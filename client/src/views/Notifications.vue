<template>
  <div class="notifications-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知管理</span>
          <el-button type="primary" @click="showDialog('create')">
            <el-icon><Plus /></el-icon>
            新建通知
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="loadList">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="active">运行中</el-radio-button>
          <el-radio-button label="paused">已暂停</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
        </el-radio-group>

        <el-radio-group v-model="filterType" @change="loadList" style="margin-left: 12px;">
          <el-radio-button label="">全部类型</el-radio-button>
          <el-radio-button label="once">单次</el-radio-button>
          <el-radio-button label="daily">每天</el-radio-button>
          <el-radio-button label="weekly">每周</el-radio-button>
          <el-radio-button label="monthly">每月</el-radio-button>
          <el-radio-button label="quarterly">每季度</el-radio-button>
          <el-radio-button label="yearly">每年</el-radio-button>
          <el-radio-button label="custom">自定义周期</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 列表 -->
      <el-table :data="list" style="margin-top: 20px; width: 100%;" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="通知标题" min-width="180">
          <template #default="{ row }">
            {{ row.title }}
            <el-tag v-if="row.enable_repeat" type="warning" size="small" style="margin-left: 8px;">
              重复×{{ row.repeat_times }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="130">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type).type" size="small">
              {{ getTypeTag(row.type).label }}
              <span v-if="row.type === 'custom'">{{ row.custom_period_days }}天</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recipients" label="收件人" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ parseRecipients(row.recipients) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type" size="small">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="next_send_at" label="下次发送" width="170">
          <template #default="{ row }">
            <span v-if="row.status === 'completed'" style="color: #909399;">已完成</span>
            <span v-else-if="row.status === 'paused'" style="color: #909399;">
              {{ row.next_send_at ? formatDate(row.next_send_at) : '-' }}
            </span>
            <span v-else>
              {{ row.next_send_at ? formatDate(row.next_send_at) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; white-space: nowrap;">
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '暂停' : '恢复' }}
            </el-button>
            <el-button size="small" @click="showDialog('edit', row)">编辑</el-button>
            <el-popconfirm title="确定删除这条通知吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建通知' : '编辑通知'"
      width="900px"
      :close-on-click-modal="false"
      @closed="resetForm"
      class="notification-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入通知标题" />
        </el-form-item>

        <el-form-item label="通知类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="once">单次通知</el-radio>
            <el-radio label="daily">每天</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="monthly">每月</el-radio>
            <el-radio label="quarterly">每季度</el-radio>
            <el-radio label="yearly">每年</el-radio>
            <el-radio label="custom">自定义周期</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 自定义周期天数 -->
        <el-form-item 
          v-if="form.type === 'custom'" 
          label="周期天数" 
          prop="custom_period_days"
        >
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-input-number 
              v-model="form.custom_period_days" 
              :min="1" 
              :max="365"
              placeholder="请输入天数"
              style="width: 200px;"
            />
            <span style="color: var(--el-text-color-secondary); white-space: nowrap;">
              天（例如：18表示每18天发送一次）
            </span>
          </div>
        </el-form-item>

        <el-form-item label="发送时间" prop="schedule_time">
          <!-- 单次通知和自定义周期：完整日期时间 -->
          <el-date-picker
            v-if="form.type === 'once' || form.type === 'custom'"
            v-model="form.schedule_time"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />

          <!-- 每天：只选择时间 -->
          <el-time-picker
            v-else-if="form.type === 'daily'"
            v-model="form.schedule_time"
            placeholder="选择时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 200px;"
          />

          <!-- 每周：选择星期几 + 时间 -->
          <div v-else-if="form.type === 'weekly'" style="display: flex; gap: 12px;">
            <el-select v-model="form.weekly_day" placeholder="选择星期" style="width: 150px;">
              <el-option label="星期日" :value="0" />
              <el-option label="星期一" :value="1" />
              <el-option label="星期二" :value="2" />
              <el-option label="星期三" :value="3" />
              <el-option label="星期四" :value="4" />
              <el-option label="星期五" :value="5" />
              <el-option label="星期六" :value="6" />
            </el-select>
            <el-time-picker
              v-model="form.weekly_time"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 150px;"
            />
          </div>

          <!-- 每月：选择几号 + 时间 -->
          <div v-else-if="form.type === 'monthly'" style="display: flex; gap: 12px;">
            <el-input-number
              v-model="form.monthly_day"
              :min="1"
              :max="31"
              placeholder="几号"
              style="width: 120px;"
            />
            <span style="line-height: 32px;">号</span>
            <el-time-picker
              v-model="form.monthly_time"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 150px;"
            />
          </div>

          <!-- 每季度：选择季度内的月日 + 时间 -->
          <div v-else-if="form.type === 'quarterly'" style="display: flex; gap: 12px; align-items: center;">
            <el-select v-model="form.quarterly_month" placeholder="选择月份" style="width: 160px;">
              <el-option label="第1个月" :value="1" />
              <el-option label="第2个月" :value="2" />
              <el-option label="第3个月" :value="3" />
            </el-select>
            <el-input-number
              v-model="form.quarterly_day"
              :min="1"
              :max="31"
              placeholder="日期"
              style="width: 100px;"
            />
            <span>日</span>
            <el-time-picker
              v-model="form.quarterly_time"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 150px;"
            />
          </div>

          <!-- 每年：选择月日 + 时间 -->
          <div v-else-if="form.type === 'yearly'" style="display: flex; gap: 12px; align-items: center;">
            <el-input-number
              v-model="form.yearly_month"
              :min="1"
              :max="12"
              placeholder="月份"
              style="width: 100px;"
            />
            <span>月</span>
            <el-input-number
              v-model="form.yearly_day"
              :min="1"
              :max="31"
              placeholder="日期"
              style="width: 100px;"
            />
            <span>日</span>
            <el-time-picker
              v-model="form.yearly_time"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 150px;"
            />
          </div>

          <div class="form-tip">
            {{ getTimeHint(form.type) }}
          </div>
        </el-form-item>

        <el-form-item label="收件人" prop="recipients">
          <el-select
            v-model="form.recipients"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择收件人或输入邮箱"
            style="width: 100%;"
            @change="handleRecipientsChange"
          >
            <el-option-group label="常用收件人">
              <el-option
                v-for="contact in activeContacts"
                :key="contact.email"
                :label="`${contact.name} <${contact.email}>`"
                :value="contact.email"
              >
                <span style="float: left">{{ contact.name }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  {{ contact.email }}
                </span>
              </el-option>
            </el-option-group>
            <el-option-group v-if="recentContacts.length > 0" label="最近使用">
              <el-option
                v-for="contact in recentContacts"
                :key="'recent-' + contact.email"
                :label="`${contact.name} <${contact.email}>`"
                :value="contact.email"
              >
                <span style="float: left">{{ contact.name }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  {{ contact.email }}
                </span>
              </el-option>
            </el-option-group>
          </el-select>
          <div class="form-tip">
            可以从列表选择，也可以直接输入新邮箱（按回车添加）。新邮箱会自动保存到收件人管理
          </div>
        </el-form-item>

        <el-form-item label="邮件内容" prop="content">
          <EmailEditor v-model="form.content" />
        </el-form-item>

        <!-- 重复发送设置 -->
        <el-form-item label="重复发送">
          <el-switch v-model="form.enable_repeat" active-text="启用" inactive-text="关闭" />
          <div class="form-tip">重要通知可以间隔一段时间重复发送多次</div>
        </el-form-item>

        <el-form-item 
          v-if="form.enable_repeat" 
          label="发送次数"
          prop="repeat_times"
        >
          <el-input-number 
            v-model="form.repeat_times" 
            :min="1" 
            :max="10"
            style="width: 150px;"
          />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary);">
            次（每次任务触发时重复发送）
          </span>
        </el-form-item>

        <el-form-item 
          v-if="form.enable_repeat" 
          label="间隔时间"
          prop="repeat_interval"
        >
          <el-input-number 
            v-model="form.repeat_interval" 
            :min="1" 
            :max="1440"
            style="width: 150px;"
          />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary);">
            分钟（每次发送的间隔）
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getNotificationList,
  createNotification,
  updateNotification,
  toggleNotification,
  deleteNotification
} from '@/api/notification'
import { getContactList, createContact } from '@/api/contact'
import EmailEditor from '@/components/EmailEditor.vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('create')
const formRef = ref(null)

