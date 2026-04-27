from flask import Blueprint, request, jsonify
from models import SystemLog, db
from models.dal import DAL
from datetime import datetime

reader_bp = Blueprint('reader', __name__, url_prefix='/api/reader')

@reader_bp.route('/', methods=['GET'])
def get_readers():
    """获取读者列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')

    readers = DAL.get_readers(page=page, per_page=per_page, search=search)

    if readers is None:
        return jsonify({'error': '获取读者列表失败'}), 500

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
    reader = DAL.get_reader(reader_id)
    if not reader:
        return jsonify({'error': '读者不存在'}), 404

    return jsonify(reader.to_dict())

@reader_bp.route('/', methods=['POST'])
def create_reader():
    """创建新读者"""
    data = request.get_json()

    if not data or 'reader_id' not in data or 'name' not in data:
        return jsonify({'error': '缺少必要字段'}), 400

    reader, error = DAL.create_reader(data)
    if error:
        return jsonify({'error': error}), 400
    if not reader:
        return jsonify({'error': '创建读者失败'}), 500

    return jsonify(reader.to_dict()), 201

@reader_bp.route('/<reader_id>', methods=['PUT'])
def update_reader(reader_id):
    """更新读者信息"""
    data = request.get_json()
    if not data:
        return jsonify({'error': '无更新数据'}), 400
    
    # 获取用户ID（这里简化处理，实际应该从认证信息中获取）
    user_id = request.headers.get('X-User-ID', 'system')
    
    reader, error = DAL.update_reader(reader_id, data, user_id)
    if error == "读者不存在":
        return jsonify({'error': error}), 404
    if error == "无权限执行此操作":
        return jsonify({'error': error}), 403
    if error:
        return jsonify({'error': error}), 400
    if not reader:
        return jsonify({'error': '更新读者失败'}), 500
    
    return jsonify(reader.to_dict())

@reader_bp.route('/<reader_id>', methods=['DELETE'])
def delete_reader(reader_id):
    """删除读者"""
    # 获取用户ID（这里简化处理，实际应该从认证信息中获取）
    user_id = request.headers.get('X-User-ID', 'system')
    
    success, error = DAL.delete_reader(reader_id, user_id)
    if error == "读者不存在":
        return jsonify({'error': error}), 404
    if error == "无权限执行此操作":
        return jsonify({'error': error}), 403
    if error:
        return jsonify({'error': error}), 500
    if not success:
        return jsonify({'error': '删除读者失败'}), 500
    
    return jsonify({'message': '读者删除成功'})

@reader_bp.route('/batch-delete', methods=['POST'])
def batch_delete_readers():
    """批量删除读者"""
    data = request.get_json()
    if not data or 'reader_ids' not in data or not isinstance(data['reader_ids'], list):
        return jsonify({'error': '缺少必要字段或格式错误'}), 400
    
    # 获取用户ID（这里简化处理，实际应该从认证信息中获取）
    user_id = request.headers.get('X-User-ID', 'system')
    
    success, message = DAL.batch_delete_readers(data['reader_ids'], user_id)
    if message == "无权限执行此操作":
        return jsonify({'error': message}), 403
    if not success:
        return jsonify({'error': message}), 500
    
    return jsonify({'message': message})

@reader_bp.route('/<reader_id>/borrow-status', methods=['GET'])
def get_borrow_status(reader_id):
    """获取读者借阅状态"""
    from models import BorrowRecord

    reader = DAL.get_reader(reader_id)
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