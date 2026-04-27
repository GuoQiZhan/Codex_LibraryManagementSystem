// stats.js - 数据分析页面功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    loadAllCharts();
    updateLastUpdateTime();

    // 绑定事件监听器
    bindEventListeners();
});

// 初始化页面
function initPage() {
    // 初始化图表容器
    window.charts = {
        trend1: echarts.init(document.getElementById('trendChart1')),
        trend2: echarts.init(document.getElementById('trendChart2')),
        trend3: echarts.init(document.getElementById('trendChart3')),
        trend4: echarts.init(document.getElementById('trendChart4'))
    };

    // 设置默认图表选项
    initDefaultCharts();
}

// 初始化默认图表选项
function initDefaultCharts() {
    // 趋势图1：借阅量趋势
    const trend1Option = {
        title: {
            text: '借阅量趋势',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 60,
            containLabel: true
        },
        xAxis: {
            type: 'category',
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
            }
        },
        series: [{
            name: '借阅量',
            type: 'line',
            smooth: true,
            data: [],
            lineStyle: {
                width: 3,
                color: '#D8BFD8'
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(216, 191, 216, 0.6)' },
                    { offset: 1, color: 'rgba(216, 191, 216, 0.1)' }
                ])
            }
        }]
    };

    // 趋势图2：读者活跃度
    const trend2Option = {
        title: {
            text: '读者活跃度',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 60,
            containLabel: true
        },
        xAxis: {
            type: 'category',
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
            }
        },
        series: [{
            name: '活跃读者',
            type: 'bar',
            data: [],
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#D8BFD8' },
                    { offset: 1, color: '#E6E6FA' }
                ])
            }
        }]
    };

    // 趋势图3：类别分布
    const trend3Option = {
        title: {
            text: '类别分布',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center'
        },
        series: [{
            name: '类别',
            type: 'pie',
            radius: '70%',
            data: [],
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            color: [
                '#D8BFD8', '#E6E6FA', '#DDA0DD', '#9370DB',
                '#8A2BE2', '#9400D3', '#9932CC', '#BA55D3'
            ]
        }]
    };

    // 趋势图4：时间段分布
    const trend4Option = {
        title: {
            text: '时间段分布',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 60,
            containLabel: true
        },
        xAxis: {
            type: 'category',
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
            }
        },
        series: [{
            name: '借阅量',
            type: 'line',
            smooth: true,
            data: [],
            lineStyle: {
                width: 3,
                color: '#9370DB'
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(147, 112, 219, 0.6)' },
                    { offset: 1, color: 'rgba(147, 112, 219, 0.1)' }
                ])
            }
        }]
    };

    window.charts.trend1.setOption(trend1Option);
    window.charts.trend2.setOption(trend2Option);
    window.charts.trend3.setOption(trend3Option);
    window.charts.trend4.setOption(trend4Option);
}

// 绑定事件监听器
function bindEventListeners() {
    // 筛选器应用按钮
    const applyButton = document.querySelector('.btn-primary');
    if (applyButton) {
        applyButton.addEventListener('click', applyFilters);
    }

    // 筛选器重置按钮
    const resetButton = document.querySelector('.btn-secondary');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    // 窗口大小调整
    window.addEventListener('resize', function() {
        Object.values(window.charts).forEach(chart => {
            chart.resize();
        });
    });

    // 导出按钮
    document.querySelectorAll('.export-buttons button').forEach(button => {
        button.addEventListener('click', function() {
            const format = this.getAttribute('onclick').match(/'(\w+)'/)[1];
            exportData(format);
        });
    });
}

// 加载所有图表数据
async function loadAllCharts() {
    try {
        // 同时加载所有数据
        const [
            trendData,
            readerData,
            categoryData,
            hourlyData
        ] = await Promise.all([
            fetch('/api/stats/borrow-trend?period=month').then(r => r.json()),
            fetch('/api/stats/reader-activity').then(r => r.json()),
            fetch('/api/stats/category-distribution').then(r => r.json()),
            fetch('/api/stats/hourly-distribution').then(r => r.json())
        ]);

        // 更新图表
        updateTrendChart1(trendData);
        updateTrendChart2(readerData);
        updateTrendChart3(categoryData);
        updateTrendChart4(hourlyData);

    } catch (error) {
        console.error('加载图表数据失败:', error);
        showNotification('数据加载失败，请检查网络连接', 'error');
    }
}

