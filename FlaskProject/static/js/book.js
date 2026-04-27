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
    // 尝试从缓存获取数据
    const cachedStats = getFromCache(CACHE_CONFIG.bookStats.key);
    if (cachedStats) {
        // 使用缓存数据
        if (window.statsCards.totalBooks) {
            window.statsCards.totalBooks.textContent = cachedStats.total_books || 0;
        }
        if (window.statsCards.availableBooks) {
            window.statsCards.availableBooks.textContent = cachedStats.available_stock || 0;
        }
        if (window.statsCards.borrowedBooks) {
            window.statsCards.borrowedBooks.textContent = cachedStats.current_borrowed || 0;
        }
        if (window.statsCards.newBooks) {
            window.statsCards.newBooks.textContent = cachedStats.new_books || 0;
        }
        return;
    }
    
    // 显示加载状态
    showLoading('bookStats');
    
    try {
        const response = await fetch('/api/stats/overview');
        const data = await response.json();

        // 从overview对象中提取数据
        const overview = data.overview || {};

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
            // 这里需要专门的API获取本月新增图书数
            // 暂时使用0或从popular_books推断
            window.statsCards.newBooks.textContent = 0;
        }
        
        // 缓存统计数据
        const statsData = {
            total_books: overview.total_books || 0,
            available_stock: overview.available_stock || 0,
            current_borrowed: overview.current_borrowed || 0,
            new_books: 0
        };
        saveToCache(CACHE_CONFIG.bookStats.key, statsData, CACHE_CONFIG.bookStats.expiry);

    } catch (error) {
        console.error('加载图书统计数据失败:', error);
        showNotification('统计信息加载失败', 'error');
    }
    finally {
        // 隐藏加载状态
        // 注意：不需要调用hideLoading，因为数据加载后会直接更新内容
    }
}

// 加载图书数据
async function loadBooksData() {
    if (window.bookState.isLoading) return;

    // 生成缓存键
    const cacheKey = `${CACHE_CONFIG.books.key}_${window.bookState.currentPage}_${window.bookState.searchQuery}_${window.bookState.categoryFilter}_${window.bookState.statusFilter}`;
    
    // 尝试从缓存获取数据
    const cachedBooks = getFromCache(cacheKey);
    if (cachedBooks) {
        // 使用缓存数据
        window.bookState.totalPages = cachedBooks.pages || 1;
        window.bookState.totalBooks = cachedBooks.total || 0;
        updatePaginationUI();
        updateBooksDisplay(cachedBooks.books || []);
        return;
    }

    // 显示加载状态
    showLoading('booksGrid');
    
    try {
        window.bookState.isLoading = true;

        // 构建查询参数，匹配后端API
        const params = new URLSearchParams();
        params.append('page', window.bookState.currentPage);
        params.append('per_page', 12); // 每页显示12本书

        if (window.bookState.searchQuery) {
            params.append('search', window.bookState.searchQuery);
        }
        if (window.bookState.categoryFilter) {
            params.append('category', window.bookState.categoryFilter);
        }
        // 将状态筛选转换为available_only参数
        if (window.bookState.statusFilter === 'available') {
            params.append('available_only', 'true');
        }
        // 注意：后端API不支持'borrowed'和'reserved'状态筛选
        // 这些需要更复杂的查询，暂时不实现

        const response = await fetch(`/api/book/?${params}`);
        const data = await response.json();

        // 更新分页信息，匹配后端响应字段名
        window.bookState.totalPages = data.pages || 1;
        window.bookState.totalBooks = data.total || 0;

        // 更新分页UI
        updatePaginationUI();

        // 根据当前视图更新图书展示
        updateBooksDisplay(data.books || []);
        
        // 缓存数据
        saveToCache(cacheKey, data, CACHE_CONFIG.books.expiry);

    } catch (error) {
        console.error('加载图书数据失败:', error);
        showNotification('图书数据加载失败，请检查网络连接', 'error');

        // 显示模拟数据作为后备
        showMockBooks();

    } finally {
        window.bookState.isLoading = false;
        // 注意：不需要调用hideLoading，因为数据加载后会直接更新内容
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

// 显示模拟图书数据（API失败时的后备方案）
function showMockBooks() {
    const mockBooks = [
        {
            isbn: '9787115428028',
            title: 'Python编程从入门到实践',
            author: 'Eric Matthes',
            category_name: '计算机',
            category: '计算机',
            total_stock: 8,
            available_stock: 5,
            is_available: true
        },
        {
            isbn: '9787115324443',
            title: 'JavaScript高级程序设计',
            author: 'Nicholas C. Zakas',
            category_name: '计算机',
            category: '计算机',
            total_stock: 6,
            available_stock: 0,
            is_available: false
        },
        {
            isbn: '9787301262431',
            title: '经济学原理',
            author: 'N. Gregory Mankiw',
            category_name: '经济管理',
            category: '经济管理',
            total_stock: 10,
            available_stock: 3,
            is_available: true
        },
        {
            isbn: '9787544253994',
            title: '百年孤独',
            author: 'Gabriel García Márquez',
            category_name: '文学',
            category: '文学',
            total_stock: 5,
            available_stock: 2,
            is_available: true
        }
    ];

    updateBooksDisplay(mockBooks);
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

function viewBook(bookId) {
    if (!bookId) return;

    showNotification(`正在查看图书详情: ${bookId}`, 'info');

    // 这里应该跳转到图书详情页面或显示详情模态框
    // window.location.href = `/book/${bookId}`;
}

function editBook(bookId) {
    if (!bookId) return;

    showNotification(`正在编辑图书信息: ${bookId}`, 'info');

    // 这里应该跳转到编辑页面或显示编辑模态框
    // window.location.href = `/book/${bookId}/edit`;
}

// 模态框控制
function openNewBookModal() {
    const modal = document.getElementById('newBookModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeNewBookModal() {
    const modal = document.getElementById('newBookModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 提交新书表单
async function submitNewBookForm() {
    const form = document.getElementById('newBookForm');
    if (!form) return;

    const formData = new FormData(form);
    const bookData = {
        title: formData.get('title') || '',
        author: formData.get('author') || '',
        isbn: formData.get('isbn') || '',
        category: formData.get('category') || '',
        stock: parseInt(formData.get('stock') || '1')
    };

    // 简单验证
    if (!bookData.title || !bookData.author || !bookData.isbn) {
        showNotification('请填写必填字段: 标题、作者、ISBN', 'error');
        return;
    }

    if (bookData.stock < 1) {
        showNotification('库存数量必须大于0', 'error');
        return;
    }

    try {
        showNotification('正在添加新书...', 'info');

        const bookPayload = {
            isbn: bookData.isbn,
            title: bookData.title,
            author: bookData.author,
            publisher: bookData.publisher || '',
            category_name: bookData.category || '未分类',
            total_stock: bookData.stock,
            price: bookData.price || 0,
            description: bookData.description || ''
        };

        const response = await fetch('/api/book/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookPayload)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('新书添加成功', 'success');
            closeNewBookModal();
            form.reset();
            loadBooksData();
            loadBookStats();
        } else {
            showNotification(result.error || '添加新书失败', 'error');
        }

    } catch (error) {
        console.error('添加新书失败:', error);
        showNotification('添加新书失败，请重试', 'error');
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