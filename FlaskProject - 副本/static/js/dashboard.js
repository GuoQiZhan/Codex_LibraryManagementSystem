// dashboard.js - 仪表盘图表和数据管理
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有图表
    initStatsCards();
    initBorrowTrendChart();
    initCategoryChart();
    initActivityChart();
    initRecentActivities();

    // 绑定事件监听器
    bindEventListeners();

    // 初始数据加载
    loadDashboardData();
});

// 统计数据卡片
function initStatsCards() {
    // 卡片元素
    window.statsCards = {
        todayBorrows: document.getElementById('todayBorrows'),
        activeReaders: document.getElementById('activeReaders'),
        borrowedBooks: document.getElementById('borrowedBooks'),
        overdueBooks: document.getElementById('overdueBooks'),
        availableBooks: document.getElementById('availableBooks'),
        borrowChange: document.getElementById('borrowChange'),
        readerChange: document.getElementById('readerChange'),
        overdueChange: document.getElementById('overdueChange')
    };
}

// 初始化借阅趋势图
function initBorrowTrendChart() {
    const chartDom = document.getElementById('borrowTrendChart');
    window.borrowTrendChart = echarts.init(chartDom);

    const option = {
        title: {
            text: '图书借阅趋势',
            left: 'center',
            textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = `<div style="margin-bottom: 5px;">${params[0].axisValue}</div>`;
                params.forEach(param => {
                    result += `<div>
                        <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${param.color}"></span>
                        ${param.seriesName}: ${param.value} 本
                    </div>`;
                });
                return result;
            }
        },
        legend: {
            data: ['借阅量'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 80,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: [],
            axisLine: {
                lineStyle: {
                    color: '#E6E6FA'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#E6E6FA'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#F0F0F0',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '借阅量',
                type: 'line',
                smooth: true,
                data: [],
                lineStyle: {
                    width: 3,
                    color: '#D8BFD8'
                },
                itemStyle: {
                    color: '#D8BFD8'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(216, 191, 216, 0.6)' },
                        { offset: 1, color: 'rgba(216, 191, 216, 0.1)' }
                    ])
                },
                symbol: 'circle',
                symbolSize: 6,
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        color: '#9370DB',
                        borderColor: '#FFFFFF',
                        borderWidth: 2
                    }
                }
            }
        ]
    };

    window.borrowTrendChart.setOption(option);
}

// 初始化类别分布图
function initCategoryChart() {
    const chartDom = document.getElementById('categoryChart');
    window.categoryChart = echarts.init(chartDom);

    const option = {
        title: {
            text: '图书类别分布',
            left: 'center',
            textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} 本 ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
                color: '#666'
            }
        },
        series: [
            {
                name: '图书类别',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 18,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [],
                color: [
                    '#D8BFD8', '#E6E6FA', '#DDA0DD', '#9370DB',
                    '#8A2BE2', '#9400D3', '#9932CC', '#BA55D3',
                    '#DA70D6', '#EE82EE', '#DDA0DD', '#E6E6FA'
                ]
            }
        ]
    };

    window.categoryChart.setOption(option);
}

// 初始化活跃度图表
function initActivityChart() {
    const chartDom = document.getElementById('activityChart');
    window.activityChart = echarts.init(chartDom);

    const option = {
        title: {
            text: '读者24小时活跃度',
            left: 'center',
            textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 80,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: [],
            axisLine: {
                lineStyle: {
                    color: '#E6E6FA'
                }
            },
            axisLabel: {
                color: '#666'
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#E6E6FA'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#F0F0F0',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '借阅量',
                type: 'bar',
                data: [],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#D8BFD8' },
                        { offset: 1, color: '#E6E6FA' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: '60%',
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#9370DB' },
                            { offset: 1, color: '#D8BFD8' }
                        ])
                    }
                }
            }
        ]
    };

    window.activityChart.setOption(option);
}

// 初始化近期活动
function initRecentActivities() {
    window.activitiesList = document.getElementById('activitiesList');
}

// 绑定事件监听器
function bindEventListeners() {
    // 周期筛选
    const periodSelect = document.getElementById('period');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            loadDashboardData();
        });
    }

    // 图表控制按钮
    document.querySelectorAll('.chart-controls button').forEach(button => {
        button.addEventListener('click', function() {
            const chartContainer = this.closest('.chart-container');
            const chartType = this.getAttribute('data-chart');

            // 更新按钮状态
            chartContainer.querySelectorAll('.chart-controls button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // 切换图表类型
            switchChartType(chartContainer, chartType);
        });
    });

    // 窗口大小调整时重绘图表
    window.addEventListener('resize', function() {
        if (window.borrowTrendChart) window.borrowTrendChart.resize();
        if (window.categoryChart) window.categoryChart.resize();
        if (window.activityChart) window.activityChart.resize();
    });
}

// 切换图表类型
function switchChartType(chartContainer, chartType) {
    const chartId = chartContainer.querySelector('.chart').id;

    switch(chartId) {
        case 'borrowTrendChart':
            // 这里可以切换不同的趋势图视图
            break;
        case 'categoryChart':
            switchCategoryChart(chartType);
            break;
        case 'activityChart':
            switchActivityChart(chartType);
            break;
    }
}