const filterStatus = ref('')
const filterType = ref('')

const list = ref([])
const contacts = ref([])
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 活跃的联系人（启用状态）
const activeContacts = computed(() => {
  return contacts.value.filter(c => c.status === 1)
})

// 最近使用的联系人（可以从localStorage读取）
const recentContacts = computed(() => {
  // 这里可以实现最近使用逻辑
  return []
})

const form = reactive({
  id: null,
  title: '',
  type: 'once',
  schedule_time: '',
  recipients: [],
  content: '',
  custom_period_days: 1,
  enable_repeat: false,
  repeat_times: 1,
  repeat_interval: 30,
  // 每周的字段
  weekly_day: 1,
  weekly_time: '09:00',
  // 每月的字段
  monthly_day: 1,
  monthly_time: '09:00',
  // 每季度的字段
  quarterly_month: 1,
  quarterly_day: 1,
  quarterly_time: '09:00',
  // 每年的字段
  yearly_month: 1,
  yearly_day: 1,
  yearly_time: '09:00'
})

const rules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  schedule_time: [{ required: true, message: '请选择发送时间', trigger: 'change' }],
  recipients: [{ required: true, message: '请添加至少一个收件人', trigger: 'change' }],
  content: [{ required: true, message: '请输入邮件内容', trigger: 'blur' }]
}

