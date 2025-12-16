# 📧 消息通知系统

一个基于 Node.js + Vue3 的邮件通知系统，支持定时通知和周期性通知（天、周、月、季度、年、自定义周期），界面简洁友好，特别适合非技术人员使用。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0-brightgreen)](https://nodejs.org/)
[![Vue.js Version](https://img.shields.io/badge/vue-3.x-brightgreen)](https://vuejs.org/)

## ✨ 功能特性

- 🎯 **定时通知**：指定特定时间发送一次
- 🔄 **周期通知**：支持每天、每周、每月、每季度、每年定时发送
- 🔁 **自定义周期**：自由设置发送周期（如每18天）
- 🔂 **重复发送**：重要通知可设置间隔重复发送多次
- 👥 **收件人管理**：统一管理收件人信息和分组
- 📮 **邮件发送**：支持多收件人、HTML格式邮件
- ⚙️ **SMTP配置**：支持QQ邮箱、163邮箱、企业邮箱等
- 📊 **发送监控**：详细的发送日志和统计数据、实时监控
- 🔐 **用户认证**：支持多用户登录、密码管理
- 🌓 **深色模式**：支持浅色/深色主题切换
- 💼 **友好界面**：专为文员等非技术人员设计

## 🛠️ 技术栈

### 后端
- Node.js + Express
- MySQL 数据库
- nodemailer（邮件发送）
- node-schedule（任务调度）

### 前端
- Vue 3
- Element Plus UI组件库
- Pinia 状态管理
- Axios HTTP客户端

## 📋 环境要求

- Node.js >= 16.0
- MySQL >= 5.7
- 宝塔面板（推荐）或 Nginx

## 🚀 快速开始

### 方式1: 图形化安装向导（推荐）⭐

系统提供了友好的安装向导页面，首次启动会自动引导：

1. **启动后端服务**
```bash
cd server
npm install
npm run dev
```

2. **启动前端服务**
```bash
cd client
npm install
npm run dev
```

3. **访问安装向导**
- 打开浏览器访问：http://localhost:5173
- 系统会自动进入安装向导
- 按照4个步骤完成配置：
  1. 环境检查
  2. 数据库配置
  3. 管理员账号
  4. 完成安装

详细说明请查看：[安装向导说明.md](./安装向导说明.md)

---

### 方式2: 手动安装

如果你更喜欢手动配置，可以按照以下步骤：

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 复制环境变量配置文件
cp .env.example .env
# Windows用户使用: copy .env.example .env
# 然后编辑 .env 文件，填入你的真实数据库配置

# 安装前端依赖
cd ../client
npm install
```

### 2. 配置数据库

在MySQL中创建数据库：

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE youjiandingshi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后使用一键初始化脚本：

```bash
cd server
node import-complete-db.js
```

详细说明请查看 [数据库初始化说明.md](./数据库初始化说明.md)

### 3. 配置后端

编辑 `server/.env` 文件（如不存在则创建），配置如下：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=youjiandingshi
DB_PASSWORD=your_password
DB_NAME=youjiandingshi
DB_PORT=3306

# 服务器配置
PORT=3000
NODE_ENV=production

# JWT密钥（请修改为随机字符串）
JWT_SECRET=your-secret-key-change-this-in-production
```

### 4. 启动服务

#### 开发环境

```bash
# 启动后端（需要先cd到server目录）
cd server
npm run dev

# 启动前端（需要先cd到client目录）
cd client
npm run dev
```

#### 生产环境

```bash
# 构建前端
cd client
npm run build

# 启动后端
cd ../server
npm start
```

## 📦 宝塔部署（推荐）

详细部署步骤请查看 [宝塔部署文档](./宝塔部署文档.md)

### 快速步骤

1. **安装环境**
   - 宝塔面板
   - PM2管理器
   - Nginx
   - MySQL 5.7+

2. **上传代码**
   - 将项目上传到 `/www/wwwroot/notification`

3. **配置数据库**
   - 在宝塔MySQL管理中导入 `server/config/init.sql`
   - 修改 `server/.env` 配置

4. **构建前端**
   ```bash
   cd /www/wwwroot/notification/client
   npm install
   npm run build
   ```

5. **启动后端**
   - 使用PM2管理器添加项目
   - 启动文件：`server/index.js`

6. **配置Nginx**
   - 参考 `nginx.conf` 配置反向代理

## 📖 使用说明

### 0. 登录系统

默认管理员账号：
- **用户名**：`admin`
- **密码**：`admin123`

首次登录后建议修改密码。

### 1. 配置邮箱

首次使用需要先配置SMTP邮箱：

1. 进入【邮箱配置】页面
2. 点击【添加配置】
3. 填写SMTP信息：
   - **QQ邮箱**：smtp.qq.com，端口465，需要开启SMTP并使用授权码
   - **163邮箱**：smtp.163.com，端口465，需要使用授权码
   - **企业邮箱**：咨询你的IT管理员
4. 点击【测试】验证配置
5. 点击【启用】激活该配置

### 2. 管理收件人

在【收件人管理】页面可以：
- 添加常用收件人
- 创建收件人分组
- 管理联系人信息
- 创建通知时可直接选择

### 3. 创建通知

1. 进入【通知管理】页面
2. 点击【新建通知】
3. 填写通知信息：
   - **标题**：邮件主题
   - **类型**：
     - 单次：指定时间发送一次
     - 每天：每天指定时间
     - 每周：每周几的指定时间
     - 每月：每月几号的指定时间
     - 每季度：每季度的第几个月第几天
     - 每年：每年几月几日
     - 自定义周期：自由设置天数（如每18天）
   - **收件人**：从列表选择或输入新邮箱
   - **内容**：邮件正文（支持HTML格式）
   - **重复发送**：可设置间隔时间重复发送多次（重要通知）
4. 点击【确定】创建

### 4. 管理通知

- **暂停/恢复**：暂时停止或恢复发送
- **编辑**：修改通知内容
- **删除**：删除通知任务

### 5. 监控发送

在【发送监控】页面可以：
- 实时查看发送状态
- 查看成功/失败统计
- 查看详细错误信息
- 筛选和搜索记录

## 🎨 界面预览

- **深色模式**：默认黑色主题，护眼舒适
- **浅色模式**：可一键切换到浅色主题
- **左侧菜单**：清晰的导航结构
- **右侧内容**：简洁的操作界面

## ⚠️ 常见问题

### 1. 邮件发送失败

- 检查SMTP配置是否正确
- 确认邮箱是否开启SMTP服务
- QQ/163邮箱需使用授权码，不是登录密码
- 检查防火墙是否阻止465端口

### 2. 定时任务不执行

- 确保后端服务正常运行
- 检查任务状态是否为"运行中"
- 查看服务器时间是否正确

### 3. 数据库连接失败

- 检查MySQL服务是否启动
- 确认 `.env` 中的数据库配置
- 检查数据库用户权限

## 📝 更新日志

### v1.0.0 (2024-12-16)

- ✅ 完整的通知管理功能
- ✅ 支持单次、每天、每周、每月、每季度、每年、自定义周期
- ✅ 重复发送功能（可设置次数和间隔）
- ✅ 收件人管理和分组
- ✅ 用户认证和权限管理
- ✅ SMTP邮箱配置和测试
- ✅ 定时和周期任务调度
- ✅ 发送记录和实时监控
- ✅ 深色/浅色主题切换
- ✅ 宝塔部署支持

## 📄 开源许可

本项目采用 [MIT License](./LICENSE) 开源协议。

**这意味着你可以：**
- ✅ 自由使用本软件用于商业或非商业用途
- ✅ 自由修改和定制
- ✅ 自由分发和再分发
- ✅ 可以私用、复制、合并、发布、分发、再许可或出售

**唯一要求：**
- 保留原作者的版权声明和许可证声明

## 🤝 贡献指南

我们欢迎并感谢任何形式的贡献！

### 如何贡献

1. **Fork 本仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **提交 Pull Request**

### 贡献类型

- 🐛 报告Bug
- 💡 提出新功能建议
- 📝 改进文档
- 💻 提交代码
- 🌍 翻译文档

## 🌟 致谢

感谢所有为本项目做出贡献的开发者！

## 🔒 安全提示

- ⚠️ **`.env` 文件包含敏感信息**，已被 `.gitignore` 忽略，切勿提交到Git
- ✅ 请使用 `.env.example` 作为模板创建自己的 `.env` 文件
- 🔑 生产环境务必修改 `JWT_SECRET` 为强密码
- 📖 详细安全检查请参考 [`安全检查清单.md`](./安全检查清单.md)

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 📮 提交 [Issue](https://github.com/xiaolou888/youjiandingshi/issues)
- 💬 发起 [Discussion](https://github.com/xiaolou888/youjiandingshi/discussions)

## 🔗 项目地址

**GitHub**: [https://github.com/xiaolou888/youjiandingshi](https://github.com/xiaolou888/youjiandingshi)

## ⭐ Star History

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！

[![Star History Chart](https://api.star-history.com/svg?repos=xiaolou888/youjiandingshi&type=Date)](https://star-history.com/#xiaolou888/youjiandingshi&Date)


