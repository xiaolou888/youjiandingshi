<template>
  <div class="install-container">
    <div class="install-card">
      <div class="install-header">
        <h1>📧 消息通知系统</h1>
        <p class="subtitle">欢迎使用，让我们开始初始化配置</p>
      </div>

      <el-steps :active="currentStep" align-center finish-status="success" class="install-steps">
        <el-step title="环境检查" />
        <el-step title="数据库配置" />
        <el-step title="完成" />
      </el-steps>

      <div class="step-content">
        <!-- 步骤1: 环境检查 -->
        <div v-if="currentStep === 0" class="step-panel">
          <h2>🔍 环境检查</h2>
          <el-alert
            title="正在检查系统环境..."
            type="info"
            :closable="false"
            v-if="checking"
          />
          
          <div v-else class="check-list">
            <div class="check-item" :class="checks.backend ? 'success' : 'error'">
              <el-icon><CircleCheck v-if="checks.backend" /><CircleClose v-else /></el-icon>
              <span>后端服务</span>
              <span class="status">{{ checks.backend ? '正常' : '未连接' }}</span>
            </div>
            
            <div class="check-item" :class="checks.configured ? 'success' : 'warning'">
              <el-icon><CircleCheck v-if="checks.configured" /><CircleClose v-else /></el-icon>
              <span>数据库配置</span>
              <span class="status">{{ checks.configured ? '已配置' : '未配置' }}</span>
            </div>
            
            <div class="check-item" :class="checks.database ? 'success' : 'warning'">
              <el-icon><CircleCheck v-if="checks.database" /><CircleClose v-else /></el-icon>
              <span>数据库连接</span>
              <span class="status">{{ checks.database ? '正常' : checks.configured ? '未连接' : '等待配置' }}</span>
            </div>
            
            <div class="check-item" :class="checks.tables ? 'success' : 'warning'">
              <el-icon><CircleCheck v-if="checks.tables" /><CircleClose v-else /></el-icon>
              <span>数据表</span>
              <span class="status">{{ checks.tables ? '已初始化' : '未初始化' }}</span>
            </div>
          </div>

          <el-alert
            v-if="!checks.configured"
            title="📝 下一步操作"
            type="info"
            :closable="false"
            style="margin-top: 20px"
          >
            <p>请点击"下一步"，在第二步中填写数据库配置信息。</p>
            <p style="margin-top: 10px;">系统将自动生成配置文件，无需手动创建 .env 文件。</p>
          </el-alert>

          <el-alert
            v-else-if="checks.configured && (!checks.database || !checks.tables)"
            title="需要初始化数据库"
            type="warning"
            :closable="false"
            style="margin-top: 20px"
          >
            <p>数据库配置已保存，但需要初始化数据表。</p>
            <p style="margin-top: 10px;">请在宝塔终端执行以下命令：</p>
            <el-input
              :value="`cd /www/wwwroot/notification/server && node import-complete-db.js`"
              readonly
              style="margin-top: 10px"
            >
              <template #append>
                <el-button @click="copyCommand">复制</el-button>
              </template>
            </el-input>
            <p style="margin-top: 10px; color: #e6a23c;">执行完成后，点击"重新检查"按钮。</p>
          </el-alert>

          <div class="step-actions">
            <el-button 
              type="primary" 
              @click="checkEnvironment"
              :loading="checking"
            >
              重新检查
            </el-button>
            <el-button 
              type="primary" 
              @click="nextStep"
              :disabled="!canProceed"
            >
              下一步
            </el-button>
          </div>
        </div>

        <!-- 步骤2: 数据库配置 -->
        <div v-if="currentStep === 1" class="step-panel">
          <h2>🗄️ 数据库配置</h2>
          <p class="tip">填写数据库信息，系统将自动保存配置</p>

          <el-alert
            title="💡 提示"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <p>请在宝塔面板中创建好数据库后，填写以下信息：</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
              <li>数据库名、用户名、密码必须与宝塔中创建的一致</li>
              <li>点击"测试并保存"后，系统会自动生成配置文件</li>
              <li>无需手动创建 .env 文件</li>
            </ul>
          </el-alert>

          <el-form :model="dbConfig" label-width="120px" class="config-form">
            <el-form-item label="数据库地址">
              <el-input v-model="dbConfig.host" placeholder="localhost" />
              <span class="form-tip">通常为 localhost</span>
            </el-form-item>
            
            <el-form-item label="端口">
              <el-input v-model="dbConfig.port" placeholder="3306" />
              <span class="form-tip">MySQL 默认端口为 3306</span>
            </el-form-item>
            
            <el-form-item label="数据库名">
              <el-input v-model="dbConfig.database" placeholder="notification_system" />
              <span class="form-tip">在宝塔中创建的数据库名称</span>
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="dbConfig.user" placeholder="root" />
              <span class="form-tip">数据库用户名</span>
            </el-form-item>
            
            <el-form-item label="密码">
              <el-input v-model="dbConfig.password" type="password" show-password />
              <span class="form-tip">数据库密码</span>
            </el-form-item>

            <el-form-item>
              <el-button @click="testAndSaveConnection" :loading="testing" type="primary">
                测试并保存配置
              </el-button>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="dbTestResult"
            :title="dbTestResult.success ? '✅ 配置保存成功！' : '❌ 连接失败'"
            :type="dbTestResult.success ? 'success' : 'error'"
            :closable="false"
          >
            {{ dbTestResult.message }}
          </el-alert>

          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button 
              type="primary" 
              @click="completeInstall"
              :disabled="!dbConfigSaved"
              :loading="restarting"
            >
              完成安装
            </el-button>
          </div>
        </div>

        <!-- 步骤3: 完成 -->
        <div v-if="currentStep === 2" class="step-panel complete-panel">
          <el-result
            icon="success"
            title="🎉 安装完成！"
            sub-title="系统已准备就绪，开始使用吧"
          >
            <template #extra>
              <div class="complete-info">
                <el-alert
                  title="🔐 默认管理员账号"
                  type="success"
                  :closable="false"
                  style="margin-bottom: 20px"
                >
                  <p><strong>用户名：</strong>admin</p>
                  <p><strong>密码：</strong>admin123</p>
                  <p style="color: #e6a23c; margin-top: 10px;">
                    ⚠️ 建议登录后立即修改密码
                  </p>
                </el-alert>

                <el-descriptions :column="1" border>
                  <el-descriptions-item label="后端地址">
                    {{ window.location.origin }}
                  </el-descriptions-item>
                  <el-descriptions-item label="数据库">
                    {{ dbConfig.database }}
                  </el-descriptions-item>
                </el-descriptions>

                <div class="quick-start">
                  <h3>📚 快速开始</h3>
                  <ol>
                    <li>使用默认账号登录系统</li>
                    <li>修改默认密码（设置 → 修改密码）</li>
                    <li>配置SMTP邮件服务器</li>
                    <li>添加收件人信息</li>
                    <li>创建第一个通知任务</li>
                  </ol>
                </div>

                <el-button type="primary" size="large" @click="goToLogin">
                  立即登录
                </el-button>
              </div>
            </template>
          </el-result>
        </div>

        <!-- 旧的步骤3和步骤4（已废弃，保留以防需要） -->
        <div v-if="false" class="step-panel">
          <h2>👤 创建管理员账号（已废弃）</h2>
          <p class="tip">设置系统管理员账号，用于登录后台</p>

          <el-alert
            title="默认账号已创建"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <p>数据库初始化时已创建默认管理员账号：</p>
            <p><strong>用户名：</strong>admin</p>
            <p><strong>密码：</strong>admin123</p>
            <p style="color: #e6a23c; margin-top: 10px;">
              ⚠️ 建议登录后立即修改密码
            </p>
          </el-alert>

          <el-form :model="adminForm" label-width="120px" class="config-form">
            <el-form-item label="用户名">
              <el-input v-model="adminForm.username" placeholder="admin" />
              <span class="form-tip">用于登录系统</span>
            </el-form-item>
            
            <el-form-item label="密码">
              <el-input v-model="adminForm.password" type="password" show-password />
              <span class="form-tip">至少6位字符</span>
            </el-form-item>
            
            <el-form-item label="确认密码">
              <el-input v-model="adminForm.confirmPassword" type="password" show-password />
            </el-form-item>

            <el-form-item label="昵称">
              <el-input v-model="adminForm.nickname" placeholder="系统管理员" />
              <span class="form-tip">显示名称，可选</span>
            </el-form-item>

            <el-form-item label="邮箱">
              <el-input v-model="adminForm.email" placeholder="admin@example.com" />
              <span class="form-tip">用于接收系统通知，可选</span>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="restarting"
            title="⏳ 系统正在重启..."
            type="info"
            :closable="false"
            style="margin-top: 20px"
          >
            <p>配置已保存，后端服务正在重启中...</p>
            <p style="margin-top: 10px;">预计需要 3-5 秒，请稍候...</p>
          </el-alert>

          <div class="step-actions">
            <el-button @click="prevStep" :disabled="restarting">上一步</el-button>
            <el-button @click="useDefault" :loading="restarting">使用默认账号</el-button>
            <el-button type="primary" @click="createAdmin" :loading="restarting">创建新账号</el-button>
          </div>
        </div>

        <!-- 旧的步骤4（已废弃） -->
        <div v-if="false" class="step-panel complete-panel">
          <el-result
            icon="success"
            title="🎉 安装完成！"
            sub-title="系统已准备就绪，开始使用吧"
          >
            <template #extra>
              <div class="complete-info">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="管理员账号">
                    {{ completedInfo.username }}
                  </el-descriptions-item>
                  <el-descriptions-item label="后端地址">
                    {{ completedInfo.backendUrl }}
                  </el-descriptions-item>
                  <el-descriptions-item label="数据库">
                    {{ completedInfo.database }}
                  </el-descriptions-item>
                </el-descriptions>

                <div class="quick-start">
                  <h3>📚 快速开始</h3>
                  <ol>
                    <li>登录系统并修改默认密码</li>
                    <li>配置SMTP邮件服务器</li>
                    <li>添加收件人信息</li>
                    <li>创建第一个通知任务</li>
                  </ol>
                </div>

                <el-button type="primary" size="large" @click="goToLogin">
                  立即登录
                </el-button>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const currentStep = ref(0)
