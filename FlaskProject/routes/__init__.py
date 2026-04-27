from .reader import reader_bp
from .book import book_bp
from .borrow import borrow_bp
from .stats import stats_bp
from .hbase import hbase_bp

blueprints = [
    reader_bp,
    book_bp,
    borrow_bp,
    stats_bp,
    hbase_bp
]

__all__ = ['blueprints']