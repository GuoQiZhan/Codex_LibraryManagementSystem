from .base import db
from datetime import datetime
import json

class SystemLog(db.Model):
    """系统日志模型"""
    __tablename__ = 'system_log'

    log_id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(20), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    target_type = db.Column(db.Enum('book', 'reader', 'borrow', 'reservation', 'fine'), nullable=False)
    target_id = db.Column(db.String(100), nullable=False)
    action_time = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    details = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, user_id, action_type, target_type, target_id, ip_address=None, user_agent=None, details=None):
        self.user_id = user_id
        self.action_type = action_type
        self.target_type = target_type
        self.target_id = target_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.details = details or {}

    @classmethod
    def log_action(cls, user_id, action_type, target_type, target_id, **details):
        """记录操作日志的便捷方法"""
        log = cls(
            user_id=user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=str(target_id),
            details=details
        )
        db.session.add(log)
        # 不在这里提交事务，让调用者负责
        return log

    def to_dict(self):
        """将模型转换为字典"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result