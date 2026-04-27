from flask import Flask, render_template, jsonify
from config import config
from models import db
from routes import blueprints

def create_app(config_name='default'):
    """创建Flask应用工厂"""
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])
    
    # 设置响应编码
    @app.after_request
    def after_request(response):
        # 如果响应还没有设置 Content-Type，则设置默认值
        if 'Content-Type' not in response.headers:
            response.headers.add('Content-Type', 'text/html; charset=utf-8')
        # 确保所有响应都包含字符编码
        content_type = response.headers.get('Content-Type', '')
        if 'charset=' not in content_type:
            if 'application/json' in content_type:
                response.headers['Content-Type'] = 'application/json; charset=utf-8'
            else:
                response.headers['Content-Type'] = content_type + '; charset=utf-8'
        
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # 初始化数据库
    db.init_app(app)

    # 注册蓝图
    for bp in blueprints:
        app.register_blueprint(bp)

    # 注册前端页面路由
    register_frontend_routes(app)

    # 注册错误处理器
    register_error_handlers(app)

    # 创建数据库表（仅在表不存在时创建，不删除已有数据）
    with app.app_context():
        db.create_all()

    return app

def register_frontend_routes(app):
    """注册前端页面路由"""

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/reader')
    def reader_page():
        return render_template('reader.html')

    @app.route('/book')
    def book_page():
        return render_template('book.html')

    @app.route('/borrow')
    def borrow_page():
        return render_template('borrow.html')

    @app.route('/admin')
    def admin_page():
        return render_template('admin.html')

    @app.route('/dashboard')
    def dashboard_page():
        return render_template('dashboard.html')

    @app.route('/stats')
    def stats_page():
        return render_template('stats.html')

    @app.route('/hbase')
    def hbase_page():
        return render_template('hbase_books.html')

def register_error_handlers(app):
    """注册错误处理器"""

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('500.html'), 500

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': '请求错误', 'message': str(e)}), 400

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'error': '禁止访问', 'message': str(e)}), 403

# 创建应用实例
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)