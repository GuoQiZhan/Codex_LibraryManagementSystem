import requests

# 获取读者列表
response = requests.get('http://127.0.0.1:5000/api/reader/')
print("读者列表 API 响应:")
print(response.json())
print("\n")

# 检查是否包含 borrow_records 字段
readers = response.json().get('readers', [])
if readers:
    first_reader = readers[0]
    print("第一个读者的字段:")
    print(list(first_reader.keys()))
    print("\n")
    print("第一个读者的完整数据:")
    print(first_reader)