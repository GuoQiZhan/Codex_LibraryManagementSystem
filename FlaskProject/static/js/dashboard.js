// dashboard.js - 仪表盘图表和数据管理
document.addEventListener('DOMContentLoaded', function() {
    initStatsCards();
    initBorrowTrendChart();
    initCategoryChart();
    initActivityChart();
    initRecentActivities();

    bindEventListeners();
    loadDashboardData();

    // 每30秒自动刷新
    setInterval(loadDashboardData, 30000);
});

// 图表通用动画配置
const CHART_ANIMATION = {
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    animationDelay: 0
};

// 颜色常量
const COLORS = {
    primary: '#9B8EC4',
    primaryDark: '#7E69AB',
    primaryLight: '#B8A6D9',
    primaryPale: '#D3C7E8',
    primaryFaint: '#E8E6F0',
    success: '#7CB89A',
    danger: '#C27070',
    warning: '#D4A373',
    info: '#9B8EC4',
    text: '#333640',
    textSecondary: '#6B7084',
    border: '#E2E5EB',
    bgSecondary: '#EEF0F4',
    white: '#FFFFFF'
};

// 统计数据卡片
function initStatsCards() {
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

// 工具：绿色渐变
function greenGradient(from, to, opacity) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: from },
        { offset: 0.5, color: to },
        { offset: 1, color: opacity }
    ]);
}

// 工具：彩色渐变
function colorGradient(from, to) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: from },
        { offset: 1, color: to }
    ]);
}

// 工具：获取颜色
function getColor(index) {
    const colors = [
        COLORS.primary,      // 主色 - 紫色
        COLORS.success,      // 成功色 - 绿色
        COLORS.warning,      // 警告色 - 橙色
        COLORS.danger,       // 危险色 - 红色
        '#4A90E2',           // 蓝色
        '#9013FE',           // 深紫色
        '#00B8D4',           // 青色
        '#FF6B6B',           // 粉红色
        '#4ECDC4',           // 薄荷绿
        '#FFD166',           // 黄色
        '#6A0572',           // 深紫色
        '#1A535C'            // 深青色
    ];
    return colors[index % colors.length];
}

// 通用tooltip样式
const TOOLTIP_STYLE = {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    padding: [10, 14],
    textStyle: {
        color: COLORS.text,
        fontSize: 13
    },
    extraCssText: 'box-shadow: 0 4px 16px rgba(155, 142, 196, 0.12); border-radius: 8px;'
};

