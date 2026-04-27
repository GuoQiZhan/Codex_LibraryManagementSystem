// API 请求封装
export async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// 更新所有图表数据
export async function updateAllCharts(apiEndpoint, updateCallback) {
  try {
    const data = await fetchData(apiEndpoint);
    updateCallback(data);
  } catch (error) {
    console.error('更新图表数据失败:', error);
  }
}