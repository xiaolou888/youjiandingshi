// 数据库导入脚本
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

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
    const sqlFile = path.join(__dirname, 'config/init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 读取SQL文件成功');

    // 执行SQL
    await connection.query(sql);

    console.log('\n✅ 数据库导入成功！');
    console.log('\n已创建的表：');
    console.log('  ✓ smtp_config (SMTP配置表)');
    console.log('  ✓ notifications (通知任务表)');
    console.log('  ✓ send_logs (发送日志表)');
    console.log('\n📧 数据库已准备就绪，可以启动服务了！\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库导入失败:', error.message);
    console.error('\n请检查：');
    console.error('  1. 数据库服务是否运行');
    console.error('  2. .env 文件中的配置是否正确');
    console.error('  3. 数据库用户是否有足够的权限\n');
    process.exit(1);
  }
}

importDatabase();


