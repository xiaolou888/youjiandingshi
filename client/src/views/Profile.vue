<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdateProfile" :loading="profileLoading">
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 修改密码 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码（至少6位）"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="passwordLoading">
                修改密码
              </el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建新用户 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>创建新用户</span>
          </template>
          <el-form :model="createUserForm" :rules="createUserRules" ref="createUserFormRef" label-width="100px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="createUserForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="createUserForm.password"
                type="password"
                placeholder="请输入密码（至少6位）"
                show-password
              />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="createUserForm.nickname" placeholder="请输入昵称（可选）" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="createUserForm.email" placeholder="请输入邮箱（可选）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCreateUser" :loading="createUserLoading">
                创建用户
              </el-button>
              <el-button @click="resetCreateUserForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updateProfile, changePassword, createUser } from '@/api/auth'

const userStore = useUserStore()

const profileLoading = ref(false)
const passwordLoading = ref(false)
const createUserLoading = ref(false)

const passwordFormRef = ref(null)
const createUserFormRef = ref(null)

const profileForm = reactive({
  username: '',
  nickname: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const createUserForm = reactive({
  username: '',
  password: '',
  nickname: '',
  email: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const createUserRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const loadUserInfo = async () => {
  await userStore.fetchUserInfo()
  profileForm.username = userStore.userInfo.username
  profileForm.nickname = userStore.userInfo.nickname
  profileForm.email = userStore.userInfo.email
}

const handleUpdateProfile = async () => {
  profileLoading.value = true
  try {
    await updateProfile({
      nickname: profileForm.nickname,
      email: profileForm.email
    })
    ElMessage.success('更新成功')
    await loadUserInfo()
  } catch (error) {
    // 错误已在request.js中处理
  } finally {
    profileLoading.value = false
  }
}

const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true

    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })

    ElMessage.success('密码修改成功，请重新登录')
    
    // 清空表单
    resetPasswordForm()
    
    // 退出登录
    setTimeout(() => {
      userStore.logout()
      window.location.href = '/login'
    }, 1500)
  } catch (error) {
    if (error.errors) {
      return
    }
    passwordLoading.value = false
  }
}

const handleCreateUser = async () => {
  try {
    await createUserFormRef.value.validate()
    createUserLoading.value = true

    await createUser(createUserForm)
    
    ElMessage.success('用户创建成功')
    resetCreateUserForm()
  } catch (error) {
    if (error.errors) {
      return
    }
  } finally {
    createUserLoading.value = false
  }
}

const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields()
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const resetCreateUserForm = () => {
  createUserFormRef.value?.resetFields()
  createUserForm.username = ''
  createUserForm.password = ''
  createUserForm.nickname = ''
  createUserForm.email = ''
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>



