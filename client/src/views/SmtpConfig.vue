<template>
  <div class="smtp-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>邮箱配置</span>
          <el-button type="primary" @click="showDialog('create')">
            <el-icon><Plus /></el-icon>
            添加配置
          </el-button>
        </div>
      </template>

      <!-- 配置说明 -->
      <el-alert
        title="📧 配置提示"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <ul style="margin: 10px 0; padding-left: 20px; line-height: 2;">
          <li><strong>QQ邮箱：</strong>smtp.qq.com，端口465，需要开启SMTP服务并使用授权码</li>
          <li><strong>163邮箱：</strong>smtp.163.com，端口465，需要开启SMTP服务并使用授权码</li>
          <li><strong>126邮箱：</strong>smtp.126.com，端口465，需要开启SMTP服务并使用授权码</li>
          <li><strong>企业邮箱：</strong>请联系邮箱管理员获取SMTP服务器信息</li>
          <li><strong>启用配置：</strong>点击"启用"按钮后，该配置将用于发送邮件（同时只能有一个配置处于启用状态）</li>
        </ul>
      </el-alert>

      <!-- 配置列表 -->
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="配置名称" width="150" />
        <el-table-column prop="host" label="SMTP服务器" min-width="150" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="user" label="发件人邮箱" min-width="180" />
        <el-table-column prop="from_name" label="发件人名称" width="120" />
        <el-table-column prop="secure" label="SSL" width="80">
          <template #default="{ row }">
            <el-tag :type="row.secure ? 'success' : 'info'" size="small">
              {{ row.secure ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.is_active" 
              type="success" 
              size="small" 
              @click="handleToggle(row.id)"
            >
              启用
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleTest(row.id)"
              :loading="testingId === row.id"
            >
              测试
            </el-button>
            <el-button size="small" @click="showDialog('edit', row)">编辑</el-button>
            <el-popconfirm title="确定删除这个配置吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="list.length === 0 && !loading" class="empty-state">
        <div class="empty-state-icon">📧</div>
        <div class="empty-state-text">还没有配置邮箱，请点击上方【添加配置】按钮</div>
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '添加配置' : '编辑配置'"
      width="600px"
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="form.name" placeholder="如：QQ邮箱、公司邮箱" />
        </el-form-item>

        <el-form-item label="SMTP服务器" prop="host">
          <el-input v-model="form.host" placeholder="如：smtp.qq.com" />
        </el-form-item>

        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%;" />
          <div class="form-tip">常用端口：465（SSL）、587（TLS）、25（无加密，不推荐）</div>
        </el-form-item>

        <el-form-item label="使用SSL" prop="secure">
          <el-switch v-model="form.secure" />
          <div class="form-tip">推荐开启SSL加密连接</div>
        </el-form-item>

        <el-form-item label="发件人邮箱" prop="user">
          <el-input v-model="form.user" placeholder="your_email@example.com" />
        </el-form-item>

        <el-form-item label="邮箱密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="邮箱密码或授权码"
            show-password
          />
          <div class="form-tip">QQ/163邮箱请使用授权码，而非登录密码</div>
        </el-form-item>

        <el-form-item label="发件人名称" prop="from_name">
          <el-input v-model="form.from_name" placeholder="如：通知系统" />
          <div class="form-tip">收件人看到的发件人名称</div>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getSmtpList,
  createSmtp,
  updateSmtp,
  toggleSmtp,
  testSmtp,
  deleteSmtp
} from '@/api/smtp'

const loading = ref(false)
const submitLoading = ref(false)
const testingId = ref(null)
const dialogVisible = ref(false)
const dialogType = ref('create')
const formRef = ref(null)

const list = ref([])

const form = reactive({
  id: null,
  name: '',
  host: '',
  port: 465,
  secure: true,
  user: '',
  password: '',
  from_name: '通知系统'
})

const rules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入SMTP服务器地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  user: [
    { required: true, message: '请输入发件人邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入邮箱密码或授权码', trigger: 'blur' }],
  from_name: [{ required: true, message: '请输入发件人名称', trigger: 'blur' }]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getSmtpList()
    list.value = res.data
  } catch (error) {
    ElMessage.error('加载列表失败')
  } finally {
    loading.value = false
  }
}

const showDialog = (type, row = null) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.host = row.host
    form.port = row.port
    form.secure = row.secure === 1
    form.user = row.user
    form.password = row.password
    form.from_name = row.from_name
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = null
  form.name = ''
  form.host = ''
  form.port = 465
  form.secure = true
  form.user = ''
  form.password = ''
  form.from_name = '通知系统'
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    const data = {
      name: form.name,
      host: form.host,
      port: form.port,
      secure: form.secure,
      user: form.user,
      password: form.password,
      from_name: form.from_name
    }

    if (dialogType.value === 'create') {
      await createSmtp(data)
      ElMessage.success('创建成功')
    } else {
      await updateSmtp(form.id, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadList()
  } catch (error) {
    if (error.errors) {
      return
    }
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleToggle = async (id) => {
  try {
    await toggleSmtp(id)
    ElMessage.success('已启用该配置')
    loadList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleTest = async (id) => {
  testingId.value = id
  try {
    const res = await testSmtp(id)
    if (res.success) {
      ElMessage.success('测试成功！SMTP配置正确')
    } else {
      ElMessage.error('测试失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('测试失败')
  } finally {
    testingId.value = null
  }
}

const handleDelete = async (id) => {
  try {
    await deleteSmtp(id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.smtp-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 14px;
}
</style>


