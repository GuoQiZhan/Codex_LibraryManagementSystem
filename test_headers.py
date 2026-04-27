import requests

# 测试API响应头
url = 'http://127.0.0.1:5000/api/reader/'
response = requests.get(url)

print("响应状态码:", response.status_code)
print("响应头:")
for key, value in response.headers.items():
    print(f"  {key}: {value}")

print("\n响应内容:")
data = response.json()
readers = data.get('readers', [])
for reader in readers:
    print(f"读者ID: {reader['reader_id']}, 姓名: {reader['name']}")