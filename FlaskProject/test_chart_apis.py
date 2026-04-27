# 测试图表数据API
import sys
import os

sys.path.append('FlaskProject')

from app import create_app

def test_chart_apis():
    app = create_app()
    client = app.test_client()

    print("测试图表数据API...")

    # 测试1: 借阅趋势API
    print("\n1. 测试借阅趋势API:")
    response = client.get('/api/stats/borrow-trend?period=month')
    if response.status_code == 200:
        data = response.get_json()
        print(f"  状态码: {response.status_code}")
        print(f"  日期数量: {len(data.get('dates', []))}")
        print(f"  借阅数据数量: {len(data.get('borrow_counts', []))}")
        print(f"  归还数据数量: {len(data.get('return_counts', []))}")
        if data.get('dates'):
            print(f"  日期示例: {data['dates'][:3]}...")
            print(f"  借阅数据示例: {data['borrow_counts'][:3]}...")
    else:
        print(f"  状态码: {response.status_code}")
        print(f"  响应内容: {response.data}")

    # 测试2: 图书类别API
    print("\n2. 测试图书类别API:")
    response = client.get('/api/stats/category-distribution')
    if response.status_code == 200:
        data = response.get_json()
        print(f"  状态码: {response.status_code}")
        print(f"  类别数量: {len(data.get('categories', []))}")
        if data.get('categories'):
            print(f"  类别示例: {data['categories'][:3]}...")
    else:
        print(f"  状态码: {response.status_code}")
        print(f"  响应内容: {response.data}")

    # 测试3: 读者活跃度API
    print("\n3. 测试读者活跃度API:")
    response = client.get('/api/stats/reader-activity')
    if response.status_code == 200:
        data = response.get_json()
        print(f"  状态码: {response.status_code}")
        print(f"  活跃读者趋势日期数量: {len(data.get('active_reader_trend', {}).get('dates', []))}")
        print(f"  新读者趋势日期数量: {len(data.get('new_reader_trend', {}).get('dates', []))}")
    else:
        print(f"  状态码: {response.status_code}")
        print(f"  响应内容: {response.data}")

if __name__ == '__main__':
    test_chart_apis()