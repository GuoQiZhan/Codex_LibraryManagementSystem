from flask import Blueprint, request, jsonify
from models import Reader, Book, BorrowRecord, Reservation, SystemLog, db
from datetime import datetime, timedelta

borrow_bp = Blueprint('borrow', __name__, url_prefix='/api/borrow')


def _enrich_record(record):
    """为借阅记录添加读者姓名和图书标题，同时计算剩余天数/逾期天数"""
    d = record.to_dict()
    reader = Reader.query.get(record.reader_id)
    book = Book.query.get(record.isbn)
    d['reader_name'] = reader.name if reader else '未知'
    d['book_title'] = book.title if book else '未知'

    # 计算剩余天数或逾期天数
    if record.status == 'borrowed':
        delta = (record.due_date - datetime.utcnow().date()).days if record.due_date else 0
        d['days_remaining'] = delta
        d['overdue_days'] = 0
    elif record.status == 'overdue':
        delta = (datetime.utcnow().date() - record.due_date).days if record.due_date else 0
        d['days_remaining'] = -delta
        d['overdue_days'] = delta
    else:
        d['days_remaining'] = 0
        d['overdue_days'] = 0

    return d


def _enrich_reservation(res):
    """为预约记录添加读者姓名和图书标题"""
    d = res.to_dict()
    reader = Reader.query.get(res.reader_id)
    book = Book.query.get(res.isbn)
    d['reader_name'] = reader.name if reader else '未知'
    d['book_title'] = book.title if book else '未知'
    return d


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
    overdue_count = BorrowRecord.query.filter_by(
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

        return jsonify(_enrich_record(borrow_record)), 201
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
            reader.update_credit_score(-5)

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
            'record': _enrich_record(borrow_record),
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
            'record': _enrich_record(borrow_record)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/records', methods=['GET'])
def get_borrow_records():
    """获取借阅记录列表（含读者姓名和图书标题）"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    reader_id = request.args.get('reader_id', '')
    isbn = request.args.get('isbn', '')
    status = request.args.get('status', '')
    search = request.args.get('search', '')

    query = BorrowRecord.query

    if reader_id:
        query = query.filter_by(reader_id=reader_id)

    if isbn:
        query = query.filter_by(isbn=isbn)

    if status:
        query = query.filter_by(status=status)

    # 搜索结果：按读者姓名或图书标题匹配
    if search:
        matching_reader_ids = Reader.query.filter(
            Reader.name.contains(search)
        ).with_entities(Reader.reader_id).all()
        matching_isbns = Book.query.filter(
            Book.title.contains(search)
        ).with_entities(Book.isbn).all()

        reader_ids = [r[0] for r in matching_reader_ids]
        book_isbns = [b[0] for b in matching_isbns]

        from sqlalchemy import or_
        conditions = []
        if reader_ids:
            conditions.append(BorrowRecord.reader_id.in_(reader_ids))
        if book_isbns:
            conditions.append(BorrowRecord.isbn.in_(book_isbns))
        if conditions:
            query = query.filter(or_(*conditions))

    # 排序：按借阅时间倒序
    query = query.order_by(BorrowRecord.borrow_date.desc())

    records = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'records': [_enrich_record(r) for r in records.items],
        'total': records.total,
        'page': records.page,
        'per_page': records.per_page,
        'pages': records.pages
    })


@borrow_bp.route('/overdue', methods=['GET'])
def get_overdue_records():
    """获取逾期记录（含读者姓名和图书标题）"""
    overdue_records = BorrowRecord.query.filter_by(status='overdue').all()

    # 重新计算罚款（确保罚款金额最新）
    for record in overdue_records:
        record.fine_amount = record.calculate_fine()

    try:
        db.session.commit()
    except:
        db.session.rollback()

    return jsonify({
        'overdue_records': [_enrich_record(r) for r in overdue_records],
        'count': len(overdue_records),
        'total_fine': sum(float(record.fine_amount) for record in overdue_records)
    })


@borrow_bp.route('/stats/daily', methods=['GET'])
def get_daily_stats():
    """获取每日借阅统计（用于图表）"""
    from sqlalchemy import func, cast, Date

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    daily_stats = db.session.query(
        cast(BorrowRecord.borrow_date, Date).label('date'),
        func.count(BorrowRecord.record_id).label('borrow_count')
    ).filter(BorrowRecord.borrow_date >= thirty_days_ago)\
     .group_by(cast(BorrowRecord.borrow_date, Date))\
     .order_by('date')\
     .all()

    dates = [stat.date.isoformat() for stat in daily_stats]
    counts = [stat.borrow_count for stat in daily_stats]

    return jsonify({
        'dates': dates,
        'borrow_counts': counts
    })


# ========== 预约管理 API ==========

@borrow_bp.route('/reservations', methods=['GET'])
def get_reservations():
    """获取预约记录列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')

    query = Reservation.query

    if status:
        query = query.filter_by(status=status)

    query = query.order_by(Reservation.reserve_date.desc())

    records = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'reservations': [_enrich_reservation(r) for r in records.items],
        'total': records.total,
        'page': records.page,
        'per_page': records.per_page,
        'pages': records.pages
    })


@borrow_bp.route('/reservations', methods=['POST'])
def create_reservation():
    """创建预约"""
    data = request.get_json()

    if not data or 'reader_id' not in data or 'isbn' not in data:
        return jsonify({'error': '缺少读者ID或图书ISBN'}), 400

    reader = Reader.query.get(data['reader_id'])
    book = Book.query.get(data['isbn'])

    if not reader:
        return jsonify({'error': '读者不存在'}), 404
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    # 检查是否已存在相同预约
    existing = Reservation.query.filter_by(
        reader_id=data['reader_id'],
        isbn=data['isbn'],
        status='pending'
    ).first()
    if existing:
        return jsonify({'error': '您已预约过该图书，请勿重复预约'}), 400

    expiry_days = data.get('expiry_days', 7)
    reservation = Reservation(
        reader_id=data['reader_id'],
        isbn=data['isbn'],
        expiry_days=expiry_days
    )

    try:
        db.session.add(reservation)
        db.session.commit()
        return jsonify(_enrich_reservation(reservation)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@borrow_bp.route('/reservations/<int:reservation_id>/cancel', methods=['PUT'])
def cancel_reservation(reservation_id):
    """取消预约"""
    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': '预约记录不存在'}), 404

    if reservation.status not in ('pending', 'ready'):
        return jsonify({'error': '当前状态不可取消'}), 400

    reservation.status = 'cancelled'

    try:
        db.session.commit()
        return jsonify({'message': '预约已取消', 'reservation': _enrich_reservation(reservation)})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
