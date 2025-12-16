// 数据库导入脚本
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

async function importDatabase() {
  console.log('开始导入数据库...');
  console.log('数据库配置:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ 数据库连接成功');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'server/config/init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 读取SQL文件成功');

    // 执行SQL
    await connection.query(sql);

    console.log('✅ 数据库导入成功！');
    console.log('\n已创建的表：');
    console.log('  - smtp_config (SMTP配置表)');
    console.log('  - notifications (通知任务表)');
    console.log('  - send_logs (发送日志表)');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库导入失败:', error.message);
    process.exit(1);
  }
}

importDatabase();


