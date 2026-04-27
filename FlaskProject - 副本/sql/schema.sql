-- 图书馆管理系统数据库 schema
-- 基于 PRD.md 第7节：数据模型设计

-- 读者表（含信用体系）
CREATE TABLE reader (
    reader_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    credit_score INT DEFAULT 100,
    borrow_quota INT DEFAULT 5,
    overdue_count INT DEFAULT 0,
    total_borrow_count INT DEFAULT 0,
    last_active DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_credit (credit_score),
    INDEX idx_active (last_active)
);

-- 图书元数据表
CREATE TABLE book (
    isbn VARCHAR(20) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    publisher VARCHAR(100),
    publish_year INT,
    category_path VARCHAR(100),
    category_name VARCHAR(50),
    total_stock INT DEFAULT 0,
    available_stock INT DEFAULT 0,
    price DECIMAL(10,2),
    hot_score DECIMAL(5,2) DEFAULT 0.0,
    borrow_count INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_path),
    INDEX idx_hot (hot_score DESC),
    INDEX idx_title (title)
);

-- 借阅记录表
CREATE TABLE borrow_record (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reader_id VARCHAR(20) NOT NULL,
    isbn VARCHAR(20) NOT NULL,
    borrow_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date DATETIME NULL,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    renew_count INT DEFAULT 0,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    INDEX idx_reader (reader_id),
    INDEX idx_isbn (isbn),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status),
    FOREIGN KEY (reader_id) REFERENCES reader(reader_id) ON DELETE CASCADE,
    FOREIGN KEY (isbn) REFERENCES book(isbn) ON DELETE CASCADE
);

-- 图书预约表
CREATE TABLE reservation (
    reservation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reader_id VARCHAR(20) NOT NULL,
    isbn VARCHAR(20) NOT NULL,
    reserve_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'ready', 'cancelled', 'expired') DEFAULT 'pending',
    expiry_date DATETIME NOT NULL,
    INDEX idx_reader_isbn (reader_id, isbn),
    INDEX idx_status (status),
    INDEX idx_expiry (expiry_date),
    FOREIGN KEY (reader_id) REFERENCES reader(reader_id) ON DELETE CASCADE,
    FOREIGN KEY (isbn) REFERENCES book(isbn) ON DELETE CASCADE
);

-- 罚款记录表
CREATE TABLE fine (
    fine_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reader_id VARCHAR(20) NOT NULL,
    record_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    fine_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('unpaid', 'paid', 'waived') DEFAULT 'unpaid',
    payment_date DATETIME NULL,
    reason VARCHAR(200),
    INDEX idx_reader (reader_id),
    INDEX idx_status (status),
    FOREIGN KEY (reader_id) REFERENCES reader(reader_id) ON DELETE CASCADE,
    FOREIGN KEY (record_id) REFERENCES borrow_record(record_id) ON DELETE CASCADE
);

-- 系统操作日志表
CREATE TABLE system_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type ENUM('book', 'reader', 'borrow', 'reservation', 'fine') NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    action_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    INDEX idx_user (user_id),
    INDEX idx_action_time (action_time),
    INDEX idx_action_type (action_type)
);

-- 创建视图：读者借阅统计视图
CREATE VIEW reader_borrow_stats AS
SELECT
    r.reader_id,
    r.name,
    r.credit_score,
    r.borrow_quota,
    COUNT(br.record_id) AS total_borrowed,
    SUM(CASE WHEN br.status = 'borrowed' THEN 1 ELSE 0 END) AS current_borrowed,
    SUM(CASE WHEN br.status = 'overdue' THEN 1 ELSE 0 END) AS overdue_books,
    MAX(br.borrow_date) AS last_borrow_date
FROM reader r
LEFT JOIN borrow_record br ON r.reader_id = br.reader_id
GROUP BY r.reader_id, r.name, r.credit_score, r.borrow_quota;

-- 创建视图：图书借阅热度视图
CREATE VIEW book_popularity AS
SELECT
    b.isbn,
    b.title,
    b.author,
    b.category_name,
    b.total_stock,
    b.available_stock,
    b.borrow_count,
    b.hot_score,
    COUNT(br.record_id) AS recent_borrows,
    AVG(CASE WHEN br.return_date IS NOT NULL THEN DATEDIFF(br.return_date, br.borrow_date) ELSE NULL END) AS avg_borrow_days
FROM book b
LEFT JOIN borrow_record br ON b.isbn = br.isbn
    AND br.borrow_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY b.isbn, b.title, b.author, b.category_name, b.total_stock, b.available_stock, b.borrow_count, b.hot_score;