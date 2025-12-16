const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { testSmtpConfig } = require('../utils/mailer');

// 获取所有SMTP配置
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM smtp_config ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取活跃的SMTP配置
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM smtp_config WHERE is_active = 1 LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建SMTP配置
router.post('/', async (req, res) => {
  try {
    const { name, host, port, secure, user, password, from_name } = req.body;

    // 验证必填字段
    if (!name || !host || !port || !user || !password) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    const [result] = await db.query(
      'INSERT INTO smtp_config (name, host, port, secure, user, password, from_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [name, host, port, secure ? 1 : 0, user, password, from_name || '']
    );

    res.json({ success: true, message: '创建成功', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新SMTP配置
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, port, secure, user, password, from_name } = req.body;

    await db.query(
      'UPDATE smtp_config SET name = ?, host = ?, port = ?, secure = ?, user = ?, password = ?, from_name = ? WHERE id = ?',
      [name, host, port, secure ? 1 : 0, user, password, from_name || '', id]
    );

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 启用/禁用SMTP配置
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    // 先禁用所有配置
    await db.query('UPDATE smtp_config SET is_active = 0');

    // 启用当前配置
    await db.query('UPDATE smtp_config SET is_active = 1 WHERE id = ?', [id]);

    res.json({ success: true, message: '已启用该配置' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 测试SMTP配置
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM smtp_config WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '配置不存在' });
    }

    const result = await testSmtpConfig(rows[0]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除SMTP配置
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM smtp_config WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;



