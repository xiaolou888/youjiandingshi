-- 创建数据库
CREATE DATABASE IF NOT EXISTS notification_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE notification_system;

-- SMTP配置表
CREATE TABLE IF NOT EXISTS smtp_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '配置名称',
  host VARCHAR(255) NOT NULL COMMENT 'SMTP服务器地址',
  port INT NOT NULL DEFAULT 465 COMMENT 'SMTP端口',
  secure TINYINT(1) DEFAULT 1 COMMENT '是否使用SSL',
  user VARCHAR(255) NOT NULL COMMENT '发件人邮箱',
  password VARCHAR(255) NOT NULL COMMENT '邮箱密码/授权码',
  from_name VARCHAR(100) DEFAULT '' COMMENT '发件人名称',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SMTP配置表';

-- 通知任务表
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT NOT NULL COMMENT '通知内容',
  type ENUM('once', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL COMMENT '通知类型',
  schedule_time DATETIME DEFAULT NULL COMMENT '定时时间（单次）',
  cron_expression VARCHAR(50) DEFAULT NULL COMMENT 'Cron表达式（周期）',
  recipients TEXT NOT NULL COMMENT '收件人列表（JSON数组）',
  status ENUM('active', 'paused', 'completed') DEFAULT 'active' COMMENT '状态',
  last_sent_at DATETIME DEFAULT NULL COMMENT '上次发送时间',
  next_send_at DATETIME DEFAULT NULL COMMENT '下次发送时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_next_send (next_send_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知任务表';

-- 发送日志表
CREATE TABLE IF NOT EXISTS send_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  notification_id INT NOT NULL,
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  recipients TEXT NOT NULL COMMENT '收件人列表',
  status ENUM('success', 'failed') NOT NULL COMMENT '发送状态',
  error_message TEXT DEFAULT NULL COMMENT '错误信息',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification (notification_id),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at),
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发送日志表';

-- 插入默认SMTP配置示例
INSERT INTO smtp_config (name, host, port, secure, user, password, from_name, is_active) 
VALUES ('默认配置', 'smtp.qq.com', 465, 1, 'your_email@qq.com', 'your_password', '通知系统', 0)
ON DUPLICATE KEY UPDATE id=id;


