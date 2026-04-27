// 系统管理页面 JavaScript 逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 初始化系统状态
    updateSystemStatus();

    // 加载系统设置
    loadSettings();

    // 加载系统日志
    loadSystemLogs();

    // 绑定事件监听器
    bindEventListeners();

    // 设置导航栏活动状态
    setActiveNavLink();
});

/**
 * 更新系统状态信息
 */
async function updateSystemStatus() {
    try {
        // 模拟API调用获取系统状态
        const status = await mockFetchSystemStatus();

        document.getElementById('systemHealth').textContent = status.health;
        document.getElementById('healthBadge').textContent = status.healthBadge;
        document.getElementById('dbStatus').textContent = status.dbStatus;
        document.getElementById('dbConnections').textContent = status.dbConnections;
        document.getElementById('diskUsage').textContent = status.diskUsage;
        document.getElementById('freeSpace').textContent = status.freeSpace;
        document.getElementById('uptime').textContent = status.uptime;
        document.getElementById('lastRestart').textContent = status.lastRestart;

        // 根据健康状态更新徽章样式
        updateHealthBadge(status.health);
    } catch (error) {
        console.error('获取系统状态失败:', error);
        showToast('获取系统状态失败', 'error');
    }
}

/**
 * 加载系统设置
 */
function loadSettings() {
    // 从本地存储加载设置，或使用默认值
    const settings = JSON.parse(localStorage.getItem('systemSettings')) || {
        autoBackup: true,
        overdueNotification: true,
        newReaderReview: false,
        logRetention: '90',
        maxBorrowDays: 30
    };

    document.getElementById('autoBackup').checked = settings.autoBackup;
    document.getElementById('overdueNotification').checked = settings.overdueNotification;
    document.getElementById('newReaderReview').checked = settings.newReaderReview;
    document.getElementById('logRetention').value = settings.logRetention;
    document.getElementById('maxBorrowDays').value = settings.maxBorrowDays;
}

/**
 * 保存系统设置
 */
function saveSettings() {
    const settings = {
        autoBackup: document.getElementById('autoBackup').checked,
        overdueNotification: document.getElementById('overdueNotification').checked,
        newReaderReview: document.getElementById('newReaderReview').checked,
        logRetention: document.getElementById('logRetention').value,
        maxBorrowDays: parseInt(document.getElementById('maxBorrowDays').value)
    };

    // 保存到本地存储（实际应用中应发送到服务器）
    localStorage.setItem('systemSettings', JSON.stringify(settings));

    showToast('系统设置已保存', 'success');

    // 模拟API调用
    mockSaveSettings(settings);
}

/**
 * 重置系统设置为默认值
 */
function resetSettings() {
    showConfirmModal(
        '重置系统设置',
        '您确定要将所有系统设置重置为默认值吗？',
        function() {
            const defaultSettings = {
                autoBackup: true,
                overdueNotification: true,
                newReaderReview: false,
                logRetention: '90',
                maxBorrowDays: 30
            };

            document.getElementById('autoBackup').checked = defaultSettings.autoBackup;
            document.getElementById('overdueNotification').checked = defaultSettings.overdueNotification;
            document.getElementById('newReaderReview').checked = defaultSettings.newReaderReview;
            document.getElementById('logRetention').value = defaultSettings.logRetention;
            document.getElementById('maxBorrowDays').value = defaultSettings.maxBorrowDays;

            localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
            showToast('系统设置已重置为默认值', 'success');
        }
    );
}

/**
 * 加载系统日志
 */
