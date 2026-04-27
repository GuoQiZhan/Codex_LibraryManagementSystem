// 读者管理页面JavaScript

// 全局变量
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// 缓存配置
const CACHE_CONFIG = {
    readers: {
        key: 'library_readers_cache',
        expiry: 5 * 60 * 1000 // 5分钟
    },
    readerStats: {
        key: 'library_reader_stats_cache',
        expiry: 10 * 60 * 1000 // 10分钟
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadReaderStats();
    loadReaders();
    
    // 初始化添加读者表单
    initNewReaderForm();
    
    // 添加刷新按钮
    addRefreshButton();
    
    // 每30秒自动刷新数据
    setInterval(function() {
        loadReaderStats();
        loadReaders();
    }, 30000);
});

// 添加刷新按钮
function addRefreshButton() {
    const actionsBar = document.querySelector('.actions-bar');
    if (actionsBar) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'btn btn-secondary';
        refreshButton.innerHTML = '↻ 刷新';
        refreshButton.onclick = function() {
            loadReaderStats();
            loadReaders();
        };
        actionsBar.appendChild(refreshButton);
    }
}

// 加载读者统计数据
function loadReaderStats() {
    // 尝试从缓存获取数据
    const cachedStats = getFromCache(CACHE_CONFIG.readerStats.key);
    if (cachedStats) {
        // 使用缓存数据
        document.getElementById('totalReaders').textContent = cachedStats.total_readers;
        document.getElementById('activeReaders').textContent = cachedStats.active_readers;
        document.getElementById('avgCreditScore').textContent = cachedStats.avg_credit_score || 0;
        document.getElementById('overdueReaders').textContent = cachedStats.overdue_books;
        return;
    }
    
    // 显示加载状态 - 直接更新每个统计卡片
    document.getElementById('totalReaders').textContent = '加载中...';
    document.getElementById('activeReaders').textContent = '加载中...';
    document.getElementById('avgCreditScore').textContent = '加载中...';
    document.getElementById('overdueReaders').textContent = '加载中...';
    
    fetch('/api/stats/overview')
        .then(response => response.json())
        .then(data => {
            if (data && data.overview) {
                document.getElementById('totalReaders').textContent = data.overview.total_readers;
                document.getElementById('activeReaders').textContent = data.overview.active_readers;
                
                // 计算平均信用分
                fetch('/api/reader')
                    .then(res => res.json())
                    .then(readerData => {
                        if (readerData && readerData.readers && readerData.readers.length > 0) {
                            const totalCredit = readerData.readers.reduce((sum, reader) => sum + (reader.credit_score || 0), 0);
                            const avgCredit = Math.round(totalCredit / readerData.readers.length);
                            document.getElementById('avgCreditScore').textContent = avgCredit;
                            
                            // 缓存统计数据
                            const statsData = {
                                total_readers: data.overview.total_readers,
                                active_readers: data.overview.active_readers,
                                avg_credit_score: avgCredit,
                                overdue_books: data.overview.overdue_books
                            };
                            saveToCache(CACHE_CONFIG.readerStats.key, statsData, CACHE_CONFIG.readerStats.expiry);
                        } else {
                            document.getElementById('avgCreditScore').textContent = 0;
                        }
                    })
                    .catch(error => {
                        console.error('加载读者数据失败:', error);
                        document.getElementById('avgCreditScore').textContent = 0;
                    });
                
                // 计算逾期读者
                document.getElementById('overdueReaders').textContent = data.overview.overdue_books;
            } else {
                // 数据加载失败，显示默认值
                document.getElementById('totalReaders').textContent = 0;
                document.getElementById('activeReaders').textContent = 0;
                document.getElementById('avgCreditScore').textContent = 0;
                document.getElementById('overdueReaders').textContent = 0;
            }
        })
        .catch(error => {
            console.error('加载统计数据失败:', error);
            showError('加载统计数据失败，请重试');
            // 显示默认值
            document.getElementById('totalReaders').textContent = 0;
            document.getElementById('activeReaders').textContent = 0;
            document.getElementById('avgCreditScore').textContent = 0;
            document.getElementById('overdueReaders').textContent = 0;
        });
}

