<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon today">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">今日发送</div>
              <div class="stat-value">{{ stats.today?.total || 0 }}</div>
              <div class="stat-sub">成功 {{ stats.today?.success || 0 }} / 失败 {{ stats.today?.failed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon week">
              <el-icon :size="32"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本周发送</div>
              <div class="stat-value">{{ stats.week?.total || 0 }}</div>
              <div class="stat-sub">成功 {{ stats.week?.success || 0 }} / 失败 {{ stats.week?.failed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon month">
              <el-icon :size="32"><PieChart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本月发送</div>
              <div class="stat-value">{{ stats.month?.total || 0 }}</div>
              <div class="stat-sub">成功 {{ stats.month?.success || 0 }} / 失败 {{ stats.month?.failed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon :size="32"><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">累计发送</div>
              <div class="stat-value">{{ stats.total?.total || 0 }}</div>
              <div class="stat-sub">成功 {{ stats.total?.success || 0 }} / 失败 {{ stats.total?.failed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToPage('/notifications')">
              <el-icon><Plus /></el-icon>
              新建通知
            </el-button>
            <el-button type="success" size="large" @click="goToPage('/contacts')">
              <el-icon><User /></el-icon>
              收件人管理
            </el-button>
            <el-button type="info" size="large" @click="goToPage('/logs')">
              <el-icon><View /></el-icon>
              查看记录
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
            </div>
          </template>
          <div class="system-status">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="邮箱配置">
                <el-tag :type="smtpConfigured ? 'success' : 'danger'" size="small">
                  {{ smtpConfigured ? '已配置' : '未配置' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="活跃任务">
                <el-tag type="primary" size="small">{{ activeTasksCount }} 个</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="成功率">
                <el-progress 
                  :percentage="successRate" 
                  :color="successRate > 80 ? '#67c23a' : '#e6a23c'"
                />
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 使用说明 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📖 使用说明</span>
            </div>
          </template>
          <el-steps :active="currentStep" finish-status="success" align-center>
            <el-step title="配置邮箱" description="在【邮箱配置】中设置SMTP服务器" />
            <el-step title="添加收件人" description="在【收件人管理】中添加常用联系人（可选）" />
            <el-step title="创建通知" description="在【通知管理】中新建通知任务" />
            <el-step title="查看记录" description="在【发送记录】中查看发送情况" />
          </el-steps>

          <div class="help-tips">
            <el-alert
              title="温馨提示"
              type="info"
              :closable="false"
              style="margin-top: 20px;"
            >
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>首次使用请先配置SMTP邮箱服务器</li>
                <li>建议在【收件人管理】中预先添加常用联系人</li>
                <li>创建通知时可从列表选择收件人，也可直接输入新邮箱</li>
                <li>新输入的邮箱会自动保存到收件人管理</li>
                <li>支持单次、周期、自定义周期等多种通知类型</li>
                <li>重要通知可以设置重复发送（间隔+次数）</li>
              </ul>
            </el-alert>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getLogStats } from '@/api/log'
import { getActiveSmtp } from '@/api/smtp'
import { getNotificationList } from '@/api/notification'
import { Calendar, Tickets, PieChart, DataLine, Plus, User, View } from '@element-plus/icons-vue'

const router = useRouter()
const stats = ref({})
const smtpConfigured = ref(false)
const activeTasksCount = ref(0)

const currentStep = computed(() => {
  if (!smtpConfigured.value) return 0
  if (activeTasksCount.value === 0) return 2
  return 3
})

const successRate = computed(() => {
  const total = stats.value.total?.total || 0
  const success = stats.value.total?.success || 0
  if (total === 0) return 0
  return Math.round((success / total) * 100)
})

const loadData = async () => {
  try {
    // 加载统计数据
    const statsRes = await getLogStats()
    stats.value = statsRes.data

    // 检查SMTP配置
    const smtpRes = await getActiveSmtp()
    smtpConfigured.value = !!smtpRes.data

    // 获取活跃任务数
    const notificationsRes = await getNotificationList({ status: 'active', limit: 1000 })
    activeTasksCount.value = notificationsRes.data.length
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const goToPage = (path) => {
  router.push(path)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.week {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.month {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.total {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 120px;
}

.system-status {
  padding: 10px 0;
}

.help-tips ul {
  line-height: 2;
  color: var(--el-text-color-regular);
}

.help-tips li {
  font-size: 14px;
}
</style>