async function loadSystemLogs() {
    try {
        // 模拟API调用获取日志
        const logs = await mockFetchSystemLogs();
        const logsContainer = document.getElementById('systemLogs');

        // 清空现有日志（除了示例）
        const exampleLogs = logsContainer.querySelectorAll('.log-entry');
        if (exampleLogs.length > 6) {
            logsContainer.innerHTML = '';
        }

        // 添加新日志
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-time">${log.time}</span>
                <span class="log-level log-level-${log.level.toLowerCase()}">${log.level}</span>
                <span class="log-message">${log.message}</span>
            `;
            logsContainer.prepend(logEntry);
        });
    } catch (error) {
        console.error('加载系统日志失败:', error);
        showToast('加载系统日志失败', 'error');
    }
}

/**
 * 刷新系统日志
 */
function refreshLogs() {
    loadSystemLogs();
    showToast('系统日志已刷新', 'success');
}

/**
 * 清空系统日志
 */
function clearLogs() {
    showConfirmModal(
        '清空系统日志',
        '您确定要清空所有系统日志吗？此操作不可恢复。',
        function() {
            const logsContainer = document.getElementById('systemLogs');
            logsContainer.innerHTML = '';
            showToast('系统日志已清空', 'success');

            // 模拟API调用
            mockClearLogs();
        }
    );
}

/**
 * 导出系统日志
 */
function exportLogs() {
    showToast('日志导出功能开发中', 'info');
    // 实际实现：调用API导出日志文件
}

/**
 * 创建数据库备份
 */
function createBackup() {
    showConfirmModal(
        '创建数据库备份',
        '您确定要立即创建数据库备份吗？',
        function() {
            // 模拟备份过程
            showToast('正在创建数据库备份...', 'info');

            setTimeout(() => {
                showToast('数据库备份创建成功', 'success');
                // 实际实现：调用备份API
            }, 2000);
        }
    );
}

/**
 * 查看备份列表
 */
function viewBackups() {
    showToast('查看备份功能开发中', 'info');
    // 实际实现：打开备份列表模态框
}

/**
 * 清理过期日志
 */
function cleanOldLogs() {
    showConfirmModal(
        '清理过期日志',
        '您确定要清理所有过期日志吗？',
        function() {
            showToast('正在清理过期日志...', 'info');

            setTimeout(() => {
                showToast('过期日志清理完成', 'success');
                // 实际实现：调用清理API
            }, 1500);
        }
    );
}

/**
 * 清理临时文件
 */
function cleanTempFiles() {
    showConfirmModal(
        '清理临时文件',
        '您确定要清理所有临时文件吗？',
        function() {
            showToast('正在清理临时文件...', 'info');

            setTimeout(() => {
                showToast('临时文件清理完成', 'success');
                // 实际实现：调用清理API
            }, 1500);
        }
    );
}

/**
 * 导出图书数据
 */
function exportBooks() {
    showToast('图书数据导出功能开发中', 'info');
    // 实际实现：调用导出API
}

/**
 * 导出读者数据
 */
function exportReaders() {
    showToast('读者数据导出功能开发中', 'info');
    // 实际实现：调用导出API
}

/**
 * 导出借阅记录
 */
function exportBorrowRecords() {
    showToast('借阅记录导出功能开发中', 'info');
    // 实际实现：调用导出API
}

/**
 * 重启系统
 */
function systemRestart() {
    showConfirmModal(
        '重启系统',
        '您确定要重启系统吗？重启期间系统将不可用。',
        function() {
            showToast('系统正在重启...', 'warning');
            // 实际实现：调用重启API
        }
    );
}

/**
 * 重置数据库
 */
function resetDatabase() {
    showConfirmModal(
        '重置数据库',
        '警告：这将删除所有数据并重置数据库！此操作不可恢复。',
        function() {
            showConfirmModal(
                '二次确认',
                '请再次确认：这将永久删除所有数据！',
                function() {
                    showToast('数据库重置中...', 'warning');
                    // 实际实现：调用重置API
                }
            );
        }
    );
}

/**
 * 清空所有数据
 */
function clearAllData() {
    showConfirmModal(
        '清空所有数据',
        '警告：这将清空所有数据（包括图书、读者、借阅记录）！此操作不可恢复。',
        function() {
            showConfirmModal(
                '二次确认',
                '请再次确认：这将永久删除所有数据！',
                function() {
                    showToast('正在清空所有数据...', 'warning');
                    // 实际实现：调用清空API
                }
            );
        }
    );
}

/**
 * 删除系统
 */
function deleteSystem() {
    showConfirmModal(
        '删除系统',
        '警告：这将删除整个系统！此操作不可恢复。',
        function() {
            showConfirmModal(
                '二次确认',
                '请再次确认：这将永久删除整个系统！',
                function() {
                    showConfirmModal(
                        '最终确认',
                        '请输入"DELETE"确认删除：',
                        function() {
                            const input = prompt('请输入"DELETE"确认删除：');
                            if (input === 'DELETE') {
                                showToast('系统删除中...', 'warning');
                                // 实际实现：调用删除API
                            } else {
                                showToast('删除已取消', 'info');
                            }
                        }
                    );
                }
            );
        }
    );
}

/**
 * 用户管理相关函数
 */
function editUser(userId) {
    showToast(`编辑用户 ${userId} 功能开发中`, 'info');
    // 实际实现：打开用户编辑模态框
}

function changePassword(userId) {
    showToast(`修改用户 ${userId} 密码功能开发中`, 'info');
    // 实际实现：打开修改密码模态框
}

function addNewUser() {
    openUserModal();
}

function manageRoles() {
    showToast('角色管理功能开发中', 'info');
    // 实际实现：打开角色管理页面
}

/**
 * 模态框控制函数
 */
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function openUserModal() {
    document.getElementById('userModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

/**
 * 显示确认模态框
 */
function showConfirmModal(title, message, confirmCallback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmActionBtn');
    confirmBtn.onclick = function() {
        confirmCallback();
        closeConfirmModal();
    };

    document.getElementById('confirmModal').style.display = 'flex';
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 设置项变更监听
    document.getElementById('autoBackup').addEventListener('change', function() {
        showToast('自动备份设置已更新', 'info');
    });

    document.getElementById('overdueNotification').addEventListener('change', function() {
        showToast('逾期通知设置已更新', 'info');
    });

    document.getElementById('newReaderReview').addEventListener('change', function() {
        showToast('新读者审核设置已更新', 'info');
    });

    document.getElementById('logRetention').addEventListener('change', function() {
        showToast('日志保留时长设置已更新', 'info');
    });

    document.getElementById('maxBorrowDays').addEventListener('change', function() {
        showToast('最大借阅天数设置已更新', 'info');
    });

    // 用户表单提交
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // 获取表单数据
            const formData = new FormData(userForm);
            const userData = {
                username: formData.get('username') || document.querySelector('#userForm input[type="text"]').value,
                email: formData.get('email') || document.querySelector('#userForm input[type="email"]').value,
                role: formData.get('role') || document.querySelector('#userForm select').value
            };

            // 验证数据
            if (!userData.username || !userData.email || !userData.role) {
                showToast('请填写所有必填字段', 'error');
                return;
            }

            // 模拟保存用户
            showToast(`用户 ${userData.username} 已保存`, 'success');
            closeUserModal();
            userForm.reset();
        });
    }
}

/**
 * 设置导航栏活动状态
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

/**
 * 更新健康状态徽章样式
 */
function updateHealthBadge(health) {
    const badge = document.getElementById('healthBadge');

    // 移除所有状态类
    badge.classList.remove('status-healthy', 'status-warning', 'status-error');

    // 根据健康状态添加对应类
    if (health === '良好' || health === '正常') {
        badge.classList.add('status-healthy');
    } else if (health === '警告') {
        badge.classList.add('status-warning');
    } else {
        badge.classList.add('status-error');
    }
}

/**
 * 显示Toast通知
 */
function showToast(message, type = 'info') {
    // 检查是否已存在toast容器
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }

    // 创建toast元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${type === 'error' ? '#F56565' : type === 'success' ? '#48BB78' : '#4299E1'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    toast.textContent = message;
    toastContainer.appendChild(toast);

    // 3秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * 模拟API函数
 */
async function mockFetchSystemStatus() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                health: '良好',
                healthBadge: '正常',
                dbStatus: '正常',
                dbConnections: '5/10',
                diskUsage: '24%',
                freeSpace: '186GB',
                uptime: '15天',
                lastRestart: '2026-04-07'
            });
        }, 500);
    });
}

async function mockFetchSystemLogs() {
    return new Promise(resolve => {
        setTimeout(() => {
            const logs = [];
            const levels = ['INFO', 'WARN', 'ERROR'];
            const messages = [
                '用户登录系统',
                '数据库备份完成',
                '图书借阅记录更新',
                '系统安全检查通过',
                'API请求响应时间正常',
                '磁盘空间监控警报',
                '用户权限变更'
            ];

            const now = new Date();
            for (let i = 0; i < 5; i++) {
                const time = new Date(now - i * 60000).toLocaleString('zh-CN');
                const level = levels[Math.floor(Math.random() * levels.length)];
                const message = messages[Math.floor(Math.random() * messages.length)];

                logs.push({ time, level, message });
            }

            resolve(logs);
        }, 300);
    });
}

async function mockSaveSettings(settings) {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('设置已保存:', settings);
            resolve({ success: true });
        }, 500);
    });
}

async function mockClearLogs() {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('日志已清空');
            resolve({ success: true });
        }, 500);
    });
}