// 初始化借阅趋势图
function initBorrowTrendChart() {
    const chartDom = document.getElementById('borrowTrendChart');
    window.borrowTrendChart = echarts.init(chartDom);

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: COLORS.primary
                }
            },
            ...TOOLTIP_STYLE
        },
        legend: {
            data: ['借阅量', '归还量'],
            bottom: 0,
            left: 'center',
            textStyle: {
                color: COLORS.textSecondary,
                fontSize: 12
            },
            itemWidth: 20,
            itemHeight: 10,
            padding: [0, 0, 10, 0]
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: [],
            axisLine: {
                lineStyle: {
                    color: COLORS.border,
                    width: 1.5
                }
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12,
                margin: 10
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: COLORS.bgSecondary,
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '借阅量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                data: [],
                lineStyle: {
                    width: 2.5,
                    color: COLORS.primary,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: COLORS.primary,
                    borderWidth: 2,
                    borderColor: COLORS.white
                },
                areaStyle: {
                    color: greenGradient(
                        'rgba(155, 142, 196, 0.35)',
                        'rgba(155, 142, 196, 0.15)',
                        'rgba(155, 142, 196, 0.02)'
                    )
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(155, 142, 196, 0.25)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            },
            {
                name: '归还量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                data: [],
                lineStyle: {
                    width: 2.5,
                    color: COLORS.success,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: COLORS.success,
                    borderWidth: 2,
                    borderColor: COLORS.white
                },
                areaStyle: {
                    color: greenGradient(
                        'rgba(124, 184, 154, 0.3)',
                        'rgba(124, 184, 154, 0.12)',
                        'rgba(124, 184, 154, 0.02)'
                    )
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(124, 184, 154, 0.25)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
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
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            ...TOOLTIP_STYLE,
            formatter: function(params) {
                return '<div style="font-weight: 600; margin-bottom: 6px;">' + params.name + '</div>' +
                       '<div style="display: flex; align-items: center;">' +
                       '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ' + params.color + '; margin-right: 8px;"></span>' +
                       '<span>借阅量: <strong>' + params.value + '</strong></span></div>' +
                       '<div style="margin-top: 4px; color: ' + COLORS.textSecondary + ';">占比: ' + params.percent.toFixed(1) + '%</div>';
            }
        },
        grid: {
            left: '10%',
            right: '10%',
            top: '10%',
            bottom: '20%',
            containLabel: true
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            textStyle: {
                color: COLORS.textSecondary,
                fontSize: 12
            },
            itemWidth: 12,
            itemHeight: 12,
            itemGap: 16,
            formatter: '{name}',
            tooltip: {
                show: true
            },
            padding: [0, 0, 10, 0],
            z: 1
        },
        series: [{
            name: '图书类别',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            z: 10,
            itemStyle: {
                borderRadius: 6,
                borderColor: COLORS.white,
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: COLORS.text,
                    formatter: '{b}\n{d}%'
                },
                itemStyle: {
                    shadowBlur: 12,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.2)'
                },
                scaleSize: 8
            },
            labelLine: {
                show: false,
                length: 15,
                length2: 10,
                smooth: true
            },
            data: [],
            color: [
                COLORS.primary, COLORS.primaryDark, COLORS.primaryLight, COLORS.primaryPale,
                COLORS.warning, COLORS.info, COLORS.success, COLORS.primaryFaint
            ]
        }],
        ...CHART_ANIMATION,
        animationType: 'scale'
    };

    window.categoryChart.setOption(option);
}

// 初始化活跃度图表
function initActivityChart() {
    const chartDom = document.getElementById('activityChart');
    window.activityChart = echarts.init(chartDom);

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
                shadowStyle: {
                    color: 'rgba(155, 142, 196, 0.1)'
                }
            },
            ...TOOLTIP_STYLE,
            formatter: function(params) {
                const data = params[0];
                return '<div style="font-weight: 600; margin-bottom: 6px;">' + data.name + '</div>' +
                       '<div style="display: flex; align-items: center;">' +
                       '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ' + data.color + '; margin-right: 8px;"></span>' +
                       '<span>借阅量: <strong>' + data.value + '</strong></span></div>';
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: [],
            axisLine: {
                lineStyle: {
                    color: COLORS.border,
                    width: 1.5
                }
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 11,
                margin: 12,
                interval: 2,
                rotate: 45
            },
            axisTick: {
                show: false
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12,
                formatter: '{value}'
            },
            splitLine: {
                lineStyle: {
                    color: COLORS.bgSecondary,
                    type: 'dashed',
                    opacity: 0.6
                }
            },
            axisTick: {
                show: false
            }
        },
        series: [{
            name: '借阅量',
            type: 'bar',
            data: [],
            barWidth: '60%',
            itemStyle: {
                color: function(params) {
                    const value = params.value;
                    const chartData = window.chart4Data || [1];
                    const max = Math.max(...chartData);
                    const ratio = value / max;

                    if (ratio > 0.8) {
                        return colorGradient(
                            COLORS.primaryDark,
                            COLORS.primary
                        );
                    } else if (ratio > 0.5) {
                        return colorGradient(
                            COLORS.primary,
                            COLORS.primaryLight
                        );
                    } else {
                        return colorGradient(
                            COLORS.primaryLight,
                            COLORS.primaryPale
                        );
                    }
                },
                borderRadius: [6, 6, 0, 0]
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 15,
                    shadowColor: 'rgba(155, 142, 196, 0.3)',
                    shadowOffsetY: 3
                }
            },
            ...CHART_ANIMATION,
            universalTransition: true
        }]
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

            chartContainer.querySelectorAll('.chart-controls button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            switchChartType(chartContainer, chartType);
        });
    });

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
            switchBorrowTrendChart(chartType);
            break;
        case 'categoryChart':
            switchCategoryChart(chartType);
            break;
        case 'activityChart':
            switchActivityChart(chartType);
            break;
    }
}

