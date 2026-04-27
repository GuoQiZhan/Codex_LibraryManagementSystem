from flask import Blueprint, request, jsonify
from models.hbase_dal import HBaseDAL

hbase_bp = Blueprint('hbase', __name__, url_prefix='/api/hbase')

def get_dal():
    """获取HBase DAL单例"""
    return HBaseDAL.get_instance()

def serialize_book(book):
    """将HBase图书数据序列化为前端期望的格式"""
    if not book:
        return None

    try:
        ts = int(book.get('stock:total_stock', 0))
        avs = int(book.get('stock:available_stock', 0))
    except:
        ts = 0
        avs = 0

    return {
        'isbn': book.get('info:isbn', ''),
        'title': book.get('info:title', ''),
        'author': book.get('info:author', ''),
        'publisher': book.get('info:publisher', ''),
        'publish_year': book.get('info:publish_year', ''),
        'category_name': book.get('info:category_name', ''),
        'description': book.get('info:description', ''),
        'total_stock': ts,
        'available_stock': avs,
        'price': book.get('ext:price', ''),
        'hot_score': book.get('ext:hot_score', ''),
        'borrow_count': book.get('ext:borrow_count', ''),
        'is_available': avs > 0
    }

@hbase_bp.route('/books', methods=['GET'])
def get_hbase_books():
    """从HBase获取图书列表（优化版：支持分页和缓存）"""
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    author = request.args.get('author', '')
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    sort_by = request.args.get('sort_by', 'hot_score')
    sort_order = request.args.get('sort_order', 'desc')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    try:
        dal = get_dal()
        dal.ensure_connection()

        if search or category or author or available_only:
            books, total, total_pages = dal.search_books(
                search=search,
                category=category,
                author=author,
                available_only=available_only,
                sort_by=sort_by,
                sort_order=sort_order,
                page=page,
                per_page=per_page
            )
        else:
            books = dal.scan_books(limit=limit, offset=offset, use_cache=True)
            total = len(books)
            total_pages = 1

        serialized_books = [serialize_book(book) for book in books]

        return jsonify({
            'books': serialized_books,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': total_pages
        })
    except Exception as e:
        return jsonify({'error': f'获取HBase图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/<isbn>', methods=['GET'])
def get_hbase_book(isbn):
    """从HBase获取单本图书信息"""
    try:
        dal = get_dal()
        dal.ensure_connection()

        book = dal.get_book_by_isbn(isbn)
        if not book:
            return jsonify({'error': '图书不存在'}), 404

        return jsonify(serialize_book(book))
    except Exception as e:
        return jsonify({'error': f'获取HBase图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/category/<category>', methods=['GET'])
def get_hbase_books_by_category(category):
    """从HBase按分类获取图书"""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)

    try:
        dal = get_dal()
        dal.ensure_connection()

        books = dal.get_books_by_category(category, limit=limit, offset=offset)
        serialized_books = [serialize_book(book) for book in books]

        return jsonify({
            'books': serialized_books,
            'total': len(serialized_books),
            'category': category
        })
    except Exception as e:
        return jsonify({'error': f'获取HBase图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/stats', methods=['GET'])
def get_hbase_books_stats():
    """获取HBase图书统计信息（优化版：使用缓存，避免重复扫描）"""
    try:
        dal = get_dal()
        dal.ensure_connection()

        stats = dal.get_books_stats(use_cache=True)

        return jsonify({
            'total_books': stats.get('total_books', 0),
            'available_stock': stats.get('available_stock', 0),
            'borrowed_count': stats.get('borrowed_count', 0),
            'new_books': 0,
            'overview': {
                'total_books': stats.get('total_books', 0),
                'available_stock': stats.get('available_stock', 0),
                'current_borrowed': stats.get('borrowed_count', 0)
            },
            'categories': stats.get('categories', {}),
            'category_count': stats.get('category_count', 0)
        })
    except Exception as e:
        return jsonify({'error': f'获取HBase图书统计失败: {str(e)}'}), 500

@hbase_bp.route('/books/categories', methods=['GET'])
def get_hbase_categories():
    """获取HBase图书分类统计"""
    try:
        dal = get_dal()
        dal.ensure_connection()

        categories = dal.get_categories_stats(use_cache=True)

        return jsonify({'categories': categories})
    except Exception as e:
        return jsonify({'error': f'获取分类统计失败: {str(e)}'}), 500

@hbase_bp.route('/health', methods=['GET'])
def hbase_health_check():
    """HBase连接健康检查"""
    try:
        dal = get_dal()
        dal.connect()
        tables = dal.get_all_tables()
        return jsonify({
            'status': 'ok',
            'message': 'HBase连接正常',
            'tables': tables
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'HBase连接错误: {str(e)}'}), 503

@hbase_bp.route('/tables', methods=['GET'])
def get_tables():
    """获取HBase所有表"""
    try:
        dal = get_dal()
        dal.connect()

        tables = dal.get_all_tables()
        return jsonify({'tables': tables})
    except Exception as e:
        return jsonify({'error': f'获取表列表失败: {str(e)}'}), 500

@hbase_bp.route('/books', methods=['POST'])
def add_hbase_book():
    """添加新图书到HBase"""
    try:
        dal = get_dal()
        dal.ensure_connection()

        data = request.get_json()
        if not data:
            return jsonify({'error': '请求数据不能为空'}), 400

        book_data = {
            'info:isbn': data.get('isbn', ''),
            'info:title': data.get('title', ''),
            'info:author': data.get('author', ''),
            'info:publisher': data.get('publisher', ''),
            'info:publish_year': str(data.get('publish_year', '')),
            'info:category_name': data.get('category_name', ''),
            'info:description': data.get('description', ''),
            'stock:total_stock': str(data.get('total_stock', 0)),
            'stock:available_stock': str(data.get('available_stock', data.get('total_stock', 0))),
            'ext:price': str(data.get('price', '')),
            'ext:hot_score': str(data.get('hot_score', 0)),
            'ext:borrow_count': str(data.get('borrow_count', 0))
        }

        dal.add_book(book_data)
        return jsonify({'status': 'ok', 'message': '图书添加成功'}), 201
    except Exception as e:
        return jsonify({'error': f'添加图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/<isbn>', methods=['PUT'])
def update_hbase_book(isbn):
    """更新HBase中的图书信息"""
    try:
        dal = get_dal()
        dal.ensure_connection()

        data = request.get_json()
        if not data:
            return jsonify({'error': '请求数据不能为空'}), 400

        book_data = {}
        if 'title' in data:
            book_data['info:title'] = data['title']
        if 'author' in data:
            book_data['info:author'] = data['author']
        if 'publisher' in data:
            book_data['info:publisher'] = data['publisher']
        if 'publish_year' in data:
            book_data['info:publish_year'] = str(data['publish_year'])
        if 'category_name' in data:
            book_data['info:category_name'] = data['category_name']
        if 'description' in data:
            book_data['info:description'] = data['description']
        if 'total_stock' in data:
            book_data['stock:total_stock'] = str(data['total_stock'])
        if 'available_stock' in data:
            book_data['stock:available_stock'] = str(data['available_stock'])
        if 'price' in data:
            book_data['ext:price'] = str(data['price'])
        if 'hot_score' in data:
            book_data['ext:hot_score'] = str(data['hot_score'])
        if 'borrow_count' in data:
            book_data['ext:borrow_count'] = str(data['borrow_count'])

        dal.update_book(isbn, book_data)
        return jsonify({'status': 'ok', 'message': '图书更新成功'})
    except Exception as e:
        return jsonify({'error': f'更新图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/<isbn>', methods=['DELETE'])
def delete_hbase_book(isbn):
    """从HBase删除图书"""
    try:
        dal = get_dal()
        dal.ensure_connection()

        dal.delete_book(isbn)
        return jsonify({'status': 'ok', 'message': '图书删除成功'})
    except Exception as e:
        return jsonify({'error': f'删除图书失败: {str(e)}'}), 500

@hbase_bp.route('/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """清除HBase缓存"""
    try:
        dal = get_dal()
        dal.ensure_connection()
        dal.invalidate_cache()
        return jsonify({'status': 'ok', 'message': '缓存已清除'})
    except Exception as e:
        return jsonify({'error': f'清除缓存失败: {str(e)}'}), 500
