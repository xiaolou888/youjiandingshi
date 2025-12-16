/**
 * 安装向导路由
 */
const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * 检查系统环境
 */
router.get('/check', async (req, res) => {
  try {
    let databaseOk = false;
    let tablesOk = false;

    try {
      // 测试数据库连接
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

    res.json({
      success: true,
      database: databaseOk,
      tables: tablesOk
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
    // 检查用户表是否有数据
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
});

module.exports = router;

