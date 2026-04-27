from flask import Blueprint, request, jsonify
from models import Reader, SystemLog, db
from datetime import datetime

reader_bp = Blueprint('reader', __name__, url_prefix='/api/reader')

@reader_bp.route('/', methods=['GET'])
def get_readers():
    """获取读者列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')

    query = Reader.query

    if search:
        query = query.filter(
            (Reader.reader_id.contains(search)) |
            (Reader.name.contains(search)) |
            (Reader.email.contains(search))
        )

    readers = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'readers': [reader.to_dict() for reader in readers.items],
        'total': readers.total,
        'page': readers.page,
        'per_page': readers.per_page,
        'pages': readers.pages
    })

@reader_bp.route('/<reader_id>', methods=['GET'])
def get_reader(reader_id):
    """获取单个读者信息"""
    reader = Reader.query.get(reader_id)
    if not reader:
        return jsonify({'error': '读者不存在'}), 404

    return jsonify(reader.to_dict())

@reader_bp.route('/', methods=['POST'])
def create_reader():
    """创建新读者"""
    data = request.get_json()

    if not data or 'reader_id' not in data or 'name' not in data:
        return jsonify({'error': '缺少必要字段'}), 400

    # 检查读者ID是否已存在
    if Reader.query.get(data['reader_id']):
        return jsonify({'error': '读者ID已存在'}), 400

    reader = Reader(
        reader_id=data['reader_id'],
        name=data['name'],
        email=data.get('email'),
        phone=data.get('phone')
    )

    # 可选：设置信用分和借阅额度
    if 'credit_score' in data:
        reader.credit_score = data['credit_score']
    if 'borrow_quota' in data:
        reader.borrow_quota = data['borrow_quota']

    try:
        db.session.add(reader)
        db.session.commit()

        # 记录日志
        SystemLog.log_action(
            user_id='system',
            action_type='create_reader',
            target_type='reader',
            target_id=reader.reader_id,
            details=data
        )

        return jsonify(reader.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reader_bp.route('/<reader_id>', methods=['PUT'])
def update_reader(reader_id):
    """更新读者信息"""
    reader = Reader.query.get(reader_id)
    if not reader:
        return jsonify({'error': '读者不存在'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': '无更新数据'}), 400

    # 更新字段
    updatable_fields = ['name', 'email', 'phone', 'credit_score', 'borrow_quota']
    updated = False

    for field in updatable_fields:
        if field in data:
            setattr(reader, field, data[field])
            updated = True

    if 'credit_score' in data:
        reader.credit_score = max(60, min(100, data['credit_score']))

    if updated:
        reader.last_active = datetime.utcnow()
        try:
            db.session.commit()

            # 记录日志
            SystemLog.log_action(
                user_id='system',
                action_type='update_reader',
                target_type='reader',
                target_id=reader.reader_id,
                details=data
            )

            return jsonify(reader.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    return jsonify({'message': '无变更'})

@reader_bp.route('/<reader_id>', methods=['DELETE'])
def delete_reader(reader_id):
    """删除读者"""
    reader = Reader.query.get(reader_id)
    if not reader:
        return jsonify({'error': '读者不存在'}), 404

    try:
        # 记录日志
        SystemLog.log_action(
            user_id='system',
            action_type='delete_reader',
            target_type='reader',
            target_id=reader.reader_id
        )

        db.session.delete(reader)
        db.session.commit()
        return jsonify({'message': '读者删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reader_bp.route('/<reader_id>/borrow-status', methods=['GET'])
def get_borrow_status(reader_id):
    """获取读者借阅状态"""
    from models import BorrowRecord

    reader = Reader.query.get(reader_id)
    if not reader:
        return jsonify({'error': '读者不存在'}), 404

    # 获取当前借阅记录
    current_borrows = BorrowRecord.query.filter_by(
        reader_id=reader_id,
        status='borrowed'
    ).all()

    # 获取逾期记录
    overdue_borrows = BorrowRecord.query.filter_by(
        reader_id=reader_id,
        status='overdue'
    ).all()

    return jsonify({
        'reader': reader.to_dict(),
        'current_borrows': [record.to_dict() for record in current_borrows],
        'overdue_borrows': [record.to_dict() for record in overdue_borrows],
        'can_borrow': reader.can_borrow(),
        'remaining_quota': reader.borrow_quota - len(current_borrows)
    })