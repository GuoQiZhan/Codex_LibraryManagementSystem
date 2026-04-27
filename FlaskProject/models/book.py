from .base import db, BaseModel

class Book(BaseModel):
    """图书模型"""
    __tablename__ = 'book'

    isbn = db.Column(db.String(20), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100))
    publisher = db.Column(db.String(100))
    publish_year = db.Column(db.Integer)
    category_path = db.Column(db.String(100))
    category_name = db.Column(db.String(50))
    total_stock = db.Column(db.Integer, default=0)
    available_stock = db.Column(db.Integer, default=0)
    price = db.Column(db.Numeric(10, 2))
    hot_score = db.Column(db.Numeric(5, 2), default=0.0)
    borrow_count = db.Column(db.Integer, default=0)
    description = db.Column(db.Text)

    # 关系
    borrow_records = db.relationship('BorrowRecord', backref='book_ref', lazy='dynamic')
    reservations = db.relationship('Reservation', backref='book_ref', lazy='dynamic')

    def __init__(self, isbn, title, author=None, total_stock=0):
        self.isbn = isbn
        self.title = title
        self.author = author
        self.total_stock = total_stock
        self.available_stock = total_stock

    def is_available(self):
        """检查图书是否可借"""
        return self.available_stock > 0

    def update_stock(self, change):
        """更新库存"""
        self.available_stock += change
        # 确保库存不会超过总库存或为负数
        self.available_stock = max(0, min(self.available_stock, self.total_stock))

    def increment_borrow_count(self):
        """增加借阅次数"""
        self.borrow_count += 1
        # 更新热度分数（简单实现：借阅次数/10）
        self.hot_score = self.borrow_count / 10.0

    def to_dict(self):
        """重写to_dict方法，包含计算字段"""
        data = super().to_dict()
        data['is_available'] = self.is_available()
        return data