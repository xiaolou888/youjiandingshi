<template>
  <div class="contacts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收件人管理</span>
          <div class="header-actions">
            <el-button type="success" @click="showGroupDialog">
              <el-icon><FolderAdd /></el-icon>
              分组管理
            </el-button>
            <el-button type="primary" @click="showDialog('create')">
              <el-icon><Plus /></el-icon>
              添加联系人
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select v-model="filterGroupId" placeholder="全部分组" @change="loadList" clearable style="width: 150px;">
          <el-option label="全部分组" value="" />
          <el-option
            v-for="group in groups"
            :key="group.id"
            :label="`${group.name} (${group.member_count})`"
            :value="group.id"
          />
        </el-select>

        <el-select v-model="filterStatus" placeholder="全部状态" @change="loadList" style="width: 120px; margin-left: 12px;">
          <el-option label="全部状态" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>

        <el-input
          v-model="keyword"
          placeholder="搜索姓名、邮箱、部门"
          @keyup.enter="loadList"
          clearable
          style="width: 300px; margin-left: 12px;"
        >
          <template #append>
            <el-button :icon="Search" @click="loadList" />
          </template>
        </el-input>
      </div>

      <!-- 列表 -->
      <el-table :data="list" style="margin-top: 20px;" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" @click="showDialog('edit', row)">编辑</el-button>
            <el-popconfirm title="确定删除这个联系人吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '添加联系人' : '编辑联系人'"
      width="600px"
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入电话号码（可选）" />
        </el-form-item>

        <el-form-item label="部门">
          <el-input v-model="form.department" placeholder="请输入部门（可选）" />
        </el-form-item>

        <el-form-item label="职位">
          <el-input v-model="form.position" placeholder="请输入职位（可选）" />
        </el-form-item>

        <el-form-item label="所属分组">
          <el-select v-model="form.group_ids" multiple placeholder="请选择分组" style="width: 100%;">
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分组管理对话框 -->
    <el-dialog v-model="groupDialogVisible" title="分组管理" width="500px">
      <el-form :model="groupForm" inline style="margin-bottom: 20px;">
        <el-form-item>
          <el-input v-model="groupForm.name" placeholder="分组名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCreateGroup">添加分组</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="groups" border>
        <el-table-column prop="name" label="分组名称" />
        <el-table-column prop="member_count" label="成员数" width="80" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-popconfirm title="确定删除这个分组吗？" @confirm="handleDeleteGroup(row.id)">
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, FolderAdd } from '@element-plus/icons-vue'
import {
  getContactList,
  createContact,
  updateContact,
  toggleContact,
  deleteContact,
  getGroupList,
  createGroup,
  deleteGroup
} from '@/api/contact'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const groupDialogVisible = ref(false)
const dialogType = ref('create')
const formRef = ref(null)

const filterGroupId = ref('')
const filterStatus = ref('')
const keyword = ref('')

const list = ref([])
const groups = ref([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  group_ids: [],
  remark: ''
})

const groupForm = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getContactList({
      group_id: filterGroupId.value,
      status: filterStatus.value,
      keyword: keyword.value,
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

const loadGroups = async () => {
  try {
    const res = await getGroupList()
    groups.value = res.data
  } catch (error) {
    console.error('加载分组失败:', error)
  }
}

const showDialog = async (type, row = null) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    form.id = row.id
    form.name = row.name
    form.email = row.email
    form.phone = row.phone
    form.department = row.department
    form.position = row.position
    form.remark = row.remark
    
    // 加载分组信息
    try {
      const res = await import('@/api/contact').then(m => m.getContactDetail(row.id))
      form.group_ids = res.data.groups.map(g => g.id)
    } catch (error) {
      console.error('加载联系人详情失败:', error)
    }
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = null
  form.name = ''
  form.email = ''
  form.phone = ''
  form.department = ''
  form.position = ''
  form.group_ids = []
  form.remark = ''
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    const data = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      department: form.department,
      position: form.position,
      group_ids: form.group_ids,
      remark: form.remark
    }

    if (dialogType.value === 'create') {
      await createContact(data)
      ElMessage.success('添加成功')
    } else {
      await updateContact(form.id, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadList()
  } catch (error) {
    if (error.errors) return
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    await toggleContact(row.id)
    ElMessage.success(row.status === 1 ? '已禁用' : '已启用')
    loadList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (id) => {
  try {
    await deleteContact(id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const showGroupDialog = () => {
  groupDialogVisible.value = true
}

const handleCreateGroup = async () => {
  if (!groupForm.name) {
    ElMessage.warning('请输入分组名称')
    return
  }

  try {
    await createGroup(groupForm)
    ElMessage.success('添加成功')
    groupForm.name = ''
    groupForm.description = ''
    loadGroups()
  } catch (error) {
    // 错误已在request.js中处理
  }
}

const handleDeleteGroup = async (id) => {
  try {
    await deleteGroup(id)
    ElMessage.success('删除成功')
    loadGroups()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadList()
  loadGroups()
})
</script>

<style scoped>
.contacts-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
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
</style>


