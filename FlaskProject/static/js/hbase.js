// HBase图书数据处理 - 优化版
const HBASE_CONFIG = {
    pageSize: 20,
    statsCacheTime: 30000
};

let hbaseStats = null;
let hbaseStatsLoadTime = 0;

async function loadHBaseBooks(page = 1, pageSize = HBASE_CONFIG.pageSize) {
    const offset = (page - 1) * pageSize;
    const booksTable = document.getElementById('hbase-books-table');
    const booksList = document.getElementById('hbase-books-list');
    const loadingElement = document.getElementById('hbase-books-loading');
    const errorElement = document.getElementById('hbase-books-error');
    const statsElement = document.getElementById('hbase-books-stats');

    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';

    try {
        const response = await fetch(`/api/hbase/books?limit=${pageSize}&offset=${offset}`);
        if (!response.ok) throw new Error('获取HBase图书数据失败');

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        renderHBaseBooks(data.books);

        if (statsElement) {
            if (hbaseStats) {
                statsElement.textContent = `第 ${page} 页 | 共 ${hbaseStats.total_books} 本图书`;
            } else {
                statsElement.textContent = `共 ${data.books.length} 本图书`;
            }
        }

        updatePaginationUI(page, hbaseStats ? hbaseStats.total_books : data.books.length, pageSize);

    } catch (error) {
        console.error('加载HBase图书失败:', error);
        if (errorElement) {
            errorElement.textContent = `加载失败: ${error.message}`;
            errorElement.style.display = 'block';
        }

        if (booksTable) {
            const tbody = booksTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">${error.message}</td></tr>`;
            }
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

function renderHBaseBooks(books) {
    const booksTable = document.getElementById('hbase-books-table');
    const booksList = document.getElementById('hbase-books-list');

    if (booksTable) {
        const tbody = booksTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';

            if (!books || books.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center; padding: 20px;">暂无图书数据</td>';
                tbody.appendChild(row);
            } else {
                books.forEach((book, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${book.isbn || book['info:isbn'] || 'N/A'}</td>
                        <td>${book.title || book['info:title'] || 'N/A'}</td>
                        <td>${book.author || book['info:author'] || 'N/A'}</td>
                        <td>${book.category_name || book['info:category_name'] || 'N/A'}</td>
                        <td>${book.total_stock || book['stock:total_stock'] || '0'}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }
    }

    if (booksList) {
        booksList.innerHTML = '';

        if (!books || books.length === 0) {
            booksList.innerHTML = '<div class="empty-message">暂无图书数据</div>';
        } else {
            books.forEach(book => {
                const bookItem = document.createElement('div');
                bookItem.className = 'book-item';
                bookItem.innerHTML = `
                    <h4>${book.title || book['info:title'] || 'N/A'}</h4>
                    <p class="author">作者: ${book.author || book['info:author'] || 'N/A'}</p>
                    <p class="isbn">ISBN: ${book.isbn || book['info:isbn'] || 'N/A'}</p>
                    <p class="category">分类: ${book.category_name || book['info:category_name'] || 'N/A'}</p>
                    <p class="stock">库存: ${book.total_stock || book['stock:total_stock'] || '0'}</p>
                `;
                booksList.appendChild(bookItem);
            });
        }
    }
}

function updatePaginationUI(currentPage, totalItems, pageSize) {
    let paginationContainer = document.getElementById('hbase-pagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'hbase-pagination';
        paginationContainer.className = 'pagination-container';
        const booksSection = document.querySelector('.section');
        if (booksSection) {
            booksSection.appendChild(paginationContainer);
        }
    }

    const totalPages = Math.ceil(totalItems / pageSize);
    let html = '';

    if (currentPage > 1) {
        html += `<button onclick="loadHBaseBooks(${currentPage - 1})">上一页</button>`;
    }

    html += `<span class="page-info">第 ${currentPage} / ${totalPages} 页</span>`;

    if (currentPage < totalPages) {
        html += `<button onclick="loadHBaseBooks(${currentPage + 1})">下一页</button>`;
    }

    paginationContainer.innerHTML = html;
}

async function loadHBaseStats(forceRefresh = false) {
    const loadingElement = document.getElementById('hbase-stats-loading');
    const errorElement = document.getElementById('hbase-stats-error');

    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';

    const now = Date.now();
    if (!forceRefresh && hbaseStats && (now - hbaseStatsLoadTime) < HBASE_CONFIG.statsCacheTime) {
        if (loadingElement) loadingElement.style.display = 'none';
        renderHBaseStats(hbaseStats);
        return;
    }

    try {
        const response = await fetch('/api/hbase/books/stats');
        if (!response.ok) throw new Error('获取HBase图书统计失败');

        const stats = await response.json();

        if (stats.error) throw new Error(stats.error);

        hbaseStats = stats;
        hbaseStatsLoadTime = now;

        renderHBaseStats(stats);

        const statsElement = document.getElementById('hbase-books-stats');
        if (statsElement) {
            statsElement.textContent = `共 ${stats.total_books} 本图书`;
        }

    } catch (error) {
        console.error('加载HBase统计失败:', error);
        if (errorElement) {
            errorElement.textContent = `加载失败: ${error.message}`;
            errorElement.style.display = 'block';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

function renderHBaseStats(stats) {
    const statsContainer = document.getElementById('hbase-stats-container');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stats-card">
                <h3>图书总数</h3>
                <p class="stats-value">${stats.total_books || 0}</p>
            </div>
            <div class="stats-card">
                <h3>分类数量</h3>
                <p class="stats-value">${stats.category_count || 0}</p>
            </div>
        `;

        if (stats.categories) {
            const categoriesContainer = document.createElement('div');
            categoriesContainer.className = 'categories-container';
            categoriesContainer.innerHTML = '<h4>分类分布</h4>';

            const categoriesList = document.createElement('ul');
            categoriesList.className = 'categories-list';

            Object.entries(stats.categories).forEach(([category, count]) => {
                const li = document.createElement('li');
                li.textContent = `${category}: ${count}`;
                li.style.cursor = 'pointer';
                li.onclick = () => filterByCategory(category);
                categoriesList.appendChild(li);
            });

            categoriesContainer.appendChild(categoriesList);
            statsContainer.appendChild(categoriesContainer);
        }
    }
}

async function filterByCategory(category) {
    const loadingElement = document.getElementById('hbase-books-loading');
    const errorElement = document.getElementById('hbase-books-error');
    const booksTable = document.getElementById('hbase-books-table');
    const statsElement = document.getElementById('hbase-books-stats');

    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';

    try {
        const response = await fetch(`/api/hbase/books/category/${encodeURIComponent(category)}?limit=50`);
        if (!response.ok) throw new Error('获取分类图书失败');

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        renderHBaseBooks(data.books);

        if (statsElement) {
            statsElement.textContent = `分类: ${category} | 共 ${data.books.length} 本`;
        }

    } catch (error) {
        console.error('按分类获取图书失败:', error);
        if (errorElement) {
            errorElement.textContent = `加载失败: ${error.message}`;
            errorElement.style.display = 'block';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

function refreshHBaseData() {
    loadHBaseBooks(1);
    loadHBaseStats(true);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        loadHBaseBooks(1);
        loadHBaseStats();
    });
} else {
    loadHBaseBooks(1);
    loadHBaseStats();
}