// borrow.js - 借阅服务页面功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面状态
    initPageState();

    // 绑定事件监听器
    bindEventListeners();

    // 初始数据加载
    loadBorrowStats();
    loadCurrentBorrows();
});

// 初始化页面状态
function initPageState() {
    // 状态变量
    window.borrowState = {
        activeTab: 'current', // current, overdue, history, reservations
        currentPage: 1,
        totalPages: 1,
        isLoading: false,
        searchQueries: {
            current: '',
            overdue: '',
            history: '',
            reservations: ''
        }
    };

    // 统计卡片元素
    window.statsCards = {
        todayBorrows: document.getElementById('todayBorrows'),
        dueToday: document.getElementById('dueToday'),
        overdueCount: document.getElementById('overdueCount'),
        pendingRenewals: document.getElementById('pendingRenewals')
    };

    // 表格容器
    window.tables = {
        currentBorrows: document.getElementById('currentBorrowsTable'),
        overdueTable: document.getElementById('overdueTable'),
        historyTable: document.getElementById('historyTable'),
        reservationsTable: document.getElementById('reservationsTable')
    };

    // 分页元素
    window.pagination = {
        current: {
            prev: document.getElementById('prevCurrentPage'),
            next: document.getElementById('nextCurrentPage'),
            current: document.getElementById('currentBorrowPage'),
            total: document.getElementById('totalCurrentPages')
        },
        overdue: {
            prev: document.getElementById('prevOverduePage'),
            next: document.getElementById('nextOverduePage'),
            current: document.getElementById('overduePage'),
            total: document.getElementById('totalOverduePages')
        },
        history: {
            prev: document.getElementById('prevHistoryPage'),
            next: document.getElementById('nextHistoryPage'),
            current: document.getElementById('historyPage'),
            total: document.getElementById('totalHistoryPages')
        },
        reservations: {
            prev: document.getElementById('prevReservationsPage'),
            next: document.getElementById('nextReservationsPage'),
            current: document.getElementById('reservationsPage'),
            total: document.getElementById('totalReservationsPages')
        }
    };

    // 搜索和筛选元素
    window.filters = {
        currentStatus: document.getElementById('currentStatusFilter'),
        overdueDays: document.getElementById('overdueDaysFilter'),
        historyTime: document.getElementById('historyTimeFilter'),
        reservationStatus: document.getElementById('reservationStatusFilter')
    };

    // 模态框元素
    window.modals = {
        borrow: document.getElementById('borrowModal'),
        return: document.getElementById('returnModal')
    };
}

// 绑定事件监听器
function bindEventListeners() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // 搜索框回车键支持
    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                const tabId = getActiveTabId();
                searchBorrowRecords(tabId);
            }
        });
    });

    // 模态框关闭事件
    Object.values(window.modals).forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === this) {
                    closeModal(this.id);
                }
            });
        }
    });

    // 表单提交
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', function(event) {
            event.preventDefault();
            submitBorrowForm();
        });
    }

    const returnForm = document.getElementById('returnForm');
    if (returnForm) {
        returnForm.addEventListener('submit', function(event) {
            event.preventDefault();
            submitReturnForm();
        });
    }

    // 窗口大小调整
    window.addEventListener('resize', function() {
        // 可以根据需要调整布局
    });
}

// 切换标签页
function switchTab(tabId) {
    if (window.borrowState.activeTab === tabId) return;

    // 更新标签页按钮状态
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });

    // 更新标签页内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId + 'Tab') {
            content.classList.add('active');
        }
    });

    // 更新活动标签页状态
    window.borrowState.activeTab = tabId;

    // 加载对应标签页的数据
    loadTabData(tabId);
}

// 加载标签页数据
function loadTabData(tabId) {
    switch(tabId) {
        case 'current':
            loadCurrentBorrows();
            break;
        case 'overdue':
            loadOverdueRecords();
            break;
        case 'history':
            loadBorrowHistory();
            break;
        case 'reservations':
            loadReservations();
            break;
    }
}

// 获取活动标签页ID
function getActiveTabId() {
    return window.borrowState.activeTab;
}

// 加载借阅统计数据
async function loadBorrowStats() {
    try {
        // 这里应该调用API获取统计数据
        // 暂时使用模拟数据
        window.statsCards.todayBorrows.textContent = '12';
        window.statsCards.dueToday.textContent = '8';
        window.statsCards.overdueCount.textContent = '3';
        window.statsCards.pendingRenewals.textContent = '5';

    } catch (error) {
        console.error('加载借阅统计数据失败:', error);
        showNotification('统计信息加载失败', 'error');
    }
}

