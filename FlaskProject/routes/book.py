from flask import Blueprint, request, jsonify
from models import SystemLog, db
from models.dal import DAL

book_bp = Blueprint('book', __name__, url_prefix='/api/book')

@book_bp.route('/', methods=['GET'])
def get_books():
    """获取图书列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    author = request.args.get('author', '')
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    sort_by = request.args.get('sort_by', 'hot_score')
    sort_order = request.args.get('sort_order', 'desc')

    books = DAL.get_books(
        page=page,
        per_page=per_page,
        search=search,
        category=category,
        author=author,
        available_only=available_only,
        sort_by=sort_by,
        sort_order=sort_order
    )

    if books is None:
        return jsonify({'error': '获取图书列表失败'}), 500

    return jsonify({
        'books': [book.to_dict() for book in books.items],
        'total': books.total,
        'page': books.page,
        'per_page': books.per_page,
        'pages': books.pages
    })

@book_bp.route('/<isbn>', methods=['GET'])
def get_book(isbn):
    """获取单本图书信息"""
    book = DAL.get_book(isbn)
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    return jsonify(book.to_dict())

@book_bp.route('/', methods=['POST'])
def create_book():
    """创建新图书（入库）"""
    data = request.get_json()

    if not data or 'isbn' not in data or 'title' not in data:
        return jsonify({'error': '缺少ISBN或书名'}), 400

    book, error = DAL.create_book(data)
    if error:
        return jsonify({'error': error}), 400
    if not book:
        return jsonify({'error': '创建图书失败'}), 500

    return jsonify(book.to_dict()), 201

@book_bp.route('/<isbn>', methods=['PUT'])
def update_book(isbn):
    """更新图书信息"""
    data = request.get_json()
    if not data:
        return jsonify({'error': '无更新数据'}), 400

    # 获取用户ID（这里简化处理，实际应该从认证信息中获取）
    user_id = request.headers.get('X-User-ID', 'system')

    book, error = DAL.update_book(isbn, data, user_id)
    if error == "图书不存在":
        return jsonify({'error': error}), 404
    if error == "无权限执行此操作":
        return jsonify({'error': error}), 403
    if error:
        return jsonify({'error': error}), 400
    if not book:
        return jsonify({'error': '更新图书失败'}), 500

    return jsonify(book.to_dict())

@book_bp.route('/<isbn>', methods=['DELETE'])
def delete_book(isbn):
    """删除图书"""
    # 获取用户ID（这里简化处理，实际应该从认证信息中获取）
    user_id = request.headers.get('X-User-ID', 'system')

    success, error = DAL.delete_book(isbn, user_id)
    if error == "图书不存在":
        return jsonify({'error': error}), 404
    if error == "无权限执行此操作":
        return jsonify({'error': error}), 403
    if error:
        return jsonify({'error': error}), 400
    if not success:
        return jsonify({'error': '删除图书失败'}), 500

    return jsonify({'message': '图书删除成功'})

@book_bp.route('/batch-delete', methods=['POST'])
def batch_delete_books():
    """批量删除图书"""
    data = request.get_json()
    if not data or 'isbns' not in data or not isinstance(data['isbns'], list):
        return jsonify({'error': '缺少必要字段或格式错误'}), 400

    # 获取用户ID（这里简化处理，实际应该从认证信息中获取）
    user_id = request.headers.get('X-User-ID', 'system')

    success, message = DAL.batch_delete_books(data['isbns'], user_id)
    if message == "无权限执行此操作":
        return jsonify({'error': message}), 403
    if not success:
        return jsonify({'error': message}), 500

    return jsonify({'message': message})

@book_bp.route('/<isbn>/stock', methods=['PUT'])
def update_stock(isbn):
    """更新图书库存"""
    data = request.get_json()
    if 'action' not in data or 'quantity' not in data:
        return jsonify({'error': '缺少action或quantity字段'}), 400

    action = data['action']
    quantity = int(data['quantity'])

    book, error = DAL.update_stock(isbn, action, quantity)
    if error:
        if error == "图书不存在":
            return jsonify({'error': error}), 404
        else:
            return jsonify({'error': error}), 400
    if not book:
        return jsonify({'error': '更新库存失败'}), 500

    return jsonify(book.to_dict())

@book_bp.route('/categories', methods=['GET'])
def get_categories():
    """获取图书分类统计"""
    from sqlalchemy import func

    categories = db.session.query(
        Book.category_name,
        Book.category_path,
        func.count(Book.isbn).label('book_count'),
        func.sum(Book.borrow_count).label('total_borrows'),
        func.sum(Book.total_stock).label('total_stock'),
        func.sum(Book.available_stock).label('available_stock')
    ).filter(Book.category_name.isnot(None))\
     .group_by(Book.category_name, Book.category_path)\
     .order_by(func.count(Book.isbn).desc())\
     .all()

    return jsonify({
        'categories': [
            {
                'category_name': cat.category_name,
                'category_path': cat.category_path,
                'book_count': cat.book_count,
                'total_borrows': int(cat.total_borrows or 0),
                'total_stock': int(cat.total_stock or 0),
                'available_stock': int(cat.available_stock or 0)
            }
            for cat in categories
        ]
    })