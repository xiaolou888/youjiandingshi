const nodemailer = require('nodemailer');
const db = require('../config/database');

/**
 * 获取活跃的SMTP配置
 */
async function getActiveSmtpConfig() {
  try {
    const [rows] = await db.query(
      'SELECT * FROM smtp_config WHERE is_active = 1 LIMIT 1'
    );
    return rows[0] || null;
  } catch (error) {
    console.error('获取SMTP配置失败:', error);
    return null;
  }
}

/**
 * 创建邮件传输器
 */
async function createTransporter() {
  const config = await getActiveSmtpConfig();
  
  if (!config) {
    throw new Error('未找到活跃的SMTP配置，请先配置邮件服务器');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure === 1,
    auth: {
      user: config.user,
      pass: config.password
    }
  });
}

/**
 * 发送邮件
 * @param {Object} options - 邮件选项
 * @param {string} options.to - 收件人（多个用逗号分隔）
 * @param {string} options.subject - 邮件主题
 * @param {string} options.html - 邮件HTML内容
 */
async function sendEmail(options) {
  try {
    const config = await getActiveSmtpConfig();
    if (!config) {
      throw new Error('未找到活跃的SMTP配置');
    }

    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"${config.from_name}" <${config.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试SMTP配置
 */
async function testSmtpConfig(config) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure === 1,
      auth: {
        user: config.user,
        pass: config.password
      }
    });

    await transporter.verify();
    return { success: true, message: 'SMTP配置测试成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendEmail,
  testSmtpConfig,
  getActiveSmtpConfig
};


