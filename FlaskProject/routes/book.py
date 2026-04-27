from flask import Blueprint, request, jsonify
from models import Book, SystemLog, db

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

    query = Book.query

    if search:
        query = query.filter(
            (Book.isbn.contains(search)) |
            (Book.title.contains(search)) |
            (Book.author.contains(search))
        )

    if category:
        query = query.filter(Book.category_path.contains(category))

    if author:
        query = query.filter(Book.author.contains(author))

    if available_only:
        query = query.filter(Book.available_stock > 0)

    # 排序：按热度或标题
    sort_by = request.args.get('sort_by', 'hot_score')
    sort_order = request.args.get('sort_order', 'desc')

    if sort_by == 'hot_score':
        if sort_order == 'asc':
            query = query.order_by(Book.hot_score.asc())
        else:
            query = query.order_by(Book.hot_score.desc())
    elif sort_by == 'title':
        if sort_order == 'asc':
            query = query.order_by(Book.title.asc())
        else:
            query = query.order_by(Book.title.desc())
    elif sort_by == 'borrow_count':
        if sort_order == 'asc':
            query = query.order_by(Book.borrow_count.asc())
        else:
            query = query.order_by(Book.borrow_count.desc())

    books = query.paginate(page=page, per_page=per_page, error_out=False)

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
    book = Book.query.get(isbn)
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    return jsonify(book.to_dict())

@book_bp.route('/', methods=['POST'])
def create_book():
    """创建新图书（入库）"""
    data = request.get_json()

    if not data or 'isbn' not in data or 'title' not in data:
        return jsonify({'error': '缺少ISBN或书名'}), 400

    # 检查图书是否已存在
    if Book.query.get(data['isbn']):
        return jsonify({'error': '图书ISBN已存在'}), 400

    book = Book(
        isbn=data['isbn'],
        title=data['title'],
        author=data.get('author'),
        total_stock=data.get('total_stock', 1)
    )

    # 设置其他字段
    optional_fields = [
        'publisher', 'publish_year', 'category_path',
        'category_name', 'price', 'description'
    ]

    for field in optional_fields:
        if field in data:
            setattr(book, field, data[field])

    try:
        db.session.add(book)
        db.session.commit()

        # 记录日志
        SystemLog.log_action(
            user_id='system',
            action_type='create_book',
            target_type='book',
            target_id=book.isbn,
            details=data
        )

        return jsonify(book.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@book_bp.route('/<isbn>', methods=['PUT'])
def update_book(isbn):
    """更新图书信息"""
    book = Book.query.get(isbn)
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': '无更新数据'}), 400

    # 更新字段（不允许直接修改库存，使用专门接口）
    updatable_fields = [
        'title', 'author', 'publisher', 'publish_year',
        'category_path', 'category_name', 'price', 'description'
    ]

    updated = False
    for field in updatable_fields:
        if field in data:
            setattr(book, field, data[field])
            updated = True

    # 特殊处理库存变更
    if 'total_stock' in data:
        stock_change = data['total_stock'] - book.total_stock
        book.total_stock = data['total_stock']
        book.available_stock += stock_change
        updated = True

    if updated:
        try:
            db.session.commit()

            # 记录日志
            SystemLog.log_action(
                user_id='system',
                action_type='update_book',
                target_type='book',
                target_id=book.isbn,
                details=data
            )

            return jsonify(book.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    return jsonify({'message': '无变更'})

@book_bp.route('/<isbn>', methods=['DELETE'])
def delete_book(isbn):
    """删除图书"""
    book = Book.query.get(isbn)
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    # 检查是否有未归还的借阅记录
    from models import BorrowRecord
    active_borrows = BorrowRecord.query.filter_by(
        isbn=isbn,
        status='borrowed'
    ).count()

    if active_borrows > 0:
        return jsonify({'error': '存在未归还的借阅记录，无法删除'}), 400

    try:
        # 记录日志
        SystemLog.log_action(
            user_id='system',
            action_type='delete_book',
            target_type='book',
            target_id=book.isbn
        )

        db.session.delete(book)
        db.session.commit()
        return jsonify({'message': '图书删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@book_bp.route('/<isbn>/stock', methods=['PUT'])
def update_stock(isbn):
    """更新图书库存"""
    book = Book.query.get(isbn)
    if not book:
        return jsonify({'error': '图书不存在'}), 404

    data = request.get_json()
    if 'action' not in data or 'quantity' not in data:
        return jsonify({'error': '缺少action或quantity字段'}), 400

    action = data['action']
    quantity = int(data['quantity'])

    if quantity <= 0:
        return jsonify({'error': '数量必须为正数'}), 400

    if action == 'add':
        book.total_stock += quantity
        book.available_stock += quantity
    elif action == 'remove':
        if book.available_stock < quantity:
            return jsonify({'error': '可用库存不足'}), 400
        book.total_stock -= quantity
        book.available_stock -= quantity
    else:
        return jsonify({'error': 'action必须为add或remove'}), 400

    try:
        db.session.commit()

        # 记录日志
        SystemLog.log_action(
            user_id='system',
            action_type='update_stock',
            target_type='book',
            target_id=book.isbn,
            details={'action': action, 'quantity': quantity}
        )

        return jsonify(book.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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