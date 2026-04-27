# 测试图表数据API
import sys
import os

sys.path.append('FlaskProject')

from app import create_app

def test_chart_apis():
    app = create_app()
    client = app.test_client()

    # 测试1: 借阅趋势API
    response = client.get('/api/stats/borrow-trend?period=month')
    if response.status_code == 200:
        data = response.get_json()
        if data.get('dates'):
            pass

    # 测试2: 图书类别API
    response = client.get('/api/stats/category-distribution')
    if response.status_code == 200:
        data = response.get_json()
        if data.get('categories'):
            pass

    # 测试3: 读者活跃度API
    response = client.get('/api/stats/reader-activity')
    if response.status_code == 200:
        data = response.get_json()
        pass

if __name__ == '__main__':
    test_chart_apis()