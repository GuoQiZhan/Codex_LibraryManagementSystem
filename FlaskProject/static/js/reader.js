// 读者管理页面JavaScript

// 全局变量
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadReaderStats();
    loadReaders();
    
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
                        }
                    });
                
                // 计算逾期读者
                document.getElementById('overdueReaders').textContent = data.overview.overdue_books;
            }
        })
        .catch(error => {
            console.error('加载统计数据失败:', error);
        });
}

// 加载读者列表
function loadReaders() {
    const url = `/api/reader?page=${currentPage}&per_page=10&search=${encodeURIComponent(searchQuery)}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data) {
                renderReaders(data.readers);
                updatePagination(data.page, data.pages, data.total);
            }
        })
        .catch(error => {
            console.error('加载读者数据失败:', error);
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
            
            // 计算当前借阅数量
            let currentBorrows = 0;
            if (reader.borrow_records) {
                currentBorrows = reader.borrow_records.filter(record => record.status === 'borrowed').length;
            }
            
            // 计算逾期次数
            let overdueCount = 0;
            if (reader.borrow_records) {
                overdueCount = reader.borrow_records.filter(record => record.status === 'overdue').length;
            }
            
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
    // 这里可以实现编辑功能
    alert(`编辑读者: ${readerId}`);
}

// 打开添加新读者模态框
function openNewReaderModal() {
    // 这里可以实现添加新读者的功能
    alert('添加新读者');
}