# HBase Thrift API连接
try:
    import happybase
except ImportError:
    raise ImportError("happybase模块未安装，请在Anaconda环境中执行: D:\\Application\\anaconda3\\Scripts\\pip install happybase")

from typing import List, Dict, Optional
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
    """HBase数据访问层 - 优化版"""

    def __init__(self, host='localhost', port=9090, table_name='book'):
        self.host = host
        self.port = port
        self.table_name = table_name
        self.connection = None
        self.table = None
        self.connected = False
        self._cache = CacheManager(default_ttl=30)

    def connect(self):
        """建立HBase连接（带缓存检查）"""
        try:
            if self.connected and self.connection:
                return True

            self.connection = happybase.Connection(
                self.host,
                self.port,
                transport='buffered',
                timeout=10000
            )
            self.connection.open()

            tables = [t.decode() for t in self.connection.tables()]
            if self.table_name not in tables:
                raise Exception(f"表 '{self.table_name}' 不存在")

            self.table = self.connection.table(self.table_name)
            self.connected = True
            return True
        except Exception as e:
            self.connected = False
            raise Exception(f"HBase连接失败: {str(e)}")

    def disconnect(self):
        """关闭HBase连接"""
        if self.connection:
            try:
                self.connection.close()
            except:
                pass
        self.connected = False

    def _scan_with_cache(self, cache_key: str, limit: int = 100, use_cache: bool = True) -> List[Dict]:
        """扫描图书（带缓存）"""
        if use_cache:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached[:limit] if limit else cached

        books = []
        count = 0
        for key, data in self.table.scan():
            if limit and count >= limit:
                break
            books.append(b2s(data))
            count += 1

        if use_cache:
            self._cache.set(cache_key, books)

        return books

    def get_book_by_isbn(self, isbn: str) -> Optional[Dict]:
        """根据ISBN获取图书信息"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            data = self.table.row(isbn.encode('utf-8'))
            if not data:
                return None
            return b2s(data)
        except Exception as e:
            raise Exception(f"获取图书失败: {str(e)}")

    def scan_books(self, limit: int = 100, offset: int = 0, use_cache: bool = True) -> List[Dict]:
        """扫描获取图书列表（优化版：支持offset和缓存）"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            cache_key = f"books_all_{limit}_{offset}"
            all_books = self._scan_with_cache("books_all", limit=0, use_cache=use_cache)

            if offset >= len(all_books):
                return []

            return all_books[offset:offset + limit] if limit else all_books[offset:]
        except Exception as e:
            raise Exception(f"扫描图书失败: {str(e)}")

    def get_books_by_category(self, category: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        """根据分类获取图书"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        try:
            books = []
            count = 0
            skipped = 0
            filter_str = f"SingleColumnValueFilter('info', 'category_name', =, 'binary:{category}')"
            for key, data in self.table.scan(filter=filter_str):
                if limit and count >= limit:
                    break
                if skipped < offset:
                    skipped += 1
                    continue
                books.append(b2s(data))
                count += 1
            return books
        except Exception as e:
            raise Exception(f"按分类获取图书失败: {str(e)}")

    def get_books_stats(self, use_cache: bool = True) -> Dict:
        """获取图书统计信息（优化版：一次扫描获取所有统计）"""
        if not self.connected:
            raise Exception("HBase未连接，请先调用connect()方法")

        cache_key = "books_stats"
        if use_cache:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        try:
            categories = {}
            total = 0

            for key, data in self.table.scan():
                total += 1
                book = b2s(data)
                category = book.get('info:category_name', '未知分类')
                if not category:
                    category = '未知分类'
                categories[category] = categories.get(category, 0) + 1

            result = {
                'total_books': total,
                'categories': categories,
                'category_count': len(categories)
            }

            if use_cache:
                self._cache.set(cache_key, result)

            return result
        except Exception as e:
            raise Exception(f"获取统计失败: {str(e)}")

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

    def invalidate_cache(self):
        """使所有缓存失效"""
        self._cache.clear()

# 全局HBaseDAL实例
hbase_dal = HBaseDAL()