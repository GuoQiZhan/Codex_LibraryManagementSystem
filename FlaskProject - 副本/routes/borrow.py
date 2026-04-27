from flask import Blueprint, request, jsonify
from models import Reader, Book, BorrowRecord, SystemLog, db
from datetime import datetime, timedelta

borrow_bp = Blueprint('borrow', __name__, url_prefix='/api/borrow')

@borrow_bp.route('/apply', methods=['POST'])
def apply_borrow():
    """申请借阅图书"""
    data = request.get_json()

    if not data or 'reader_id' not in data or 'isbn' not in data:
        return jsonify({'error': '缺少读者ID或图书ISBN'}), 400

    reader = Reader.query.get(data['reader_id'])
    book = Book.query.get(data['isbn'])

    if not reader:
        return jsonify({'error': '读者不存在'}), 404
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    # 检查读者是否可以借书
    if not reader.can_borrow():
        return jsonify({'error': '借阅额度已满'}), 400

    # 检查图书是否可借
    if not book.is_available():
        return jsonify({'error': '图书库存不足'}), 400

    # 检查读者是否有逾期记录
    from models import BorrowRecord as BR
    overdue_count = BR.query.filter_by(
        reader_id=reader.reader_id,
        status='overdue'
    ).count()

    if overdue_count > 0:
        return jsonify({'error': '存在逾期记录，请先处理逾期图书'}), 400

    # 创建借阅记录
    borrow_days = data.get('borrow_days', 30)
    borrow_record = BorrowRecord(
        reader_id=reader.reader_id,
        isbn=book.isbn,
        borrow_days=borrow_days
    )

    # 更新图书库存
    book.update_stock(-1)
    book.increment_borrow_count()

    # 更新读者借阅计数
    reader.total_borrow_count += 1
    reader.last_active = datetime.utcnow()

    try:
        db.session.add(borrow_record)
        db.session.commit()

        # 记录日志
        SystemLog.log_action(
            user_id=reader.reader_id,
            action_type='borrow_book',
            target_type='borrow',
            target_id=borrow_record.record_id,
            details={
                'reader_id': reader.reader_id,
                'isbn': book.isbn,
                'borrow_days': borrow_days
            }
        )

        return jsonify(borrow_record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@borrow_bp.route('/return', methods=['POST'])
def return_book():
    """归还图书"""
    data = request.get_json()

    if not data or 'record_id' not in data:
        return jsonify({'error': '缺少借阅记录ID'}), 400

    record_id = data['record_id']
    borrow_record = BorrowRecord.query.get(record_id)

    if not borrow_record:
        return jsonify({'error': '借阅记录不存在'}), 404

    if borrow_record.status == 'returned':
        return jsonify({'error': '图书已归还'}), 400

    # 归还图书
    success, message = borrow_record.return_book()

    if not success:
        return jsonify({'error': message}), 400

    # 更新图书库存
    book = Book.query.get(borrow_record.isbn)
    if book:
        book.update_stock(1)

    # 如果逾期，更新读者逾期计数
    if borrow_record.status == 'overdue':
        reader = Reader.query.get(borrow_record.reader_id)
        if reader:
            reader.overdue_count += 1
            reader.update_credit_score(-5)  # 逾期扣5分

            # 创建罚款记录
            from models import Fine
            if borrow_record.fine_amount > 0:
                fine = Fine(
                    reader_id=reader.reader_id,
                    record_id=borrow_record.record_id,
                    amount=borrow_record.fine_amount,
                    reason='图书逾期归还'
                )
                db.session.add(fine)

    try:
        db.session.commit()

        # 记录日志
        SystemLog.log_action(
            user_id=borrow_record.reader_id,
            action_type='return_book',
            target_type='borrow',
            target_id=borrow_record.record_id,
            details={
                'status': borrow_record.status,
                'fine_amount': float(borrow_record.fine_amount) if borrow_record.fine_amount else 0
            }
        )

        return jsonify({
            'message': message,
            'record': borrow_record.to_dict(),
            'fine_amount': float(borrow_record.fine_amount) if borrow_record.fine_amount else 0
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@borrow_bp.route('/<record_id>/renew', methods=['PUT'])
def renew_book(record_id):
    """续借图书"""
    borrow_record = BorrowRecord.query.get(record_id)

    if not borrow_record:
        return jsonify({'error': '借阅记录不存在'}), 404

    # 续借图书
    success, message = borrow_record.renew()

    if not success:
        return jsonify({'error': message}), 400

    try:
        db.session.commit()

        # 记录日志
        SystemLog.log_action(
            user_id=borrow_record.reader_id,
            action_type='renew_book',
            target_type='borrow',
            target_id=borrow_record.record_id,
            details={
                'renew_count': borrow_record.renew_count,
                'new_due_date': borrow_record.due_date.isoformat()
            }
        )

        return jsonify({
            'message': message,
            'record': borrow_record.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@borrow_bp.route('/records', methods=['GET'])
def get_borrow_records():
    """获取借阅记录列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    reader_id = request.args.get('reader_id', '')
    isbn = request.args.get('isbn', '')
    status = request.args.get('status', '')

    query = BorrowRecord.query

    if reader_id:
        query = query.filter_by(reader_id=reader_id)

    if isbn:
        query = query.filter_by(isbn=isbn)

    if status:
        query = query.filter_by(status=status)

    # 排序：按借阅时间倒序
    query = query.order_by(BorrowRecord.borrow_date.desc())

    records = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'records': [record.to_dict() for record in records.items],
        'total': records.total,
        'page': records.page,
        'per_page': records.per_page,
        'pages': records.pages
    })

@borrow_bp.route('/overdue', methods=['GET'])
def get_overdue_records():
    """获取逾期记录"""
    overdue_records = BorrowRecord.query.filter_by(status='overdue').all()

    # 重新计算罚款（确保罚款金额最新）
    for record in overdue_records:
        record.fine_amount = record.calculate_fine()

    try:
        db.session.commit()
    except:
        db.session.rollback()

    return jsonify({
        'overdue_records': [record.to_dict() for record in overdue_records],
        'count': len(overdue_records),
        'total_fine': sum(float(record.fine_amount) for record in overdue_records)
    })

@borrow_bp.route('/stats/daily', methods=['GET'])
def get_daily_stats():
    """获取每日借阅统计（用于图表）"""
    from sqlalchemy import func, cast, Date

    # 获取最近30天的借阅统计
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    daily_stats = db.session.query(
        cast(BorrowRecord.borrow_date, Date).label('date'),
        func.count(BorrowRecord.record_id).label('borrow_count')
    ).filter(BorrowRecord.borrow_date >= thirty_days_ago)\
     .group_by(cast(BorrowRecord.borrow_date, Date))\
     .order_by('date')\
     .all()

    # 格式化数据
    dates = [stat.date.isoformat() for stat in daily_stats]
    counts = [stat.borrow_count for stat in daily_stats]

    return jsonify({
        'dates': dates,
        'borrow_counts': counts
    })