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
        <el-step title="管理员账号" />
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
            
            <div class="check-item" :class="checks.database ? 'success' : 'error'">
              <el-icon><CircleCheck v-if="checks.database" /><CircleClose v-else /></el-icon>
              <span>数据库连接</span>
              <span class="status">{{ checks.database ? '正常' : '未连接' }}</span>
            </div>
            
            <div class="check-item" :class="checks.tables ? 'success' : 'error'">
              <el-icon><CircleCheck v-if="checks.tables" /><CircleClose v-else /></el-icon>
              <span>数据表</span>
              <span class="status">{{ checks.tables ? '已初始化' : '未初始化' }}</span>
            </div>
          </div>

          <el-alert
            v-if="!checks.database || !checks.tables"
            title="需要初始化数据库"
            type="warning"
            :closable="false"
            style="margin-top: 20px"
          >
            <p>请先运行数据库初始化脚本：</p>
            <el-input
              :value="`cd server && node import-complete-db.js`"
              readonly
              style="margin-top: 10px"
            >
              <template #append>
                <el-button @click="copyCommand">复制</el-button>
              </template>
            </el-input>
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
          <p class="tip">测试数据库连接并配置基本信息</p>

          <el-form :model="dbConfig" label-width="120px" class="config-form">
            <el-form-item label="数据库地址">
              <el-input v-model="dbConfig.host" placeholder="localhost" />
            </el-form-item>
            
            <el-form-item label="端口">
              <el-input v-model="dbConfig.port" placeholder="3306" />
            </el-form-item>
            
            <el-form-item label="数据库名">
              <el-input v-model="dbConfig.database" placeholder="notification_system" />
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="dbConfig.user" placeholder="root" />
            </el-form-item>
            
            <el-form-item label="密码">
              <el-input v-model="dbConfig.password" type="password" show-password />
            </el-form-item>

            <el-form-item>
              <el-button @click="testConnection" :loading="testing">
                测试连接
              </el-button>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="dbTestResult"
            :title="dbTestResult.success ? '连接成功！' : '连接失败'"
            :type="dbTestResult.success ? 'success' : 'error'"
            :closable="false"
          >
            {{ dbTestResult.message }}
          </el-alert>

          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button 
              type="primary" 
              @click="nextStep"
              :disabled="!dbTestResult?.success"
            >
              下一步
            </el-button>
          </div>
        </div>

        <!-- 步骤3: 管理员账号 -->
        <div v-if="currentStep === 2" class="step-panel">
          <h2>👤 创建管理员账号</h2>
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

          <div class="step-actions">
            <el-button @click="prevStep">上一步</el-button>
            <el-button @click="useDefault">使用默认账号</el-button>
            <el-button type="primary" @click="createAdmin">创建新账号</el-button>
          </div>
        </div>

        <!-- 步骤4: 完成 -->
        <div v-if="currentStep === 3" class="step-panel complete-panel">
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

// 环境检查结果
const checks = reactive({
  backend: false,
  database: false,
  tables: false
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
  return checks.backend && checks.database && checks.tables
})

// 检查环境
const checkEnvironment = async () => {
  checking.value = true
  
  try {
    // 检查后端连接
    const response = await request.get('/api/install/check')
    checks.backend = true
    checks.database = response.data.database
    checks.tables = response.data.tables
  } catch (error) {
    checks.backend = false
    checks.database = false
    checks.tables = false
  } finally {
    checking.value = false
  }
}

// 测试数据库连接
const testConnection = async () => {
  testing.value = true
  dbTestResult.value = null
  
  try {
    const response = await request.post('/api/install/test-db', dbConfig)
    dbTestResult.value = {
      success: true,
      message: response.data.message || '数据库连接成功'
    }
  } catch (error) {
    dbTestResult.value = {
      success: false,
      message: error.response?.data?.message || '连接失败，请检查配置'
    }
  } finally {
    testing.value = false
  }
}

// 创建管理员
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
    await request.post('/api/auth/register', adminForm)
    completedInfo.username = adminForm.username
    ElMessage.success('管理员账号创建成功')
    currentStep.value = 3
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '创建失败')
  }
}

// 使用默认账号
const useDefault = () => {
  completedInfo.username = 'admin'
  currentStep.value = 3
}

// 复制命令
const copyCommand = () => {
  navigator.clipboard.writeText('cd server && node import-complete-db.js')
  ElMessage.success('命令已复制到剪贴板')
}

// 步骤控制
const nextStep = () => {
  if (currentStep.value < 3) {
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

