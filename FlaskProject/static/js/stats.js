// stats.js - 数据分析页面功能
document.addEventListener('DOMContentLoaded', function() {
    initPage();
    loadAllCharts();
    updateLastUpdateTime();
    bindEventListeners();
});

// 图表通用动画配置
const CHART_ANIMATION = {
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    animationDelay: 0
};

const COLORS = {
    primary: '#9B8EC4',
    primaryDark: '#7E69AB',
    primaryLight: '#B8A6D9',
    primaryPale: '#D3C7E8',
    success: '#7CB89A',
    danger: '#C27070',
    warning: '#D4A373',
    info: '#9B8EC4',
    text: '#333640',
    textSecondary: '#6B7084',
    textMuted: '#9CA3AF',
    border: '#E2E5EB',
    bgSecondary: '#EEF0F4',
    white: '#FFFFFF'
};

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

function greenGradient(from, to) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: from },
        { offset: 1, color: to }
    ]);
}

// 初始化页面
function initPage() {
    window.charts = {
        trend1: echarts.init(document.getElementById('trendChart1')),
        trend2: echarts.init(document.getElementById('trendChart2')),
        trend3: echarts.init(document.getElementById('trendChart3')),
        trend4: echarts.init(document.getElementById('trendChart4'))
    };

    initDefaultCharts();

    window.chartViewMode = 'default';
}

// 初始化默认图表选项
function initDefaultCharts() {
    // 图表1：借阅量趋势 - 折线图
    const trend1Option = {
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

    // 图表2：读者活跃度 - 柱状图
    const trend2Option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            ...TOOLTIP_STYLE
        },
        legend: {
            data: ['活跃读者', '新注册读者'],
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
                name: '活跃读者',
                type: 'bar',
                barWidth: '35%',
                data: [],
                itemStyle: {
                    color: greenGradient(COLORS.primary, COLORS.primaryDark),
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: greenGradient(COLORS.primaryLight, COLORS.primary),
                        shadowBlur: 10,
                        shadowColor: 'rgba(155, 142, 196, 0.25)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            },
            {
                name: '新注册读者',
                type: 'bar',
                barWidth: '35%',
                data: [],
                itemStyle: {
                    color: greenGradient(COLORS.success, '#6AAA80'),
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: greenGradient('#8CC8A0', COLORS.success),
                        shadowBlur: 10,
                        shadowColor: 'rgba(124, 184, 154, 0.25)'
                    }
                },
                ...CHART_ANIMATION,
                universalTransition: true
            }
        ]
    };

    // 图表3：类别借阅分布 - 环形图
    const trend3Option = {
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
                COLORS.warning, COLORS.info, COLORS.success, COLORS.textMuted
            ]
        }],
        ...CHART_ANIMATION,
        animationType: 'scale'
    };

    // 图表4：时间段分布 - 热力柱状图
    const trend4Option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
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
                margin: 10,
                interval: 2
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
        series: [{
            name: '借阅量',
            type: 'bar',
            data: [],
            barWidth: '60%',
            itemStyle: {
                color: function(params) {
                    const value = params.value;
                    const max = Math.max(...(window.chart4StatsData || [1]));
                    const ratio = value / max;

                    if (ratio > 0.8) {
                        return greenGradient(COLORS.primaryDark, COLORS.primary);
                    } else if (ratio > 0.5) {
                        return greenGradient(COLORS.primary, COLORS.primaryLight);
                    } else {
                        return greenGradient(COLORS.primaryLight, COLORS.primaryPale);
                    }
                },
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
        }]
    };

    window.charts.trend1.setOption(trend1Option);
    window.charts.trend2.setOption(trend2Option);
    window.charts.trend3.setOption(trend3Option);
    window.charts.trend4.setOption(trend4Option);
}

// 绑定事件监听器
function bindEventListeners() {
    const applyButton = document.querySelector('.btn-primary');
    if (applyButton) {
        applyButton.addEventListener('click', applyFilters);
    }

    const resetButton = document.querySelector('.btn-secondary');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    window.addEventListener('resize', function() {
        Object.values(window.charts).forEach(chart => {
            chart.resize();
        });
    });

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
        showLoading(true);

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

        updateTrendChart1(trendData);
        updateTrendChart2(readerData);
        updateTrendChart3(categoryData);
        updateTrendChart4(hourlyData);

        updateLastUpdateTime();

    } catch (error) {
        console.error('加载图表数据失败:', error);
        showNotification('数据加载失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 更新趋势图1：借阅量趋势
function updateTrendChart1(data) {
    const dates = data.dates || [];
    const borrowCounts = data.borrow_counts || [];
    const returnCounts = data.return_counts || borrowCounts.map(v => Math.floor(v * 0.85));

    // 使用完整配置更新图表
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
            boundaryGap: false,
            data: dates,
            axisLine: {
                lineStyle: {
                    color: COLORS.border,
                    width: 2
                }
            },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 12
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
                symbolSize: 8,
                data: borrowCounts,
                lineStyle: {
                    width: 3,
                    color: COLORS.primary
                },
                itemStyle: {
                    color: COLORS.primary,
                    borderWidth: 2,
                    borderColor: '#fff'
                }
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
                    color: COLORS.success
                },
                itemStyle: {
                    color: COLORS.success,
                    borderWidth: 2,
                    borderColor: '#fff'
                }
            }
        ]
    };

    window.charts.trend1.setOption(option, { notMerge: true });
}