const getTypeTag = (type) => {
  const map = {
    once: { label: '单次', type: 'info' },
    daily: { label: '每天', type: 'primary' },
    weekly: { label: '每周', type: 'success' },
    monthly: { label: '每月', type: 'warning' },
    quarterly: { label: '每季度', type: 'danger' },
    yearly: { label: '每年', type: 'danger' },
    custom: { label: '自定义', type: '' }
  }
  return map[type] || { label: type, type: '' }
}

const getStatusTag = (status) => {
  const map = {
    active: { label: '运行中', type: 'success' },
    paused: { label: '已暂停', type: 'warning' },
    completed: { label: '已完成', type: 'info' }
  }
  return map[status] || { label: status, type: '' }
}

const getTimeHint = (type) => {
  const map = {
    once: '单次通知将在指定时间发送一次',
    daily: '每天在指定时间发送',
    weekly: '每周指定星期几的指定时间发送',
    monthly: '每月指定日期的指定时间发送',
    quarterly: '每季度的指定月日时间发送（例如：第1月15日代表1/4/7/10月的15日）',
    yearly: '每年指定月日的指定时间发送',
    custom: '从指定时间开始，按设定的天数周期发送'
  }
  return map[type] || ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 格式化本地时间为 YYYY-MM-DD HH:mm:ss（不转换时区）
const formatLocalDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getNotificationList({
      status: filterStatus.value,
      type: filterType.value,
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

// 加载联系人列表
const loadContacts = async () => {
  try {
    const res = await getContactList({ limit: 1000 })
    contacts.value = res.data
  } catch (error) {
    console.error('加载联系人失败:', error)
  }
}

// 处理收件人变化，自动保存新邮箱到联系人
const handleRecipientsChange = async (value) => {
  // 检查是否有新添加的邮箱（不在联系人列表中的）
  const existingEmails = contacts.value.map(c => c.email)
  const newEmails = value.filter(email => !existingEmails.includes(email))
  
  if (newEmails.length > 0) {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    for (const email of newEmails) {
      if (emailRegex.test(email)) {
        try {
          // 自动保存到联系人
          await createContact({
            name: email.split('@')[0], // 使用邮箱前缀作为姓名
            email: email,
            phone: '',
            department: '',
            position: '',
            group_ids: [],
            remark: '从通知创建时自动添加'
          })
          
          // 刷新联系人列表
          await loadContacts()
          
          console.log(`✅ 新邮箱 ${email} 已自动保存到收件人管理`)
        } catch (error) {
          // 如果保存失败（比如邮箱已存在），忽略错误
          console.log(`邮箱 ${email} 可能已存在`)
        }
      }
    }
  }
}

const showDialog = (type, row = null) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.title = row.title
    form.type = row.type
    // 安全解析 recipients
    try {
      if (typeof row.recipients === 'string') {
        try {
          form.recipients = JSON.parse(row.recipients)
        } catch (jsonError) {
          // 如果不是有效的 JSON，尝试按逗号分割
          form.recipients = row.recipients.split(',').map(r => r.trim()).filter(r => r)
        }
      } else if (Array.isArray(row.recipients)) {
        form.recipients = row.recipients
      } else {
        form.recipients = []
      }
    } catch (error) {
      console.error('解析收件人失败:', error)
      form.recipients = []
    }
    form.content = row.content
    form.custom_period_days = row.custom_period_days || 1
    form.enable_repeat = row.enable_repeat === 1
    form.repeat_times = row.repeat_times || 1
    form.repeat_interval = row.repeat_interval || 30
    
    // 解析时间 - 所有类型都从 schedule_time 解析
    if (row.schedule_time) {
      const date = new Date(row.schedule_time)
      
      if (row.type === 'once') {
        // 单次：完整日期时间
        form.schedule_time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      } else if (row.type === 'daily') {
        // 每天：只需要时间
        form.schedule_time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (row.type === 'weekly') {
        // 每周：从 schedule_time 解析星期几和时间
        form.weekly_day = date.getDay()
        form.weekly_time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (row.type === 'monthly') {
        // 每月：从 schedule_time 解析日期和时间
        form.monthly_day = date.getDate()
        form.monthly_time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (row.type === 'quarterly') {
        // 每季度：使用数据库存储的字段 + 从 schedule_time 解析时间
        form.quarterly_month = row.quarterly_month || 1
        form.quarterly_day = row.quarterly_day || 1
        form.quarterly_time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (row.type === 'yearly') {
        // 每年：从 schedule_time 解析月份、日期和时间
        form.yearly_month = date.getMonth() + 1
        form.yearly_day = date.getDate()
        form.yearly_time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      } else if (row.type === 'custom') {
        // 自定义周期：完整日期时间
        form.schedule_time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      }
    }
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = null
  form.title = ''
  form.type = 'once'
  form.schedule_time = ''
  form.recipients = []
  form.content = ''
  form.custom_period_days = 1
  form.enable_repeat = false
  form.repeat_times = 1
  form.repeat_interval = 30
  form.weekly_day = 1
  form.weekly_time = '09:00'
  form.monthly_day = 1
  form.monthly_time = '09:00'
  form.quarterly_month = 1
  form.quarterly_day = 1
  form.quarterly_time = '09:00'
  form.yearly_month = 1
  form.yearly_day = 1
  form.yearly_time = '09:00'
}

const handleSubmit = async () => {
  try {
    // 先验证其他必填字段（不包括 schedule_time）
    // 因为 schedule_time 需要根据类型动态构建
    if (!form.title) {
      ElMessage.warning('请输入通知标题')
      return
    }
    if (!form.type) {
      ElMessage.warning('请选择通知类型')
      return
    }
    if (!form.recipients || form.recipients.length === 0) {
      ElMessage.warning('请添加至少一个收件人')
      return
    }
    if (!form.content) {
      ElMessage.warning('请输入邮件内容')
      return
    }
    
    // 自定义周期类型需要验证周期天数
    if (form.type === 'custom') {
      if (!form.custom_period_days || form.custom_period_days < 1) {
        ElMessage.warning('请输入有效的周期天数（至少1天）')
        return
      }
    }
    
    // 验证时间字段
    if (form.type === 'once' || form.type === 'custom') {
      if (!form.schedule_time) {
        ElMessage.warning('请选择发送时间')
        return
      }
    } else if (form.type === 'daily') {
      if (!form.schedule_time) {
        ElMessage.warning('请选择发送时间')
        return
      }
    } else if (form.type === 'weekly') {
      if (form.weekly_day === null || form.weekly_day === undefined || !form.weekly_time) {
        ElMessage.warning('请选择星期和时间')
        return
      }
    } else if (form.type === 'monthly') {
      if (!form.monthly_day || !form.monthly_time) {
        ElMessage.warning('请选择日期和时间')
        return
      }
    } else if (form.type === 'quarterly') {
      if (!form.quarterly_month || !form.quarterly_day || !form.quarterly_time) {
        ElMessage.warning('请选择月份、日期和时间')
        return
      }
    } else if (form.type === 'yearly') {
      if (!form.yearly_month || !form.yearly_day || !form.yearly_time) {
        ElMessage.warning('请选择月份、日期和时间')
        return
      }
    }
    
    // 根据不同类型构建 schedule_time
    let scheduleTime = form.schedule_time
    const now = new Date()
    
    if (form.type === 'daily') {
      // 每天：只用时间，日期用今天
      const [hour, minute] = form.schedule_time.split(':')
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0)
      scheduleTime = formatLocalDateTime(date)
    } else if (form.type === 'weekly') {
      // 每周：找到下一个对应星期几
      const [hour, minute] = form.weekly_time.split(':')
      const currentDay = now.getDay()
      let daysUntilTarget = form.weekly_day - currentDay
      if (daysUntilTarget < 0) daysUntilTarget += 7
      if (daysUntilTarget === 0 && now.getHours() * 60 + now.getMinutes() > parseInt(hour) * 60 + parseInt(minute)) {
        daysUntilTarget = 7
      }
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + daysUntilTarget)
      targetDate.setHours(hour, minute, 0, 0)
      scheduleTime = formatLocalDateTime(targetDate)
    } else if (form.type === 'monthly') {
      // 每月：指定日期 + 时间
      const [hour, minute] = form.monthly_time.split(':')
      let month = now.getMonth()
      let year = now.getFullYear()
      // 如果本月这天已过，则设置为下月
      if (now.getDate() > form.monthly_day || 
          (now.getDate() === form.monthly_day && now.getHours() * 60 + now.getMinutes() > parseInt(hour) * 60 + parseInt(minute))) {
        month++
        if (month > 11) {
          month = 0
          year++
        }
      }
      const date = new Date(year, month, form.monthly_day, hour, minute, 0)
      scheduleTime = formatLocalDateTime(date)
    } else if (form.type === 'quarterly') {
      // 每季度：指定季度内的月日 + 时间
      const [hour, minute] = form.quarterly_time.split(':')
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const quarters = [
        [0, 1, 2],    // Q1
        [3, 4, 5],    // Q2
        [6, 7, 8],    // Q3
        [9, 10, 11]   // Q4
      ]
      
      let targetMonth = quarters[currentQuarter][form.quarterly_month - 1]
      let year = now.getFullYear()
      let targetDate = new Date(year, targetMonth, form.quarterly_day, hour, minute, 0)
      
      // 如果当前季度的时间已过，找下一个季度
      if (targetDate < now) {
        let nextQuarter = (currentQuarter + 1) % 4
        if (nextQuarter === 0) year++
        targetMonth = quarters[nextQuarter][form.quarterly_month - 1]
        targetDate = new Date(year, targetMonth, form.quarterly_day, hour, minute, 0)
      }
      
      scheduleTime = formatLocalDateTime(targetDate)
    } else if (form.type === 'yearly') {
      // 每年：指定月日 + 时间
      const [hour, minute] = form.yearly_time.split(':')
      let year = now.getFullYear()
      const targetDate = new Date(year, form.yearly_month - 1, form.yearly_day, hour, minute, 0)
      // 如果今年已过，则设置为明年
      if (targetDate < now) {
        year++
        targetDate.setFullYear(year)
      }
      scheduleTime = formatLocalDateTime(targetDate)
    }
    
    submitLoading.value = true

    const data = {
      title: form.title,
      type: form.type,
      schedule_time: scheduleTime,
      recipients: form.recipients,
      content: form.content,
      enable_repeat: form.enable_repeat,
      repeat_times: form.repeat_times,
      repeat_interval: form.repeat_interval
    }

    // 添加类型特定的字段
    if (form.type === 'custom') {
      data.custom_period_days = form.custom_period_days
    } else if (form.type === 'quarterly') {
      data.quarterly_month = form.quarterly_month
      data.quarterly_day = form.quarterly_day
    }

    if (dialogType.value === 'create') {
      await createNotification(data)
      ElMessage.success('创建成功')
    } else {
      await updateNotification(form.id, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadList()
  } catch (error) {
    if (error.errors) {
      // 表单验证失败
      return
    }
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    await toggleNotification(row.id)
    ElMessage.success(row.status === 'active' ? '已暂停' : '已恢复')
    loadList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (id) => {
  try {
    await deleteNotification(id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 解析收件人列表（优先显示名称）
const parseRecipients = (recipients) => {
  try {
    if (!recipients) return '-'
    
    let emailList = []
    if (typeof recipients === 'string') {
      try {
        const parsed = JSON.parse(recipients)
        emailList = Array.isArray(parsed) ? parsed : []
      } catch (jsonError) {
        // 如果不是有效的 JSON，尝试按逗号分割
        emailList = recipients.split(',').map(r => r.trim()).filter(r => r)
      }
    } else if (Array.isArray(recipients)) {
      emailList = recipients
    }
    
    if (emailList.length === 0) return '-'
    
    // 将邮箱转换为名称（如果有联系人）
    const displayList = emailList.map(email => {
      const contact = contacts.value.find(c => c.email === email)
      return contact && contact.name ? contact.name : email
    })
    
    return displayList.join(', ')
  } catch (error) {
    console.error('解析收件人失败:', error, recipients)
    // 如果完全失败，至少返回原始值
    return String(recipients)
  }
}

onMounted(() => {
  loadList()
  loadContacts()
})
</script>

<style scoped>
.notifications-container {
  max-width: 1400px;
  margin: 0 auto;
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

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 对话框样式优化 - 固定标题和底部按钮 */
.notification-dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.notification-dialog :deep(.el-dialog__header) {
  flex-shrink: 0;
  padding: 20px 20px 10px;
}

.notification-dialog :deep(.el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
  max-height: calc(90vh - 140px);
}

.notification-dialog :deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 10px 20px 20px;
  border-top: 1px solid var(--el-border-color-light);
}

/* 深色模式适配 */
html.dark .notification-dialog :deep(.el-dialog__footer) {
  border-top-color: var(--el-border-color);
}
</style>


