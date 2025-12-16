const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { startJob, stopJob, generateCronExpression } = require('../utils/scheduler');

// 获取所有通知
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
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

// 获取单个通知详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建通知
router.post('/', async (req, res) => {
  try {
    const { title, content, type, schedule_time, recipients, custom_period_days, enable_repeat, repeat_times, repeat_interval, quarterly_month, quarterly_day } = req.body;

    // 验证必填字段
    if (!title || !content || !type || !recipients || recipients.length === 0) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    // 验证收件人邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `以下邮箱格式不正确: ${invalidEmails.join(', ')}` 
      });
    }

    let cronExpression = null;
    let nextSendAt = null;
    let customPeriodDays = null;
    let customPeriodStart = null;
    let quarterlyMonthValue = null;
    let quarterlyDayValue = null;

    if (type === 'once') {
      if (!schedule_time) {
        return res.status(400).json({ success: false, message: '单次通知需要指定发送时间' });
      }
      nextSendAt = schedule_time;
    } else if (type === 'custom') {
      // 自定义周期
      if (!schedule_time) {
        return res.status(400).json({ success: false, message: '自定义周期通知需要指定起始时间' });
      }
      if (!custom_period_days || custom_period_days < 1) {
        return res.status(400).json({ success: false, message: '请输入有效的周期天数（至少1天）' });
      }
      customPeriodDays = parseInt(custom_period_days);
      customPeriodStart = schedule_time;
      nextSendAt = schedule_time;
    } else if (type === 'quarterly') {
      // 每季度
      if (!schedule_time) {
        return res.status(400).json({ success: false, message: '每季度通知需要指定时间' });
      }
      if (!quarterly_month || quarterly_month < 1 || quarterly_month > 3) {
        return res.status(400).json({ success: false, message: '请选择季度内的月份（1-3）' });
      }
      if (!quarterly_day || quarterly_day < 1 || quarterly_day > 31) {
        return res.status(400).json({ success: false, message: '请输入有效的日期（1-31）' });
      }
      quarterlyMonthValue = parseInt(quarterly_month);
      quarterlyDayValue = parseInt(quarterly_day);
      nextSendAt = schedule_time;
    } else {
      // 其他周期类型
      if (!schedule_time) {
        return res.status(400).json({ success: false, message: '周期通知需要指定起始时间' });
      }
      cronExpression = generateCronExpression(type, schedule_time);
      nextSendAt = schedule_time;
    }

    const recipientsJson = JSON.stringify(recipients);

    // 处理重复发送参数
    const enableRepeat = enable_repeat ? 1 : 0;
    const repeatTimesValue = enable_repeat ? (repeat_times || 1) : 1;
    const repeatIntervalValue = enable_repeat ? (repeat_interval || 30) : 30;

    const [result] = await db.query(
      `INSERT INTO notifications 
       (title, content, type, schedule_time, cron_expression, recipients, status, next_send_at, 
        custom_period_days, custom_period_start, enable_repeat, repeat_times, repeat_interval, sent_count,
        quarterly_month, quarterly_day) 
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [title, content, type, schedule_time, cronExpression, recipientsJson, nextSendAt, 
       customPeriodDays, customPeriodStart, enableRepeat, repeatTimesValue, repeatIntervalValue,
       quarterlyMonthValue, quarterlyDayValue]
    );

    const notificationId = result.insertId;

    // 获取完整的通知信息并启动任务
    const [newNotification] = await db.query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    startJob(newNotification[0]);

    res.json({ success: true, message: '创建成功', id: notificationId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新通知
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, schedule_time, recipients, custom_period_days, enable_repeat, repeat_times, repeat_interval, quarterly_month, quarterly_day } = req.body;

    // 验证收件人邮箱格式
    if (recipients && recipients.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `以下邮箱格式不正确: ${invalidEmails.join(', ')}` 
        });
      }
    }

    let cronExpression = null;
    let nextSendAt = null;
    let customPeriodDays = null;
    let customPeriodStart = null;
    let quarterlyMonthValue = null;
    let quarterlyDayValue = null;

    if (type === 'once') {
      nextSendAt = schedule_time;
    } else if (type === 'custom') {
      if (!custom_period_days || custom_period_days < 1) {
        return res.status(400).json({ success: false, message: '请输入有效的周期天数' });
      }
      customPeriodDays = parseInt(custom_period_days);
      customPeriodStart = schedule_time;
      nextSendAt = schedule_time;
    } else if (type === 'quarterly') {
      // 每季度
      if (quarterly_month) {
        quarterlyMonthValue = parseInt(quarterly_month);
      }
      if (quarterly_day) {
        quarterlyDayValue = parseInt(quarterly_day);
      }
      nextSendAt = schedule_time;
    } else {
      cronExpression = generateCronExpression(type, schedule_time);
      nextSendAt = schedule_time;
    }

    const recipientsJson = JSON.stringify(recipients);

    // 处理重复发送参数
    const enableRepeat = enable_repeat ? 1 : 0;
    const repeatTimesValue = enable_repeat ? (repeat_times || 1) : 1;
    const repeatIntervalValue = enable_repeat ? (repeat_interval || 30) : 30;

    await db.query(
      `UPDATE notifications 
       SET title = ?, content = ?, type = ?, schedule_time = ?, 
           cron_expression = ?, recipients = ?, next_send_at = ?, 
           custom_period_days = ?, custom_period_start = ?,
           enable_repeat = ?, repeat_times = ?, repeat_interval = ?, sent_count = 0,
           quarterly_month = ?, quarterly_day = ?
       WHERE id = ?`,
      [title, content, type, schedule_time, cronExpression, recipientsJson, nextSendAt, 
       customPeriodDays, customPeriodStart, enableRepeat, repeatTimesValue, repeatIntervalValue,
       quarterlyMonthValue, quarterlyDayValue, id]
    );

    // 重新启动任务
    const [updatedNotification] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    if (updatedNotification[0].status === 'active') {
      startJob(updatedNotification[0]);
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 暂停/恢复通知
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT status FROM notifications WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    await db.query('UPDATE notifications SET status = ? WHERE id = ?', [newStatus, id]);

    if (newStatus === 'paused') {
      stopJob(parseInt(id));
    } else {
      const [notification] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
      startJob(notification[0]);
    }

    res.json({ success: true, message: newStatus === 'active' ? '已恢复' : '已暂停' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除通知
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 停止任务
    stopJob(parseInt(id));

    // 删除通知
    await db.query('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