// 切换借阅趋势图表
function switchBorrowTrendChart(type) {
    const period = document.getElementById('period').value;
    if (type === 'borrowTrend') {
        loadBorrowTrendDataWithFullConfig(period);
    } else if (type === 'categoryTrend') {
        loadCategoryTrendData(period);
    }
}

// 加载借阅趋势数据（带完整配置）
async function loadBorrowTrendDataWithFullConfig(period) {
    try {
        const response = await fetch(`/api/stats/borrow-trend?period=${period}`);
        const data = await response.json();
        updateBorrowTrendChartWithFullConfig(data);
    } catch (error) {
        console.error('加载借阅趋势数据失败:', error);
    }
}

// 使用完整配置更新借阅趋势图
function updateBorrowTrendChartWithFullConfig(data) {
    const dates = data.dates || [];
    const borrowCounts = data.borrow_counts || [];
    const returnCounts = data.return_counts || borrowCounts.map(v => Math.floor(v * 0.85));

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: COLORS.primary,
                    color: COLORS.white,
                    padding: [8, 12],
                    borderRadius: 4
                },
                crossStyle: {
                    color: COLORS.border,
                    width: 1,
                    type: 'dashed'
                }
            },
            ...TOOLTIP_STYLE,
            formatter: function(params) {
                let result = '<div style="font-weight: 600; margin-bottom: 8px;">' + params[0].name + '</div>';
                params.forEach(function(item) {
                    result += '<div style="display: flex; align-items: center; margin-bottom: 4px;">' +
                             '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ' + item.color + '; margin-right: 8px;"></span>' +
                             '<span>' + item.seriesName + ': <strong>' + item.value + '</strong></span></div>';
                });
                return result;
            }
        },
        legend: {
            data: ['借阅量', '归还量'],
            bottom: 0,
            left: 'center',
            textStyle: {
                color: COLORS.textSecondary,
                fontSize: 12,
                fontWeight: '500'
            },
            itemWidth: 20,
            itemHeight: 10,
            itemGap: 20,
            padding: [0, 0, 15, 0],
            formatter: function(name) {
                return name;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '18%',
            top: '12%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLine: {
                lineStyle: {
                    color: COLORS.border,
                    width: 1.5
                }
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12,
                margin: 12,
                rotate: dates.length > 12 ? 45 : 0
            },
            axisTick: {
                show: false
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12,
                formatter: '{value}'
            },
            splitLine: {
                lineStyle: {
                    color: COLORS.bgSecondary,
                    type: 'dashed',
                    opacity: 0.6
                }
            },
            axisTick: {
                show: false
            }
        },
        series: [
            {
                name: '借阅量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: borrowCounts,
                lineStyle: {
                    width: 3,
                    color: COLORS.primary,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: COLORS.primary,
                    borderWidth: 2.5,
                    borderColor: COLORS.white,
                    shadowBlur: 8,
                    shadowColor: 'rgba(155, 142, 196, 0.3)'
                },
                areaStyle: {
                    color: greenGradient(
                        'rgba(155, 142, 196, 0.35)',
                        'rgba(155, 142, 196, 0.15)',
                        'rgba(155, 142, 196, 0.02)'
                    )
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 4,
                        shadowBlur: 12,
                        shadowColor: 'rgba(155, 142, 196, 0.4)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            },
            {
                name: '归还量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: returnCounts,
                lineStyle: {
                    width: 3,
                    color: COLORS.success,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: COLORS.success,
                    borderWidth: 2.5,
                    borderColor: COLORS.white,
                    shadowBlur: 8,
                    shadowColor: 'rgba(124, 184, 154, 0.3)'
                },
                areaStyle: {
                    color: greenGradient(
                        'rgba(124, 184, 154, 0.3)',
                        'rgba(124, 184, 154, 0.12)',
                        'rgba(124, 184, 154, 0.02)'
                    )
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 4,
                        shadowBlur: 12,
                        shadowColor: 'rgba(124, 184, 154, 0.4)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            }
        ]
    };

    window.borrowTrendChart.setOption(option, { notMerge: true });
}

// 切换类别图表
function switchCategoryChart(type) {
    const categoryData = window.categoryChartData;
    if (!categoryData) return;

    if (type === 'categoryPie') {
        const chartData = categoryData.categories.map(cat => ({ value: cat.value, name: cat.name }));
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                ...TOOLTIP_STYLE,
                formatter: function(params) {
                    return '<div style="font-weight: 600; margin-bottom: 6px;">' + params.name + '</div>' +
                           '<div style="display: flex; align-items: center;">' +
                           '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ' + params.color + '; margin-right: 8px;"></span>' +
                           '<span>借阅量: <strong>' + params.value + '</strong></span></div>' +
                           '<div style="margin-top: 4px; color: ' + COLORS.textSecondary + ';">占比: ' + params.percent.toFixed(1) + '%</div>';
                }
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '10%',
                bottom: '20%',
                containLabel: true
            },
            legend: {
                orient: 'horizontal',
                bottom: 0,
                left: 'center',
                textStyle: {
                    color: COLORS.textSecondary,
                    fontSize: 12,
                    fontWeight: '500'
                },
                itemWidth: 14,
                itemHeight: 14,
                itemGap: 18,
                formatter: function(name) {
                    const item = categoryData.categories.find(cat => cat.name === name);
                    return name;
                },
                tooltip: {
                    show: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: COLORS.primary,
                    padding: 8,
                    textStyle: {
                        color: COLORS.text,
                        fontSize: 12
                    }
                },
                padding: [0, 0, 15, 0],
                z: 1
            },
            series: [{
                name: '图书类别',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                z: 10,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: COLORS.white,
                    borderWidth: 2,
                    shadowBlur: 8,
                    shadowColor: 'rgba(0, 0, 0, 0.1)'
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: '600',
                        color: COLORS.text,
                        formatter: '{b}\n{d}%'
                    },
                    itemStyle: {
                        shadowBlur: 15,
                        shadowColor: 'rgba(155, 142, 196, 0.3)',
                        shadowOffsetX: 0,
                        shadowOffsetY: 0
                    },
                    scaleSize: 8
                },
                labelLine: {
                    show: false,
                    length: 15,
                    length2: 10,
                    smooth: true
                },
                data: chartData,
                color: chartData.map((_, index) => getColor(index))
            }],
            ...CHART_ANIMATION,
            animationType: 'scale'
        };
        window.categoryChart.setOption(option, { notMerge: true });
    } else if (type === 'categoryBar') {
        const chartData = categoryData.categories.map(cat => ({ value: cat.value, name: cat.name }));
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                    shadowStyle: {
                        color: 'rgba(155, 142, 196, 0.1)'
                    }
                },
                ...TOOLTIP_STYLE,
                formatter: function(params) {
                    const data = params[0];
                    return '<div style="font-weight: 600; margin-bottom: 6px;">' + data.name + '</div>' +
                           '<div style="display: flex; align-items: center;">' +
                           '<span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ' + data.color + '; margin-right: 8px;"></span>' +
                           '<span>借阅量: <strong>' + data.value + '</strong></span></div>';
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            legend: {
                show: false
            },
            xAxis: {
                type: 'category',
                data: chartData.map(item => item.name),
                axisLine: {
                    lineStyle: {
                        color: COLORS.border,
                        width: 1.5
                    }
                },
                axisLabel: {
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    margin: 12,
                    interval: 0,
                    rotate: 45
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: false
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisLabel: {
                    color: COLORS.textSecondary,
                    fontSize: 12,
                    formatter: '{value}'
                },
                splitLine: {
                    lineStyle: {
                        color: COLORS.bgSecondary,
                        type: 'dashed',
                        opacity: 0.6
                    }
                },
                axisTick: {
                    show: false
                }
            },
            series: [{
                type: 'bar',
                data: chartData.map(item => item.value),
                barWidth: '60%',
                itemStyle: {
                    color: function(params) {
                        return getColor(params.dataIndex);
                    },
                    borderRadius: [6, 6, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 15,
                        shadowColor: 'rgba(155, 142, 196, 0.3)',
                        shadowOffsetY: 3
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    formatter: '{c}'
                },
                ...CHART_ANIMATION,
                universalTransition: true
            }]
        };
        window.categoryChart.setOption(option, { notMerge: true });
    }
}

