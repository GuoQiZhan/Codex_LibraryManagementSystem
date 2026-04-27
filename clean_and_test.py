import os
import sys
import requests

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from FlaskProject.models.base import db
from FlaskProject.models.reader import Reader
from FlaskProject.config import config
from flask import Flask

app = Flask(__name__)
app.config.from_object(config['development'])
db.init_app(app)

with app.app_context():
    # 删除乱码数据
    readers = Reader.query.all()
    for reader in readers:
        if '????' in reader.name:
            print(f"删除乱码数据: {reader.reader_id} - {reader.name}")
            db.session.delete(reader)
    
    db.session.commit()
    print("乱码数据已删除")

# 创建新的测试数据
url = 'http://127.0.0.1:5000/api/reader/'
test_readers = [
    {
        'reader_id': 'R20260001',
        'name': '张三',
        'email': 'zhangsan@example.com',
        'phone': '13800138000',
        'credit_score': 95,
        'borrow_quota': 10
    },
    {
        'reader_id': 'R20260002',
        'name': '李四',
        'email': 'lisi@example.com',
        'phone': '13800138001',
        'credit_score': 88,
        'borrow_quota': 8
    },
    {
        'reader_id': 'R20260003',
        'name': '王五',
        'email': 'wangwu@example.com',
        'phone': '13800138002',
        'credit_score': 92,
        'borrow_quota': 6
    }
]

print("\n创建新的测试数据:")
for data in test_readers:
    print(f"创建读者: {data['name']}")
    response = requests.post(url, json=data)
    if response.status_code == 201:
        print(f"  成功: {response.json()['name']}")
    else:
        print(f"  失败: {response.status_code}")

# 获取读者列表
print("\n获取读者列表:")
response = requests.get(url)
readers = response.json().get('readers', [])
for reader in readers:
    print(f"读者ID: {reader['reader_id']}, 姓名: {reader['name']}")