// 加载读者列表
function loadReaders() {
    const url = `/api/reader?page=${currentPage}&per_page=10&search=${encodeURIComponent(searchQuery)}`;
    
    // 生成缓存键
    const cacheKey = `${CACHE_CONFIG.readers.key}_${currentPage}_${searchQuery}`;
    
    // 尝试从缓存获取数据
    const cachedReaders = getFromCache(cacheKey);
    if (cachedReaders) {
        // 使用缓存数据
        renderReaders(cachedReaders.readers);
        updatePagination(cachedReaders.page, cachedReaders.pages, cachedReaders.total);
        return;
    }
    
    // 显示加载状态
    showLoading('readersTableBody');
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data) {
                renderReaders(data.readers);
                updatePagination(data.page, data.pages, data.total);
                
                // 缓存数据
                saveToCache(cacheKey, data, CACHE_CONFIG.readers.expiry);
            }
        })
        .catch(error => {
            console.error('加载读者数据失败:', error);
            showError('加载读者数据失败，请重试');
        })
        .finally(() => {
            // 隐藏加载状态
            // 注意：不需要调用hideLoading，因为renderReaders会直接更新内容
        });
}

// 渲染读者列表
function renderReaders(readers) {
    const tableBody = document.getElementById('readersTableBody');
    if (!tableBody) return;
    
    if (readers && readers.length > 0) {
        tableBody.innerHTML = '';
        
        readers.forEach(reader => {
            const row = document.createElement('div');
            row.className = 'table-row';
            
            // 使用 API 返回的字段，而不是尝试从 borrow_records 计算
            const currentBorrows = reader.total_borrow_count || 0;
            const overdueCount = reader.overdue_count || 0;
            
            row.innerHTML = `
                <div>${reader.reader_id}</div>
                <div>${reader.name || '无'}</div>
                <div>${reader.email || '无'}</div>
                <div><span class="status-badge ${reader.credit_score >= 90 ? 'status-active' : reader.credit_score >= 70 ? 'status-inactive' : 'status-overdue'}">${reader.credit_score || 0}</span></div>
                <div>${reader.borrow_quota || 5}</div>
                <div>${currentBorrows}</div>
                <div>${overdueCount}</div>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewReader('${reader.reader_id}')">查看</button>
                    <button class="action-btn" onclick="editReader('${reader.reader_id}')">编辑</button>
                    <button class="action-btn" onclick="deleteReader('${reader.reader_id}')">删除</button>
                </div>
            `;
            
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = `
            <div class="table-row">
                <div colspan="8" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    暂无读者数据
                </div>
            </div>
        `;
    }
}

// 更新分页
function updatePagination(page, pages, total) {
    currentPage = page;
    totalPages = pages;
    
    document.getElementById('currentPage').textContent = page;
    document.getElementById('totalPages').textContent = pages;
    
    document.getElementById('prevPage').disabled = page === 1;
    document.getElementById('nextPage').disabled = page === pages;
}

// 搜索读者
function searchReaders() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        loadReaders();
    }
}

// 改变页码
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadReaders();
    }
}

// 查看读者详情
function viewReader(readerId) {
    fetch(`/api/reader/${readerId}`)
        .then(response => response.json())
        .then(reader => {
            if (reader) {
                alert(`读者ID: ${reader.reader_id}\n姓名: ${reader.name}\n邮箱: ${reader.email}\n电话: ${reader.phone}\n信用分: ${reader.credit_score}\n借阅额度: ${reader.borrow_quota}`);
            }
        })
        .catch(error => {
            console.error('获取读者详情失败:', error);
        });
}