const checking = ref(false)
const testing = ref(false)
const dbConfigSaved = ref(false)
const restarting = ref(false)

// 环境检查结果
const checks = reactive({
  backend: false,
  configured: false,
  database: false,
  tables: false,
  locked: false
})

// 数据库配置
const dbConfig = reactive({
  host: 'localhost',
  port: '3306',
  database: 'notification_system',
  user: 'root',
  password: ''
})

const dbTestResult = ref(null)

// 管理员表单
const adminForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: ''
})

// 完成信息
const completedInfo = reactive({
  username: 'admin',
  backendUrl: 'http://localhost:3000',
  database: 'notification_system'
})

// 是否可以继续
const canProceed = computed(() => {
  // 如果已配置，检查数据库和表
  if (checks.configured) {
    return checks.backend && checks.database && checks.tables
  }
  // 如果未配置，只需要后端运行
  return checks.backend
})

// 检查环境
const checkEnvironment = async () => {
  checking.value = true
  
  try {
    // 检查后端连接
    const response = await request.get('/api/install/check')
    console.log('环境检查响应:', response)
    
    checks.backend = true
    checks.configured = response.configured || false
    checks.database = response.database || false
    checks.tables = response.tables || false
    checks.locked = response.locked || false
    
    // 如果已锁定，跳转到登录页
    if (checks.locked) {
      ElMessage.warning('系统已完成安装，正在跳转到登录页...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      return
    }
    
    // 如果已配置，更新数据库配置保存状态
    if (checks.configured) {
      dbConfigSaved.value = true
    }
  } catch (error) {
    console.error('环境检查失败:', error)
    checks.backend = false
    checks.configured = false
    checks.database = false
    checks.tables = false
    checks.locked = false
  } finally {
    checking.value = false
  }
}

// 测试并保存数据库连接
const testAndSaveConnection = async () => {
  testing.value = true
  dbTestResult.value = null
  
  try {
    // 先测试连接
    await request.post('/api/install/test-db', dbConfig)
    
    // 测试成功，保存配置
    await request.post('/api/install/save-config', dbConfig)
    
    // 初始化数据库表
    ElMessage.info('正在初始化数据库表...')
    await request.post('/api/install/init-database')
    
    dbTestResult.value = {
      success: true,
      message: '数据库配置已保存！数据库表已初始化完成。'
    }
    
    dbConfigSaved.value = true
    ElMessage.success('配置保存成功，数据库已初始化')
    
    // 延迟重新检查环境
    setTimeout(() => {
      checkEnvironment()
    }, 1000)
    
  } catch (error) {
    dbTestResult.value = {
      success: false,
      message: error.response?.data?.message || error.message || '操作失败，请检查配置'
    }
    dbConfigSaved.value = false
  } finally {
    testing.value = false
  }
}

// 创建管理员并完成安装
const createAdmin = async () => {
  if (!adminForm.username || !adminForm.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  
  if (adminForm.password !== adminForm.confirmPassword) {
    ElMessage.error('两次密码不一致')
    return
  }
  
  if (adminForm.password.length < 6) {
    ElMessage.error('密码至少6位字符')
    return
  }
  
  try {
    restarting.value = true
    
    // 创建管理员账号
    await request.post('/api/auth/register', adminForm)
    completedInfo.username = adminForm.username
    
    // 完成安装并重启
    await request.post('/api/install/complete')
    
    ElMessage.success('管理员账号创建成功，系统正在重启...')
    
    // 等待服务重启
    setTimeout(() => {
      currentStep.value = 3
      restarting.value = false
    }, 3000)
  } catch (error) {
    restarting.value = false
    ElMessage.error(error.response?.data?.message || '创建失败')
  }
}

// 完成安装
const completeInstall = async () => {
  try {
    restarting.value = true
    
    // 调用完成安装接口，触发服务重启
    await request.post('/api/install/complete')
    
    ElMessage.success('安装完成，系统正在重启...')
    
    // 等待服务重启（约3秒）
    setTimeout(() => {
      currentStep.value = 2 // 跳到完成页面
      restarting.value = false
    }, 3000)
  } catch (error) {
    restarting.value = false
    ElMessage.error('完成安装失败: ' + (error.response?.data?.message || error.message))
  }
}

// 使用默认账号并完成安装（已废弃，保留兼容）
const useDefault = completeInstall

// 复制命令
const copyCommand = () => {
  navigator.clipboard.writeText('cd server && node import-complete-db.js')
  ElMessage.success('命令已复制到剪贴板')
}

// 步骤控制
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 跳转到登录
const goToLogin = () => {
  localStorage.setItem('install_completed', 'true')
  router.push('/login')
}

// 初始化时检查环境
checkEnvironment()
</script>

<style scoped>
.install-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.install-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.install-header {
  text-align: center;
  margin-bottom: 40px;
}

.install-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 16px;
}

.install-steps {
  margin-bottom: 40px;
}

.step-content {
  min-height: 400px;
}

.step-panel {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-panel h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.tip {
  color: #666;
  margin-bottom: 30px;
}

.check-list {
  margin: 30px 0;
}

.check-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.check-item.success {
  border-color: #67c23a;
  background: #f0f9ff;
}

.check-item.error {
  border-color: #f56c6c;
  background: #fef0f0;
}

.check-item.warning {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.check-item .el-icon {
  font-size: 24px;
  margin-right: 15px;
}

.check-item.success .el-icon {
  color: #67c23a;
}

.check-item.error .el-icon {
  color: #f56c6c;
}

.check-item.warning .el-icon {
  color: #e6a23c;
}

.check-item span:nth-child(2) {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
}

.check-item .status {
  color: #666;
  font-size: 14px;
}

.config-form {
  max-width: 500px;
  margin: 30px 0;
}

.form-tip {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 5px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #e0e0e0;
}

.complete-panel {
  text-align: center;
}

.complete-info {
  max-width: 600px;
  margin: 0 auto;
}

.complete-info .el-descriptions {
  margin-bottom: 30px;
}

.quick-start {
  text-align: left;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin: 30px 0;
}

.quick-start h3 {
  color: #333;
  margin-bottom: 15px;
}

.quick-start ol {
  color: #666;
  line-height: 2;
  padding-left: 20px;
}

.quick-start li {
  margin-bottom: 8px;
}

/* 暗色模式 */
html.dark .install-card {
  background: #1e1e1e;
}

html.dark .install-header h1,
html.dark .step-panel h2 {
  color: #e0e0e0;
}

html.dark .subtitle,
html.dark .tip {
  color: #999;
}

html.dark .check-item {
  border-color: #333;
  background: #262626;
}

html.dark .check-item.success {
  border-color: #67c23a;
  background: #1a2e1a;
}

html.dark .check-item.error {
  border-color: #f56c6c;
  background: #2e1a1a;
}
</style>

