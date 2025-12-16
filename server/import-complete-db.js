/**
 * 完整数据库初始化脚本
 * 用于一次性创建所有表结构和初始数据
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔄 开始初始化数据库...\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true
    });
    
    console.log('✅ 数据库连接成功');
    console.log(`📌 数据库: ${process.env.DB_NAME}\n`);
    
    // 读取完整初始化SQL文件
    const sql = fs.readFileSync('./config/init-complete.sql', 'utf8');
    
    // 执行SQL
    console.log('🔄 执行SQL脚本...\n');
    await connection.query(sql);
    
    console.log('✅ 数据库初始化完成！\n');
    console.log('📋 已创建的表：');
    console.log('   ✓ notifications (通知任务表)');
    console.log('   ✓ smtp_config (SMTP配置表)');
    console.log('   ✓ send_logs (发送日志表)');
    console.log('   ✓ users (用户表)');
    console.log('   ✓ contacts (联系人表)');
    console.log('   ✓ contact_groups (联系人分组表)\n');
    
    console.log('🔐 默认管理员账号：');
    console.log('   用户名: admin');
    console.log('   密码: admin123\n');
    
    console.log('🎉 初始化成功！可以启动服务了');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error('\n请检查：');
    console.log('1. 数据库配置是否正确 (.env文件)');
    console.log('2. 数据库是否已创建');
    console.log('3. 数据库用户是否有足够权限');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行初始化
initDatabase();

