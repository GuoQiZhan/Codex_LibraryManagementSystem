// book.js - 图书管理页面功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面状态
    initPageState();

    // 绑定事件监听器
    bindEventListeners();

    // 初始数据加载
    loadBooksData();
    loadBookStats();
});

// 初始化页面状态
function initPageState() {
    // 状态变量
    window.bookState = {
        currentView: 'grid', // grid, list, table
        currentPage: 1,
        totalPages: 1,
        totalBooks: 0,
        searchQuery: '',
        categoryFilter: '',
        statusFilter: '',
        isLoading: false
    };

    // 统计卡片元素
    window.statsCards = {
        totalBooks: document.getElementById('totalBooks'),
        availableBooks: document.getElementById('availableBooks'),
        borrowedBooks: document.getElementById('borrowedBooks'),
        newBooks: document.getElementById('newBooks')
    };

    // 容器元素
    window.containers = {
        booksGrid: document.getElementById('booksGrid'),
        booksList: document.getElementById('booksList'),
        booksTable: document.getElementById('booksTable'),
        booksTableBody: document.getElementById('booksTableBody')
    };

    // 分页元素
    window.pagination = {
        prevBtn: document.getElementById('prevPage'),
        nextBtn: document.getElementById('nextPage'),
        currentPage: document.getElementById('currentPage'),
        totalPages: document.getElementById('totalPages')
    };

    // 搜索和筛选元素
    window.filters = {
        searchInput: document.querySelector('.search-input'),
        categoryFilter: document.getElementById('categoryFilter'),
        statusFilter: document.getElementById('statusFilter')
    };
}

// 缓存配置
const CACHE_CONFIG = {
    books: {
        key: 'library_books_cache',
        expiry: 5 * 60 * 1000 // 5分钟
    },
    bookStats: {
        key: 'library_book_stats_cache',
        expiry: 10 * 60 * 1000 // 10分钟
    }
};

// 绑定事件监听器
function bindEventListeners() {
    // 搜索框回车键支持
    if (window.filters.searchInput) {
        window.filters.searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                searchBooks();
            }
        });
    }

    // 筛选器变更时重新加载数据
    if (window.filters.categoryFilter) {
        window.filters.categoryFilter.addEventListener('change', function() {
            window.bookState.categoryFilter = this.value;
            resetPagination();
            loadBooksData();
        });
    }

    if (window.filters.statusFilter) {
        window.filters.statusFilter.addEventListener('change', function() {
            window.bookState.statusFilter = this.value;
            resetPagination();
            loadBooksData();
        });
    }

    // 视图切换按钮
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            changeView(viewType);
        });
    });

    // 窗口大小调整时重新布局
    window.addEventListener('resize', function() {
        // 可以根据需要调整布局
    });

    // 模态框关闭事件
    const newBookModal = document.getElementById('newBookModal');
    if (newBookModal) {
        newBookModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeNewBookModal();
            }
        });
    }

    // 添加新书表单提交
    const newBookForm = document.getElementById('newBookForm');
    if (newBookForm) {
        newBookForm.addEventListener('submit', function(event) {
            event.preventDefault();
            submitNewBookForm();
        });
    }
}

// 加载图书统计数据
async function loadBookStats() {
    showLoading('bookStats');

    try {
        const response = await fetch('/api/hbase/books/stats');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const overview = data.overview || data;

        if (window.statsCards.totalBooks) {
            window.statsCards.totalBooks.textContent = overview.total_books || 0;
        }
        if (window.statsCards.availableBooks) {
            window.statsCards.availableBooks.textContent = overview.available_stock || 0;
        }
        if (window.statsCards.borrowedBooks) {
            window.statsCards.borrowedBooks.textContent = overview.current_borrowed || 0;
        }
        if (window.statsCards.newBooks) {
            window.statsCards.newBooks.textContent = data.new_books || 0;
        }

        saveToCache(CACHE_CONFIG.bookStats.key, overview, CACHE_CONFIG.bookStats.expiry);

    } catch (error) {
        console.error('加载图书统计数据失败:', error);
        showNotification('统计信息加载失败: ' + error.message, 'error');
    }
}

