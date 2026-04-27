import os
import sys

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from FlaskProject.models.base import db
from FlaskProject.models.reader import Reader
from FlaskProject.models.book import Book
from FlaskProject.models.dal import DAL
from FlaskProject.config import config
from flask import Flask

app = Flask(__name__)
app.config.from_object(config['development'])
db.init_app(app)

with app.app_context():
    # 测试1: 测试权限检查
    print("测试1: 测试权限检查")
    print(f"系统用户权限: {DAL.check_permission('system', 'delete', 'reader')}")
    print(f"管理员权限: {DAL.check_permission('admin', 'delete', 'reader')}")
    print(f"普通用户权限: {DAL.check_permission('user', 'delete', 'reader')}")
    print()
    
    # 测试2: 测试更新功能
    print("测试2: 测试更新功能")
    # 确保有测试数据
    reader = Reader.query.first()
    if reader:
        print(f"更新前读者信息: {reader.name}, 信用分: {reader.credit_score}")
        updated_reader, error = DAL.update_reader(
            reader.reader_id, 
            {'name': reader.name + ' (更新)', 'credit_score': 95}, 
            'admin'
        )
        if error:
            print(f"更新失败: {error}")
        else:
            print(f"更新后读者信息: {updated_reader.name}, 信用分: {updated_reader.credit_score}")
    else:
        print("没有读者数据，跳过更新测试")
    print()
    
    # 测试3: 测试批量删除功能
    print("测试3: 测试批量删除功能")
    # 获取所有读者ID
    readers = Reader.query.all()
    if len(readers) >= 2:
        reader_ids = [readers[0].reader_id, readers[1].reader_id]
        print(f"尝试删除读者: {reader_ids}")
        success, message = DAL.batch_delete_readers(reader_ids, 'admin')
        print(f"批量删除结果: {success}, 消息: {message}")
    else:
        print("读者数据不足，跳过批量删除测试")
    print()
    
    # 测试4: 测试备份功能
    print("测试4: 测试备份功能")
    # 检查备份目录是否存在
    if os.path.exists(DAL.BACKUP_DIR):
        backup_files = os.listdir(DAL.BACKUP_DIR)
        print(f"备份文件数量: {len(backup_files)}")
        if backup_files:
            print(f"最新备份文件: {backup_files[-1]}")
    else:
        print("备份目录不存在")
    print()
    
    # 测试5: 测试图书更新和删除功能
    print("测试5: 测试图书更新和删除功能")
    book = Book.query.first()
    if book:
        print(f"图书信息: {book.title}, ISBN: {book.isbn}")
        # 测试更新
        updated_book, error = DAL.update_book(
            book.isbn, 
            {'title': book.title + ' (更新)'}, 
            'admin'
        )
        if error:
            print(f"更新图书失败: {error}")
        else:
            print(f"更新后图书标题: {updated_book.title}")
        # 测试删除
        success, error = DAL.delete_book(book.isbn, 'admin')
        if error:
            print(f"删除图书失败: {error}")
        else:
            print("删除图书成功")
    else:
        print("没有图书数据，跳过图书测试")
    print()
    
    print("测试完成！")