// 切换类别图表
function switchCategoryChart(type) {
    // 这里可以实现饼图/柱状图切换
    // 暂时只显示饼图
}

// 切换活跃度图表
function switchActivityChart(type) {
    // 根据类型加载不同数据
    loadActivityData(type);
}

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        const period = document.getElementById('period').value;

        // 加载概览数据
        const overviewResponse = await fetch('/api/stats/overview');
        const overviewData = await overviewResponse.json();

        // 更新统计卡片
        updateStatsCards(overviewData);

        // 加载趋势数据
        const trendResponse = await fetch(`/api/stats/borrow-trend?period=${period}`);
        const trendData = await trendResponse.json();
        updateBorrowTrendChart(trendData);

        // 加载类别数据
        const categoryResponse = await fetch('/api/stats/category-distribution');
        const categoryData = await categoryResponse.json();
        updateCategoryChart(categoryData);

        // 加载活跃度数据（默认显示24小时分布）
        const activityResponse = await fetch('/api/stats/hourly-distribution');
        const activityData = await activityResponse.json();
        updateActivityChart(activityData);

        // 加载近期活动
        loadActivities();

    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        showNotification('数据加载失败，请检查网络连接', 'error');
    }
}

// 更新统计卡片
function updateStatsCards(data) {
    const overview = data.overview;
    const cards = window.statsCards;

    cards.todayBorrows.textContent = overview.today_borrows;
    cards.activeReaders.textContent = overview.active_readers;
    cards.borrowedBooks.textContent = overview.current_borrowed;
    cards.overdueBooks.textContent = overview.overdue_books;
    cards.availableBooks.textContent = `可用: ${overview.available_stock} 本`;

    // 模拟变化百分比
    cards.borrowChange.textContent = '+12%';
    cards.readerChange.textContent = '+5%';
    cards.overdueChange.textContent = '-3%';
}

// 更新借阅趋势图
function updateBorrowTrendChart(data) {
    const option = window.borrowTrendChart.getOption();

    option.xAxis[0].data = data.dates;
    option.series[0].data = data.borrow_counts;

    window.borrowTrendChart.setOption(option);
}

// 更新类别分布图
function updateCategoryChart(data) {
    const option = window.categoryChart.getOption();

    const chartData = data.categories.map(cat => ({
        value: cat.value,
        name: cat.name
    }));

    option.series[0].data = chartData;

    window.categoryChart.setOption(option);
}

// 更新活跃度图表
function updateActivityChart(data) {
    const option = window.activityChart.getOption();

    // 转换小时数据
    const hours = data.hours.map(h => `${h}:00`);
    option.xAxis[0].data = hours;
    option.series[0].data = data.counts;
    option.title.text = '读者24小时活跃度';

    window.activityChart.setOption(option);
}

// 加载活跃度数据
async function loadActivityData(type) {
    try {
        let url = '/api/stats/hourly-distribution';
        let title = '读者24小时活跃度';

        switch(type) {
            case 'credit':
                url = '/api/stats/credit-distribution';
                title = '读者信用分分布';
                break;
            case 'activity':
                url = '/api/stats/reader-activity';
                title = '读者借阅活动分组';
                break;
        }

        const response = await fetch(url);
        const data = await response.json();

        const option = window.activityChart.getOption();

        if (type === 'credit') {
            // 信用分分布 - 柱状图
            option.xAxis[0].data = data.credit_distribution.map(d => d.range);
            option.series[0].data = data.credit_distribution.map(d => d.count);
            option.series[0].type = 'bar';
        } else if (type === 'activity') {
            // 活动分组 - 柱状图
            option.xAxis[0].data = data.activity_groups.map(g => g.range);
            option.series[0].data = data.activity_groups.map(g => g.reader_count);
            option.series[0].type = 'bar';
        } else {
            // 24小时分布 - 柱状图
            const hours = data.hours.map(h => `${h}:00`);
            option.xAxis[0].data = hours;
            option.series[0].data = data.counts;
            option.series[0].type = 'bar';
        }

        option.title.text = title;
        window.activityChart.setOption(option);

    } catch (error) {
        console.error('加载活跃度数据失败:', error);
    }
}

// 加载近期活动
async function loadActivities() {
    try {
        // 这里可以调用API获取实际的活动数据
        // 暂时使用模拟数据
        const mockActivities = [
            { icon: '📖', title: '新读者注册', desc: '读者 "张三" 完成了注册', time: '5分钟前' },
            { icon: '📚', title: '图书借阅', desc: '"人工智能导论" 被读者借阅', time: '15分钟前' },
            { icon: '🔄', title: '图书归还', desc: '"Python编程" 已归还', time: '30分钟前' },
            { icon: '⏰', title: '逾期提醒', desc: '2本图书即将到期', time: '1小时前' },
            { icon: '👥', title: '新书入库', desc: '10本新书加入图书馆', time: '2小时前' }
        ];

        window.activitiesList.innerHTML = '';

        mockActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <h3 class="activity-title">${activity.title}</h3>
                    <p class="activity-desc">${activity.desc}</p>
                    <p class="activity-time">${activity.time}</p>
                </div>
            `;
            window.activitiesList.appendChild(activityItem);
        });

    } catch (error) {
        console.error('加载活动数据失败:', error);
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建一个简单的通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'error' ? '#F56565' : '#48BB78'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);