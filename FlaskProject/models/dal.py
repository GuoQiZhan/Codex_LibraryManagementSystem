from .base import db
from .reader import Reader
from .book import Book
from .borrow import BorrowRecord, Reservation, Fine
from .system_log import SystemLog
from datetime import datetime, timedelta
import traceback
import sqlalchemy.exc
import json
import os

class DAL:
    """数据访问层，处理数据库操作"""
    
    # 备份目录
    BACKUP_DIR = 'backup'
    
    @classmethod
    def _ensure_backup_dir(cls):
        """确保备份目录存在"""
        if not os.path.exists(cls.BACKUP_DIR):
            os.makedirs(cls.BACKUP_DIR)
    
    @classmethod
    def _backup_record(cls, target_type, record):
        """备份记录"""
        cls._ensure_backup_dir()
        
        # 生成备份文件名
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{cls.BACKUP_DIR}/{target_type}_{record.reader_id if hasattr(record, 'reader_id') else getattr(record, 'isbn', 'unknown')}_{timestamp}.json"
        
        # 转换记录为字典
        if hasattr(record, 'to_dict'):
            data = record.to_dict()
        else:
            data = {}
            for column in record.__table__.columns:
                value = getattr(record, column.name)
                if isinstance(value, datetime):
                    value = value.isoformat()
                # 处理 Decimal 类型
                from decimal import Decimal
                if isinstance(value, Decimal):
                    value = float(value)
                data[column.name] = value
        
        # 写入备份文件
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return filename
    
    @staticmethod
    def check_permission(user_id, action, target_type):
        """检查用户权限
        
        Args:
            user_id: 用户ID
            action: 操作类型 (create, read, update, delete)
            target_type: 目标类型 (reader, book, borrow, reservation, fine)
            
        Returns:
            bool: 是否有权限
        """
        # 这里可以根据实际的权限系统进行实现
        # 目前简单实现：系统用户拥有所有权限
        return user_id == 'system' or user_id == 'admin'
    
    @staticmethod
    def get_readers(page=1, per_page=20, search=''):
        """获取读者列表"""
        try:
            query = Reader.query
            
            if search:
                query = query.filter(
                    (Reader.reader_id.contains(search)) |
                    (Reader.name.contains(search)) |
                    (Reader.email.contains(search))
                )
            
            return query.paginate(page=page, per_page=per_page, error_out=False)
        except sqlalchemy.exc.OperationalError as e:
            traceback.print_exc()
            return None
        except Exception as e:
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_reader(reader_id):
        """获取单个读者"""
        try:
            return Reader.query.get(reader_id)
        except sqlalchemy.exc.OperationalError as e:
            traceback.print_exc()
            return None
        except Exception as e:
            traceback.print_exc()
            return None
    
    @staticmethod
    def create_reader(data):
        """创建读者"""
        try:
            # 检查读者ID是否已存在
            if Reader.query.get(data['reader_id']):
                return None, "读者ID已存在"
            
            reader = Reader(
                reader_id=data['reader_id'],
                name=data['name'],
                email=data.get('email'),
                phone=data.get('phone')
            )
            
            # 可选：设置信用分和借阅额度
            if 'credit_score' in data:
                reader.credit_score = data['credit_score']
            if 'borrow_quota' in data:
                reader.borrow_quota = data['borrow_quota']
            
            db.session.add(reader)
            db.session.commit()
            
            # 记录日志
            SystemLog.log_action(
                user_id='system',
                action_type='create_reader',
                target_type='reader',
                target_id=reader.reader_id,
                details=data
            )
            
            return reader, None
        except sqlalchemy.exc.OperationalError as e:
            db.session.rollback()
            traceback.print_exc()
            return None, "数据库连接失败，请稍后重试"
        except sqlalchemy.exc.IntegrityError as e:
            db.session.rollback()
            traceback.print_exc()
            return None, "数据已存在或格式错误"
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return None, str(e)
    
    @staticmethod
    def update_reader(reader_id, data, user_id='system'):
        """更新读者信息"""
        try:
            # 检查权限
            if not DAL.check_permission(user_id, 'update', 'reader'):
                return None, "无权限执行此操作"
            
            reader = Reader.query.get(reader_id)
            if not reader:
                return None, "读者不存在"
            
            # 备份记录
            DAL._backup_record('reader', reader)
            
            # 更新字段
            updatable_fields = ['name', 'email', 'phone', 'credit_score', 'borrow_quota']
            updated = False
            
            for field in updatable_fields:
                if field in data:
                    setattr(reader, field, data[field])
                    updated = True
            
            if 'credit_score' in data:
                reader.credit_score = max(60, min(100, data['credit_score']))
            
            if updated:
                reader.last_active = datetime.utcnow()
                db.session.commit()
                
                # 记录日志
                SystemLog.log_action(
                    user_id=user_id,
                    action_type='update_reader',
                    target_type='reader',
                    target_id=reader.reader_id,
                    details=data
                )
                
                return reader, None
            return reader, "无变更"
        except sqlalchemy.exc.OperationalError as e:
            db.session.rollback()
            traceback.print_exc()
            return None, "数据库连接失败，请稍后重试"
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return None, str(e)
    
    @staticmethod
    def delete_reader(reader_id, user_id='system'):
        """删除读者"""
        try:
            # 检查权限
            if not DAL.check_permission(user_id, 'delete', 'reader'):
                return None, "无权限执行此操作"
            
            reader = Reader.query.get(reader_id)
            if not reader:
                return None, "读者不存在"
            
            # 检查是否有未归还的借阅记录
            active_borrows = BorrowRecord.query.filter_by(
                reader_id=reader_id,
                status='borrowed'
            ).count()
            
            if active_borrows > 0:
                return None, "存在未归还的借阅记录，无法删除"
            
            # 备份记录
            DAL._backup_record('reader', reader)
            
            # 记录日志
            SystemLog.log_action(
                user_id=user_id,
                action_type='delete_reader',
                target_type='reader',
                target_id=reader.reader_id
            )
            
            db.session.delete(reader)
            db.session.commit()
            return True, None
        except sqlalchemy.exc.OperationalError as e:
            db.session.rollback()
            traceback.print_exc()
            return None, "数据库连接失败，请稍后重试"
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return None, str(e)
    
    @staticmethod
    def batch_delete_readers(reader_ids, user_id='system'):
        """批量删除读者"""
        try:
            # 检查权限
            if not DAL.check_permission(user_id, 'delete', 'reader'):
                return False, "无权限执行此操作"
            
            deleted_count = 0
            errors = []
            
            for reader_id in reader_ids:
                try:
                    reader = Reader.query.get(reader_id)
                    if not reader:
                        errors.append(f"读者 {reader_id} 不存在")
                        continue
                    
                    # 检查是否有未归还的借阅记录
                    active_borrows = BorrowRecord.query.filter_by(
                        reader_id=reader_id,
                        status='borrowed'
                    ).count()
                    
                    if active_borrows > 0:
                        errors.append(f"读者 {reader_id} 存在未归还的借阅记录，无法删除")
                        continue
                    
                    # 备份记录
                    DAL._backup_record('reader', reader)
                    
                    # 记录日志
                    SystemLog.log_action(
                        user_id=user_id,
                        action_type='delete_reader',
                        target_type='reader',
                        target_id=reader.reader_id
                    )
                    
                    db.session.delete(reader)
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"删除读者 {reader_id} 失败: {str(e)}")
            
            db.session.commit()
            
            if errors:
                return deleted_count > 0, "\n".join(errors)
            return True, f"成功删除 {deleted_count} 个读者"
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return False, str(e)
    
    @staticmethod
    def get_books(page=1, per_page=20, search='', category='', author='', available_only=False, sort_by='hot_score', sort_order='desc'):
        """获取图书列表"""
        try:
            query = Book.query
            
            if search:
                query = query.filter(
                    (Book.isbn.contains(search)) |
                    (Book.title.contains(search)) |
                    (Book.author.contains(search))
                )
            
            if category:
                query = query.filter(Book.category_path.contains(category))
            
            if author:
                query = query.filter(Book.author.contains(author))
            
            if available_only:
                query = query.filter(Book.available_stock > 0)
            
            # 排序
            if sort_by == 'hot_score':
                if sort_order == 'asc':
                    query = query.order_by(Book.hot_score.asc())
                else:
                    query = query.order_by(Book.hot_score.desc())
            elif sort_by == 'title':
                if sort_order == 'asc':
                    query = query.order_by(Book.title.asc())
                else:
                    query = query.order_by(Book.title.desc())
            elif sort_by == 'borrow_count':
                if sort_order == 'asc':
                    query = query.order_by(Book.borrow_count.asc())
                else:
                    query = query.order_by(Book.borrow_count.desc())
            
            return query.paginate(page=page, per_page=per_page, error_out=False)
        except sqlalchemy.exc.OperationalError as e:
            traceback.print_exc()
            return None
        except Exception as e:
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_book(isbn):
        """获取单本图书"""
        try:
            return Book.query.get(isbn)
        except sqlalchemy.exc.OperationalError as e:
            traceback.print_exc()
            return None
        except Exception as e:
            traceback.print_exc()
            return None
    
    @staticmethod
    def create_book(data):
        """创建图书"""
        try:
            # 检查图书是否已存在
            if Book.query.get(data['isbn']):
                return None, "图书ISBN已存在"
            
            book = Book(
                isbn=data['isbn'],
                title=data['title'],
                author=data.get('author'),
                total_stock=data.get('total_stock', 1)
            )
            
            # 设置其他字段
            optional_fields = [
                'publisher', 'publish_year', 'category_path',
                'category_name', 'price', 'description'
            ]
            
            for field in optional_fields:
                if field in data:
                    setattr(book, field, data[field])
            
            # 设置可用库存
            book.available_stock = book.total_stock
            
            db.session.add(book)
            db.session.commit()
            
            # 记录日志
            SystemLog.log_action(
                user_id='system',
                action_type='create_book',
                target_type='book',
                target_id=book.isbn,
                details=data
            )
            
            return book, None
        except sqlalchemy.exc.OperationalError as e:
            db.session.rollback()
            traceback.print_exc()
            return None, "数据库连接失败，请稍后重试"
        except sqlalchemy.exc.IntegrityError as e:
            db.session.rollback()
            traceback.print_exc()
            return None, "数据已存在或格式错误"
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return None, str(e)
    
    @staticmethod
    def update_book(isbn, data, user_id='system'):
        """更新图书信息"""
        try:
            # 检查权限
            if not DAL.check_permission(user_id, 'update', 'book'):
                return None, "无权限执行此操作"
            
            book = Book.query.get(isbn)
            if not book:
                return None, "图书不存在"
            
            # 备份记录
            DAL._backup_record('book', book)
            
            # 更新字段
            updatable_fields = [
                'title', 'author', 'publisher', 'publish_year',
                'category_path', 'category_name', 'price', 'description'
            ]
            
            for field in updatable_fields:
                if field in data:
                    setattr(book, field, data[field])
            
            # 如果更新了总库存，同时更新可用库存
            if 'total_stock' in data:
                book.total_stock = data['total_stock']
                # 确保可用库存不超过总库存
                book.available_stock = min(book.available_stock, book.total_stock)
            
            db.session.commit()
            
            # 记录日志
            SystemLog.log_action(
                user_id=user_id,
                action_type='update_book',
                target_type='book',
                target_id=book.isbn,
                details=data
            )
            
            return book, None
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return None, str(e)
    
    @staticmethod
    def delete_book(isbn, user_id='system'):
        """删除图书"""
        try:
            # 检查权限
            if not DAL.check_permission(user_id, 'delete', 'book'):
                return False, "无权限执行此操作"
            
            book = Book.query.get(isbn)
            if not book:
                return False, "图书不存在"
            
            # 检查是否有未归还的借阅记录
            active_borrows = BorrowRecord.query.filter_by(
                isbn=isbn,
                status='borrowed'
            ).count()
            
            if active_borrows > 0:
                return False, "存在未归还的借阅记录，无法删除"
            
            # 备份记录
            DAL._backup_record('book', book)
            
            # 记录日志
            SystemLog.log_action(
                user_id=user_id,
                action_type='delete_book',
                target_type='book',
                target_id=book.isbn
            )
            
            db.session.delete(book)
            db.session.commit()
            
            return True, None
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return False, str(e)
    
    @staticmethod
    def batch_delete_books(isbns, user_id='system'):
        """批量删除图书"""
        try:
            # 检查权限
            if not DAL.check_permission(user_id, 'delete', 'book'):
                return False, "无权限执行此操作"
            
            deleted_count = 0
            errors = []
            
            for isbn in isbns:
                try:
                    book = Book.query.get(isbn)
                    if not book:
                        errors.append(f"图书 {isbn} 不存在")
                        continue
                    
                    # 检查是否有未归还的借阅记录
                    active_borrows = BorrowRecord.query.filter_by(
                        isbn=isbn,
                        status='borrowed'
                    ).count()
                    
                    if active_borrows > 0:
                        errors.append(f"图书 {isbn} 存在未归还的借阅记录，无法删除")
                        continue
                    
                    # 备份记录
                    DAL._backup_record('book', book)
                    
                    # 记录日志
                    SystemLog.log_action(
                        user_id=user_id,
                        action_type='delete_book',
                        target_type='book',
                        target_id=book.isbn
                    )
                    
                    db.session.delete(book)
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"删除图书 {isbn} 失败: {str(e)}")
            
            db.session.commit()
            
            if errors:
                return deleted_count > 0, "\n".join(errors)
            return True, f"成功删除 {deleted_count} 本图书"
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return False, str(e)
    
    @staticmethod
    def update_stock(isbn, action, quantity):
        """更新图书库存"""
        try:
            book = Book.query.get(isbn)
            if not book:
                return None, "图书不存在"
            
            if quantity <= 0:
                return None, "数量必须为正数"
            
            if action == 'add':
                book.total_stock += quantity
                book.available_stock += quantity
            elif action == 'remove':
                if book.available_stock < quantity:
                    return None, "可用库存不足"
                book.total_stock -= quantity
                book.available_stock -= quantity
            else:
                return None, "action必须为add或remove"
            
            db.session.commit()
            
            # 记录日志
            SystemLog.log_action(
                user_id='system',
                action_type='update_stock',
                target_type='book',
                target_id=book.isbn,
                details={'action': action, 'quantity': quantity}
            )
            
            return book, None
        except Exception as e:
            db.session.rollback()
            traceback.print_exc()
            return None, str(e)
    
    @staticmethod
    def get_borrow_records(reader_id=None, book_isbn=None, status=None, page=1, per_page=20):
        """获取借阅记录"""
        try:
            query = BorrowRecord.query
            
            if reader_id:
                query = query.filter(BorrowRecord.reader_id == reader_id)
            
            if book_isbn:
                query = query.filter(BorrowRecord.isbn == book_isbn)
            
            if status:
                query = query.filter(BorrowRecord.status == status)
            
            return query.order_by(BorrowRecord.borrow_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
        except Exception as e:
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_overdue_books():
        """获取逾期图书"""
        try:
            today = datetime.utcnow().date()
            return BorrowRecord.query.filter(
                BorrowRecord.status == 'borrowed',
                BorrowRecord.due_date < today
            ).all()
        except Exception as e:
            traceback.print_exc()
            return []
    
    @staticmethod
    def get_available_books():
        """获取可借图书"""
        try:
            return Book.query.filter(Book.available_stock > 0).count()
        except Exception as e:
            traceback.print_exc()
            return 0
    
    @staticmethod
    def get_total_books():
        """获取总图书数"""
        try:
            return Book.query.count()
        except Exception as e:
            traceback.print_exc()
            return 0
    
    @staticmethod
    def get_total_readers():
        """获取总读者数"""
        try:
            return Reader.query.count()
        except Exception as e:
            traceback.print_exc()
            return 0
    
    @staticmethod
    def get_active_readers():
        """获取活跃读者数"""
        try:
            # 最近30天有活动的读者
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            return Reader.query.filter(Reader.last_active >= thirty_days_ago).count()
        except Exception as e:
            traceback.print_exc()
            return 0