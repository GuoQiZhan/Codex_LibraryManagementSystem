import os
import sys
import requests

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 直接调用 API 创建读者
url = 'http://127.0.0.1:5000/api/reader/'
data = {
    'reader_id': 'R20260004',
    'name': '测试读者4',
    'email': 'test4@example.com',
    'phone': '13800138003',
    'credit_score': 80,
    'borrow_quota': 4
}

print(f"发送创建读者请求，姓名: {data['name']}")
response = requests.post(url, json=data)
print(f"响应状态码: {response.status_code}")
print(f"响应内容: {response.json()}")

# 获取读者列表
print("\n获取读者列表:")
response = requests.get(url)
readers = response.json().get('readers', [])
for reader in readers:
    print(f"读者ID: {reader['reader_id']}, 姓名: {reader['name']}")