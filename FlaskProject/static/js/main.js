import { fetchData, updateAllCharts } from './api.js';
import { initBorrowTrend } from './charts.js';

document.addEventListener('DOMContentLoaded', () => {
  // 初始化借阅趋势图
  const borrowTrendChart = initBorrowTrend('borrow-trend-chart', '/api/stats/borrow-trend');

  // 日期筛选事件绑定
  document.getElementById('date-filter').addEventListener('change', (e) => {
    const period = e.target.value; // 'day' | 'week' | 'month'
    updateAllCharts(`/api/stats/overview?period=${period}`, (data) => {
      borrowTrendChart.setOption({
        xAxis: { data: data.dates },
        series: [{ data: data.borrow_counts }],
      });
    });
  });
});