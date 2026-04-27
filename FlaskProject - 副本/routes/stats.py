from flask import Blueprint, jsonify, request
from models import db, Reader, Book, BorrowRecord
from datetime import datetime, timedelta
from sqlalchemy import func, extract

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('/overview', methods=['GET'])
def get_overview():
    """获取系统概览统计"""
    # 读者总数
    total_readers = Reader.query.count()

    # 图书总数
    total_books = Book.query.count()

    # 总库存
    total_stock = db.session.query(func.sum(Book.total_stock)).scalar() or 0

    # 可用库存
    available_stock = db.session.query(func.sum(Book.available_stock)).scalar() or 0

    # 今日借阅数
    today = datetime.utcnow().date()
    today_borrows = BorrowRecord.query.filter(
        func.date(BorrowRecord.borrow_date) == today
    ).count()

    # 当前借出图书数
    current_borrowed = BorrowRecord.query.filter_by(status='borrowed').count()

    # 逾期图书数
    overdue_books = BorrowRecord.query.filter_by(status='overdue').count()

    # 热门图书（借阅次数最多的前5本）
    popular_books = Book.query.order_by(Book.borrow_count.desc()).limit(5).all()

    # 活跃读者（最近30天有借阅的读者）
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_readers = Reader.query.filter(
        Reader.last_active >= thirty_days_ago
    ).count()

    return jsonify({
        'overview': {
            'total_readers': total_readers,
            'total_books': total_books,
            'total_stock': int(total_stock),
            'available_stock': int(available_stock),
            'today_borrows': today_borrows,
            'current_borrowed': current_borrowed,
            'overdue_books': overdue_books,
            'active_readers': active_readers
        },
        'popular_books': [
            {
                'isbn': book.isbn,
                'title': book.title,
                'author': book.author,
                'borrow_count': book.borrow_count,
                'hot_score': float(book.hot_score) if book.hot_score else 0.0
            }
            for book in popular_books
        ]
    })

@stats_bp.route('/borrow-trend', methods=['GET'])
def get_borrow_trend():
    """获取借阅趋势数据（用于折线图）"""
    period = request.args.get('period', 'week')  # day, week, month, year

    end_date = datetime.utcnow()

    if period == 'day':
        start_date = end_date - timedelta(days=1)
        interval = 'hour'
    elif period == 'week':
        start_date = end_date - timedelta(days=7)
        interval = 'day'
    elif period == 'month':
        start_date = end_date - timedelta(days=30)
        interval = 'day'
    elif period == 'year':
        start_date = end_date - timedelta(days=365)
        interval = 'month'
    else:
        start_date = end_date - timedelta(days=7)
        interval = 'day'

    # 根据间隔分组查询
    if interval == 'hour':
        borrow_stats = db.session.query(
            func.date_format(BorrowRecord.borrow_date, '%Y-%m-%d %H:00').label('time_group'),
            func.count(BorrowRecord.record_id).label('count')
        ).filter(BorrowRecord.borrow_date >= start_date)\
         .group_by('time_group')\
         .order_by('time_group')\
         .all()
    elif interval == 'day':
        borrow_stats = db.session.query(
            func.date(BorrowRecord.borrow_date).label('date'),
            func.count(BorrowRecord.record_id).label('count')
        ).filter(BorrowRecord.borrow_date >= start_date)\
         .group_by(func.date(BorrowRecord.borrow_date))\
         .order_by('date')\
         .all()
    elif interval == 'month':
        borrow_stats = db.session.query(
            func.date_format(BorrowRecord.borrow_date, '%Y-%m').label('month'),
            func.count(BorrowRecord.record_id).label('count')
        ).filter(BorrowRecord.borrow_date >= start_date)\
         .group_by('month')\
         .order_by('month')\
         .all()

    # 格式化数据
    if interval == 'hour':
        dates = [stat.time_group for stat in borrow_stats]
        counts = [stat.count for stat in borrow_stats]
    elif interval == 'day':
        dates = [stat.date.isoformat() for stat in borrow_stats]
        counts = [stat.count for stat in borrow_stats]
    elif interval == 'month':
        dates = [stat.month for stat in borrow_stats]
        counts = [stat.count for stat in borrow_stats]

    return jsonify({
        'dates': dates,
        'borrow_counts': counts,
        'period': period,
        'interval': interval
    })