// 编辑读者
function editReader(readerId) {
    // 显示加载状态
    const modal = document.getElementById('editReaderModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // 显示加载状态提示
        alert('正在加载读者信息...');
    }
    
    // 获取读者详情
    fetch(`/api/reader/${readerId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取读者详情失败');
            }
            return response.json();
        })
        .then(reader => {
            // 填充表单数据
            document.getElementById('editReaderId').value = reader.reader_id;
            document.getElementById('editReaderReaderId').value = reader.reader_id;
            document.getElementById('editReaderName').value = reader.name || '';
            document.getElementById('editReaderEmail').value = reader.email || '';
            document.getElementById('editReaderPhone').value = reader.phone || '';
            document.getElementById('editReaderQuota').value = reader.borrow_quota || 5;
            document.getElementById('editReaderCredit').value = reader.credit_score || 80;
        })
        .catch(error => {
            console.error('获取读者详情失败:', error);
            alert('获取读者详情失败，请重试');
            closeEditReaderModal();
        });
}

// 打开添加新读者模态框
function openNewReaderModal() {
    const modal = document.getElementById('newReaderModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 关闭添加新读者模态框
function closeNewReaderModal() {
    const modal = document.getElementById('newReaderModal');
    if (modal) {
        modal.style.display = 'none';
        // 重置表单
        document.getElementById('newReaderForm').reset();
    }
}

// 关闭编辑读者模态框
function closeEditReaderModal() {
    const modal = document.getElementById('editReaderModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 初始化添加读者表单
function initNewReaderForm() {
    const form = document.getElementById('newReaderForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewReader();
        });
    }
    
    // 初始化编辑读者表单
    const editForm = document.getElementById('editReaderForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateReader();
        });
    }
}

// 添加新读者
function addNewReader() {
    // 获取表单数据
    const name = document.getElementById('readerName').value.trim();
    const email = document.getElementById('readerEmail').value.trim();
    const phone = document.getElementById('readerPhone').value.trim();
    const quota = parseInt(document.getElementById('readerQuota').value) || 5;
    const credit = parseInt(document.getElementById('readerCredit').value) || 80;
    
    // 验证表单数据
    if (!name) {
        alert('请输入读者姓名');
        return;
    }
    
    // 生成读者ID
    const readerId = 'R' + new Date().getFullYear() + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    // 创建新读者对象
    const newReader = {
        reader_id: readerId,
        name: name,
        email: email || null,
        phone: phone || null,
        credit_score: credit,
        borrow_quota: quota
    };
    
    // 保存到数据库
    saveReaderToDatabase(newReader);
}

// 更新读者信息
function updateReader() {
    // 获取表单数据
    const readerId = document.getElementById('editReaderId').value;
    const name = document.getElementById('editReaderName').value.trim();
    const email = document.getElementById('editReaderEmail').value.trim();
    const phone = document.getElementById('editReaderPhone').value.trim();
    const quota = parseInt(document.getElementById('editReaderQuota').value) || 5;
    const credit = parseInt(document.getElementById('editReaderCredit').value) || 80;
    
    // 验证表单数据
    if (!name) {
        alert('请输入读者姓名');
        return;
    }
    
    // 创建更新对象
    const updateData = {
        name: name,
        email: email || null,
        phone: phone || null,
        credit_score: credit,
        borrow_quota: quota
    };
    
    // 保存到数据库
    updateReaderToDatabase(readerId, updateData);
}

// 保存读者到数据库
function saveReaderToDatabase(readerData) {
    // 显示加载状态
    alert('正在保存读者数据...');
    
    // 发送请求到后端API
    fetch('/api/reader/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(readerData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error || '保存失败');
            });
        }
        return response.json();
    })
    .then(data => {
        // 保存成功
        console.log('读者保存成功:', data);
        
        // 添加到表格中
        addReaderToTable(data);
        
        // 关闭模态框
        closeNewReaderModal();
        
        // 显示成功提示
        alert('读者添加成功！');
        
        // 清除缓存，确保下次加载最新数据
        clearCache(CACHE_CONFIG.readers.key);
        
        // 刷新统计数据
        loadReaderStats();
        
        // 刷新读者列表
        loadReaders();
    })
    .catch(error => {
        // 保存失败
        console.error('保存读者失败:', error);
        alert('保存失败: ' + error.message);
    });
}

// 更新读者到数据库
function updateReaderToDatabase(readerId, updateData) {
    // 显示加载状态
    alert('正在更新读者数据...');
    
    // 发送请求到后端API
    fetch(`/api/reader/${readerId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error || '更新失败');
            });
        }
        return response.json();
    })
    .then(data => {
        // 更新成功
        console.log('读者更新成功:', data);
        
        // 关闭模态框
        closeEditReaderModal();
        
        // 显示成功提示
        alert('读者更新成功！');
        
        // 清除缓存，确保下次加载最新数据
        clearCache(CACHE_CONFIG.readers.key);
        
        // 刷新统计数据
        loadReaderStats();
        
        // 刷新读者列表
        loadReaders();
    })
    .catch(error => {
        // 更新失败
        console.error('更新读者失败:', error);
        alert('更新失败: ' + error.message);
    });
}

