from flask import Flask, render_template, jsonify
from config import config
from models import db
from routes import blueprints

def create_app(config_name='default'):
    """创建Flask应用工厂"""
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])
    # 初始化数据库
    db.init_app(app)

    # 注册蓝图
    for bp in blueprints:
        app.register_blueprint(bp)

    # 注册前端页面路由
    register_frontend_routes(app)

    # 注册错误处理器
    register_error_handlers(app)

    # 创建数据库表（开发环境）
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