// 加载当前借阅记录
async function loadCurrentBorrows() {
    if (window.borrowState.isLoading) return;

    try {
        window.borrowState.isLoading = true;

        // 这里应该调用API获取当前借阅记录
        // 暂时使用模拟数据
        const mockData = [
            {
                record_id: 'BR20230001',
                reader_name: '张三',
                reader_id: 'R20230001',
                book_title: 'Python编程从入门到实践',
                book_isbn: '9787115428028',
                borrow_date: '2026-04-15',
                due_date: '2026-04-29',
                days_remaining: 7,
                status: 'borrowed'
            },
            {
                record_id: 'BR20230002',
                reader_name: '李四',
                reader_id: 'R20230002',
                book_title: 'JavaScript高级程序设计',
                book_isbn: '9787115324443',
                borrow_date: '2026-04-18',
                due_date: '2026-04-25',
                days_remaining: 3,
                status: 'due_soon'
            },
            {
                record_id: 'BR20230003',
                reader_name: '王五',
                reader_id: 'R20230003',
                book_title: '经济学原理',
                book_isbn: '9787301262431',
                borrow_date: '2026-04-10',
                due_date: '2026-04-24',
                days_remaining: 2,
                status: 'due_soon'
            }
        ];

        renderCurrentBorrowsTable(mockData);

    } catch (error) {
        console.error('加载当前借阅记录失败:', error);
        showNotification('数据加载失败', 'error');
        window.tables.currentBorrows.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">数据加载失败</td></tr>';
    } finally {
        window.borrowState.isLoading = false;
    }
}