// 切换活跃度图表
function switchActivityChart(type) {
    loadActivityData(type);
}

// 生成模拟数据
function generateMockData() {
    // 生成借阅趋势数据
    const generateBorrowTrendData = () => {
        const dates = [];
        const borrowCounts = [];
        const returnCounts = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            dates.push(date.toISOString().slice(0, 7)); // YYYY-MM
            const borrowCount = Math.floor(Math.random() * 20) + 10;
            borrowCounts.push(borrowCount);
            returnCounts.push(Math.floor(borrowCount * 0.85));
        }
        
        return { dates, borrow_counts: borrowCounts, return_counts: returnCounts };
    };
    
    // 生成图书类别数据
    const generateCategoryData = () => {
        const categories = [
            { name: '文学', count: 5209, value: 976 },
            { name: '经济', count: 4806, value: 903 },
            { name: '自动化技术、计算机技术', count: 5121, value: 888 },
            { name: '历史', count: 4500, value: 820 },
            { name: '艺术', count: 3800, value: 750 },
            { name: '教育', count: 4200, value: 780 },
            { name: '科技', count: 3900, value: 720 },
            { name: '哲学', count: 3500, value: 680 },
            { name: '社会科学', count: 4100, value: 760 },
            { name: '自然科学', count: 3700, value: 700 },
            { name: '其他', count: 2800, value: 550 }
        ];
        return { categories };
    };
    
    // 生成读者活跃度数据
    const generateActivityData = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const counts = hours.map(hour => {
            if (hour >= 8 && hour <= 18) {
                return Math.floor(Math.random() * 15) + 10;
            } else if (hour >= 19 && hour <= 22) {
                return Math.floor(Math.random() * 10) + 5;
            } else {
                return Math.floor(Math.random() * 5);
            }
        });
        return { hours, counts };
    };
    
    // 生成统计卡片数据
    const generateStatsData = () => {
        return {
            today_borrows: Math.floor(Math.random() * 30) + 15, // 今日借阅量：15-45
            active_readers: Math.floor(Math.random() * 50) + 20, // 在线读者：20-70
            current_borrowed: Math.floor(Math.random() * 200) + 300, // 在借图书：300-500
            overdue_books: Math.floor(Math.random() * 20) + 5, // 逾期图书：5-25
            available_stock: Math.floor(Math.random() * 1000) + 4000, // 可用图书：4000-5000
            total_books: 5000, // 总图书数
            total_readers: 1000, // 总读者数
            total_borrows: 3000, // 总借阅数
            total_fines: 500 // 总罚款
        };
    };
    
    return {
        borrowTrend: generateBorrowTrendData(),
        category: generateCategoryData(),
        activity: generateActivityData(),
        stats: generateStatsData()
    };
}

