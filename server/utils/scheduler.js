const schedule = require('node-schedule');
const db = require('../config/database');
const { sendEmail } = require('./mailer');

// 存储所有调度任务
const jobs = new Map();

/**
 * 生成Cron表达式
 */
function generateCronExpression(type, scheduleTime) {
  const date = new Date(scheduleTime);
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1;

  switch (type) {
    case 'daily':
      return `${minute} ${hour} * * *`; // 每天指定时间
    case 'weekly':
      const dayOfWeek = date.getDay();
      return `${minute} ${hour} * * ${dayOfWeek}`; // 每周指定时间
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`; // 每月指定日期
    case 'quarterly':
      // 每季度不使用cron表达式，需要特殊处理
      return null;
    case 'yearly':
      return `${minute} ${hour} ${dayOfMonth} ${month} *`; // 每年指定日期
    case 'custom':
      // 自定义周期不使用cron表达式，返回null
      return null;
    default:
      return null;
  }
}

/**
 * 计算自定义周期的下次执行时间
 */
function calculateNextCustomTime(startTime, periodDays, lastSentAt) {
  const start = new Date(startTime);
  const now = new Date();
  
  // 如果还没发送过，第一次就在起始时间发送
  if (!lastSentAt) {
    return start > now ? start : now;
  }
  
  // 计算下次发送时间：上次发送时间 + 周期天数
  const lastSent = new Date(lastSentAt);
  const nextTime = new Date(lastSent);
  nextTime.setDate(nextTime.getDate() + periodDays);
  
  return nextTime;
}

/**
 * 计算每季度的下次执行时间
 * @param {Number} quarterlyMonth - 季度内的月份（1-3）
 * @param {Number} quarterlyDay - 日期
 * @param {String} time - 时间 HH:mm
 * @param {Date} lastSentAt - 上次发送时间
 */
function calculateNextQuarterlyTime(quarterlyMonth, quarterlyDay, time, lastSentAt) {
  const now = new Date();
  const [hour, minute] = time.split(':').map(Number);
  
  // 计算当前是第几季度 (0-3)
  const currentQuarter = Math.floor(now.getMonth() / 3);
  
  // 计算目标月份（quarterlyMonth: 1=第一个月, 2=第二个月, 3=第三个月）
  const quarters = [
    [0, 1, 2],    // Q1: 1月, 2月, 3月
    [3, 4, 5],    // Q2: 4月, 5月, 6月
    [6, 7, 8],    // Q3: 7月, 8月, 9月
    [9, 10, 11]   // Q4: 10月, 11月, 12月
  ];
  
  // 尝试当前季度
  let targetMonth = quarters[currentQuarter][quarterlyMonth - 1];
  let targetYear = now.getFullYear();
  let targetDate = new Date(targetYear, targetMonth, quarterlyDay, hour, minute, 0);
  
  // 如果当前季度的时间已过，找下一个季度
  if (targetDate <= now || (lastSentAt && targetDate <= new Date(lastSentAt))) {
    let nextQuarter = (currentQuarter + 1) % 4;
    if (nextQuarter === 0) {
      targetYear++; // 跨年了
    }
    targetMonth = quarters[nextQuarter][quarterlyMonth - 1];
    targetDate = new Date(targetYear, targetMonth, quarterlyDay, hour, minute, 0);
  }
  
  return targetDate;
}

/**
 * 记录发送日志
 */
async function logSend(notificationId, title, recipients, status, errorMessage = null) {
  try {
    await db.query(
      'INSERT INTO send_logs (notification_id, title, recipients, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [notificationId, title, recipients, status, errorMessage]
    );
  } catch (error) {
    console.error('记录日志失败:', error);
  }
}

/**
 * 执行通知发送
 */
async function executeNotification(notification) {
  console.log(`📧 执行通知任务: ${notification.title}`);
  
  const recipients = JSON.parse(notification.recipients);
  const recipientsStr = recipients.join(', ');

  // 发送邮件
  const result = await sendEmail({
    to: recipientsStr,
    subject: notification.title,
    html: notification.content
  });

  // 记录日志
  await logSend(
    notification.id,
    notification.title,
    recipientsStr,
    result.success ? 'success' : 'failed',
    result.error || null
  );

  // 更新发送计数和最后发送时间
  await db.query(
    'UPDATE notifications SET last_sent_at = NOW(), sent_count = sent_count + 1 WHERE id = ?',
    [notification.id]
  );

  // 检查是否需要重复发送
  if (notification.enable_repeat && notification.repeat_times > 0) {
    const currentCount = (notification.sent_count || 0) + 1;
    
    if (currentCount < notification.repeat_times) {
      // 还需要继续发送，安排下次发送
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + notification.repeat_interval);
      
      console.log(`🔄 重复发送已调度: ${notification.title} - 第${currentCount + 1}次 - ${nextTime}`);
      
      // 重新获取最新的通知信息并调度
      setTimeout(async () => {
        const [updatedNotification] = await db.query('SELECT * FROM notifications WHERE id = ?', [notification.id]);
        if (updatedNotification[0] && updatedNotification[0].status === 'active') {
          await executeNotification(updatedNotification[0]);
        }
      }, notification.repeat_interval * 60 * 1000);
      
      return;
    } else {
      console.log(`✅ 重复发送已完成: ${notification.title} - 共${currentCount}次`);
      // 重置发送计数，为下次周期做准备
      await db.query('UPDATE notifications SET sent_count = 0 WHERE id = ?', [notification.id]);
    }
  }

  // 如果是单次任务，标记为已完成
  if (notification.type === 'once') {
    await db.query(
      'UPDATE notifications SET status = ? WHERE id = ?',
      ['completed', notification.id]
    );
    // 移除任务
    stopJob(notification.id);
  }
}

/**
 * 启动单个任务
 */
function startJob(notification) {
  // 如果任务已存在，先停止
  stopJob(notification.id);

  let job;

  if (notification.type === 'once') {
    // 单次定时任务
    const scheduleTime = new Date(notification.schedule_time);
    if (scheduleTime > new Date()) {
      job = schedule.scheduleJob(scheduleTime, async () => {
        await executeNotification(notification);
      });
      console.log(`⏰ 单次任务已调度: ${notification.title} - ${scheduleTime}`);
    }
  } else if (notification.type === 'custom') {
    // 自定义周期任务
    const periodDays = notification.custom_period_days;
    const startTime = notification.custom_period_start;
    
    if (periodDays && startTime) {
      // 计算下次执行时间
      const nextTime = calculateNextCustomTime(startTime, periodDays, notification.last_sent_at);
      
      if (nextTime > new Date()) {
        job = schedule.scheduleJob(nextTime, async () => {
          await executeNotification(notification);
          // 执行后，重新调度下一次
          const [updatedNotification] = await db.query('SELECT * FROM notifications WHERE id = ?', [notification.id]);
          if (updatedNotification[0].status === 'active') {
            startJob(updatedNotification[0]);
          }
        });
        console.log(`⏰ 自定义周期任务已调度: ${notification.title} - 每${periodDays}天 - 下次: ${nextTime}`);
      }
    }
  } else if (notification.type === 'quarterly') {
    // 每季度任务
    const quarterlyMonth = notification.quarterly_month;
    const quarterlyDay = notification.quarterly_day;
    const scheduleTime = notification.schedule_time;
    
    if (quarterlyMonth && quarterlyDay && scheduleTime) {
      const date = new Date(scheduleTime);
      const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      // 计算下次执行时间
      const nextTime = calculateNextQuarterlyTime(quarterlyMonth, quarterlyDay, time, notification.last_sent_at);
      
      if (nextTime > new Date()) {
        job = schedule.scheduleJob(nextTime, async () => {
          await executeNotification(notification);
          // 执行后，重新调度下一次季度
          const [updatedNotification] = await db.query('SELECT * FROM notifications WHERE id = ?', [notification.id]);
          if (updatedNotification[0].status === 'active') {
            startJob(updatedNotification[0]);
          }
        });
        console.log(`⏰ 每季度任务已调度: ${notification.title} - 第${quarterlyMonth}月${quarterlyDay}日 - 下次: ${nextTime}`);
      }
    }
  } else {
    // 其他周期性任务（daily, weekly, monthly, yearly）
    const cronExpression = notification.cron_expression;
    if (cronExpression) {
      job = schedule.scheduleJob(cronExpression, async () => {
        await executeNotification(notification);
      });
      console.log(`⏰ 周期任务已调度: ${notification.title} - ${cronExpression}`);
    }
  }

  if (job) {
    jobs.set(notification.id, job);
  }
}

/**
 * 停止单个任务
 */
function stopJob(notificationId) {
  const job = jobs.get(notificationId);
  if (job) {
    job.cancel();
    jobs.delete(notificationId);
    console.log(`⏹️ 任务已停止: ID ${notificationId}`);
  }
}

/**
 * 初始化所有活跃任务
 */
async function initScheduler() {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE status = ?',
      ['active']
    );

    console.log(`🚀 正在加载 ${notifications.length} 个活跃任务...`);

    for (const notification of notifications) {
      startJob(notification);
    }

    console.log('✅ 调度器初始化完成');
  } catch (error) {
    console.error('❌ 调度器初始化失败:', error);
  }
}

/**
 * 重新加载所有任务
 */
async function reloadAllJobs() {
  // 停止所有任务
  jobs.forEach((job, id) => {
    job.cancel();
  });
  jobs.clear();

  // 重新加载
  await initScheduler();
}

module.exports = {
  initScheduler,
  startJob,
  stopJob,
  reloadAllJobs,
  generateCronExpression,
  calculateNextCustomTime,
  calculateNextQuarterlyTime
};


