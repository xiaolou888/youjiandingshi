/*
 Navicat Premium Dump SQL

 Source Server         : 飞牛数据库
 Source Server Type    : MySQL
 Source Server Version : 80407 (8.4.7)
 Source Host           : 192.168.88.88:3306
 Source Schema         : youjiandingshi

 Target Server Type    : MySQL
 Target Server Version : 80407 (8.4.7)
 File Encoding         : 65001

 Date: 02/01/2026 14:53:20
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for contact_group_relation
-- ----------------------------
DROP TABLE IF EXISTS `contact_group_relation`;
CREATE TABLE `contact_group_relation`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL COMMENT '联系人ID',
  `group_id` int NOT NULL COMMENT '分组ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_contact_group`(`contact_id` ASC, `group_id` ASC) USING BTREE,
  INDEX `group_id`(`group_id` ASC) USING BTREE,
  CONSTRAINT `contact_group_relation_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `contact_group_relation_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `contact_groups` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '联系人分组关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contact_group_relation
-- ----------------------------

-- ----------------------------
-- Table structure for contact_groups
-- ----------------------------
DROP TABLE IF EXISTS `contact_groups`;
CREATE TABLE `contact_groups`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分组名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '分组描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '联系人分组表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contact_groups
-- ----------------------------
INSERT INTO `contact_groups` VALUES (1, '技术团队', '所有技术部门人员', '2025-12-15 17:35:30', '2025-12-15 17:35:30');
INSERT INTO `contact_groups` VALUES (2, '管理层', '公司管理层人员', '2025-12-15 17:35:30', '2025-12-15 17:35:30');
INSERT INTO `contact_groups` VALUES (3, '全体员工', '公司所有员工', '2025-12-15 17:35:30', '2025-12-15 17:35:30');

-- ----------------------------
-- Table structure for contacts
-- ----------------------------
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系人姓名',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱地址',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '电话号码',
  `department` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '部门',
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '职位',
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '标签（逗号分隔）',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态：1启用，0禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_email`(`email` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '联系人表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contacts
-- ----------------------------
INSERT INTO `contacts` VALUES (1, '张富强', 'sxzfq@foxmail.com', '', '', '', '', '', 1, '2025-12-15 17:35:30', '2025-12-16 10:31:11');
INSERT INTO `contacts` VALUES (2, '李四', 'lisi@example.com', '', '市场部', '市场经理', '', NULL, 1, '2025-12-15 17:35:30', '2025-12-15 17:35:30');
INSERT INTO `contacts` VALUES (3, '王五', 'wangwu@example.com', '', '行政部', '行政专员', '', NULL, 1, '2025-12-15 17:35:30', '2025-12-15 17:35:30');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知内容',
  `type` enum('once','daily','weekly','monthly','quarterly','yearly','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知类型',
  `schedule_time` datetime NULL DEFAULT NULL COMMENT '定时时间（单次）',
  `cron_expression` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'Cron表达式（周期）',
  `recipients` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '收件人列表（JSON数组）',
  `status` enum('active','paused','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '状态',
  `last_sent_at` datetime NULL DEFAULT NULL COMMENT '上次发送时间',
  `next_send_at` datetime NULL DEFAULT NULL COMMENT '下次发送时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `custom_period_days` int NULL DEFAULT NULL COMMENT '自定义周期天数（仅type=custom时使用）',
  `custom_period_start` datetime NULL DEFAULT NULL COMMENT '自定义周期起始时间',
  `enable_repeat` tinyint(1) NULL DEFAULT 0 COMMENT '是否启用重复发送',
  `repeat_times` int NULL DEFAULT 1 COMMENT '重复发送次数',
  `repeat_interval` int NULL DEFAULT 30 COMMENT '重复发送间隔（分钟）',
  `sent_count` int NULL DEFAULT 0 COMMENT '已发送次数',
  `quarterly_month` int NULL DEFAULT NULL COMMENT '季度内的月份(1-3)',
  `quarterly_day` int NULL DEFAULT NULL COMMENT '季度内的日期(1-31)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_next_send`(`next_send_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '通知任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (1, '2222', '111111111111111', 'once', '2025-12-15 17:45:47', NULL, '[\"2099156872@qq.com\"]', 'completed', '2025-12-15 17:45:47', '2025-12-15 17:45:47', '2025-12-15 17:32:23', '2025-12-15 17:45:47', NULL, NULL, 0, 1, 30, 0, NULL, NULL);

-- ----------------------------
-- Table structure for send_logs
-- ----------------------------
DROP TABLE IF EXISTS `send_logs`;
CREATE TABLE `send_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_id` int NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知标题',
  `recipients` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '收件人列表',
  `status` enum('success','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '发送状态',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_notification`(`notification_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_sent_at`(`sent_at` ASC) USING BTREE,
  CONSTRAINT `send_logs_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '发送日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of send_logs
-- ----------------------------
INSERT INTO `send_logs` VALUES (1, 1, '2222', 'xy.a@foxmail.com', 'failed', '未找到活跃的SMTP配置', '2025-12-15 17:34:46');
INSERT INTO `send_logs` VALUES (2, 1, '2222', '2099156872@qq.com', 'success', NULL, '2025-12-15 17:45:47');

-- ----------------------------
-- Table structure for smtp_config
-- ----------------------------
DROP TABLE IF EXISTS `smtp_config`;
CREATE TABLE `smtp_config`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置名称',
  `host` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'SMTP服务器地址',
  `port` int NOT NULL DEFAULT 465 COMMENT 'SMTP端口',
  `secure` tinyint(1) NULL DEFAULT 1 COMMENT '是否使用SSL',
  `user` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '发件人邮箱',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱密码/授权码',
  `from_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '发件人名称',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'SMTP配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of smtp_config
-- ----------------------------
INSERT INTO `smtp_config` VALUES (1, '默认配置', 'smtp.qq.com', 465, 1, '469893885@qq.com', 'dafrbuqtgahacahb', '通知系统', 1, '2025-12-15 17:15:51', '2025-12-15 17:42:35');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码（加密）',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '昵称',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '邮箱',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态：1启用，0禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  INDEX `idx_username`(`username` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', '$2b$10$x1WSeAcFz8/bOCpNd4yyBOEmuce8nzFnDucuGlJqj3VevW8R89nue', '管理员', '', 1, '2025-12-15 17:21:08', '2025-12-15 17:27:14');

SET FOREIGN_KEY_CHECKS = 1;