// 加载仪表盘数据
async function loadDashboardData() {
    console.log('[仪表盘] 开始加载数据...');
    try {
        const periodElement = document.getElementById('period');
        const period = periodElement ? periodElement.value : 'month';
        console.log('[仪表盘] 当前周期:', period);

        showLoading(true);

        // 直接使用模拟数据，不调用API
        console.log('[仪表盘] 使用模拟数据');
        const mockData = generateMockData();
        const overviewData = { overview: mockData.stats };
        const trendData = mockData.borrowTrend;
        const categoryData = mockData.category;
        const activityData = mockData.activity;

        console.log('[仪表盘] 概览:', overviewData.overview);
        console.log('[仪表盘] 趋势数据量:', trendData.dates?.length);
        console.log('[仪表盘] 分类:', categoryData.categories?.length, '项');
        console.log('[仪表盘] 时段:', activityData.counts?.reduce((a,b)=>a+b, 0), '条');

        updateStatsCards(overviewData);
        updateBorrowTrendChart(trendData);
        updateCategoryChart(categoryData);
        updateActivityChart(activityData);
        loadActivities();

        const now = new Date();
        const timeEl = document.getElementById('lastUpdateTime');
        if (timeEl) {
            timeEl.textContent = now.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        showLoading(false);
        console.log('[仪表盘] 数据加载完成 ✓');

    } catch (error) {
        console.error('[仪表盘] 数据加载失败:', error);
        showNotification('数据加载失败，请检查网络连接', 'error');
        showLoading(false);
    }
}

// 加载借阅趋势数据
async function loadBorrowTrendData(period) {
    try {
        // 直接使用模拟数据，不调用API
        console.log('[借阅趋势] 使用模拟数据，周期:', period);
        const mockData = generateBorrowTrendMockData(period);
        updateBorrowTrendChart(mockData);
        console.log('[借阅趋势] 模拟数据加载完成');
    } catch (error) {
        console.error('加载借阅趋势数据失败:', error);
    }
}

// 加载分类趋势数据
async function loadCategoryTrendData(period) {
    try {
        // 直接使用模拟数据，不调用API
        console.log('[分类趋势] 使用模拟数据，周期:', period);
        const mockData = generateCategoryMockData();

        if (mockData.categories && mockData.categories.length > 0) {
            const categories = mockData.categories.map(cat => cat.name);
            const counts = mockData.categories.map(cat => cat.value || cat.count || 0);

            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    ...TOOLTIP_STYLE
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '15%',
                    top: '10%',
                    containLabel: true
                },
                legend: {
                    data: ['借阅量'],
                    bottom: 0,
                    left: 'center',
                    textStyle: {
                        color: COLORS.textSecondary,
                        fontSize: 12
                    },
                    itemWidth: 20,
                    itemHeight: 10,
                    padding: [0, 0, 10, 0]
                },
                xAxis: {
                    type: 'category',
                    data: categories,
                    axisLine: {
                        lineStyle: {
                            color: COLORS.border,
                            width: 1.5
                        }
                    },
                    axisLabel: {
                        color: COLORS.textSecondary,
                        fontSize: 11,
                        margin: 10,
                        interval: 0,
                        rotate: 35
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLine: {
                        show: false
                    },
                    axisLabel: {
                        color: COLORS.textSecondary,
                        fontSize: 12
                    },
                    splitLine: {
                        lineStyle: {
                            color: COLORS.bgSecondary,
                            type: 'dashed'
                        }
                    }
                },
                series: [
                    {
                        name: '借阅量',
                        type: 'bar',
                        data: counts,
                        barWidth: '60%',
                        itemStyle: {
                            color: greenGradient(
                                COLORS.primary,
                                COLORS.primaryDark,
                                COLORS.primary
                            ),
                            borderRadius: [3, 3, 0, 0]
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowColor: 'rgba(155, 142, 196, 0.25)'
                            }
                        },
                        ...CHART_ANIMATION,
                        universalTransition: true
                    }
                ]
            };

            window.borrowTrendChart.setOption(option, { notMerge: true });
        }
        
        console.log('[分类趋势] 模拟数据加载完成');
    } catch (error) {
        console.error('加载分类趋势数据失败:', error);
    }
}

