// ECharts 图表初始化
export function initBorrowTrend(containerId, apiEndpoint) {
  const chart = echarts.init(document.getElementById(containerId));

  // 获取数据并渲染图表
  fetch(apiEndpoint)
    .then((res) => res.json())
    .then((data) => {
      const option = {
        title: { text: '图书借阅趋势分析', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.dates },
        yAxis: { type: 'value' },
        series: [
          {
            name: '借阅量',
            type: 'line',
            smooth: true,
            data: data.borrow_counts,
            areaStyle: { opacity: 0.2 },
          },
        ],
      };
      chart.setOption(option);
    })
    .catch((err) => console.error('图表加载失败:', err));

  // 响应式适配
  window.addEventListener('resize', () => chart.resize());
  return chart;
}