// 加载图书数据
async function loadBooksData() {
    if (window.bookState.isLoading) return;

    window.bookState.isLoading = true;
    showLoading('booksGrid');

    try {
        const params = new URLSearchParams();
        params.append('page', window.bookState.currentPage);
        params.append('per_page', 12);

        if (window.bookState.searchQuery) {
            params.append('search', window.bookState.searchQuery);
        }
        if (window.bookState.categoryFilter) {
            params.append('category', window.bookState.categoryFilter);
        }
        if (window.bookState.statusFilter === 'available') {
            params.append('available_only', 'true');
        }

        const response = await fetch(`/api/hbase/books?${params}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        window.bookState.totalPages = data.pages || 1;
        window.bookState.totalBooks = data.total || 0;

        updatePaginationUI();
        updateBooksDisplay(data.books || []);

        saveToCache(CACHE_CONFIG.books.key, data, CACHE_CONFIG.books.expiry);

    } catch (error) {
        console.error('加载图书数据失败:', error);
        showNotification('图书数据加载失败: ' + error.message, 'error');
    } finally {
        window.bookState.isLoading = false;
    }
}

// 根据视图类型更新图书展示
function updateBooksDisplay(books) {
    // 清空所有容器
    window.containers.booksGrid.innerHTML = '';
    window.containers.booksList.innerHTML = '';
    window.containers.booksTableBody.innerHTML = '';

    if (books.length === 0) {
        showNoBooksMessage();
        return;
    }

    // 根据当前视图类型渲染
    switch (window.bookState.currentView) {
        case 'grid':
            renderBooksGrid(books);
            break;
        case 'list':
            renderBooksList(books);
            break;
        case 'table':
            renderBooksTable(books);
            break;
        default:
            renderBooksGrid(books);
    }
}

// 渲染网格视图
function renderBooksGrid(books) {
    books.forEach(book => {
        const bookCard = createBookCard(book);
        window.containers.booksGrid.appendChild(bookCard);
    });
}

// 渲染列表视图
function renderBooksList(books) {
    books.forEach(book => {
        const bookCard = createBookCard(book);
        bookCard.classList.add('list-view-card');
        window.containers.booksList.appendChild(bookCard);
    });
}

// 渲染表格视图
function renderBooksTable(books) {
    books.forEach(book => {
        const tableRow = createBookTableRow(book);
        window.containers.booksTableBody.appendChild(tableRow);
    });
}

// 创建图书卡片
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';

    // 计算状态：根据可用库存和is_available字段
    let status = 'unknown';
    let statusClass = 'status-inactive';
    if (book.is_available === true || book.available_stock > 0) {
        status = 'available';
        statusClass = 'status-available';
    } else if (book.available_stock === 0 && book.total_stock > 0) {
        status = 'borrowed';
        statusClass = 'status-borrowed';
    } else if (book.available_stock === 0 && book.total_stock === 0) {
        status = 'reserved';
        statusClass = 'status-reserved';
    }

    // 库存信息
    const stockInfo = book.total_stock !== undefined && book.available_stock !== undefined ?
        `${book.available_stock}/${book.total_stock}` : '--';

    card.innerHTML = `
        <div class="book-cover">
            <span>📚</span>
        </div>
        <div class="book-info">
            <h3 class="book-title">${book.title || '未命名'}</h3>
            <p class="book-author">作者: ${book.author || '未知'}</p>
            <div class="book-meta">
                <div class="meta-item">
                    <div class="meta-label">ISBN</div>
                    <div class="meta-value">${book.isbn || '--'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">类别</div>
                    <div class="meta-value">${book.category_name || book.category || '--'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">库存</div>
                    <div class="meta-value">${stockInfo}</div>
                </div>
            </div>
            <span class="status-badge ${statusClass}">${status === 'available' ? '可借阅' :
                status === 'borrowed' ? '已借出' :
                status === 'reserved' ? '已预约' : '未知状态'}</span>
            <div class="book-actions">
                ${status === 'available' ?
                    `<button class="action-btn primary" onclick="borrowBook('${book.isbn}')">借阅</button>` :
                    `<button class="action-btn" disabled>不可借阅</button>`
                }
                <button class="action-btn" onclick="viewBook('${book.isbn}')">详情</button>
                <button class="action-btn" onclick="editBook('${book.isbn}')">编辑</button>
            </div>
        </div>
    `;

    return card;
}

// 创建表格行
function createBookTableRow(book) {
    const row = document.createElement('div');
    row.className = 'table-row';

    // 计算状态
    let statusText = '未知';
    if (book.is_available === true || book.available_stock > 0) {
        statusText = '可借阅';
    } else if (book.available_stock === 0 && book.total_stock > 0) {
        statusText = '已借出';
    } else if (book.available_stock === 0 && book.total_stock === 0) {
        statusText = '已预约';
    }

    // 库存信息
    const stockInfo = book.total_stock !== undefined && book.available_stock !== undefined ?
        `${book.available_stock}/${book.total_stock}` : '--';

    row.innerHTML = `
        <div>${book.isbn || '--'}</div>
        <div>${book.title || '未命名'}</div>
        <div>${book.author || '未知'}</div>
        <div>${book.isbn || '--'}</div>
        <div>${book.category_name || book.category || '--'}</div>
        <div>${stockInfo}</div>
        <div class="action-buttons">
            ${statusText === '可借阅' ?
                `<button class="action-btn" onclick="borrowBook('${book.isbn}')">借阅</button>` :
                `<button class="action-btn" disabled>不可借阅</button>`
            }
            <button class="action-btn" onclick="viewBook('${book.isbn}')">详情</button>
            <button class="action-btn" onclick="editBook('${book.isbn}')">编辑</button>
        </div>
    `;

    return row;
}

// 搜索图书
function searchBooks() {
    const searchInput = window.filters.searchInput;
    if (!searchInput) return;

    window.bookState.searchQuery = searchInput.value.trim();
    resetPagination();
    loadBooksData();
}

// 切换视图
function changeView(viewType) {
    if (window.bookState.currentView === viewType) return;

    // 更新当前视图
    window.bookState.currentView = viewType;

    // 更新按钮状态
    document.querySelectorAll('.view-btn').forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-view') === viewType) {
            button.classList.add('active');
        }
    });

    // 显示/隐藏容器
    window.containers.booksGrid.style.display = viewType === 'grid' ? 'grid' : 'none';
    window.containers.booksList.style.display = viewType === 'list' ? 'block' : 'none';
    window.containers.booksTable.style.display = viewType === 'table' ? 'block' : 'none';

    // 重新加载数据（如果数据已经加载，可以只切换显示方式）
    loadBooksData();
}

// 分页控制
function changePage(direction) {
    const newPage = window.bookState.currentPage + direction;

    if (newPage < 1 || newPage > window.bookState.totalPages) {
        return;
    }

    window.bookState.currentPage = newPage;
    loadBooksData();

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 重置分页到第一页
function resetPagination() {
    window.bookState.currentPage = 1;
}

// 更新分页UI
function updatePaginationUI() {
    if (!window.pagination.prevBtn || !window.pagination.nextBtn) return;

    // 当前页和总页数
    if (window.pagination.currentPage) {
        window.pagination.currentPage.textContent = window.bookState.currentPage;
    }
    if (window.pagination.totalPages) {
        window.pagination.totalPages.textContent = window.bookState.totalPages;
    }

    // 上一页按钮状态
    window.pagination.prevBtn.disabled = window.bookState.currentPage <= 1;

    // 下一页按钮状态
    window.pagination.nextBtn.disabled = window.bookState.currentPage >= window.bookState.totalPages;
}

// 显示无图书消息
function showNoBooksMessage() {
    const message = document.createElement('div');
    message.className = 'no-books-message';
    message.style.cssText = `
        text-align: center;
        padding: 3rem;
        color: #999;
        font-size: 1.1rem;
    `;
    message.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 1rem;">📚</div>
        <p>没有找到符合条件的图书</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">尝试调整搜索条件或筛选器</p>
    `;

    // 根据当前视图显示在相应容器
    if (window.bookState.currentView === 'grid') {
        window.containers.booksGrid.appendChild(message);
    } else if (window.bookState.currentView === 'list') {
        window.containers.booksList.appendChild(message);
    } else {
        window.containers.booksTableBody.appendChild(message);
    }
}

// 图书操作函数
function borrowBook(bookId) {
    if (!bookId) return;

    const readerId = prompt('请输入读者ID：');
    if (!readerId || !readerId.trim()) {
        showNotification('请输入有效的读者ID', 'error');
        return;
    }

    showNotification('正在处理借阅请求...', 'info');

    fetch('/api/borrow/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reader_id: readerId.trim(), isbn: bookId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.record_id) {
            showNotification('借阅成功', 'success');
            loadBooksData();
            loadBookStats();
        } else {
            showNotification(data.error || '借阅失败', 'error');
        }
    })
    .catch(error => {
        console.error('借阅请求失败:', error);
        showNotification('借阅请求失败，请重试', 'error');
    });
}

function viewBook(isbn) {
    if (!isbn) return;
    openBookDetailModal(isbn);
}

function openBookDetailModal(isbn) {
    const modal = document.getElementById('bookDetailModal');
    const content = document.getElementById('bookDetailContent');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>正在加载...</p>
        </div>
    `;

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
    });

    fetchBookDetail(isbn);
}

function closeBookDetailModal() {
    const modal = document.getElementById('bookDetailModal');
    if (!modal) return;

    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

async function fetchBookDetail(isbn) {
    const content = document.getElementById('bookDetailContent');

    try {
        const response = await fetch(`/api/hbase/books/${isbn}`);
        const book = await response.json();

        if (!response.ok || book.error) {
            throw new Error(book.error || '获取图书详情失败');
        }

        const totalStock = book.total_stock || 0;
        const availableStock = book.available_stock || 0;
        const borrowedStock = totalStock - availableStock;

        let statusClass, statusText;
        if (availableStock > 0) {
            statusClass = 'status-available';
            statusText = '可借阅';
        } else if (borrowedStock > 0) {
            statusClass = 'status-borrowed';
            statusText = '已借出';
        } else {
            statusClass = 'status-unavailable';
            statusText = '无库存';
        }

        const categoryIcons = {
            '计算机': '💻', '文学': '📚', '经济管理': '📈', '历史': '🏛️',
            '哲学': '🤔', '艺术': '🎨', '生活': '🏠', '科技': '🔬'
        };
        const icon = categoryIcons[book.category_name] || '📖';

        content.innerHTML = `
            <div class="book-detail-header">
                <div class="book-cover-large">${icon}</div>
                <div class="book-main-info">
                    <h3>${escapeHtml(book.title)}</h3>
                    <p class="author">${escapeHtml(book.author || '未知作者')}</p>
                    <span class="book-status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>

            <div class="book-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">ISBN编号</div>
                    <div class="detail-value">${escapeHtml(book.isbn)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">出版社</div>
                    <div class="detail-value">${escapeHtml(book.publisher || '未知')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">出版年份</div>
                    <div class="detail-value">${escapeHtml(book.publish_year || '未知')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">分类</div>
                    <div class="detail-value">${escapeHtml(book.category_name || '未分类')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">价格</div>
                    <div class="detail-value">¥${escapeHtml(book.price || '0')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">热门指数</div>
                    <div class="detail-value">${escapeHtml(book.hot_score || '0')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">总库存</div>
                    <div class="detail-value">${totalStock} 册</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">可借数量</div>
                    <div class="detail-value">${availableStock} 册</div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">借阅次数</div>
                    <div class="detail-value">${book.borrow_count || 0} 次</div>
                </div>
            </div>

            ${book.description ? `
            <div class="book-description">
                <h4>内容简介</h4>
                <p>${escapeHtml(book.description)}</p>
            </div>
            ` : ''}

            <div class="book-detail-actions">
                <button class="btn btn-danger" onclick="deleteBook('${escapeHtml(book.isbn)}')">删除</button>
                <button class="btn btn-secondary" onclick="editBook('${escapeHtml(book.isbn)}')">编辑</button>
                <button class="btn btn-primary" onclick="borrowBook('${escapeHtml(book.isbn)}'); closeBookDetailModal();">借阅</button>
            </div>
        `;

    } catch (error) {
        content.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 2rem;">
                <p style="color: #dc3545; margin-bottom: 1rem;">加载失败: ${escapeHtml(error.message)}</p>
                <button class="btn btn-secondary" onclick="closeBookDetailModal()">关闭</button>
            </div>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function editBook(isbn) {
    if (!isbn) return;
    openEditBookModal(isbn);
}

let currentEditIsbn = null;

// 模态框控制
function openNewBookModal() {
    currentEditIsbn = null;
    const modal = document.getElementById('newBookModal');
    const form = document.getElementById('newBookForm');
    const title = document.querySelector('#newBookModal h2');

    if (form) form.reset();
    if (title) title.textContent = '添加新书';

    if (modal) {
        modal.style.display = 'flex';
    }
}

function openEditBookModal(isbn) {
    currentEditIsbn = isbn;
    const modal = document.getElementById('newBookModal');
    const form = document.getElementById('newBookForm');
    const title = document.querySelector('#newBookModal h2');

    if (title) title.textContent = '编辑图书';

    fetchBookDetailForEdit(isbn);

    if (modal) {
        modal.style.display = 'flex';
    }
}

async function fetchBookDetailForEdit(isbn) {
    try {
        const response = await fetch(`/api/hbase/books/${isbn}`);
        const book = await response.json();

        if (book.error) {
            showNotification('获取图书信息失败: ' + book.error, 'error');
            return;
        }

        const form = document.getElementById('newBookForm');
        if (form) {
            form.elements['title'].value = book.title || '';
            form.elements['author'].value = book.author || '';
            form.elements['isbn'].value = book.isbn || '';
            form.elements['isbn'].readOnly = true;
            form.elements['publisher'].value = book.publisher || '';
            form.elements['publish_year'].value = book.publish_year || '';
            form.elements['category_name'].value = book.category_name || '';
            form.elements['description'].value = book.description || '';
            form.elements['total_stock'].value = book.total_stock || 0;
            form.elements['available_stock'].value = book.available_stock || 0;
            form.elements['price'].value = book.price || '';
            form.elements['hot_score'].value = book.hot_score || 0;
        }
    } catch (error) {
        showNotification('获取图书信息失败', 'error');
    }
}

function closeNewBookModal() {
    const modal = document.getElementById('newBookModal');
    const form = document.getElementById('newBookForm');
    const isbnInput = form ? form.elements['isbn'] : null;

    if (isbnInput) isbnInput.readOnly = false;
    if (form) form.reset();
    currentEditIsbn = null;

    if (modal) {
        modal.style.display = 'none';
    }
}

// 提交新书或更新表单
async function submitNewBookForm() {
    const form = document.getElementById('newBookForm');
    if (!form) return;

    const formData = new FormData(form);
    const isEdit = currentEditIsbn !== null;

    const bookData = {
        isbn: formData.get('isbn') || '',
        title: formData.get('title') || '',
        author: formData.get('author') || '',
        publisher: formData.get('publisher') || '',
        publish_year: formData.get('publish_year') || '',
        category_name: formData.get('category_name') || '',
        description: formData.get('description') || '',
        total_stock: parseInt(formData.get('total_stock') || '0'),
        available_stock: parseInt(formData.get('available_stock') || formData.get('total_stock') || '0'),
        price: formData.get('price') || '',
        hot_score: parseFloat(formData.get('hot_score') || '0')
    };

    if (!bookData.isbn || !bookData.title) {
        showNotification('ISBN和标题不能为空', 'error');
        return;
    }

    if (bookData.total_stock < 0 || bookData.available_stock < 0) {
        showNotification('库存数量不能为负数', 'error');
        return;
    }

    if (bookData.available_stock > bookData.total_stock) {
        showNotification('可用库存不能大于总库存', 'error');
        return;
    }

    try {
        showNotification(isEdit ? '正在更新图书...' : '正在添加新书...', 'info');

        let response;
        if (isEdit) {
            response = await fetch(`/api/hbase/books/${currentEditIsbn}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        } else {
            response = await fetch('/api/hbase/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        }

        const result = await response.json();

        if (response.ok) {
            showNotification(isEdit ? '图书更新成功' : '新书添加成功', 'success');
            closeNewBookModal();
            loadBooksData();
            loadBookStats();
        } else {
            showNotification(result.error || (isEdit ? '更新失败' : '添加失败'), 'error');
        }
    } catch (error) {
        showNotification('操作失败: ' + error.message, 'error');
    }
}

// 删除图书
async function deleteBook(isbn) {
    if (!isbn) return;

    const confirmed = confirm(`确定要删除 ISBN 为 "${isbn}" 的图书吗？此操作不可撤销。`);
    if (!confirmed) return;

    try {
        showNotification('正在删除图书...', 'info');

        const response = await fetch(`/api/hbase/books/${isbn}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('图书删除成功', 'success');
            closeBookDetailModal();
            loadBooksData();
            loadBookStats();
        } else {
            showNotification(result.error || '删除失败', 'error');
        }
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    }
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

// 显示加载状态
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>';
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