// 更新统计卡片
function updateStatsCards(data) {
    const overview = data.overview;
    const cards = window.statsCards;

    cards.todayBorrows.textContent = overview.today_borrows || 0;
    cards.activeReaders.textContent = overview.active_readers || 0;
    cards.borrowedBooks.textContent = overview.current_borrowed || 0;
    cards.overdueBooks.textContent = overview.overdue_books || 0;
    cards.availableBooks.textContent = `可用: ${overview.available_stock || 0} 本`;

    cards.borrowChange.textContent = '+12%';
    cards.readerChange.textContent = '+5%';
    cards.overdueChange.textContent = '-3%';
}

// 更新借阅趋势图
function updateBorrowTrendChart(data) {
    const dates = data.dates || [];
    const borrowCounts = data.borrow_counts || [];
    const returnCounts = data.return_counts || borrowCounts.map(v => Math.floor(v * 0.85));

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: COLORS.primary
                }
            },
            ...TOOLTIP_STYLE
        },
        legend: {
            data: ['借阅量', '归还量'],
            bottom: 0,
            left: 'center',
            textStyle: {
                color: COLORS.textSecondary,
                fontSize: 12
            },
            itemWidth: 20,
            itemHeight: 10,
            padding: [0, 0, 10, 0]
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLine: {
                lineStyle: {
                    color: COLORS.border,
                    width: 1.5
                }
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12,
                margin: 10
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: COLORS.bgSecondary,
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '借阅量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                data: borrowCounts,
                lineStyle: {
                    width: 2.5,
                    color: COLORS.primary,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: COLORS.primary,
                    borderWidth: 2,
                    borderColor: COLORS.white
                },
                areaStyle: {
                    color: greenGradient(
                        'rgba(155, 142, 196, 0.35)',
                        'rgba(155, 142, 196, 0.15)',
                        'rgba(155, 142, 196, 0.02)'
                    )
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(155, 142, 196, 0.25)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            },
            {
                name: '归还量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                data: returnCounts,
                lineStyle: {
                    width: 2.5,
                    color: COLORS.success,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: COLORS.success,
                    borderWidth: 2,
                    borderColor: COLORS.white
                },
                areaStyle: {
                    color: greenGradient(
                        'rgba(124, 184, 154, 0.3)',
                        'rgba(124, 184, 154, 0.12)',
                        'rgba(124, 184, 154, 0.02)'
                    )
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(124, 184, 154, 0.25)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            }
        ]
    };

    window.borrowTrendChart.setOption(option, { notMerge: true });
}

