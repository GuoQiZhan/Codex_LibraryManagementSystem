from .base import db, BaseModel
from datetime import datetime

class Reader(BaseModel):
    """读者模型"""
    __tablename__ = 'reader'

    reader_id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True)
    phone = db.Column(db.String(20))
    credit_score = db.Column(db.Integer, default=100)
    borrow_quota = db.Column(db.Integer, default=5)
    overdue_count = db.Column(db.Integer, default=0)
    total_borrow_count = db.Column(db.Integer, default=0)
    last_active = db.Column(db.DateTime)

    # 关系
    borrow_records = db.relationship('BorrowRecord', backref='reader_ref', lazy='dynamic')
    reservations = db.relationship('Reservation', backref='reader_ref', lazy='dynamic')
    fines = db.relationship('Fine', backref='reader_ref', lazy='dynamic')

    def __init__(self, reader_id, name, email=None, phone=None):
        self.reader_id = reader_id
        self.name = name
        self.email = email
        self.phone = phone
        self.last_active = datetime.utcnow()

    def update_credit_score(self, delta):
        """更新信用分"""
        new_score = self.credit_score + delta
        self.credit_score = max(60, min(100, new_score))

    def can_borrow(self):
        """检查是否可以借书"""
        from .borrow import BorrowRecord
        current_borrowed = BorrowRecord.query.filter_by(
            reader_id=self.reader_id,
            status='borrowed'
        ).count()
        return current_borrowed < self.borrow_quota

    def to_dict(self):
        """重写to_dict方法，包含计算字段"""
        data = super().to_dict()
        data['can_borrow'] = self.can_borrow()
        return data