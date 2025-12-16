const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取发送日志
router.get('/', async (req, res) => {
  try {
    const { status, notification_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM send_logs WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (notification_id) {
      query += ' AND notification_id = ?';
      params.push(notification_id);
    }

    query += ' ORDER BY sent_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM send_logs WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (notification_id) {
      countQuery += ' AND notification_id = ?';
      countParams.push(notification_id);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    // 今日发送统计
    const [todayStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM send_logs 
      WHERE DATE(sent_at) = CURDATE()
    `);

    // 本周发送统计
    const [weekStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM send_logs 
      WHERE YEARWEEK(sent_at, 1) = YEARWEEK(CURDATE(), 1)
    `);

    // 本月发送统计
    const [monthStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM send_logs 
      WHERE YEAR(sent_at) = YEAR(CURDATE()) AND MONTH(sent_at) = MONTH(CURDATE())
    `);

    // 总体统计
    const [totalStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM send_logs
    `);

    res.json({
      success: true,
      data: {
        today: todayStats[0],
        week: weekStats[0],
        month: monthStats[0],
        total: totalStats[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 清空日志
router.delete('/clear', async (req, res) => {
  try {
    const { days } = req.query; // 清空多少天前的日志

    if (days) {
      await db.query('DELETE FROM send_logs WHERE sent_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [parseInt(days)]);
    } else {
      await db.query('TRUNCATE TABLE send_logs');
    }

    res.json({ success: true, message: '日志已清空' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;



