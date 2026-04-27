import requests
import json

# 测试创建读者的API
def test_create_reader():
    url = 'http://127.0.0.1:5000/api/reader/'
    
    # 测试数据
    test_data = {
        'reader_id': 'R20260001',
        'name': '测试读者',
        'email': 'test@example.com',
        'phone': '13800138000',
        'credit_score': 95,
        'borrow_quota': 10
    }
    
    try:
        response = requests.post(url, json=test_data)
        print(f'状态码: {response.status_code}')
        print(f'响应内容: {response.json()}')
        return response.status_code == 201
    except Exception as e:
        print(f'测试失败: {str(e)}')
        return False

if __name__ == '__main__':
    print('测试创建读者API...')
    success = test_create_reader()
    if success:
        print('测试成功!')
    else:
        print('测试失败!')