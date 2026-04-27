# HBase Thrift API连接
try:
    import happybase
except ImportError:
    raise ImportError("happybase模块未安装，请在Anaconda环境中执行: D:\\Application\\anaconda3\\Scripts\\pip install happybase")

from typing import List, Dict, Optional, Tuple
import time

def b2s(data):
    """将字节数据转换为字符串"""
    return {k.decode(): v.decode() for k, v in data.items()}

class CacheManager:
    """简单的内存缓存管理器"""

    def __init__(self, default_ttl=30):
        self._cache = {}
        self._timestamps = {}
        self.default_ttl = default_ttl

    def get(self, key):
        """获取缓存，如果过期返回None"""
        if key in self._cache:
            if time.time() - self._timestamps[key] < self.default_ttl:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._timestamps[key]
        return None

    def set(self, key, value, ttl=None):
        """设置缓存"""
        self._cache[key] = value
        self._timestamps[key] = time.time()

    def invalidate(self, key):
        """使缓存失效"""
        if key in self._cache:
            del self._cache[key]
            del self._timestamps[key]

    def clear(self):
        """清空所有缓存"""
        self._cache.clear()
        self._timestamps.clear()

class HBaseDAL:
    """HBase数据访问层 - 增强版（带连接池和自动重连）"""

    _instance = None
    _lock = False

    def __init__(self, host='localhost', port=9090, table_name='book'):
        self.host = host
        self.port = port
        self.table_name = table_name
        self.connection = None
        self.table = None
        self.connected = False
        self._cache = CacheManager(default_ttl=30)
        self._all_books_cache = None
        self._all_books_cache_time = 0
        self._all_books_ttl = 30
        self._reconnect_attempts = 0
        self._max_reconnect_attempts = 3

    @classmethod
    def get_instance(cls, host='localhost', port=9090, table_name='book'):
        """获取单例实例"""
        if cls._instance is None:
            cls._instance = cls(host, port, table_name)
        return cls._instance

    def connect(self):
        """建立HBase连接（带自动重连）"""
        for attempt in range(self._max_reconnect_attempts):
            try:
                self._do_connect()
                self._reconnect_attempts = 0
                return True
            except Exception as e:
                self._reconnect_attempts = attempt + 1
                if attempt < self._max_reconnect_attempts - 1:
                    time.sleep(0.5 * (attempt + 1))
                else:
                    raise Exception(f"HBase连接失败: {str(e)}")

    def _do_connect(self):
        """执行实际的连接操作"""
        self.disconnect()

        self.connection = happybase.Connection(
            self.host,
            self.port,
            transport='buffered',
            timeout=15000
        )
        self.connection.open()

        tables = [t.decode() for t in self.connection.tables()]
        if self.table_name not in tables:
            raise Exception(f"表 '{self.table_name}' 不存在")

        self.table = self.connection.table(self.table_name)
        self.connected = True

    def disconnect(self):
        """关闭HBase连接"""
        self.connected = False
        if self.connection:
            try:
                self.connection.close()
            except:
                pass
        self.connection = None
        self.table = None

    def ensure_connection(self):
        """确保连接有效，不有效则重连"""
        if not self.connected or not self.connection:
            return self.connect()
        try:
            self.connection.tables()
            return True
        except:
            return self.connect()

    def _get_all_books_cached(self, use_cache=True) -> List[Dict]:
        """获取所有图书（带内存缓存，30秒内不重复扫描）"""
        now = time.time()
        if use_cache and self._all_books_cache is not None:
            if now - self._all_books_cache_time < self._all_books_ttl:
                return self._all_books_cache

        self.ensure_connection()

        books = []
        for key, data in self.table.scan():
            book_data = b2s(data)
            book_data['_row_key'] = key.decode('utf-8') if isinstance(key, bytes) else key
            if 'info:isbn' not in book_data or not book_data['info:isbn']:
                book_data['info:isbn'] = book_data.get('_row_key', '')
            books.append(book_data)

        self._all_books_cache = books
        self._all_books_cache_time = now
        return books

    def get_book_by_isbn(self, isbn: str) -> Optional[Dict]:
        """根据ISBN获取图书信息"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            data = self.table.row(isbn.encode('utf-8'))

            if not data:
                all_books = self._get_all_books_cached(use_cache=True)
                for book in all_books:
                    book_isbn = book.get('info:isbn', '')
                    if book_isbn == isbn or book_isbn.replace('-', '') == isbn.replace('-', ''):
                        return book
                return None

            book_data = b2s(data)
            if 'info:isbn' not in book_data or not book_data['info:isbn']:
                book_data['info:isbn'] = isbn
            return book_data
        except Exception as e:
            raise Exception(f"获取图书失败: {str(e)}")

    def scan_books(self, limit: int = 100, offset: int = 0, use_cache: bool = True) -> List[Dict]:
        """扫描获取图书列表（优化版：支持offset和缓存）"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            all_books = self._get_all_books_cached(use_cache=use_cache)

            if offset >= len(all_books):
                return []

            return all_books[offset:offset + limit] if limit else all_books[offset:]
        except Exception as e:
            raise Exception(f"扫描图书失败: {str(e)}")

    def search_books(
        self,
        search: str = '',
        category: str = '',
        author: str = '',
        available_only: bool = False,
        sort_by: str = 'hot_score',
        sort_order: str = 'desc',
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict], int, int]:
        """
        搜索图书（支持多条件筛选和排序）
        返回: (图书列表, 总数, 总页数)
        """
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            all_books = self._get_all_books_cached(use_cache=True)

            filtered_books = []

            for book in all_books:
                if search:
                    title = book.get('info:title', '').lower()
                    author_val = book.get('info:author', '').lower()
                    isbn = book.get('info:isbn', '').lower()
                    search_lower = search.lower()
                    if search_lower not in title and search_lower not in author_val and search_lower not in isbn:
                        continue

                if category:
                    cat = book.get('info:category_name', '')
                    if cat != category:
                        continue

                if available_only:
                    avail = int(book.get('stock:available_stock', 0))
                    if avail <= 0:
                        continue

                filtered_books.append(book)

            total = len(filtered_books)
            total_pages = (total + per_page - 1) // per_page if total > 0 else 1

            sort_key_map = {
                'hot_score': 'ext:hot_score',
                'borrow_count': 'ext:borrow_count',
                'title': 'info:title',
                'author': 'info:author',
                'publish_year': 'info:publish_year'
            }
            sort_key = sort_key_map.get(sort_by, 'ext:hot_score')

            def get_sort_value(b):
                val = b.get(sort_key, '0')
                try:
                    return float(val)
                except:
                    return 0

            reverse = sort_order == 'desc'
            filtered_books.sort(key=get_sort_value, reverse=reverse)

            start = (page - 1) * per_page
            end = start + per_page
            page_books = filtered_books[start:end]

            return page_books, total, total_pages

        except Exception as e:
            raise Exception(f"搜索图书失败: {str(e)}")

    def get_books_by_category(self, category: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        """根据分类获取图书"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            all_books = self._get_all_books_cached(use_cache=True)
            filtered = [b for b in all_books if b.get('info:category_name') == category]

            if offset >= len(filtered):
                return []
            return filtered[offset:offset + limit]

        except Exception as e:
            raise Exception(f"按分类获取图书失败: {str(e)}")

    def get_books_stats(self, use_cache: bool = True) -> Dict:
        """获取图书统计信息（优化版：一次扫描获取所有统计）"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        cache_key = "books_stats_v2"
        if use_cache:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        try:
            categories = {}
            total_books = 0
            total_stock = 0
            available_stock = 0
            borrowed_count = 0

            for key, data in self.table.scan():
                total_books += 1
                book = b2s(data)

                cat = book.get('info:category_name', '未知分类')
                if not cat:
                    cat = '未知分类'
                categories[cat] = categories.get(cat, 0) + 1

                try:
                    ts = int(book.get('stock:total_stock', 0))
                    avs = int(book.get('stock:available_stock', 0))
                    total_stock += ts
                    available_stock += avs
                    if ts > avs:
                        borrowed_count += (ts - avs)
                except:
                    pass

            result = {
                'total_books': total_books,
                'total_stock': total_stock,
                'available_stock': available_stock,
                'borrowed_count': borrowed_count,
                'categories': categories,
                'category_count': len(categories)
            }

            if use_cache:
                self._cache.set(cache_key, result, ttl=30)

            return result
        except Exception as e:
            raise Exception(f"获取统计失败: {str(e)}")

    def get_categories_stats(self, use_cache: bool = True) -> List[Dict]:
        """获取分类统计"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        cache_key = "categories_stats"
        if use_cache:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        try:
            category_data = {}

            for key, data in self.table.scan():
                book = b2s(data)
                cat = book.get('info:category_name', '未知分类')
                if not cat:
                    cat = '未知分类'

                if cat not in category_data:
                    category_data[cat] = {
                        'category_name': cat,
                        'book_count': 0,
                        'total_stock': 0,
                        'available_stock': 0,
                        'total_borrows': 0
                    }

                category_data[cat]['book_count'] += 1
                try:
                    category_data[cat]['total_stock'] += int(book.get('stock:total_stock', 0))
                    category_data[cat]['available_stock'] += int(book.get('stock:available_stock', 0))
                    category_data[cat]['total_borrows'] += int(book.get('ext:borrow_count', 0))
                except:
                    pass

            result = sorted(category_data.values(), key=lambda x: x['book_count'], reverse=True)

            if use_cache:
                self._cache.set(cache_key, result, ttl=60)

            return result

        except Exception as e:
            raise Exception(f"获取分类统计失败: {str(e)}")

    def count_books(self) -> int:
        """统计图书总数（使用缓存）"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        stats = self.get_books_stats(use_cache=True)
        return stats['total_books']

    def get_all_tables(self) -> List[str]:
        """获取所有表名"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            return [t.decode() for t in self.connection.tables()]
        except Exception as e:
            raise Exception(f"获取表列表失败: {str(e)}")

    def add_book(self, book_data: Dict) -> bool:
        """添加新图书"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        if not book_data.get('info:isbn'):
            raise Exception("ISBN不能为空")

        isbn = book_data['info:isbn']

        existing = self.table.row(isbn.encode('utf-8'))
        if existing:
            raise Exception(f"图书 ISBN {isbn} 已存在")

        row_data = {}
        for key, value in book_data.items():
            if value is not None:
                if isinstance(value, str):
                    row_data[key.encode('utf-8')] = value.encode('utf-8')
                else:
                    row_data[key.encode('utf-8')] = str(value).encode('utf-8')

        self.table.put(isbn.encode('utf-8'), row_data)
        self.invalidate_cache()
        return True

    def update_book(self, isbn: str, book_data: Dict) -> bool:
        """更新图书信息"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        existing = self.table.row(isbn.encode('utf-8'))
        if not existing:
            raise Exception(f"图书 ISBN {isbn} 不存在")

        row_data = {}
        for key, value in book_data.items():
            if value is not None:
                if isinstance(value, str):
                    row_data[key.encode('utf-8')] = value.encode('utf-8')
                else:
                    row_data[key.encode('utf-8')] = str(value).encode('utf-8')

        self.table.put(isbn.encode('utf-8'), row_data)
        self.invalidate_cache()
        return True

    def delete_book(self, isbn: str) -> bool:
        """删除图书"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        existing = self.table.row(isbn.encode('utf-8'))
        if not existing:
            raise Exception(f"图书 ISBN {isbn} 不存在")

        self.table.delete(isbn.encode('utf-8'))
        self.invalidate_cache()
        return True

    def invalidate_cache(self):
        """使所有缓存失效"""
        self._cache.clear()
        self._all_books_cache = None
        self._all_books_cache_time = 0

# 全局HBaseDAL实例
hbase_dal = HBaseDAL()