// 更新类别分布图
// 更新分类图表
function updateCategoryChart(data) {
    window.categoryChartData = data;

    if (data.categories && data.categories.length > 0) {
        const chartData = data.categories.map((cat, index) => ({
            value: cat.value || cat.count || 0,
            name: cat.name || `类别${index + 1}`
        }));

        // 使用完整配置更新图表
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)',
                ...TOOLTIP_STYLE
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: {
                    color: COLORS.textSecondary,
                    fontSize: 12
                },
                formatter: function(name) {
                    const item = data.categories.find(cat => cat.name === name);
                    return `${name}: ${item ? (item.value || item.count) : 0}`;
                }
            },
            series: [
                {
                    name: '图书类别',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['40%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '18',
                            fontWeight: 'bold',
                            color: COLORS.text
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: chartData
                }
            ],
            animationDuration: 1500,
            animationEasing: 'cubicOut'
        };

        window.categoryChart.setOption(option, { notMerge: true });
    }
}

// 更新活跃度图表
function updateActivityChart(data) {
    if (data.hours && data.counts) {
        const times = data.hours.map(h => `${h}:00`);
        window.chart4Data = data.counts;

        // 使用完整配置更新图表
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                ...TOOLTIP_STYLE
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: times,
                axisLine: {
                    lineStyle: {
                        color: COLORS.border,
                        width: 2
                    }
                },
                axisLabel: {
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    rotate: 45,
                    margin: 12
                },
                axisTick: {
                    show: false
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisLabel: {
                    color: COLORS.textSecondary,
                    fontSize: 12
                },
                splitLine: {
                    lineStyle: {
                        color: COLORS.bgSecondary,
                        type: 'dashed'
                    }
                }
            },
            series: [
                {
                    name: '借阅量',
                    type: 'bar',
                    data: data.counts,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: COLORS.primary },
                            { offset: 1, color: COLORS.primaryPale }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    },
                    emphasis: {
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: COLORS.primaryDark },
                                { offset: 1, color: COLORS.primary }
                            ])
                        }
                    },
                    barWidth: '60%'
                }
            ],
            animationDuration: 1500,
            animationEasing: 'cubicOut'
        };

        window.activityChart.setOption(option, { notMerge: true });
    }
}