// 更新趋势图1：借阅量趋势
function updateTrendChart1(data) {
    const option = window.charts.trend1.getOption();

    // 处理日期数据
    const dates = data.dates || [];
    const counts = data.borrow_counts || [];

    option.xAxis.data = dates;
    option.series[0].data = counts;

    window.charts.trend1.setOption(option);
}

// 更新趋势图2：读者活跃度
function updateTrendChart2(data) {
    const option = window.charts.trend2.getOption();

    // 使用新读者趋势数据
    if (data.new_reader_trend) {
        const dates = data.new_reader_trend.dates || [];
        const counts = data.new_reader_trend.counts || [];

        option.xAxis.data = dates.slice(-10); // 只显示最近10天
        option.series[0].data = counts.slice(-10);
        option.title.text = '新读者趋势';
    }

    window.charts.trend2.setOption(option);
}

// 更新趋势图3：类别分布
function updateTrendChart3(data) {
    const option = window.charts.trend3.getOption();

    if (data.categories) {
        const chartData = data.categories.map(cat => ({
            value: cat.value,
            name: cat.name
        }));

        option.series[0].data = chartData;
    }

    window.charts.trend3.setOption(option);
}

// 更新趋势图4：时间段分布
function updateTrendChart4(data) {
    const option = window.charts.trend4.getOption();

    if (data.hours && data.counts) {
        // 转换为时间段标签
        const times = data.hours.map(h => `${h}:00`);
        const counts = data.counts;

        option.xAxis.data = times;
        option.series[0].data = counts;
        option.title.text = '24小时借阅分布';
    }

    window.charts.trend4.setOption(option);
}

// 应用筛选条件
async function applyFilters() {
    try {
        // 获取筛选条件
        const timeRange = document.getElementById('timeRange').value;
        const category = document.getElementById('categoryFilter').value;
        const readerType = document.getElementById('readerType').value;

        // 构建查询参数
        const params = new URLSearchParams();
        if (timeRange && timeRange !== 'custom') {
            params.append('period', timeRange);
        }
        if (category) {
            params.append('category', category);
        }
        if (readerType) {
            params.append('reader_type', readerType);
        }

        // 显示加载状态
        showLoading(true);

        // 重新加载数据
        const [trendData, readerData] = await Promise.all([
            fetch(`/api/stats/borrow-trend?${params}`).then(r => r.json()),
            fetch(`/api/stats/reader-activity?${params}`).then(r => r.json())
        ]);

        // 更新图表
        updateTrendChart1(trendData);
        updateTrendChart2(readerData);

        showNotification('筛选条件已应用', 'success');

    } catch (error) {
        console.error('应用筛选失败:', error);
        showNotification('筛选失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('timeRange').value = '30days';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('readerType').value = '';

    // 重新加载默认数据
    loadAllCharts();

    showNotification('筛选条件已重置', 'info');
}

// 导出数据
function exportData(format) {
    switch(format) {
        case 'excel':
            exportExcel();
            break;
        case 'pdf':
            exportPDF();
            break;
        case 'json':
            exportJSON();
            break;
    }
}

// 导出Excel
function exportExcel() {
    showNotification('Excel导出功能正在开发中', 'info');
}

// 导出PDF
function exportPDF() {
    showNotification('PDF导出功能正在开发中', 'info');
}

// 导出JSON
function exportJSON() {
    // 收集当前数据
    const exportData = {
        exportTime: new Date().toISOString(),
        filters: {
            timeRange: document.getElementById('timeRange').value,
            category: document.getElementById('categoryFilter').value,
            readerType: document.getElementById('readerType').value
        },
        charts: {}
    };

    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);

    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_stats_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('JSON数据已导出', 'success');
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const element = document.getElementById('lastUpdateTime');
    if (element) {
        element.textContent = formatted;
    }
}

// 显示加载状态
function showLoading(show) {
    const charts = document.querySelectorAll('.chart-placeholder');
    charts.forEach(chart => {
        if (show) {
            chart.textContent = '数据加载中...';
            chart.style.color = '#999';
        } else {
            if (chart.textContent === '数据加载中...') {
                chart.textContent = '图表加载中...';
            }
        }
    });
}

// 显示通知
function showNotification(message, type = 'info') {
    // 移除现有的通知
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'error' ? '#F56565' :
                     type === 'success' ? '#48BB78' : '#4299E1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
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