// 渲染当前借阅表格
function renderCurrentBorrowsTable(records) {
    const tbody = window.tables.currentBorrows;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">暂无借阅记录</td></tr>';
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');

        // 状态徽章
        let statusBadge = '';
        if (record.status === 'borrowed') {
            statusBadge = '<span class="status-badge status-borrowed">借阅中</span>';
        } else if (record.status === 'due_soon') {
            statusBadge = '<span class="status-badge status-overdue">即将到期</span>';
        } else if (record.status === 'overdue') {
            statusBadge = '<span class="status-badge status-overdue">已逾期</span>';
        }

        // 剩余天数样式
        let daysClass = '';
        if (record.days_remaining <= 0) {
            daysClass = 'style="color: #F56565; font-weight: bold;"';
        } else if (record.days_remaining <= 3) {
            daysClass = 'style="color: #ED8936; font-weight: bold;"';
        }

        row.innerHTML = `
            <td>${record.record_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${record.borrow_date}</td>
            <td>${record.due_date}</td>
            <td ${daysClass}>${record.days_remaining}天</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-small" onclick="processReturn('${record.record_id}')">归还</button>
                    <button class="btn btn-secondary btn-small" onclick="processRenew('${record.record_id}')">续借</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 加载逾期记录
async function loadOverdueRecords() {
    // 实现类似loadCurrentBorrows的逻辑
    const mockData = [
        {
            record_id: 'BR20230004',
            reader_name: '赵六',
            reader_id: 'R20230004',
            book_title: '百年孤独',
            book_isbn: '9787544253994',
            due_date: '2026-04-10',
            overdue_days: 12,
            fine_amount: 24,
            status: 'overdue'
        }
    ];

    renderOverdueTable(mockData);
}

// 渲染逾期表格
function renderOverdueTable(records) {
    const tbody = window.tables.overdueTable;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">暂无逾期记录</td></tr>';
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.record_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${record.due_date}</td>
            <td style="color: #F56565; font-weight: bold;">${record.overdue_days}天</td>
            <td style="color: #F56565; font-weight: bold;">${record.fine_amount}元</td>
            <td><span class="status-badge status-overdue">已逾期</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-small" onclick="processReturn('${record.record_id}')">归还</button>
                    <button class="btn btn-secondary btn-small" onclick="sendReminder('${record.record_id}')">提醒</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 加载借阅历史
async function loadBorrowHistory() {
    // 模拟数据
    const mockData = [
        {
            record_id: 'BR20230005',
            reader_name: '孙七',
            reader_id: 'R20230005',
            book_title: '人类简史',
            book_isbn: '9787508647357',
            borrow_date: '2026-03-15',
            return_date: '2026-03-29',
            borrow_days: 14,
            status: 'returned'
        }
    ];

    renderHistoryTable(mockData);
}

// 渲染历史表格
function renderHistoryTable(records) {
    const tbody = window.tables.historyTable;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">暂无历史记录</td></tr>';
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.record_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${record.borrow_date}</td>
            <td>${record.return_date}</td>
            <td>${record.borrow_days}天</td>
            <td><span class="status-badge status-returned">已归还</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-small" onclick="viewBorrowDetails('${record.record_id}')">详情</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 加载预约记录
async function loadReservations() {
    // 模拟数据
    const mockData = [
        {
            reservation_id: 'RSV20230001',
            reader_name: '周八',
            reader_id: 'R20230006',
            book_title: '深度学习',
            book_isbn: '9787115461476',
            reservation_date: '2026-04-20',
            expected_date: '2026-04-25',
            status: 'pending'
        }
    ];

    renderReservationsTable(mockData);
}

// 渲染预约表格
function renderReservationsTable(records) {
    const tbody = window.tables.reservationsTable;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #999;">暂无预约记录</td></tr>';
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');

        let statusBadge = '';
        if (record.status === 'pending') {
            statusBadge = '<span class="status-badge status-reserved">等待中</span>';
        } else if (record.status === 'available') {
            statusBadge = '<span class="status-badge status-available">可领取</span>';
        } else if (record.status === 'expired') {
            statusBadge = '<span class="status-badge status-overdue">已过期</span>';
        }

        row.innerHTML = `
            <td>${record.reservation_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${record.reservation_date}</td>
            <td>${record.expected_date}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    ${record.status === 'available' ?
                        `<button class="btn btn-primary btn-small" onclick="fulfillReservation('${record.reservation_id}')">办理借阅</button>` :
                        `<button class="btn btn-secondary btn-small" onclick="cancelReservation('${record.reservation_id}')">取消预约</button>`
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 搜索功能
function searchCurrentBorrows() {
    const searchInput = document.querySelector('#currentTab .search-input');
    const statusFilter = window.filters.currentStatus;

    if (searchInput) {
        window.borrowState.searchQueries.current = searchInput.value.trim();
    }

    // 重新加载数据
    loadCurrentBorrows();
    showNotification('搜索条件已应用', 'info');
}

function searchOverdueRecords() {
    const searchInput = document.querySelector('#overdueTab .search-input');
    const daysFilter = window.filters.overdueDays;

    if (searchInput) {
        window.borrowState.searchQueries.overdue = searchInput.value.trim();
    }

    loadOverdueRecords();
    showNotification('搜索条件已应用', 'info');
}

function searchBorrowHistory() {
    const searchInput = document.querySelector('#historyTab .search-input');
    const timeFilter = window.filters.historyTime;

    if (searchInput) {
        window.borrowState.searchQueries.history = searchInput.value.trim();
    }

    loadBorrowHistory();
    showNotification('搜索条件已应用', 'info');
}

function searchReservations() {
    const searchInput = document.querySelector('#reservationsTab .search-input');
    const statusFilter = window.filters.reservationStatus;

    if (searchInput) {
        window.borrowState.searchQueries.reservations = searchInput.value.trim();
    }

    loadReservations();
    showNotification('搜索条件已应用', 'info');
}

// 通用搜索函数
function searchBorrowRecords(tabId) {
    switch(tabId) {
        case 'current':
            searchCurrentBorrows();
            break;
        case 'overdue':
            searchOverdueRecords();
            break;
        case 'history':
            searchBorrowHistory();
            break;
        case 'reservations':
            searchReservations();
            break;
    }
}

// 重置筛选条件
function resetCurrentFilters() {
    const searchInput = document.querySelector('#currentTab .search-input');
    const statusFilter = window.filters.currentStatus;

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';

    window.borrowState.searchQueries.current = '';
    loadCurrentBorrows();
    showNotification('筛选条件已重置', 'info');
}

// 分页控制
function changeBorrowPage(direction, tabId) {
    // 这里应该实现分页逻辑
    showNotification('分页功能正在开发中', 'info');
}

// 模态框控制
function openBorrowModal() {
    if (window.modals.borrow) {
        window.modals.borrow.style.display = 'flex';
    }
}

function closeBorrowModal() {
    if (window.modals.borrow) {
        window.modals.borrow.style.display = 'none';
    }
}

function openReturnModal() {
    if (window.modals.return) {
        window.modals.return.style.display = 'flex';
    }
}

function closeReturnModal() {
    if (window.modals.return) {
        window.modals.return.style.display = 'none';
    }
}

function closeModal(modalId) {
    if (modalId === 'borrowModal') {
        closeBorrowModal();
    } else if (modalId === 'returnModal') {
        closeReturnModal();
    }
}

// 表单提交
function submitBorrowForm() {
    showNotification('图书借阅功能正在开发中', 'info');
    closeBorrowModal();
}

function submitReturnForm() {
    showNotification('图书归还功能正在开发中', 'info');
    closeReturnModal();
}

// 操作函数
function processReturn(recordId) {
    showNotification(`正在处理归还: ${recordId}`, 'info');
    setTimeout(() => {
        showNotification('归还处理完成', 'success');
        loadCurrentBorrows();
        loadBorrowStats();
    }, 1000);
}

function processRenew(recordId) {
    showNotification(`正在处理续借: ${recordId}`, 'info');
    setTimeout(() => {
        showNotification('续借申请已提交', 'success');
        loadCurrentBorrows();
    }, 1000);
}

function sendReminder(recordId) {
    showNotification(`发送逾期提醒: ${recordId}`, 'info');
    setTimeout(() => {
        showNotification('提醒已发送', 'success');
    }, 1000);
}

function viewBorrowDetails(recordId) {
    showNotification(`查看借阅详情: ${recordId}`, 'info');
}

function fulfillReservation(reservationId) {
    showNotification(`办理预约借阅: ${reservationId}`, 'info');
    setTimeout(() => {
        showNotification('预约借阅办理完成', 'success');
        loadReservations();
    }, 1000);
}

function cancelReservation(reservationId) {
    showNotification(`取消预约: ${reservationId}`, 'info');
    setTimeout(() => {
        showNotification('预约已取消', 'success');
        loadReservations();
    }, 1000);
}

function openRenewModal() {
    showNotification('续借功能正在开发中', 'info');
}

function openReservationModal() {
    showNotification('预约管理功能正在开发中', 'info');
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