from .base import db, BaseModel
from datetime import datetime, timedelta

class BorrowRecord(BaseModel):
    """借阅记录模型"""
    __tablename__ = 'borrow_record'

    record_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    reader_id = db.Column(db.String(20), db.ForeignKey('reader.reader_id'), nullable=False)
    isbn = db.Column(db.String(20), db.ForeignKey('book.isbn'), nullable=False)
    borrow_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.DateTime)
    status = db.Column(db.Enum('borrowed', 'returned', 'overdue'), default='borrowed')
    renew_count = db.Column(db.Integer, default=0)
    fine_amount = db.Column(db.Numeric(10, 2), default=0.00)

    def __init__(self, reader_id, isbn, borrow_days=30):
        self.reader_id = reader_id
        self.isbn = isbn
        self.borrow_date = datetime.utcnow()
        self.due_date = (datetime.utcnow() + timedelta(days=borrow_days)).date()

    def calculate_fine(self):
        """计算罚款金额"""
        if self.status != 'overdue' or self.return_date:
            return 0.0

        overdue_days = (datetime.utcnow().date() - self.due_date).days
        if overdue_days <= 0:
            return 0.0

        # 简单罚款计算：每天0.5元
        fine = overdue_days * 0.5
        return min(fine, 50.0)  # 最高罚款50元

    def renew(self, extra_days=30):
        """续借图书"""
        if self.renew_count >= 2:
            return False, "已达到最大续借次数"
        if self.status != 'borrowed':
            return False, "只能续借未归还的图书"

        self.renew_count += 1
        self.due_date = (self.due_date + timedelta(days=extra_days))
        return True, "续借成功"

    def return_book(self):
        """归还图书"""
        if self.status == 'returned':
            return False, "图书已归还"

        self.return_date = datetime.utcnow()

        # 检查是否逾期
        if self.return_date.date() > self.due_date:
            self.status = 'overdue'
            self.fine_amount = self.calculate_fine()
        else:
            self.status = 'returned'

        return True, "归还成功"

class Reservation(BaseModel):
    """预约记录模型"""
    __tablename__ = 'reservation'

    reservation_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    reader_id = db.Column(db.String(20), db.ForeignKey('reader.reader_id'), nullable=False)
    isbn = db.Column(db.String(20), db.ForeignKey('book.isbn'), nullable=False)
    reserve_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum('pending', 'ready', 'cancelled', 'expired'), default='pending')
    expiry_date = db.Column(db.DateTime, nullable=False)

    def __init__(self, reader_id, isbn, expiry_days=7):
        self.reader_id = reader_id
        self.isbn = isbn
        self.expiry_date = datetime.utcnow() + timedelta(days=expiry_days)

class Fine(BaseModel):
    """罚款记录模型"""
    __tablename__ = 'fine'

    fine_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    reader_id = db.Column(db.String(20), db.ForeignKey('reader.reader_id'), nullable=False)
    record_id = db.Column(db.BigInteger, db.ForeignKey('borrow_record.record_id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    fine_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum('unpaid', 'paid', 'waived'), default='unpaid')
    payment_date = db.Column(db.DateTime)
    reason = db.Column(db.String(200))

    def __init__(self, reader_id, record_id, amount, reason=""):
        self.reader_id = reader_id
        self.record_id = record_id
        self.amount = amount
        self.reason = reason