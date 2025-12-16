const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { initScheduler } = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', require('./routes/auth')); // 认证路由（登录不需要token）
app.use('/api/smtp', require('./routes/smtp'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/contacts', require('./routes/contacts')); // 联系人管理

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════╗
║     📧 消息通知系统后端服务已启动          ║
║     端口: ${PORT}                            ║
║     环境: ${process.env.NODE_ENV || 'development'}               ║
╚════════════════════════════════════════════╝
  `);

  // 初始化调度器
  await initScheduler();
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

