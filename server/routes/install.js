/**
 * 安装向导路由
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 检查是否已安装（防止重复安装）
 */
function isInstallLocked() {
  const lockPath = path.join(__dirname, '../.install.lock');
  return fs.existsSync(lockPath);
}

/**
 * 检查系统环境
 */
router.get('/check', async (req, res) => {
  try {
    let databaseOk = false;
    let tablesOk = false;
    let configured = false;
    let locked = isInstallLocked();

    // 检查 .env 文件是否存在
    const envPath = path.join(__dirname, '../.env');
    configured = fs.existsSync(envPath);

    if (configured) {
      // 如果已配置，尝试连接数据库
      try {
        const db = require('../config/database');
        await db.query('SELECT 1');
        databaseOk = true;

        // 检查关键表是否存在
        const [tables] = await db.query(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = ? 
          AND table_name IN ('users', 'notifications', 'smtp_config', 'contacts')
        `, [process.env.DB_NAME]);

        tablesOk = tables[0].count >= 4;
      } catch (error) {
        console.error('Database check error:', error.message);
      }
    }

    res.json({
      success: true,
      configured,
      database: databaseOk,
      tables: tablesOk,
      locked
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 测试数据库连接
 */
router.post('/test-db', async (req, res) => {
  const { host, port, user, password, database } = req.body;

  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host,
      port: port || 3306,
      user,
      password,
      database
    });

    await connection.query('SELECT 1');
    await connection.end();

    res.json({
      success: true,
      message: '数据库连接成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `连接失败: ${error.message}`
    });
  }
});

/**
 * 检查是否已安装
 */
router.get('/status', async (req, res) => {
  try {
    const envPath = path.join(__dirname, '../.env');
    const configured = fs.existsSync(envPath);

    if (!configured) {
      return res.json({
        success: true,
        installed: false
      });
    }

    // 如果已配置，检查用户表是否有数据
    try {
      const db = require('../config/database');
      const [users] = await db.query('SELECT COUNT(*) as count FROM users');
      const installed = users[0].count > 0;

      res.json({
        success: true,
        installed
      });
    } catch (error) {
      res.json({
        success: false,
        installed: false
      });
    }
  } catch (error) {
    res.json({
      success: false,
      installed: false
    });
  }
});

/**
 * 生成随机密钥
 */
function generateRandomSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 保存数据库配置并生成 .env 文件
 */
router.post('/save-config', async (req, res) => {
  // 检查是否已锁定
  if (isInstallLocked()) {
    return res.status(403).json({
      success: false,
      message: '系统已完成安装，无法重复配置'
    });
  }

  const { host, port, user, password, database } = req.body;

  try {
    // 先测试数据库连接
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: host || 'localhost',
      port: port || 3306,
      user,
      password,
      database
    });

    await connection.query('SELECT 1');
    await connection.end();

    // 连接成功，生成 .env 文件内容
    const envContent = `# 数据库配置（由安装向导自动生成）
# 生成时间: ${new Date().toLocaleString('zh-CN')}
DB_HOST=${host || 'localhost'}
DB_USER=${user}
DB_PASSWORD=${password}
DB_NAME=${database}
DB_PORT=${port || 3306}

# 服务器配置
PORT=3000
NODE_ENV=production

# JWT密钥（自动生成，请勿泄露）
JWT_SECRET=${generateRandomSecret()}
`;

    // 写入 .env 文件
    const envPath = path.join(__dirname, '../.env');
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('✅ .env 配置文件已生成');

    res.json({
      success: true,
      message: '数据库配置已保存'
    });

  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(400).json({
      success: false,
      message: `保存失败: ${error.message}`
    });
  }
});

/**
 * 初始化数据库表
 */
router.post('/init-database', async (req, res) => {
  try {
    // 检查 .env 是否已生成
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
      return res.status(400).json({
        success: false,
        message: '请先保存数据库配置'
      });
    }

    // 重新加载环境变量
    require('dotenv').config({ path: envPath });

    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../config/init-complete.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // 生成正确的密码哈希
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    // 替换占位符
    sql = sql.replace('$2a$10$PLACEHOLDER_HASH_WILL_BE_REPLACED', passwordHash);

    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    await connection.query(sql);
    await connection.end();

    console.log('✅ 数据库初始化完成');

    res.json({
      success: true,
      message: '数据库初始化成功'
    });

  } catch (error) {
    console.error('数据库初始化失败:', error);
    res.status(500).json({
      success: false,
      message: `初始化失败: ${error.message}`
    });
  }
});

/**
 * 完成安装并重启服务
 */
router.post('/complete', async (req, res) => {
  try {
    // 检查是否已锁定
    if (isInstallLocked()) {
      return res.status(403).json({
        success: false,
        message: '系统已完成安装'
      });
    }

    // 检查 .env 是否已生成
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
      return res.status(400).json({
        success: false,
        message: '请先保存数据库配置'
      });
    }

    // 创建安装锁定文件，防止重复安装
    const lockPath = path.join(__dirname, '../.install.lock');
    const lockContent = {
      installedAt: new Date().toISOString(),
      version: '1.0.0',
      message: '此文件用于防止重复安装，请勿删除'
    };
    fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2), 'utf8');

    console.log('🎉 安装完成，准备重启服务...');

    res.json({
      success: true,
      message: '安装完成，系统正在重启...'
    });

    // 延迟退出，让响应先发送
    setTimeout(() => {
      console.log('♻️  正在重启服务...');
      process.exit(0); // PM2 会自动重启服务
    }, 1000);

  } catch (error) {
    console.error('完成安装失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

