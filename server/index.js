const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 检查是否已配置（.env 文件是否存在）
const envPath = path.join(__dirname, '.env');
const isConfigured = fs.existsSync(envPath);

if (!isConfigured) {
  // ========== 安装模式 ==========
  console.log(`
╔════════════════════════════════════════════╗
║     ⚙️  消息通知系统 - 安装模式            ║
║     端口: ${PORT}                            ║
║     请访问前端页面完成安装配置             ║
╚════════════════════════════════════════════╝
  `);

  // 请求日志中间件（用于调试）
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
  });

  // 安装模式下的路由
  app.use('/api/install', require('./routes/install'));
  app.use('/api/auth', require('./routes/auth')); // 需要注册路由

  // 健康检查（安装模式）
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: '服务运行正常（安装模式）',
      needInstall: true 
    });
  });

  // 404 处理
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      message: '接口不存在（安装模式）',
      needInstall: true 
    });
  });

  // 启动服务器（安装模式）
  app.listen(PORT, () => {
    // 启动信息已在上面打印
  });

} else {
  // ========== 正常模式 ==========
  require('dotenv').config();
  const { initScheduler } = require('./utils/scheduler');

  // 路由
  app.use('/api/install', require('./routes/install')); // 安装向导路由（检查是否已安装）
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

  // 启动服务器（正常模式）
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
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