// 加载活跃度数据
async function loadActivityData(type) {
    try {
        // 直接使用模拟数据，不调用API
        console.log('[活跃度] 使用模拟数据，类型:', type);
        
        let mockData;
        
        switch(type) {
            case 'credit':
                // 信用分布模拟数据
                mockData = {
                    credit_distribution: [
                        { range: '60-69', count: 85 },
                        { range: '70-79', count: 180 },
                        { range: '80-89', count: 320 },
                        { range: '90-95', count: 250 },
                        { range: '96-100', count: 120 }
                    ]
                };
                
                const creditOption = {
                    xAxis: {
                        data: mockData.credit_distribution.map(d => d.range),
                        axisLabel: {
                            interval: 0,
                            rotate: 35
                        }
                    },
                    series: [{
                        data: mockData.credit_distribution.map(d => d.count),
                        itemStyle: {
                            color: greenGradient(
                                COLORS.primary,
                                COLORS.primaryDark,
                                COLORS.primary
                            )
                        }
                    }]
                };
                window.activityChart.setOption(creditOption, { notMerge: false });
                break;
                
            case 'activity':
                // 借阅分组模拟数据
                mockData = {
                    activity_groups: [
                        { range: '0-10', reader_count: 320 },
                        { range: '11-20', reader_count: 250 },
                        { range: '21-30', reader_count: 180 },
                        { range: '31-40', reader_count: 120 },
                        { range: '41-50', reader_count: 85 },
                        { range: '50+', reader_count: 45 }
                    ]
                };
                
                const activityOption = {
                    xAxis: {
                        data: mockData.activity_groups.map(g => g.range),
                        axisLabel: {
                            interval: 0,
                            rotate: 35
                        }
                    },
                    series: [{
                        data: mockData.activity_groups.map(g => g.reader_count),
                        itemStyle: {
                            color: greenGradient(
                                COLORS.primary,
                                COLORS.primaryDark,
                                COLORS.primary
                            )
                        }
                    }]
                };
                window.activityChart.setOption(activityOption, { notMerge: false });
                break;
                
            default:
                // 24小时分布模拟数据
                mockData = {
                    hours: Array.from({ length: 24 }, (_, i) => i),
                    counts: [
                        2, 1, 0, 0, 1, 3, 8, 15, 25, 30, 28, 22, // 0-11点
                        18, 20, 25, 28, 35, 40, 30, 22, 15, 10, 5, 3  // 12-23点
                    ]
                };
                updateActivityChart(mockData);
                break;
        }
        
        console.log('[活跃度] 模拟数据加载完成');
    } catch (error) {
        console.error('[活跃度] 数据加载失败:', error);
    }
}

// 加载近期活动
async function loadActivities() {
    try {
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

// 显示加载状态
function showLoading(show) {
    const chartElements = [
        document.getElementById('borrowTrendChart'),
        document.getElementById('categoryChart'),
        document.getElementById('activityChart')
    ];

    chartElements.forEach(chartElement => {
        if (chartElement) {
            const placeholder = chartElement.nextElementSibling;
            if (placeholder && placeholder.classList.contains('chart-placeholder')) {
                if (show) {
                    placeholder.textContent = '数据加载中...';
                    placeholder.style.display = 'flex';
                } else {
                    placeholder.style.display = 'none';
                }
            }
        }
    });
}

// 显示通知
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const bgColor = type === 'error' ? COLORS.danger :
                    type === 'success' ? COLORS.success : COLORS.info;

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 14px 22px;
        background: ${bgColor};
        color: white;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
        font-weight: 500;
        font-size: 0.9rem;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

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

    @media (max-width: 768px) {
        .chart-container {
            height: 300px !important;
        }
    }
`;
document.head.appendChild(style);