// 更新趋势图2：读者活跃度
function updateTrendChart2(data) {
    if (data.active_reader_trend && data.new_reader_trend) {
        const dates = data.active_reader_trend.dates || [];
        const activeCounts = data.active_reader_trend.counts || [];
        const newCounts = data.new_reader_trend.counts || [];

        const displayDates = dates.slice(-10);
        const displayActive = activeCounts.slice(-10);
        const displayNew = newCounts.slice(-10);

        // 使用完整配置更新图表
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
                data: ['活跃读者', '新读者'],
                bottom: 0,
                left: 'center',
                textStyle: {
                    color: COLORS.textSecondary,
                    fontSize: 12
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
                boundaryGap: false,
                data: displayDates,
                axisLine: {
                    lineStyle: {
                        color: COLORS.border,
                        width: 2
                    }
                },
                axisLabel: {
                    color: COLORS.textSecondary,
                    fontSize: 12
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
                    name: '活跃读者',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    data: displayActive,
                    lineStyle: {
                        width: 3,
                        color: COLORS.primary
                    },
                    itemStyle: {
                        color: COLORS.primary,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }
                },
                {
                    name: '新读者',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    data: displayNew,
                    lineStyle: {
                        width: 3,
                        color: COLORS.warning
                    },
                    itemStyle: {
                        color: COLORS.warning,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }
                }
            ]
        };

        window.charts.trend2.setOption(option, { notMerge: true });
    }
}

// 更新趋势图3：类别分布
function updateTrendChart3(data) {
    if (data.categories && data.categories.length > 0) {
        const chartData = data.categories.map((cat, index) => ({
            value: cat.count || 0,
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
            ]
        };

        window.charts.trend3.setOption(option, { notMerge: true });
    }
}

// 更新趋势图4：时间段分布
function updateTrendChart4(data) {
    if (data.hours && data.counts) {
        const times = data.hours.map(h => `${h}:00`);
        window.chart4StatsData = data.counts;

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
                    rotate: 45
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
                    barWidth: '60%'
                }
            ]
        };

        window.charts.trend4.setOption(option, { notMerge: true });
    }
}

// 应用筛选条件
async function applyFilters() {
    try {
        const timeRange = document.getElementById('timeRange').value;
        const category = document.getElementById('categoryFilter').value;
        const readerType = document.getElementById('readerType').value;

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

        showLoading(true);

        const [trendData, readerData] = await Promise.all([
            fetch(`/api/stats/borrow-trend?${params}`).then(r => r.json()),
            fetch(`/api/stats/reader-activity?${params}`).then(r => r.json())
        ]);

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

    loadAllCharts();
    showNotification('筛选条件已重置', 'info');
}

// 刷新图表数据
function refreshCharts() {
    showNotification('正在刷新数据...', 'info');
    loadAllCharts();
}

// 切换图表视图
function toggleChartView() {
    window.chartViewMode = window.chartViewMode === 'default' ? 'compact' : 'default';

    const modeLabel = document.getElementById('viewModeLabel');
    if (modeLabel) {
        modeLabel.textContent = window.chartViewMode === 'default' ? '默认' : '紧凑';
    }

    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        if (window.chartViewMode === 'compact') {
            container.style.height = '280px';
        } else {
            container.style.height = '380px';
        }
    });

    Object.values(window.charts).forEach(chart => {
        chart.resize();
    });

    showNotification(`图表视图已切换为${window.chartViewMode === 'default' ? '默认' : '紧凑'}模式`, 'success');
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

function exportExcel() {
    showNotification('Excel导出功能正在开发中', 'info');
}

function exportPDF() {
    showNotification('PDF导出功能正在开发中', 'info');
}

function exportJSON() {
    const exportData = {
        exportTime: new Date().toISOString(),
        filters: {
            timeRange: document.getElementById('timeRange').value,
            category: document.getElementById('categoryFilter').value,
            readerType: document.getElementById('readerType').value
        },
        charts: {}
    };

    const jsonString = JSON.stringify(exportData, null, 2);
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
            chart.style.fontSize = '16px';
            chart.style.display = 'flex';
        } else {
            chart.style.display = 'none';
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
