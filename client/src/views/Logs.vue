<template>
  <div class="logs-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">今日发送</div>
              <div class="stat-value">{{ stats.today?.total || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">成功</div>
              <div class="stat-value success">{{ stats.today?.success || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">失败</div>
              <div class="stat-value failed">{{ stats.today?.failed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">成功率</div>
              <div class="stat-value">{{ successRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>发送记录</span>
          <div>
            <el-popconfirm
              title="确定清空30天前的日志吗？"
              @confirm="handleClear(30)"
            >
              <template #reference>
                <el-button type="warning" size="small">
                  <el-icon><Delete /></el-icon>
                  清空旧日志
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="loadList">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="success">成功</el-radio-button>
          <el-radio-button label="failed">失败</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 列表 -->
      <el-table :data="list" style="margin-top: 20px;" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="通知标题" min-width="200" />
        <el-table-column prop="recipients" label="收件人" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
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
            <span v-if="row.error_message" class="error-text">{{ row.error_message }}</span>
            <span v-else class="success-text">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { getLogList, getLogStats, clearLogs } from '@/api/log'

const loading = ref(false)
const filterStatus = ref('')

const list = ref([])
const stats = ref({})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const successRate = computed(() => {
  const total = stats.value.today?.total || 0
  const success = stats.value.today?.success || 0
  if (total === 0) return 0
  return Math.round((success / total) * 100)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadStats = async () => {
  try {
    const res = await getLogStats()
    stats.value = res.data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getLogList({
      status: filterStatus.value,
      page: pagination.page,
      limit: pagination.limit
    })
    list.value = res.data
    pagination.total = res.pagination.total
  } catch (error) {
    ElMessage.error('加载列表失败')
  } finally {
    loading.value = false
  }
}

const handleClear = async (days) => {
  try {
    await clearLogs(days)
    ElMessage.success('清空成功')
    loadList()
    loadStats()
  } catch (error) {
    ElMessage.error('清空失败')
  }
}

onMounted(() => {
  loadStats()
  loadList()
})
</script>

<style scoped>
.logs-container {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.failed {
  color: #f56c6c;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.error-text {
  color: var(--el-color-danger);
  font-size: 12px;
}

.success-text {
  color: var(--el-text-color-secondary);
}
</style>


