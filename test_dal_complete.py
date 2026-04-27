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

# 创建Flask应用
app = Flask(__name__)
app.config.from_object(config['development'])
db.init_app(app)

# 启动测试
print("开始测试数据库操作功能...")

with app.app_context():
    # 测试1: 测试创建读者
    print("\n测试1: 测试创建读者")
    reader_data = {
        'reader_id': 'R20260001',
        'name': '测试读者',
        'email': 'test@example.com',
        'phone': '13800138000',
        'credit_score': 90,
        'borrow_quota': 5
    }
    
    reader, error = DAL.create_reader(reader_data)
    if error:
        print(f"创建读者失败: {error}")
    else:
        print(f"创建读者成功: {reader.name}")
    
    # 测试2: 测试更新读者
    print("\n测试2: 测试更新读者")
    update_data = {
        'name': '测试读者 (更新)',
        'credit_score': 95
    }
    
    updated_reader, error = DAL.update_reader('R20260001', update_data, 'admin')
    if error:
        print(f"更新读者失败: {error}")
    else:
        print(f"更新读者成功: {updated_reader.name}, 信用分: {updated_reader.credit_score}")
    
    # 测试3: 测试创建图书
    print("\n测试3: 测试创建图书")
    book_data = {
        'isbn': '9787111676615',
        'title': 'Python编程从入门到实践',
        'author': 'Eric Matthes',
        'publisher': '机械工业出版社',
        'publish_year': 2020,
        'category_name': '计算机',
        'category_path': '计算机/编程语言/Python',
        'total_stock': 10,
        'price': 99.00,
        'description': 'Python编程入门经典书籍'
    }
    
    book, error = DAL.create_book(book_data)
    if error:
        print(f"创建图书失败: {error}")
    else:
        print(f"创建图书成功: {book.title}")
    
    # 测试4: 测试更新图书
    print("\n测试4: 测试更新图书")
    book_update_data = {
        'title': 'Python编程从入门到实践 (第3版)',
        'price': 109.00
    }
    
    updated_book, error = DAL.update_book('9787111676615', book_update_data, 'admin')
    if error:
        print(f"更新图书失败: {error}")
    else:
        print(f"更新图书成功: {updated_book.title}, 价格: {updated_book.price}")
    
    # 测试5: 测试权限检查
    print("\n测试5: 测试权限检查")
    print(f"管理员权限: {DAL.check_permission('admin', 'delete', 'reader')}")
    print(f"普通用户权限: {DAL.check_permission('user', 'delete', 'reader')}")
    
    # 测试6: 测试备份功能
    print("\n测试6: 测试备份功能")
    if os.path.exists(DAL.BACKUP_DIR):
        backup_files = os.listdir(DAL.BACKUP_DIR)
        print(f"备份文件数量: {len(backup_files)}")
        if backup_files:
            print(f"最新备份文件: {backup_files[-1]}")
    else:
        print("备份目录不存在")
    
    # 测试7: 测试批量删除
    print("\n测试7: 测试批量删除")
    # 创建另一个测试读者
    reader_data2 = {
        'reader_id': 'R20260002',
        'name': '测试读者2',
        'email': 'test2@example.com',
        'phone': '13800138001'
    }
    DAL.create_reader(reader_data2)
    
    # 批量删除读者
    success, message = DAL.batch_delete_readers(['R20260001', 'R20260002'], 'admin')
    print(f"批量删除结果: {success}, 消息: {message}")
    
    # 测试8: 测试批量删除图书
    print("\n测试8: 测试批量删除图书")
    # 创建另一本测试图书
    book_data2 = {
        'isbn': '9787115546021',
        'title': 'JavaScript高级程序设计',
        'author': 'Matt Frisbie',
        'total_stock': 5
    }
    DAL.create_book(book_data2)
    
    # 批量删除图书
    success, message = DAL.batch_delete_books(['9787111676615', '9787115546021'], 'admin')
    print(f"批量删除结果: {success}, 消息: {message}")
    
    print("\n测试完成！")