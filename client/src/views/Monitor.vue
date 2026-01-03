<template>
  <div class="monitor-container">
    <!-- 实时统计 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card success-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">今日成功</div>
              <div class="stat-value">{{ stats.today?.success || 0 }}</div>
              <div class="stat-rate">
                成功率: {{ calculateRate(stats.today) }}%
              </div>
            </div>
            <el-icon class="stat-icon" :size="48"><SuccessFilled /></el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card error-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">今日失败</div>
              <div class="stat-value">{{ stats.today?.failed || 0 }}</div>
              <div class="stat-rate">
                需要关注
              </div>
            </div>
            <el-icon class="stat-icon" :size="48"><CircleCloseFilled /></el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card warning-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">活跃任务</div>
              <div class="stat-value">{{ activeTasksCount }}</div>
              <div class="stat-rate">
                运行中
              </div>
            </div>
            <el-icon class="stat-icon" :size="48"><Timer /></el-icon>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card info-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">通知人数</div>
              <div class="stat-value">{{ contactsCount }}</div>
              <div class="stat-rate">
                联系人
              </div>
            </div>
            <el-icon class="stat-icon" :size="48"><User /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近发送记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📊 发送监控（最近50条）</span>
          <el-button @click="loadData" :icon="Refresh" size="small">刷新</el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="loadLogs">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="success">成功</el-radio-button>
          <el-radio-button label="failed">失败</el-radio-button>
        </el-radio-group>

        <el-button @click="autoRefresh = !autoRefresh" :type="autoRefresh ? 'success' : 'info'" style="margin-left: 12px;">
          <el-icon><VideoPlay v-if="!autoRefresh" /><VideoPause v-else /></el-icon>
          {{ autoRefresh ? '自动刷新中' : '自动刷新' }}
        </el-button>

        <span style="margin-left: 12px; color: var(--el-text-color-secondary);">
          每30秒自动刷新
        </span>
      </div>

      <!-- 表格 -->
      <el-table :data="logs" style="margin-top: 20px;" v-loading="loading" :height="500">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="通知标题" min-width="180" />
        <el-table-column prop="recipients" label="收件人" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small" class="status-tag">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sent_at" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.sent_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="200">
          <template #default="{ row }">
            <span v-if="row.error_message" class="error-text">
              {{ row.error_message }}
            </span>
            <span v-else style="color: var(--el-text-color-secondary);">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  SuccessFilled, 
  CircleCloseFilled, 
  Timer, 
  User, 
  Refresh,
  VideoPlay,
  VideoPause
} from '@element-plus/icons-vue'
import { getLogList, getLogStats } from '@/api/log'
import { getNotificationList } from '@/api/notification'
import { getContactList } from '@/api/contact'

const loading = ref(false)
const filterStatus = ref('')
const autoRefresh = ref(false)
let refreshTimer = null

const stats = ref({})
const activeTasksCount = ref(0)
const contactsCount = ref(0)
const logs = ref([])

const calculateRate = (stat) => {
  if (!stat || !stat.total || stat.total === 0) return 0
  return Math.round((stat.success / stat.total) * 100)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  // 5分钟内显示"刚刚"
  if (diff < 5 * 60 * 1000) {
    return '刚刚'
  }
  
  // 1小时内显示"X分钟前"
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 今天显示"今天 HH:mm"
  if (date.toDateString() === now.toDateString()) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天显示"昨天 HH:mm"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 其他显示完整日期时间
  return date.toLocaleString('zh-CN')
}

const loadStats = async () => {
  try {
    const res = await getLogStats()
    stats.value = res.data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadActiveTasks = async () => {
  try {
    const res = await getNotificationList({ status: 'active', limit: 1000 })
    activeTasksCount.value = res.data.length
  } catch (error) {
    console.error('加载活跃任务失败:', error)
  }
}

const loadContactsCount = async () => {
  try {
    const res = await getContactList({ status: 1, limit: 1 })
    contactsCount.value = res.pagination.total
  } catch (error) {
    console.error('加载联系人数失败:', error)
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await getLogList({
      status: filterStatus.value,
      limit: 50
    })
    logs.value = res.data
  } catch (error) {
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  await Promise.all([
    loadStats(),
    loadActiveTasks(),
    loadContactsCount(),
    loadLogs()
  ])
}

const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      loadData()
    }, 30000) // 30秒刷新一次
    ElMessage.success('已开启自动刷新（每30秒）')
  } else {
    ElMessage.info('已关闭自动刷新')
  }
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

// 监听自动刷新开关
import { watch } from 'vue'
watch(autoRefresh, () => {
  startAutoRefresh()
})
</script>

<style scoped>
.monitor-container {
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
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-rate {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-icon {
  opacity: 0.3;
}

.success-card .stat-value {
  color: #67c23a;
}

.success-card .stat-icon {
  color: #67c23a;
}

.error-card .stat-value {
  color: #f56c6c;
}

.error-card .stat-icon {
  color: #f56c6c;
}

.warning-card .stat-value {
  color: #e6a23c;
}

.warning-card .stat-icon {
  color: #e6a23c;
}

.info-card .stat-value {
  color: #409eff;
}

.info-card .stat-icon {
  color: #409eff;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.error-text {
  color: var(--el-color-danger);
  font-size: 12px;
}

/* 状态标签样式 - 防止换行 */
.status-tag {
  white-space: nowrap;
}
</style>



