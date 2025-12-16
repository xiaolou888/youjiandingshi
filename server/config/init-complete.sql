-- =============================================
-- 消息通知系统 - 完整数据库初始化脚本
-- =============================================

-- 1. 创建通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL COMMENT '通知标题',
  `content` TEXT NOT NULL COMMENT '邮件内容',
  `type` ENUM('once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL COMMENT '通知类型',
  `schedule_time` DATETIME NOT NULL COMMENT '计划发送时间',
  `cron_expression` VARCHAR(100) DEFAULT NULL COMMENT 'Cron表达式',
  `recipients` JSON NOT NULL COMMENT '收件人列表',
  `status` ENUM('active', 'paused', 'completed') DEFAULT 'active' COMMENT '状态',
  `last_sent_at` DATETIME DEFAULT NULL COMMENT '最后发送时间',
  `next_send_at` DATETIME DEFAULT NULL COMMENT '下次发送时间',
  `custom_period_days` INT DEFAULT NULL COMMENT '自定义周期天数',
  `custom_period_start` DATETIME DEFAULT NULL COMMENT '自定义周期起始时间',
  `enable_repeat` TINYINT(1) DEFAULT 0 COMMENT '是否启用重复发送',
  `repeat_times` INT DEFAULT 1 COMMENT '重复发送次数',
  `repeat_interval` INT DEFAULT 30 COMMENT '重复发送间隔(分钟)',
  `sent_count` INT DEFAULT 0 COMMENT '已发送次数',
  `quarterly_month` INT DEFAULT NULL COMMENT '季度内的月份(1-3)',
  `quarterly_day` INT DEFAULT NULL COMMENT '季度内的日期(1-31)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知任务表';

-- 2. 创建SMTP配置表
CREATE TABLE IF NOT EXISTS `smtp_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `host` VARCHAR(255) NOT NULL COMMENT 'SMTP服务器地址',
  `port` INT NOT NULL COMMENT '端口号',
  `secure` TINYINT(1) DEFAULT 0 COMMENT '是否使用SSL/TLS',
  `user` VARCHAR(255) NOT NULL COMMENT '发件人邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '授权码/密码',
  `from_name` VARCHAR(100) DEFAULT NULL COMMENT '发件人名称',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SMTP配置表';

-- 3. 创建发送日志表
CREATE TABLE IF NOT EXISTS `send_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `notification_id` INT NOT NULL COMMENT '通知ID',
  `recipient` VARCHAR(255) NOT NULL COMMENT '收件人',
  `status` ENUM('success', 'failed') NOT NULL COMMENT '发送状态',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  `is_retry` TINYINT(1) DEFAULT 0 COMMENT '是否为重复发送',
  `retry_number` INT DEFAULT 0 COMMENT '第几次重复发送(0为首次)',
  INDEX `idx_notification_id` (`notification_id`),
  INDEX `idx_sent_at` (`sent_at`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件发送日志表';

-- 4. 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
  `email` VARCHAR(255) DEFAULT NULL COMMENT '邮箱',
  `role` ENUM('admin', 'user') DEFAULT 'user' COMMENT '角色',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态(1启用0禁用)',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 5. 创建联系人表
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '姓名',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT '邮箱',
  `phone` VARCHAR(50) DEFAULT NULL COMMENT '电话',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '部门',
  `position` VARCHAR(100) DEFAULT NULL COMMENT '职位',
  `group_ids` JSON DEFAULT NULL COMMENT '分组ID列表',
  `remark` TEXT DEFAULT NULL COMMENT '备注',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态(1启用0禁用)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人表';

-- 6. 创建联系人分组表
CREATE TABLE IF NOT EXISTS `contact_groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '分组名称',
  `description` TEXT DEFAULT NULL COMMENT '分组描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人分组表';

-- =============================================
-- 初始化数据
-- =============================================

-- 插入默认管理员账号 (用户名: admin, 密码: admin123)
INSERT INTO `users` (`username`, `password`, `email`, `role`) 
VALUES ('admin', '$2a$10$8K1p/a0dL3LqxKKYN0F6yOHGLqNrYvjBQJGQvJ3kZFqKLqHqF6kYW', 'admin@example.com', 'admin')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- =============================================
-- 完成
-- =============================================


