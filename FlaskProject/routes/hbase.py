from flask import Blueprint, request, jsonify
from models import hbase_dal

hbase_bp = Blueprint('hbase', __name__, url_prefix='/api/hbase')

@hbase_bp.route('/books', methods=['GET'])
def get_hbase_books():
    """从HBase获取图书列表（优化版：支持分页和缓存）"""
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)

    try:
        if not hbase_dal.connected:
            hbase_dal.connect()

        books = hbase_dal.scan_books(limit=limit, offset=offset, use_cache=True)

        serialized_books = []
        for book in books:
            serialized_book = {}
            for key, value in book.items():
                if isinstance(value, bytes):
                    try:
                        serialized_book[key] = value.decode('utf-8')
                    except:
                        serialized_book[key] = str(value)
                else:
                    serialized_book[key] = value
            serialized_books.append(serialized_book)

        return jsonify({
            'books': serialized_books,
            'total': len(serialized_books),
            'limit': limit,
            'offset': offset
        })
    except Exception as e:
        return jsonify({'error': f'获取HBase图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/<isbn>', methods=['GET'])
def get_hbase_book(isbn):
    """从HBase获取单本图书信息"""
    try:
        if not hbase_dal.connected:
            hbase_dal.connect()

        book = hbase_dal.get_book_by_isbn(isbn)
        if not book:
            return jsonify({'error': '图书不存在'}), 404

        serialized_book = {}
        for key, value in book.items():
            if isinstance(value, bytes):
                try:
                    serialized_book[key] = value.decode('utf-8')
                except:
                    serialized_book[key] = str(value)
            else:
                serialized_book[key] = value

        return jsonify(serialized_book)
    except Exception as e:
        return jsonify({'error': f'获取HBase图书失败: {str(e)}'}), 500

@hbase_bp.route('/books/category/<category>', methods=['GET'])
def get_hbase_books_by_category(category):
    """从HBase按分类获取图书"""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)

    try:
        if not hbase_dal.connected:
            hbase_dal.connect()

        books = hbase_dal.get_books_by_category(category, limit=limit, offset=offset)

        serialized_books = []
        for book in books:
            serialized_book = {}
            for key, value in book.items():
                if isinstance(value, bytes):
                    try:
                        serialized_book[key] = value.decode('utf-8')
                    except:
                        serialized_book[key] = str(value)
                else:
                    serialized_book[key] = value
            serialized_books.append(serialized_book)

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
        if not hbase_dal.connected:
            hbase_dal.connect()

        stats = hbase_dal.get_books_stats(use_cache=True)

        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': f'获取HBase图书统计失败: {str(e)}'}), 500

@hbase_bp.route('/health', methods=['GET'])
def hbase_health_check():
    """HBase连接健康检查"""
    try:
        hbase_dal.connect()
        tables = hbase_dal.get_all_tables()
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
        if not hbase_dal.connected:
            hbase_dal.connect()

        tables = hbase_dal.get_all_tables()
        return jsonify({'tables': tables})
    except Exception as e:
        return jsonify({'error': f'获取表列表失败: {str(e)}'}), 500

@hbase_bp.route('/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """清除HBase缓存"""
    try:
        hbase_dal.invalidate_cache()
        return jsonify({'status': 'ok', 'message': '缓存已清除'})
    except Exception as e:
        return jsonify({'error': f'清除缓存失败: {str(e)}'}), 500