// 删除读者
function deleteReader(readerId) {
    // 确认删除
    if (!confirm('确定要删除这个读者吗？此操作不可恢复。')) {
        return;
    }
    
    // 显示加载状态
    alert('正在删除读者数据...');
    
    // 发送请求到后端API
    fetch(`/api/reader/${readerId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error || '删除失败');
            });
        }
        return response.json();
    })
    .then(data => {
        // 删除成功
        console.log('读者删除成功:', data);
        
        // 显示成功提示
        alert('读者删除成功！');
        
        // 清除缓存，确保下次加载最新数据
        clearCache(CACHE_CONFIG.readers.key);
        
        // 刷新统计数据
        loadReaderStats();
        
        // 刷新读者列表
        loadReaders();
    })
    .catch(error => {
        // 删除失败
        console.error('删除读者失败:', error);
        alert('删除失败: ' + error.message);
    });
}

// 将新读者添加到表格中
function addReaderToTable(reader) {
    const tableBody = document.getElementById('readersTableBody');
    if (!tableBody) return;
    
    // 检查表格是否为空
    const isEmpty = tableBody.querySelector('.table-row') === null;
    
    // 创建新行
    const row = document.createElement('div');
    row.className = 'table-row';
    
    // 计算当前借阅数量和逾期次数
    let currentBorrows = 0;
    let overdueCount = 0;
    if (reader.borrow_records) {
        currentBorrows = reader.borrow_records.filter(record => record.status === 'borrowed').length;
        overdueCount = reader.borrow_records.filter(record => record.status === 'overdue').length;
    }
    
    // 设置行内容
    row.innerHTML = `
        <div>${reader.reader_id}</div>
        <div>${reader.name}</div>
        <div>${reader.email || '无'}</div>
        <div><span class="status-badge ${reader.credit_score >= 90 ? 'status-active' : reader.credit_score >= 70 ? 'status-inactive' : 'status-overdue'}">${reader.credit_score || 0}</span></div>
        <div>${reader.borrow_quota || 5}</div>
        <div>${currentBorrows}</div>
        <div>${overdueCount}</div>
        <div class="action-buttons">
            <button class="action-btn" onclick="viewReader('${reader.reader_id}')">查看</button>
            <button class="action-btn" onclick="editReader('${reader.reader_id}')">编辑</button>
            <button class="action-btn" onclick="deleteReader('${reader.reader_id}')">删除</button>
        </div>
    `;
    
    // 如果表格为空，直接添加新行
    if (isEmpty) {
        tableBody.innerHTML = '';
        tableBody.appendChild(row);
    } else {
        // 否则，将新行添加到表格顶部
        tableBody.insertBefore(row, tableBody.firstChild);
    }
}

// 显示加载状态
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>';
    }
}

// 显示错误信息
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    
    const mainContainer = document.querySelector('.main-content');
    if (mainContainer) {
        mainContainer.insertBefore(errorContainer, mainContainer.firstChild);
        
        // 3秒后自动移除错误信息
        setTimeout(() => {
            errorContainer.remove();
        }, 3000);
    }
}

// 缓存相关函数
function getFromCache(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const parsed = JSON.parse(cached);
        if (parsed.expiry < Date.now()) {
            localStorage.removeItem(key);
            return null;
        }
        
        return parsed.data;
    } catch (error) {
        console.error('从缓存获取数据失败:', error);
        return null;
    }
}

function saveToCache(key, data, expiry) {
    try {
        const cacheItem = {
            data: data,
            expiry: Date.now() + expiry
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
        console.error('保存数据到缓存失败:', error);
    }
}

function clearCache(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('清除缓存失败:', error);
    }
}