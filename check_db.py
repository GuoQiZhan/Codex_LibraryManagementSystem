import os
import sys

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from FlaskProject.models.base import db
from FlaskProject.models.reader import Reader

# 手动初始化数据库连接
from FlaskProject.config import config
from flask import Flask

app = Flask(__name__)
app.config.from_object(config['development'])
db.init_app(app)

with app.app_context():
    # 查询所有读者
    readers = Reader.query.all()
    print("数据库中的读者数据:")
    for reader in readers:
        print(f"读者ID: {reader.reader_id}")
        print(f"姓名: {reader.name}")
        print(f"邮箱: {reader.email}")
        print(f"电话: {reader.phone}")
        print(f"信用分: {reader.credit_score}")
        print("---")

    # 检查数据库表结构
    print("\n数据库表结构:")
    for column in Reader.__table__.columns:
        print(f"{column.name}: {column.type}")