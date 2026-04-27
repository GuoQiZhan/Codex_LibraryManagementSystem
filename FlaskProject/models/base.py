from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class BaseModel(db.Model):
    """抽象基类，提供通用字段和方法"""
    __abstract__ = True

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """将模型转换为字典"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            # 处理 Decimal 类型
            from decimal import Decimal
            if isinstance(value, Decimal):
                value = float(value)
            result[column.name] = value
        return result

    def save(self):
        """保存对象到数据库"""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """从数据库删除对象"""
        db.session.delete(self)
        db.session.commit()