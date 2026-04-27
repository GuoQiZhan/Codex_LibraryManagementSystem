import requests

# 测试添加新读者
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

print("创建测试读者:")
for data in test_readers:
    print(f"创建读者: {data['name']}")
    response = requests.post(url, json=data)
    if response.status_code == 201:
        print(f"  成功: {response.json()['name']}")
    else:
        print(f"  失败: {response.status_code} - {response.json().get('error')}")

# 测试获取读者列表
print("\n获取读者列表:")
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    readers = data.get('readers', [])
    print(f"共 {data.get('total', 0)} 个读者")
    for reader in readers:
        print(f"读者ID: {reader['reader_id']}, 姓名: {reader['name']}, 信用分: {reader['credit_score']}")
else:
    print(f"获取读者列表失败: {response.status_code}")

# 测试编辑读者
print("\n测试编辑读者:")
update_data = {
    'name': '张三 (更新)',
    'credit_score': 98,
    'borrow_quota': 12
}
response = requests.put(f"{url}R20260001", json=update_data)
if response.status_code == 200:
    print(f"编辑成功: {response.json()['name']}, 信用分: {response.json()['credit_score']}")
else:
    print(f"编辑失败: {response.status_code} - {response.json().get('error')}")

# 测试删除读者
print("\n测试删除读者:")
response = requests.delete(f"{url}R20260003")
if response.status_code == 200:
    print(f"删除成功: {response.json()['message']}")
else:
    print(f"删除失败: {response.status_code} - {response.json().get('error')}")

# 再次获取读者列表，验证删除结果
print("\n再次获取读者列表:")
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    readers = data.get('readers', [])
    print(f"共 {data.get('total', 0)} 个读者")
    for reader in readers:
        print(f"读者ID: {reader['reader_id']}, 姓名: {reader['name']}, 信用分: {reader['credit_score']}")
else:
    print(f"获取读者列表失败: {response.status_code}")