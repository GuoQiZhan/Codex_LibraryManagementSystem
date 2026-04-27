# 📚 图书馆管理系统需求规格说明书

## （基于Flask + HTML/CSS/JS + Hadoop生态架构）

---

## 📋 文档目录

- [一、修订历史](#一修订历史)
- [二、技术栈可行性说明](#二技术栈可行性说明)
- [三、项目概述](#三项目概述)
  - [3.1 项目背景](#31-项目背景)
  - [3.2 核心目标](#32-核心目标)
  - [3.3 系统边界](#33-系统边界)
- [四、系统架构设计](#四系统架构设计)
  - [4.1 整体技术架构](#41-整体技术架构)
  - [4.2 数据流转设计](#42-数据流转设计)
- [五、功能需求详解](#五功能需求详解)
  - [5.1 核心业务模块](#51-核心业务模块)
- [六、可视化需求专项](#六可视化需求专项)
  - [6.1 前端技术实现方案](#61-前端技术实现方案)
  - [6.2 核心可视化场景实现示例](#62-核心可视化场景实现示例)
- [七、数据模型设计](#七数据模型设计)
  - [7.1 关键表结构（MySQL）](#71-关键表结构mysql)
  - [7.2 HBase RowKey设计（借阅记录）](#72-hbase-rowkey设计借阅记录)
  - [7.3 Redis缓存策略](#73-redis缓存策略)
  - [7.4 扩展数据模型](#74-扩展数据模型)
- [八、非功能需求](#八非功能需求)
  - [8.1 性能需求](#81-性能需求)
  - [8.2 可用性需求](#82-可用性需求)
  - [8.3 安全性需求](#83-安全性需求)
  - [8.4 可扩展性需求](#84-可扩展性需求)
  - [8.5 兼容性需求](#85-兼容性需求)
- [九、安全设计](#九安全设计)
  - [9.1 身份认证与授权](#91-身份认证与授权)
  - [9.2 数据安全](#92-数据安全)
  - [9.3 应用安全](#93-应用安全)
  - [9.4 网络安全](#94-网络安全)
- [十、后端实现指南（Flask）](#十后端实现指南flask)
  - [10.1 项目结构](#101-项目结构)
  - [10.2 Flask部署配置](#102-flask部署配置)
- [十一、数据生成与模拟](#十一数据生成与模拟)
  - [11.1 模拟数据生成方案](#111-模拟数据生成方案)
  - [11.2 Excel数据导出格式](#112-excel数据导出格式)
  - [11.3 数据质量保证](#113-数据质量保证)
  - [11.4 推荐系统训练数据](#114-推荐系统训练数据)
- [十三、附录](#十三附录)
  - [13.1 Python依赖清单](#131-python依赖清单)
  - [13.2 前端HTML骨架示例](#132-前端html骨架示例)

---

## 一、修订历史

| 版本 | 日期       | 作者       | 修订说明                                           |
| ---- | ---------- | ---------- | -------------------------------------------------- |
| v1.0 | 2026-04-21 | 系统分析员 | 初始版本创建，包含基础架构和功能需求               |
| v1.1 | 2026-04-21 | 系统分析员 | 增加目录、修订历史、非功能需求、安全设计、部署方案 |
| v1.2 | 2026-04-21 | 系统分析员 | 增加推荐系统模块描述和模拟数据生成方案             |

---

> **技术栈**：Hadoop/HBase/MapReduce + Flask + HTML/CSS/JS + ECharts + HBase
> **操作系统**：Ubuntu 16.04。
> **Hadoop版本**：3.3.5。
> **MySQL版本**：5.7。
> **HBase版本**：2.5.4。
> **Redis版本**：6.0.6。
> **MongoDB版本**：4.4.22（可选，用于日志分析）。

---

## ✅ 技术栈可行性说明

本项目采用**混合技术栈**设计，兼顾业务系统稳定性与大数据学习实践：

### 🎯 核心业务系统（生产就绪）

- 🐍 **Flask** 轻量灵活，Python生态成熟，快速开发RESTful API
- 🗄️ **MySQL 8.0+** 稳定可靠，支持事务处理与复杂查询
- ⚡ **Redis 7.0+** 高性能缓存，提升热点数据访问速度
- 🌐 **原生HTML5/CSS3/JS** 无构建依赖，ECharts原生支持，适合快速迭代

### 📊 大数据学习组件（教学实践）

- 🐘 **Hadoop/HBase** 用于存储海量借阅记录与行为日志，学习分布式存储
- 🔄 **MapReduce** 用于离线数据分析任务，理解批处理计算模型
- 📈 **MongoDB（可选）** 存储非结构化日志数据，学习文档数据库

### ⚖️ 学习曲线平衡策略

1. **阶段化实施**：优先完成MySQL+Flask+前端核心业务，再集成大数据组件
2. **职责分工**：4人团队可分配为：前端1人、Flask业务1人、MySQL/Redis 1人、大数据组件1人
3. **简化集成**：大数据组件仅用于数据分析展示，业务系统保持轻量

> **教学建议**：对于时间有限的实训项目，可考虑**简化架构**（移除HBase/Hadoop，用MySQL+Python脚本替代MapReduce），聚焦核心业务实现。

---

## 三、项目概述

### 1.1 项目背景

传统图书馆管理系统面临**数据孤岛、分析能力弱、响应速度慢**等痛点。本项目基于Hadoop大数据平台，构建集"业务管理+智能分析+可视化决策"于一体的现代化图书馆管理系统，实现从"记录型"向"智慧型"的转型。

### 1.2 核心目标

- ✅ 支撑10万+图书、5万+读者的并发管理
- ✅ 借阅记录查询响应时间 < 500ms（Redis缓存热点数据）
- ✅ 离线分析任务（MapReduce/Python脚本）每日凌晨自动执行
- ✅ 可视化大屏实时刷新（5秒级延迟）
- ✅ 支持多维度数据筛选与下钻分析

### 1.3 系统边界

| 模块       | 包含内容                                     | 不包含内容       |
| ---------- | -------------------------------------------- | ---------------- |
| 读者服务   | 注册登录、图书检索、借阅/归还/续借、个人中心 | 图书采购审批流程 |
| 图书管理   | 图书入库、信息维护、分类管理、库存盘点       | 图书编目规则制定 |
| 数据分析   | 借阅行为分析、推荐算法、逾期预测、运营报表   | 第三方数据接入   |
| 可视化中心 | 运营大屏、管理看板、移动端图表               | 3D虚拟图书馆展示 |

---

## 四、系统架构设计

### 2.1 整体技术架构

┌─────────────────────────────────────────┐
│ 前端展示层 │
│ 原生HTML5 + CSS3 + Vanilla JS + ECharts│
│ • 模块化JS (ES6) • Fetch API • DOM操作 │
└────────────────┬────────────────────────┘
│ RESTful API (JSON)
┌────────────────▼────────────────────────┐
│ 应用服务层 │
│ Flask + Gunicorn + Flask-CORS │
│ • 路由分发 • 业务逻辑 • 数据库代理 │
│ • MapReduce任务调度 • 缓存管理 │
└────────────────┬────────────────────────┘
│ 数据读写
┌────────────────▼────────────────────────┐
│ 混合数据存储层 │
├─────────────┬─────────────┬─────────────┤
│ MySQL │ HBase │ Redis │
│ • 读者信息 │ • 借阅记录 │ • 热门图书 │
│ • 图书元数据│ • 盘点日志 │ • 会话缓存 │
│ • 权限配置 │ • 行为日志 │ • 推荐结果 │
└─────────────┴─────────────┴─────────────┘
│ 离线计算
┌────────────────▼────────────────────────┐
│ 大数据计算层 │
│ HDFS + MapReduce(mrjob) + Python脚本 │
│ • 借阅行为分析 • 推荐模型训练 │
│ • 逾期风险预测 • 运营指标聚合 │
└─────────────────────────────────────────┘

### 2.2 数据流转设计

用户操作 → Fetch请求 → Flask路由 → 业务逻辑
↓
MySQL/HBase查询 ←→ Redis缓存
↓
触发MapReduce任务 (subprocess/mrjob)
↓
结果写入HDFS/MySQL → Flask返回JSON → 前端ECharts渲染

---

## 五、功能需求详解

### 3.1 核心业务模块

#### 🔹 读者管理模块

| 功能点   | 详细描述                                | 数据源          | Flask路由示例                 |
| -------- | --------------------------------------- | --------------- | ----------------------------- |
| 读者注册 | 学号/工号验证、实名认证、信用等级初始化 | MySQL           | `POST /api/reader/register`   |
| 借阅权限 | 根据信用等级动态计算可借数量、续借次数  | MySQL+Redis     | `GET /api/reader/<id>/quota`  |
| 逾期管理 | 自动计算逾期天数、罚款金额、信用扣分    | HBase+MapReduce | `POST /api/overdue/calculate` |
| 信用体系 | 逾期次数→信用分→借阅权限的联动规则引擎  | MySQL           | `PUT /api/reader/<id>/credit` |

#### 🔹 图书管理模块

| 功能点   | 详细描述                               | 数据源      | Flask路由示例               |
| -------- | -------------------------------------- | ----------- | --------------------------- |
| 图书入库 | ISBN自动校验、分类标签生成、库存初始化 | MySQL       | `POST /api/book/import`     |
| 智能盘点 | 扫码录入→HBase库存比对→差异报告生成    | HBase+MySQL | `POST /api/inventory/scan`  |
| 状态追踪 | 在馆/借出/预约/维修/丢失五态流转       | HBase       | `PUT /api/book/<id>/status` |
| 分类管理 | 中图法分类树维护、热门标签关联         | MySQL       | `GET /api/category/tree`    |

#### 🔹 借阅服务模块

| 功能点   | 详细描述                                | 数据源      | Flask路由示例                |
| -------- | --------------------------------------- | ----------- | ---------------------------- |
| 图书检索 | 多字段模糊查询+分类筛选+热度排序        | MySQL+Redis | `GET /api/book/search?q=xxx` |
| 借阅操作 | 库存校验→借阅记录生成→库存扣减（事务）  | HBase+MySQL | `POST /api/borrow/apply`     |
| 归还处理 | 逾期判断→罚款计算→库存恢复→信用更新     | HBase+MySQL | `POST /api/return/submit`    |
| 续借服务 | 规则校验（次数/时间/预约冲突）→延期更新 | MySQL       | `PUT /api/borrow/<id>/renew` |

#### 🔹 推荐系统模块

| 功能点       | 详细描述                                       | 数据源        | Flask路由示例                                   |
| ------------ | ---------------------------------------------- | ------------- | ----------------------------------------------- |
| 个性化推荐   | 基于用户借阅历史，使用协同过滤算法推荐相似图书 | MySQL + Redis | `GET /api/recommendations/<reader_id>`          |
| 热门推荐     | 基于图书热度分数推荐近期热门图书               | Redis + MySQL | `GET /api/recommendations/hot`                  |
| 类别推荐     | 根据用户偏好的图书类别推荐同类图书             | MySQL         | `GET /api/recommendations/category/<reader_id>` |
| 相似图书推荐 | 基于图书相似度矩阵推荐内容相似的图书           | MySQL + Redis | `GET /api/books/<isbn>/similar`                 |
| 推荐缓存管理 | 缓存推荐结果，减少实时计算压力                 | Redis         | `POST /api/recommendations/cache/refresh`       |

**推荐算法设计**：

1. **协同过滤（基于用户）**：计算用户之间的相似度，推荐相似用户喜欢的图书
2. **基于内容的推荐**：根据图书的类别、作者、标签等特征进行推荐
3. **混合推荐**：结合协同过滤和基于内容的方法，提高推荐准确性
4. **实时更新**：借阅行为实时更新用户画像和推荐结果

**数据流程**：

1. 收集用户借阅历史数据
2. 构建用户-图书评分矩阵
3. 计算相似度（余弦相似度/皮尔逊相关系数）
4. 生成Top-N推荐列表
5. 缓存推荐结果到Redis（24小时有效期）

**技术实现**：

- 使用scikit-learn进行相似度计算
- Redis存储用户相似度矩阵和推荐结果缓存
- 每日凌晨使用MapReduce任务更新全局推荐模型
- 实时API返回个性化推荐结果

---

## 六、✨ 可视化需求专项（重点增强）

### 6.1 前端技术实现方案（原生JS）

public/
├── index.html // 主页面骨架
├── css/
│ ├── base.css // 重置+全局变量
│ ├── layout.css // 网格/响应式布局
│ └── dashboard.css // 大屏专用样式
├── js/
│ ├── api.js // Fetch封装 & 请求拦截
│ ├── charts.js // ECharts实例管理
│ ├── utils.js // 日期格式化/防抖/节流
│ └── main.js // 页面初始化 & 事件绑定
└── lib/
└── echarts.min.js // ECharts核心库

### 6.2 核心可视化场景实现示例

#### 🎯 场景1：借阅趋势图（原生JS + ECharts）

```javascript
// js/charts.js
export function initBorrowTrend(containerId, apiEndpoint) {
  const chart = echarts.init(document.getElementById(containerId));

  // 1. 获取数据
  fetch(apiEndpoint)
    .then((res) => res.json())
    .then((data) => {
      const option = {
        title: { text: "图书借阅趋势分析", left: "center" },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: data.dates },
        yAxis: { type: "value" },
        series: [
          {
            name: "借阅量",
            type: "line",
            smooth: true,
            data: data.borrow_counts,
            areaStyle: { opacity: 0.2 },
          },
        ],
      };
      chart.setOption(option);
    })
    .catch((err) => console.error("图表加载失败:", err));

  // 2. 响应式适配
  window.addEventListener("resize", () => chart.resize());
  return chart;
}
```

#### 🎯 场景2：全局筛选联动（DOM事件 + 状态管理）

```javascript
// js/main.js
import { fetchData, updateAllCharts } from "./api.js";

document.getElementById("date-filter").addEventListener("change", (e) => {
  const period = e.target.value; // 'day' | 'week' | 'month'
  // 更新所有图表数据
  fetchData(`/api/stats/overview?period=${period}`).then((data) => {
    updateAllCharts(data);
  });
});

// 防抖优化：避免频繁请求
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

## 七、数据模型设计

### 7.1 关键表结构（MySQL）

-- 读者表（含信用体系）
CREATE TABLE reader (
reader_id VARCHAR(20) PRIMARY KEY,
name VARCHAR(50) NOT NULL,
credit_score INT DEFAULT 100,
borrow_quota INT DEFAULT 5,
overdue_count INT DEFAULT 0,
last_active DATETIME,
INDEX idx_credit (credit_score),
INDEX idx_active (last_active)
);

-- 图书元数据表
CREATE TABLE book (
isbn VARCHAR(20) PRIMARY KEY,
title VARCHAR(200) NOT NULL,
author VARCHAR(100),
category_path VARCHAR(100),
total_stock INT DEFAULT 0,
available_stock INT DEFAULT 0,
hot_score DECIMAL(5,2),
INDEX idx_category (category_path),
INDEX idx_hot (hot_score DESC)
);

### 7.2 HBase RowKey设计（借阅记录）

格式：{reader*id}*{borrow*date}*{book*isbn}*{sequence}
✅ 按读者查询：scan 'borrow*records', {STARTROW=>'R2023001*', STOPROW=>'R2023002\_'}
✅ 避免热点：sequence字段分散写入压力
✅ Python访问：使用 happybase.Connection('localhost').table('borrow_records')

### 7.3 Redis缓存策略

cache:
hot_books:
key: "cache:hot:books:{category}"
ttl: 3600
reader_session:
key: "session:reader:{reader_id}"
ttl: 1800
recommend_result:
key: "rec:reader:{reader_id}:{date}"
ttl: 86400

### 7.4 扩展数据模型

#### 7.4.1 借阅记录表（borrow_record）

```sql
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
```

#### 7.4.2 预约记录表（reservation）

```sql
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
```

#### 7.4.3 罚款记录表（fine）

```sql
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
```

#### 7.4.4 系统日志表（system_log）

```sql
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
```

## 八、非功能需求

### 8.1 性能需求

| 指标         | 要求             | 测量方法                | 备注               |
| ------------ | ---------------- | ----------------------- | ------------------ |
| **响应时间** | 关键操作 < 500ms | Apache JMeter压力测试   | 图书检索、借阅操作 |
|              | 查询操作 < 2s    | 监控SQL执行时间         | 复杂报表查询       |
|              | 页面加载 < 3s    | Chrome DevTools Network | 首屏完整渲染       |
| **吞吐量**   | 并发用户数 ≥ 100 | 并发测试工具            | 同时在线用户       |
|              | QPS ≥ 50         | 接口压测                | 核心API每秒请求数  |
| **数据容量** | 读者数据 ≥ 5万   | MySQL表空间监控         | 持续增长管理       |
|              | 图书数据 ≥ 10万  | HBase Region监控        | 分布式存储扩展     |
|              | 借阅记录 ≥ 100万 | HBase表分区策略         | 历史数据归档机制   |

### 8.2 可用性需求

| 维度           | 要求                        | 实现策略            |
| -------------- | --------------------------- | ------------------- |
| **服务可用性** | 99.5% (年停机 ≤ 43.8小时)   | 负载均衡 + 故障转移 |
| **数据可用性** | 99.9% (数据丢失风险 < 0.1%) | 每日备份 + 异地备份 |
| **故障恢复**   | RTO ≤ 30分钟                | 自动化部署脚本      |
|                | RPO ≤ 1小时                 | 增量备份机制        |
| **维护窗口**   | 每月一次，≤ 4小时           | 凌晨2:00-6:00       |

### 8.3 安全性需求

| 安全领域     | 要求              | 技术实现          |
| ------------ | ----------------- | ----------------- |
| **身份认证** | 密码复杂度策略    | bcrypt哈希 + 盐值 |
|              | 会话超时 ≤ 30分钟 | JWT令牌过期机制   |
| **访问控制** | 最小权限原则      | RBAC角色模型      |
|              | API权限校验       | Flask装饰器拦截   |
| **数据保护** | 敏感信息加密      | AES-256加密存储   |
|              | SQL注入防护       | 参数化查询 + ORM  |
| **审计追溯** | 关键操作日志      | 操作日志表 + ELK  |
|              | 数据变更记录      | 触发器 + 审计表   |

### 8.4 可扩展性需求

| 扩展维度     | 要求               | 架构设计            |
| ------------ | ------------------ | ------------------- |
| **水平扩展** | 支持Web服务器集群  | Nginx负载均衡       |
|              | 支持数据库读写分离 | MySQL主从复制       |
| **垂直扩展** | 支持硬件升级       | 模块化部署          |
| **功能扩展** | 插件式功能添加     | Flask蓝本机制       |
| **数据扩展** | 支持新数据类型     | JSON字段 + 文档存储 |

### 8.5 兼容性需求

| 兼容对象     | 要求                      | 测试策略       |
| ------------ | ------------------------- | -------------- |
| **浏览器**   | Chrome ≥ 80, Firefox ≥ 75 | 跨浏览器测试   |
|              | Edge ≥ 85, Safari ≥ 13    | 响应式布局测试 |
| **操作系统** | Windows 10+, macOS 10.15+ | 功能测试       |
|              | Ubuntu 20.04+（服务端）   | 部署测试       |
| **移动设备** | 主流手机浏览器            | 移动端适配测试 |
| **API兼容**  | 向后兼容 ≥ 2个版本        | API版本控制    |

## 九、安全设计

### 9.1 身份认证与授权

#### 9.1.1 认证机制

```python
# Flask JWT认证示例
import jwt
import bcrypt
from datetime import datetime, timedelta

class AuthService:
    SECRET_KEY = 'your-secret-key-change-in-production'
    ALGORITHM = 'HS256'
    EXPIRY_HOURS = 24

    @staticmethod
    def hash_password(password: str) -> str:
        """使用bcrypt哈希密码"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """验证密码"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    @staticmethod
    def create_token(user_id: str, role: str) -> str:
        """创建JWT令牌"""
        payload = {
            'user_id': user_id,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=AuthService.EXPIRY_HOURS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, AuthService.SECRET_KEY, algorithm=AuthService.ALGORITHM)
```

#### 9.1.2 授权模型（RBAC）

```python
# 角色权限装饰器
from functools import wraps
from flask import request, jsonify

def require_role(required_role):
    """角色权限检查装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            try:
                payload = jwt.decode(token, AuthService.SECRET_KEY, algorithms=[AuthService.ALGORITHM])
                user_role = payload.get('role')

                # 角色权限映射
                role_hierarchy = {
                    'admin': ['admin', 'librarian', 'reader'],
                    'librarian': ['librarian', 'reader'],
                    'reader': ['reader']
                }

                if user_role not in role_hierarchy or required_role not in role_hierarchy[user_role]:
                    return jsonify({'error': '权限不足'}), 403

                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': '令牌已过期'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': '无效令牌'}), 401
        return decorated_function
    return decorator

# 使用示例
@app.route('/api/admin/dashboard')
@require_role('admin')
def admin_dashboard():
    return jsonify({'data': '管理员数据'})
```

### 9.2 数据安全

#### 9.2.1 数据库安全

1. **连接加密**：使用SSL/TLS连接MySQL、Redis
2. **敏感数据加密**：
   - 读者身份证号、手机号：AES-256加密存储
   - 密码：bcrypt哈希 + 随机盐值
3. **数据脱敏**：日志中敏感信息掩码处理
4. **SQL注入防护**：

   ```python
   # 错误示例 - SQL注入风险
   # cursor.execute(f"SELECT * FROM reader WHERE reader_id = '{user_input}'")

   # 正确示例 - 参数化查询
   cursor.execute("SELECT * FROM reader WHERE reader_id = %s", (user_input,))
   ```

#### 9.2.2 文件安全

1. **上传文件验证**：

   ```python
   ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
   MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

   def allowed_file(filename):
       return '.' in filename and \
              filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
   ```

### 9.3 应用安全

#### 9.3.1 输入验证

```python
from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField
from wtforms.validators import DataRequired, Length, Regexp, NumberRange

class ReaderRegistrationForm(FlaskForm):
    reader_id = StringField('读者ID', validators=[
        DataRequired(),
        Length(min=6, max=20),
        Regexp(r'^[A-Za-z0-9_\-]+$', message='只能包含字母、数字、下划线和横线')
    ])

    phone = StringField('手机号', validators=[
        DataRequired(),
        Regexp(r'^1[3-9]\d{9}$', message='请输入有效的手机号')
    ])
```

#### 9.3.2 防CSRF攻击

```python
# Flask配置
app.config['WTF_CSRF_ENABLED'] = True
app.config['SECRET_KEY'] = 'your-secret-key'

# 表单中使用CSRF令牌
<form method="POST">
    {{ form.csrf_token }}
    <!-- 其他字段 -->
</form>
```

#### 9.3.3 XSS防护

```html
<!-- 前端输出转义 -->
<div id="content">
  {{ content|safe }}
  <!-- 谨慎使用 -->
</div>

<!-- 推荐使用文本节点或innerText -->
<script>
  document.getElementById("content").innerText = userContent;
</script>
```

### 9.4 网络安全

#### 9.4.1 HTTPS强制

```nginx
# Nginx配置
server {
    listen 80;
    server_name library.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name library.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ...其他SSL配置
}
```

#### 9.4.2 安全响应头

```python
# Flask安全中间件
from flask_talisman import Talisman

app = Flask(__name__)
Talisman(app, content_security_policy={
    'default-src': "'self'",
    'script-src': ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "http://*", "https://*"]
})
```

#### 9.4.3 API限流

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/search')
@limiter.limit("10 per minute")  # 搜索接口限流
def search_books():
    # ...
```

## 十、后端实现指南（Flask）

### 10.1 项目结构

backend/
├── app.py # Flask入口 & 蓝图注册
├── routes/
│ ├── reader.py
│ ├── book.py
│ ├── borrow.py
│ └── stats.py # 可视化数据接口
├── services/ # 业务逻辑层
├── utils/
│ ├── hbase_conn.py # happybase封装
│ ├── redis_cache.py # redis操作
│ └── mapreduce_job.py# 任务调度
├── config.py
└── requirements.txt

### 10.2 Flask部署配置

# config.py

class Config:
SECRET_KEY = 'dev-secret-key-change-in-prod'
MYSQL_URI = 'mysql+pymysql://user:pass@localhost:3306/library'
HBASE_HOST = 'localhost'
REDIS_URI = 'redis://localhost:6379/0'
UPLOAD_FOLDER = './uploads'

## 十一、部署方案

### 11.1 开发环境部署

#### 11.1.1 环境准备

```bash
# 1. 安装系统依赖（Ubuntu 22.04）
sudo apt update
sudo apt install -y python3-pip python3-venv git mysql-server redis-server

# 2. 安装大数据组件（可选学习环境）
# Hadoop + HBase 安装脚本见 scripts/install-hadoop.sh
```

#### 11.1.2 项目初始化

```bash
# 1. 克隆代码库
git clone https://github.com/your-org/library-management-system.git
cd library-management-system

# 2. 创建Python虚拟环境
python3 -m venv venv
source venv/bin/activate

# 3. 安装Python依赖
pip install -r backend/requirements.txt

# 4. 数据库初始化
mysql -u root -p < docs/sql/schema.sql
mysql -u root -p < docs/sql/initial_data.sql

# 5. 启动开发服务器
cd backend
python app.py  # 开发模式，端口5000
```

#### 11.1.3 前端启动

```bash
# 1. 安装前端依赖（仅需HTTP服务器）
cd public
python3 -m http.server 8080  # 或使用任何静态文件服务器
```

### 11.2 生产环境部署

#### 11.2.1 服务器架构

```
                   ┌─────────────────┐
                   │   Nginx (80/443)│
                   │   • 负载均衡    │
                   │   • SSL终止     │
                   └────────┬────────┘
                            │
     ┌──────────┬───────────┼───────────┬──────────┐
     │          │           │           │          │
┌────▼──┐ ┌────▼──┐ ┌─────▼────┐ ┌────▼──┐ ┌────▼──┐
│Gunicorn│ │Gunicorn│ │静态文件 │ │ MySQL │ │ Redis │
│Worker1│ │Worker2 │ │  服务器  │ │  8.0  │ │  7.0  │
│ :5000 │ │ :5001  │ │  :8080  │ │ :3306 │ │ :6379 │
└────┬──┘ └────┬──┘ └──────────┘ └────┬──┘ └────┬──┘
     │          │                      │          │
     └──────────┼──────────────────────┼──────────┘
                │                      │
         ┌──────▼──────┐       ┌──────▼──────┐
         │  Flask App  │       │ 大数据集群  │
         │  业务逻辑   │       │ (可选)      │
         └─────────────┘       │ • Hadoop    │
                               │ • HBase     │
                               │ • HDFS      │
                               └─────────────┘
```

#### 11.2.2 部署脚本

```bash
#!/bin/bash
# deploy-prod.sh

set -e  # 遇到错误时退出

echo "=== 开始部署图书馆管理系统 ==="

# 1. 拉取最新代码
cd /opt/library-system
git pull origin main

# 2. 更新Python依赖
source venv/bin/activate
pip install -r backend/requirements.txt

# 3. 数据库迁移
cd backend
python manage.py db upgrade  # 使用Flask-Migrate

# 4. 重启Gunicorn服务
sudo systemctl restart library-api.service

# 5. 清理旧版本
echo "部署完成！"
```

#### 11.2.3 服务配置文件

**Gunicorn服务** (`/etc/systemd/system/library-api.service`)：

```ini
[Unit]
Description=Library Management System API
After=network.target mysql.service redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/library-system/backend
ExecStart=/opt/library-system/venv/bin/gunicorn \
          --workers 4 \
          --bind 127.0.0.1:5000 \
          --timeout 120 \
          --access-logfile /var/log/library/api.log \
          --error-logfile /var/log/library/error.log \
          app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Nginx配置** (`/etc/nginx/sites-available/library.conf`)：

```nginx
upstream library_api {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
}

server {
    listen 80;
    server_name library.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name library.example.com;

    # SSL证书
    ssl_certificate /etc/letsencrypt/live/library.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/library.example.com/privkey.pem;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API代理
    location /api/ {
        proxy_pass http://library_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件
    location / {
        root /opt/library-system/public;
        index index.html;
        try_files $uri $uri/ =404;

        # 缓存静态资源
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 十二、数据生成与模拟

### 12.1 模拟数据生成方案

为支持推荐系统训练和系统演示，需要生成1万条结构化的模拟数据，涵盖读者、图书、借阅记录等核心业务数据。

#### 12.1.1 数据生成目标

- 读者数据：2,000条（含信用等级、借阅历史分布）
- 图书数据：5,000条（含热门类别、作者、出版年份分布）
- 借阅记录：10,000条（时间跨度1年，包含正常、逾期、已归还状态）
- 预约记录：500条
- 罚款记录：300条

#### 12.1.2 数据属性设计

**读者数据属性**：

- `reader_id`：学号/工号（格式：R20230001）
- `name`：姓名（中文）
- `credit_score`：信用分（60-100均匀分布）
- `borrow_quota`：借书额度（基于信用分自动计算）
- `overdue_count`：逾期次数（0-5次，幂律分布）
- `total_borrow_count`：总借阅次数（0-50次）
- `last_active`：最后活跃时间（近1年随机）

**图书数据属性**：

- `isbn`：ISBN编码（格式：978-7-xxx-xxxxx-x）
- `title`：书名（按类别生成，如《人工智能导论》）
- `author`：作者（从作者库中随机选择）
- `category_path`：分类路径（中图法，22个大类）
- `category_name`：分类名称
- `total_stock`：总库存（1-10本）
- `available_stock`：可借库存（动态计算）
- `hot_score`：热度分数（基于借阅次数计算）
- `borrow_count`：借阅次数（0-200次）
- `price`：价格（20-150元）
- `publish_year`：出版年份（2000-2025年）

**借阅记录属性**：

- `record_id`：唯一记录ID
- `reader_id`：读者ID（关联读者表）
- `isbn`：图书ISBN（关联图书表）
- `borrow_date`：借书日期（2024-01-01至2025-04-20）
- `due_date`：应还日期（借书日期+30天）
- `return_date`：归还日期（70%在应还日期前，20%逾期归还，10%未归还）
- `status`：状态（borrowed/returned/overdue）
- `fine_amount`：罚款金额（逾期记录计算）
- `renew_count`：续借次数（0-2次）

#### 12.1.3 数据分布设计

1. **借阅行为模拟**：
   - 热门图书借阅频率高（长尾分布）
   - 活跃读者借阅次数多（80%借阅由20%读者产生）
   - 季节性波动（寒暑假借阅量下降）
   - 新书效应（新入库图书前3个月借阅率高）

2. **类别偏好模拟**：
   - 计算机类：30%借阅量
   - 文学类：25%借阅量
   - 经济管理类：15%借阅量
   - 工程技术类：10%借阅量
   - 其他类别：20%借阅量

3. **时间分布**：
   - 工作日借阅量 > 周末借阅量
   - 学期中借阅量 > 假期借阅量
   - 每日高峰时段：10:00-12:00, 14:00-16:00

#### 12.1.4 生成工具与脚本

```python
# scripts/generate_mock_data.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from faker import Faker

class MockDataGenerator:
    def __init__(self, seed=42):
        self.faker = Faker('zh_CN')
        np.random.seed(seed)

    def generate_readers(self, count=2000):
        """生成读者数据"""
        readers = []
        for i in range(1, count + 1):
            reader_id = f'R2023{i:04d}'
            credit = np.random.randint(60, 101)
            readers.append({
                'reader_id': reader_id,
                'name': self.faker.name(),
                'credit_score': credit,
                'borrow_quota': self._calculate_quota(credit),
                'overdue_count': np.random.poisson(0.5),
                'total_borrow_count': np.random.randint(0, 51),
                'last_active': self.faker.date_between(start_date='-1y', end_date='today')
            })
        return pd.DataFrame(readers)

    def generate_books(self, count=5000):
        """生成图书数据"""
        # ... 具体实现
        pass

    def generate_borrow_records(self, count=10000, readers_df=None, books_df=None):
        """生成借阅记录"""
        # ... 具体实现
        pass
```

### 12.2 Excel数据导出格式

生成的模拟数据将按以下格式导出为Excel文件：

1. **`readers.xlsx`**（读者数据表）
   - 工作表名称：`readers`
   - 列：reader_id, name, credit_score, borrow_quota, overdue_count, total_borrow_count, last_active

2. **`books.xlsx`**（图书数据表）
   - 工作表名称：`books`
   - 列：isbn, title, author, category_name, total_stock, available_stock, price, publish_year, borrow_count, hot_score

3. **`borrow_records.xlsx`**（借阅记录表）
   - 工作表名称：`borrow_records`
   - 列：record_id, reader_id, isbn, borrow_date, due_date, return_date, status, fine_amount, renew_count

4. **`data_summary.xlsx`**（数据汇总报告）
   - 工作表1：`summary` - 数据统计摘要
   - 工作表2：`category_distribution` - 类别借阅分布
   - 工作表3：`time_series` - 时间序列分析
   - 工作表4：`reader_behavior` - 读者行为分析

### 12.3 数据质量保证

1. **完整性**：所有必填字段均有值，外键关联关系正确
2. **一致性**：数据间逻辑关系正确（如库存与借阅记录一致）
3. **真实性**：数据分布符合实际图书馆业务特征
4. **多样性**：覆盖各种业务场景（正常、逾期、热门、冷门等）
5. **时效性**：时间范围覆盖近1年，支持趋势分析

### 12.4 推荐系统训练数据

为支持推荐算法训练，额外生成以下数据：

1. **用户-图书评分矩阵**：基于借阅次数、借阅时长、是否续借等行为计算评分（1-5分）
2. **图书相似度矩阵**：基于类别、作者、关键词计算图书间相似度
3. **用户画像数据**：基于借阅历史提取用户兴趣标签
4. **时间序列数据**：用户行为随时间变化趋势

---

## 十三、附录

### 13.1 Python依赖清单 (requirements.txt)

```txt
# Web框架与核心依赖
Flask==3.0.2
Flask-CORS==4.0.0
gunicorn==22.0.0

# 数据库连接
PyMySQL==1.1.1
redis==5.0.3
happybase==2.0.0  # HBase Python客户端

# 安全与认证
PyJWT==2.9.0
bcrypt==4.1.3
Flask-Limiter==3.6.0  # API限流
Flask-Talisman==1.1.0  # 安全响应头

# 表单与验证
Flask-WTF==1.2.1
WTForms==3.1.2

# 数据库迁移
Flask-Migrate==4.0.7
Flask-SQLAlchemy==3.1.1

# 大数据处理（可选）
mrjob==0.7.4  # MapReduce任务调度

# 配置管理
python-dotenv==1.0.1

# 监控与日志
prometheus-flask-exporter==0.22.4
structlog==24.2.0

# 推荐系统与数据分析
scikit-learn==1.4.2  # 机器学习与推荐算法
pandas==2.2.2  # 数据处理与分析
numpy==1.26.4  # 数值计算
scipy==1.13.0  # 科学计算
openpyxl==3.1.2  # Excel读写
faker==24.9.0  # 模拟数据生成
tqdm==4.66.4  # 进度条

# 工具类
pandas==2.2.2  # 数据分析
requests==2.32.3  # HTTP客户端
```

> **注意**：对于生产环境，建议使用`pip freeze > requirements.txt`生成精确版本锁定。

### 13.2 前端HTML骨架示例

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>智慧图书馆管理大屏</title>
  <link rel="stylesheet" href="css/layout.css">
</head>
<body>
  <header class="header">
    <h1>📚 图书馆运营指挥中心</h1>
    <select id="date-filter">
      <option value="day">今日</option>
      <option value="week" selected>本周</option>
      <option value="month">本月</option>
    </select>
  </header>
  
  <main class="dashboard-grid">
    <div id="chart-trend" class="chart-card"></div>
    <div id="chart-category" class="chart-card"></div>
    <div id="chart-heatmap" class="chart-card"></div>
    <!-- 其他图表容器 -->
  </main>

  <script src="lib/echarts.min.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