@stats_bp.route('/category-distribution', methods=['GET'])
def get_category_distribution():
    """获取图书类别分布数据（用于饼图）"""
    categories = db.session.query(
        Book.category_name,
        func.count(Book.isbn).label('book_count'),
        func.sum(Book.borrow_count).label('total_borrows')
    ).filter(Book.category_name.isnot(None))\
     .group_by(Book.category_name)\
     .order_by(func.count(Book.isbn).desc())\
     .all()

    # 准备饼图数据
    pie_data = []
    for cat in categories:
        if cat.category_name:
            pie_data.append({
                'name': cat.category_name,
                'value': cat.book_count,
                'borrows': int(cat.total_borrows or 0)
            })

    # 如果类别太多，只显示前10个，其他合并为"其他"
    if len(pie_data) > 10:
        top_10 = pie_data[:10]
        other_count = sum(item['value'] for item in pie_data[10:])
        other_borrows = sum(item['borrows'] for item in pie_data[10:])
        top_10.append({
            'name': '其他',
            'value': other_count,
            'borrows': other_borrows
        })
        pie_data = top_10

    return jsonify({
        'categories': pie_data,
        'total_categories': len(categories)
    })

@stats_bp.route('/reader-activity', methods=['GET'])
def get_reader_activity():
    """获取读者活跃度数据（用于热力图或柱状图）"""
    # 按借阅次数分组读者
    activity_groups = db.session.query(
        func.floor(Reader.total_borrow_count / 10).label('group'),
        func.count(Reader.reader_id).label('reader_count')
    ).group_by('group')\
     .order_by('group')\
     .all()

    groups = []
    for group in activity_groups:
        min_borrows = group.group * 10
        max_borrows = min_borrows + 9
        if group.group == 0:
            label = f'0-9次'
        else:
            label = f'{min_borrows}-{max_borrows}次'
        groups.append({
            'range': label,
            'reader_count': group.reader_count,
            'min_borrows': min_borrows,
            'max_borrows': max_borrows
        })

    # 获取最近7天每天的新增读者数
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    daily_new_readers = db.session.query(
        func.date(Reader.created_at).label('date'),
        func.count(Reader.reader_id).label('new_readers')
    ).filter(Reader.created_at >= seven_days_ago)\
     .group_by(func.date(Reader.created_at))\
     .order_by('date')\
     .all()

    new_reader_data = {
        'dates': [stat.date.isoformat() for stat in daily_new_readers],
        'counts': [stat.new_readers for stat in daily_new_readers]
    }

    return jsonify({
        'activity_groups': groups,
        'new_reader_trend': new_reader_data
    })

@stats_bp.route('/hourly-distribution', methods=['GET'])
def get_hourly_distribution():
    """获取借阅时间分布（24小时热力图）"""
    # 统计每天各小时的借阅数量
    hourly_stats = db.session.query(
        extract('hour', BorrowRecord.borrow_date).label('hour'),
        func.count(BorrowRecord.record_id).label('count')
    ).group_by('hour')\
     .order_by('hour')\
     .all()

    # 初始化24小时数据
    hours = list(range(24))
    counts = [0] * 24

    for stat in hourly_stats:
        hour = int(stat.hour)
        if 0 <= hour < 24:
            counts[hour] = stat.count

    return jsonify({
        'hours': hours,
        'counts': counts
    })

@stats_bp.route('/credit-distribution', methods=['GET'])
def get_credit_distribution():
    """获取读者信用分分布"""
    # 信用分分组：<60, 60-69, 70-79, 80-89, 90-100
    credit_ranges = [
        ('<60', 'credit_score < 60'),
        ('60-69', 'credit_score BETWEEN 60 AND 69'),
        ('70-79', 'credit_score BETWEEN 70 AND 79'),
        ('80-89', 'credit_score BETWEEN 80 AND 89'),
        ('90-100', 'credit_score BETWEEN 90 AND 100')
    ]

    distribution = []
    for range_name, condition in credit_ranges:
        count = db.session.query(Reader.reader_id).filter(
            db.text(condition)
        ).count()
        distribution.append({
            'range': range_name,
            'count': count
        })

    # 平均信用分
    avg_credit = db.session.query(func.avg(Reader.credit_score)).scalar() or 0

    return jsonify({
        'credit_distribution': distribution,
        'average_credit': float(avg_credit),
        'total_readers': sum(item['count'] for item in distribution)
    })