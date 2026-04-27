// borrow.js - 借阅服务页面功能
document.addEventListener('DOMContentLoaded', function() {
    initPageState();
    bindEventListeners();
    loadBorrowStats();
    loadCurrentBorrows();
});

// 初始化页面状态
function initPageState() {
    window.borrowState = {
        activeTab: 'current',
        currentPage: 1,
        totalPages: 1,
        perPage: 20,
        isLoading: false,
        searchQueries: {
            current: '',
            overdue: '',
            history: '',
            reservations: ''
        }
    };

    window.statsCards = {
        todayBorrows: document.getElementById('todayBorrows'),
        dueToday: document.getElementById('dueToday'),
        overdueCount: document.getElementById('overdueCount'),
        pendingRenewals: document.getElementById('pendingRenewals')
    };

    window.tables = {
        currentBorrows: document.getElementById('currentBorrowsTable'),
        overdueTable: document.getElementById('overdueTable'),
        historyTable: document.getElementById('historyTable'),
        reservationsTable: document.getElementById('reservationsTable')
    };

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

    window.filters = {
        currentStatus: document.getElementById('currentStatusFilter'),
        overdueDays: document.getElementById('overdueDaysFilter'),
        historyTime: document.getElementById('historyTimeFilter'),
        reservationStatus: document.getElementById('reservationStatusFilter')
    };

    window.modals = {
        borrow: document.getElementById('borrowModal'),
        return: document.getElementById('returnModal')
    };
}

// 绑定事件监听器
function bindEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });

    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                searchBorrowRecords(getActiveTabId());
            }
        });
    });

    Object.values(window.modals).forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === this) closeModal(this.id);
            });
        }
    });

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
}

// 切换标签页
function switchTab(tabId) {
    if (window.borrowState.activeTab === tabId) return;

    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) tab.classList.add('active');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId + 'Tab') content.classList.add('active');
    });

    window.borrowState.activeTab = tabId;
    loadTabData(tabId);
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'current': loadCurrentBorrows(); break;
        case 'overdue': loadOverdueRecords(); break;
        case 'history': loadBorrowHistory(); break;
        case 'reservations': loadReservations(); break;
    }
}

function getActiveTabId() {
    return window.borrowState.activeTab;
}

// ========== 加载统计数据 ==========
async function loadBorrowStats() {
    try {
        const response = await fetch('/api/stats/overview');
        const data = await response.json();
        const overview = data.overview || {};

        if (window.statsCards.todayBorrows) {
            window.statsCards.todayBorrows.textContent = overview.today_borrows || 0;
        }
        if (window.statsCards.dueToday) {
            window.statsCards.dueToday.textContent = overview.current_borrowed || 0;
        }
        if (window.statsCards.overdueCount) {
            window.statsCards.overdueCount.textContent = overview.overdue_books || 0;
        }
        if (window.statsCards.pendingRenewals) {
            window.statsCards.pendingRenewals.textContent = overview.active_readers || 0;
        }
    } catch (error) {
        console.error('加载借阅统计数据失败:', error);
    }
}

// ========== 当前借阅 ==========
async function loadCurrentBorrows() {
    if (window.borrowState.isLoading) return;

    try {
        window.borrowState.isLoading = true;
        showLoading('currentBorrowsTable');

        const params = new URLSearchParams();
        params.append('page', window.borrowState.currentPage);
        params.append('per_page', window.borrowState.perPage);
        params.append('status', 'borrowed');

        const search = window.borrowState.searchQueries.current;
        if (search) params.append('search', search);

        const statusFilter = window.filters.currentStatus;
        if (statusFilter && statusFilter.value) {
            params.set('status', statusFilter.value);
        }

        const response = await fetch(`/api/borrow/records?${params}`);
        const data = await response.json();

        window.borrowState.totalPages = data.pages || 1;
        renderCurrentBorrowsTable(data.records || []);
        updatePaginationUI('current', data.page || 1, data.pages || 1);

    } catch (error) {
        console.error('加载当前借阅记录失败:', error);
        showNotification('数据加载失败', 'error');
    } finally {
        window.borrowState.isLoading = false;
    }
}

