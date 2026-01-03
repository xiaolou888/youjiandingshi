/**
 * 修复数据库中 recipients 字段的格式
 * 将非 JSON 格式的收件人字段转换为 JSON 数组格式
 */

require('dotenv').config();
const db = require('./config/database');

async function fixRecipients() {
  console.log('🔧 开始修复 recipients 字段格式...\n');
  
  try {
    // 获取所有通知
    const [notifications] = await db.query('SELECT id, title, recipients FROM notifications');
    
    console.log(`📊 找到 ${notifications.length} 条通知记录\n`);
    
    let fixedCount = 0;
    let alreadyValidCount = 0;
    
    for (const notification of notifications) {
      const { id, title, recipients } = notification;
      
      // 检查是否已经是有效的 JSON 格式
      let isValid = false;
      try {
        const parsed = JSON.parse(recipients);
        if (Array.isArray(parsed)) {
          isValid = true;
          alreadyValidCount++;
        }
      } catch (error) {
        // 不是有效的 JSON
      }
      
      if (!isValid) {
        console.log(`❌ ID ${id}: "${title}"`);
        console.log(`   原始值: ${recipients}`);
        
        // 尝试修复
        let emailList = [];
        if (typeof recipients === 'string') {
          // 按逗号分割
          emailList = recipients.split(',').map(r => r.trim()).filter(r => r);
        }
        
        if (emailList.length > 0) {
          const recipientsJson = JSON.stringify(emailList);
          
          // 更新数据库
          await db.query(
            'UPDATE notifications SET recipients = ? WHERE id = ?',
            [recipientsJson, id]
          );
          
          console.log(`   ✅ 修复为: ${recipientsJson}\n`);
          fixedCount++;
        } else {
          console.log(`   ⚠️ 无法解析，跳过\n`);
        }
      }
    }
    
    console.log('═══════════════════════════════════════');
    console.log(`✅ 修复完成！`);
    console.log(`   - 已修复: ${fixedCount} 条`);
    console.log(`   - 已是正确格式: ${alreadyValidCount} 条`);
    console.log(`   - 总计: ${notifications.length} 条`);
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
  }
}

// 执行修复
fixRecipients();


