import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from models.reader import Reader
from models.book import Book
from models.borrow import BorrowRecord, Reservation, Fine
from datetime import datetime, timedelta
import random
import string

def generate_reader_id():
    """生成读者ID"""
    prefix = "R"
    suffix = ''.join(random.choices(string.digits, k=8))
    return f"{prefix}{suffix}"

def generate_isbn():
    """生成ISBN"""
    return ''.join(random.choices(string.digits, k=13))

def create_readers(count=10):
    """创建读者数据"""
    readers = []
    names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑一", "王二"]
    emails = ["zhangsan@example.com", "lisi@example.com", "wangwu@example.com", "zhaoliu@example.com", "qianqi@example.com",
              "sunba@example.com", "zhoujiu@example.com", "wushi@example.com", "zhengyi@example.com", "wanger@example.com"]
    phones = ["13800138000", "13900139000", "13700137000", "13600136000", "13500135000",
              "13400134000", "13300133000", "13200132000", "13100131000", "13000130000"]
    
    for i in range(count):
        reader_id = generate_reader_id()
        name = names[i]
        email = emails[i]
        phone = phones[i]
        
        reader = Reader(reader_id, name, email, phone)
        # 随机设置一些属性
        reader.credit_score = random.randint(80, 100)
        reader.borrow_quota = random.randint(3, 5)
        reader.overdue_count = random.randint(0, 2)
        reader.total_borrow_count = random.randint(0, 10)
        reader.last_active = datetime.utcnow() - timedelta(days=random.randint(0, 30))
        
        readers.append(reader)
    
    return readers

def create_books(count=20):
    """创建图书数据"""
    books = []
    titles = ["Python编程从入门到精通", "Java核心技术", "JavaScript高级程序设计", "数据结构与算法分析", "机器学习实战",
              "人工智能导论", "计算机网络", "操作系统原理", "数据库系统概论", "软件工程",
              "Web前端开发", "移动应用开发", "云计算技术", "大数据分析", "区块链技术",
              "网络安全", "嵌入式系统", "数字信号处理", "计算机图形学", "人工智能伦理"]
    authors = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑一", "王二"]
    publishers = ["清华大学出版社", "人民邮电出版社", "机械工业出版社", "电子工业出版社", "高等教育出版社"]
    categories = ["计算机科学", "人工智能", "网络技术", "软件工程", "数据科学"]
    
    for i in range(count):
        isbn = generate_isbn()
        title = titles[i % len(titles)]
        author = authors[random.randint(0, len(authors)-1)]
        publisher = publishers[random.randint(0, len(publishers)-1)]
        publish_year = random.randint(2010, 2024)
        category = categories[random.randint(0, len(categories)-1)]
        total_stock = random.randint(1, 10)
        price = round(random.uniform(30, 100), 2)
        
        book = Book(isbn, title, author, total_stock)
        book.publisher = publisher
        book.publish_year = publish_year
        book.category_path = f"/{category}"
        book.category_name = category
        book.available_stock = total_stock
        book.price = price
        book.borrow_count = random.randint(0, 20)
        book.hot_score = round(book.borrow_count / 10.0, 2)
        book.description = f"这是一本关于{title}的书籍"
        
        books.append(book)
    
    return books

def create_borrow_records(readers, books, count=15):
    """创建借阅记录"""
    records = []
    
    for i in range(count):
        reader = random.choice(readers)
        book = random.choice(books)
        
        # 确保图书有可借库存
        if book.available_stock <= 0:
            continue
        
        borrow_days = random.randint(14, 30)
        record = BorrowRecord(reader.reader_id, book.isbn, borrow_days)
        
        # 随机设置一些记录为已归还或逾期
        status = random.choice(['borrowed', 'returned', 'overdue'])
        record.status = status
        
        if status in ['returned', 'overdue']:
            # 随机设置归还日期
            borrow_days_past = random.randint(1, borrow_days + 10)
            record.return_date = record.borrow_date + timedelta(days=borrow_days_past)
            
            if status == 'overdue':
                # 计算罚款
                overdue_days = max(0, (record.return_date.date() - record.due_date).days)
                record.fine_amount = min(overdue_days * 0.5, 50.0)
        
        records.append(record)
        
        # 更新图书库存和借阅次数
        book.update_stock(-1)
        book.increment_borrow_count()
        
        # 更新读者借阅信息
        reader.total_borrow_count += 1
        if status == 'overdue':
            reader.overdue_count += 1
            reader.update_credit_score(-5)
    
    return records

def main():
    """主函数"""
    app = create_app()
    
    with app.app_context():
        # 检查是否已有数据
        reader_count = Reader.query.count()
        book_count = Book.query.count()
        borrow_count = BorrowRecord.query.count()
        
        print(f"现有数据：读者 {reader_count} 人，图书 {book_count} 本，借阅记录 {borrow_count} 条")
        
        if reader_count == 0 or book_count == 0:
            print("开始生成模拟数据...")
            
            # 创建读者数据
            readers = create_readers(10)
            db.session.add_all(readers)
            db.session.flush()  # 刷新以获取ID
            print(f"生成了 {len(readers)} 个读者")
            
            # 创建图书数据
            books = create_books(20)
            db.session.add_all(books)
            db.session.flush()
            print(f"生成了 {len(books)} 本图书")
            
            # 创建借阅记录
            records = create_borrow_records(readers, books, 15)
            db.session.add_all(records)
            print(f"生成了 {len(records)} 条借阅记录")
            
            # 提交所有数据
            db.session.commit()
            print("数据生成完成！")
        else:
            print("数据库中已存在数据，跳过生成步骤。")
        
        # 再次检查数据
        reader_count = Reader.query.count()
        book_count = Book.query.count()
        borrow_count = BorrowRecord.query.count()
        
        print(f"最终数据：读者 {reader_count} 人，图书 {book_count} 本，借阅记录 {borrow_count} 条")

if __name__ == "__main__":
    main()