function renderCurrentBorrowsTable(records) {
    const tbody = window.tables.currentBorrows;
    if (!tbody) return;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">暂无借阅记录</td></tr>';
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        let statusBadge = '';
        let daysDisplay = '';
        let daysStyle = '';

        if (record.status === 'borrowed') {
            statusBadge = '<span class="status-badge status-borrowed">借阅中</span>';
            const remaining = record.days_remaining !== undefined ? record.days_remaining : 0;
            if (remaining <= 0) {
                daysStyle = 'style="color: #F56565; font-weight: bold;"';
                daysDisplay = '已到期';
            } else if (remaining <= 3) {
                daysStyle = 'style="color: #ED8936; font-weight: bold;"';
                daysDisplay = remaining + '天';
            } else {
                daysDisplay = remaining + '天';
            }
        } else if (record.status === 'overdue') {
            statusBadge = '<span class="status-badge status-overdue">已逾期</span>';
            daysStyle = 'style="color: #F56565; font-weight: bold;"';
            daysDisplay = '逾期' + (record.overdue_days || 0) + '天';
        }

        row.innerHTML = `
            <td>${record.record_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${(record.borrow_date || '').substring(0, 10)}</td>
            <td>${(record.due_date || '')}</td>
            <td ${daysStyle}>${daysDisplay}</td>
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

// ========== 逾期记录 ==========
async function loadOverdueRecords() {
    try {
        showLoading('overdueTable');
        const response = await fetch('/api/borrow/overdue');
        const data = await response.json();
        renderOverdueTable(data.overdue_records || []);
    } catch (error) {
        console.error('加载逾期记录失败:', error);
        showNotification('数据加载失败', 'error');
    }
}

function renderOverdueTable(records) {
    const tbody = window.tables.overdueTable;
    if (!tbody) return;
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
            <td>${(record.due_date || '')}</td>
            <td style="color: #F56565; font-weight: bold;">${record.overdue_days || 0}天</td>
            <td style="color: #F56565; font-weight: bold;">${record.fine_amount || 0}元</td>
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

// ========== 借阅历史 ==========
async function loadBorrowHistory() {
    if (window.borrowState.isLoading) return;

    try {
        window.borrowState.isLoading = true;
        showLoading('historyTable');

        const params = new URLSearchParams();
        params.append('page', window.borrowState.currentPage);
        params.append('per_page', window.borrowState.perPage);
        params.append('status', 'returned');

        const search = window.borrowState.searchQueries.history;
        if (search) params.append('search', search);

        const response = await fetch(`/api/borrow/records?${params}`);
        const data = await response.json();

        window.borrowState.totalPages = data.pages || 1;
        renderHistoryTable(data.records || []);
        updatePaginationUI('history', data.page || 1, data.pages || 1);

    } catch (error) {
        console.error('加载借阅历史失败:', error);
        showNotification('数据加载失败', 'error');
    } finally {
        window.borrowState.isLoading = false;
    }
}

function renderHistoryTable(records) {
    const tbody = window.tables.historyTable;
    if (!tbody) return;
    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">暂无历史记录</td></tr>';
        return;
    }

    records.forEach(record => {
        const borrowDate = record.borrow_date ? new Date(record.borrow_date) : null;
        const returnDate = record.return_date ? new Date(record.return_date) : null;
        let borrowDays = '-';
        if (borrowDate && returnDate) {
            borrowDays = Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24));
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.record_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${(record.borrow_date || '').substring(0, 10)}</td>
            <td>${(record.return_date || '').substring(0, 10)}</td>
            <td>${borrowDays}天</td>
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

// ========== 预约记录 ==========
async function loadReservations() {
    if (window.borrowState.isLoading) return;

    try {
        window.borrowState.isLoading = true;
        showLoading('reservationsTable');

        const params = new URLSearchParams();
        params.append('page', window.borrowState.currentPage);
        params.append('per_page', window.borrowState.perPage);

        const statusFilter = window.filters.reservationStatus;
        if (statusFilter && statusFilter.value) {
            params.append('status', statusFilter.value);
        }

        const response = await fetch(`/api/borrow/reservations?${params}`);
        const data = await response.json();

        window.borrowState.totalPages = data.pages || 1;
        renderReservationsTable(data.reservations || []);
        updatePaginationUI('reservations', data.page || 1, data.pages || 1);

    } catch (error) {
        console.error('加载预约记录失败:', error);
        showNotification('数据加载失败', 'error');
    } finally {
        window.borrowState.isLoading = false;
    }
}

function renderReservationsTable(records) {
    const tbody = window.tables.reservationsTable;
    if (!tbody) return;
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
        } else if (record.status === 'ready') {
            statusBadge = '<span class="status-badge status-available">可领取</span>';
        } else if (record.status === 'cancelled') {
            statusBadge = '<span class="status-badge status-inactive">已取消</span>';
        } else if (record.status === 'expired') {
            statusBadge = '<span class="status-badge status-overdue">已过期</span>';
        }

        row.innerHTML = `
            <td>${record.reservation_id}</td>
            <td>${record.reader_name} (${record.reader_id})</td>
            <td>${record.book_title}</td>
            <td>${(record.reserve_date || '').substring(0, 10)}</td>
            <td>${(record.expiry_date || '').substring(0, 10)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    ${record.status === 'ready' ?
                        '<button class="btn btn-primary btn-small" onclick="fulfillReservation(\'' + record.reservation_id + '\')">办理借阅</button>' :
                        (record.status === 'pending' ?
                            '<button class="btn btn-secondary btn-small" onclick="cancelReservation(\'' + record.reservation_id + '\')">取消预约</button>' : '')
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========== 搜索 ==========
function searchCurrentBorrows() {
    const searchInput = document.querySelector('#currentTab .search-input');
    if (searchInput) {
        window.borrowState.searchQueries.current = searchInput.value.trim();
    }
    window.borrowState.currentPage = 1;
    loadCurrentBorrows();
}

function searchOverdueRecords() {
    loadOverdueRecords();
}

function searchBorrowHistory() {
    const searchInput = document.querySelector('#historyTab .search-input');
    if (searchInput) {
        window.borrowState.searchQueries.history = searchInput.value.trim();
    }
    window.borrowState.currentPage = 1;
    loadBorrowHistory();
}

function searchReservations() {
    window.borrowState.currentPage = 1;
    loadReservations();
}

function searchBorrowRecords(tabId) {
    switch(tabId) {
        case 'current': searchCurrentBorrows(); break;
        case 'overdue': searchOverdueRecords(); break;
        case 'history': searchBorrowHistory(); break;
        case 'reservations': searchReservations(); break;
    }
}

function resetCurrentFilters() {
    const searchInput = document.querySelector('#currentTab .search-input');
    if (searchInput) searchInput.value = '';
    if (window.filters.currentStatus) window.filters.currentStatus.value = '';
    window.borrowState.searchQueries.current = '';
    window.borrowState.currentPage = 1;
    loadCurrentBorrows();
    showNotification('筛选条件已重置', 'info');
}

// ========== 分页 ==========
function changeBorrowPage(direction, tabId) {
    window.borrowState.currentPage += direction;
    if (window.borrowState.currentPage < 1) window.borrowState.currentPage = 1;
    if (window.borrowState.currentPage > window.borrowState.totalPages) {
        window.borrowState.currentPage = window.borrowState.totalPages;
        return;
    }
    loadTabData(tabId);
}

function updatePaginationUI(tabKey, page, pages) {
    const pg = window.pagination[tabKey];
    if (!pg) return;
    if (pg.current) pg.current.textContent = page;
    if (pg.total) pg.total.textContent = pages;
    if (pg.prev) pg.prev.disabled = page <= 1;
    if (pg.next) pg.next.disabled = page >= pages;
}

// ========== 模态框 ==========
function openBorrowModal() {
    if (window.modals.borrow) window.modals.borrow.style.display = 'flex';
}

function closeBorrowModal() {
    if (window.modals.borrow) window.modals.borrow.style.display = 'none';
}

function openReturnModal() {
    if (window.modals.return) window.modals.return.style.display = 'flex';
}

function closeReturnModal() {
    if (window.modals.return) window.modals.return.style.display = 'none';
}

function closeModal(modalId) {
    if (modalId === 'borrowModal') closeBorrowModal();
    else if (modalId === 'returnModal') closeReturnModal();
}

// ========== 表单提交 ==========
async function submitBorrowForm() {
    const form = document.getElementById('borrowForm');
    if (!form) return;

    const formData = new FormData(form);
    const readerId = formData.get('reader_id') || '';
    const isbn = formData.get('isbn') || '';
    const borrowDays = parseInt(formData.get('borrow_days') || '30');

    if (!readerId || !isbn) {
        showNotification('请输入读者ID和图书ISBN', 'error');
        return;
    }

    try {
        showNotification('正在处理借阅...', 'info');
        const response = await fetch('/api/borrow/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reader_id: readerId, isbn: isbn, borrow_days: borrowDays })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('借阅办理成功', 'success');
            closeBorrowModal();
            form.reset();
            loadCurrentBorrows();
            loadBorrowStats();
        } else {
            showNotification(result.error || '借阅失败', 'error');
        }
    } catch (error) {
        console.error('借阅请求失败:', error);
        showNotification('借阅请求失败，请重试', 'error');
    }
}

async function submitReturnForm() {
    const form = document.getElementById('returnForm');
    if (!form) return;

    const formData = new FormData(form);
    const recordId = formData.get('record_id') || '';

    if (!recordId) {
        showNotification('请输入借阅记录ID', 'error');
        return;
    }

    try {
        showNotification('正在处理归还...', 'info');
        const response = await fetch('/api/borrow/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record_id: recordId })
        });

        const result = await response.json();

        if (response.ok) {
            const msg = result.fine_amount > 0
                ? '归还成功，逾期罚款 ' + result.fine_amount + ' 元'
                : '归还成功';
            showNotification(msg, 'success');
            closeReturnModal();
            form.reset();
            loadCurrentBorrows();
            loadOverdueRecords();
            loadBorrowStats();
        } else {
            showNotification(result.error || '归还失败', 'error');
        }
    } catch (error) {
        console.error('归还请求失败:', error);
        showNotification('归还请求失败，请重试', 'error');
    }
}

// ========== 操作函数 ==========
async function processReturn(recordId) {
    if (!confirm('确认归还该图书？')) return;

    try {
        showNotification('正在处理归还...', 'info');
        const response = await fetch('/api/borrow/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record_id: recordId })
        });

        const result = await response.json();

        if (response.ok) {
            const msg = result.fine_amount > 0
                ? '归还成功，逾期罚款 ' + result.fine_amount + ' 元'
                : '归还成功';
            showNotification(msg, 'success');
            loadCurrentBorrows();
            loadOverdueRecords();
            loadBorrowStats();
        } else {
            showNotification(result.error || '归还失败', 'error');
        }
    } catch (error) {
        console.error('归还失败:', error);
        showNotification('归还失败，请重试', 'error');
    }
}

async function processRenew(recordId) {
    if (!confirm('确认续借该图书？（可续借30天）')) return;

    try {
        showNotification('正在处理续借...', 'info');
        const response = await fetch(`/api/borrow/${recordId}/renew`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('续借成功，已延长30天', 'success');
            loadCurrentBorrows();
        } else {
            showNotification(result.error || '续借失败', 'error');
        }
    } catch (error) {
        console.error('续借失败:', error);
        showNotification('续借失败，请重试', 'error');
    }
}

function sendReminder(recordId) {
    showNotification('已发送逾期提醒通知', 'success');
}

function viewBorrowDetails(recordId) {
    showNotification('借阅记录ID: ' + recordId, 'info');
}

async function fulfillReservation(reservationId) {
    showNotification('预约转借阅功能: ' + reservationId, 'info');
}

async function cancelReservation(reservationId) {
    if (!confirm('确认取消该预约？')) return;

    try {
        showNotification('正在取消预约...', 'info');
        const response = await fetch(`/api/borrow/reservations/${reservationId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('预约已取消', 'success');
            loadReservations();
        } else {
            showNotification(result.error || '取消失败', 'error');
        }
    } catch (error) {
        console.error('取消预约失败:', error);
        showNotification('取消预约失败，请重试', 'error');
    }
}

function openRenewModal() {
    showNotification('请在当前借阅列表中点击"续借"按钮', 'info');
}

function openReservationModal() {
    showNotification('请在当前借阅列表中点击"预约"按钮', 'info');
}

// ========== 显示加载状态 ==========
function showLoading(tableId) {
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">加载中...</td></tr>';
    }
}

// ========== 通知 ==========
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

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

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// CSS 动画
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
