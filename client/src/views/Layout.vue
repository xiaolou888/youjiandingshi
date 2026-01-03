<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo-container">
        <el-icon v-if="isCollapse" :size="28" color="#409eff">
          <Bell />
        </el-icon>
        <template v-else>
          <el-icon :size="28" color="#409eff">
            <Bell />
          </el-icon>
          <span class="logo-text">通知系统</span>
        </template>
      </div>

      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item
          v-for="route in routes"
          :key="route.path"
          :index="route.path"
        >
          <el-icon>
            <component :is="iconMap[route.meta.icon]" />
          </el-icon>
          <template #title>{{ route.meta.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse" :size="20">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 主题切换 -->
          <el-tooltip :content="isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
            <el-button circle @click="toggleTheme">
              <el-icon :size="18">
                <Sunny v-if="isDark" />
                <Moon v-else />
              </el-icon>
            </el-button>
          </el-tooltip>

          <!-- 用户菜单 -->
          <el-dropdown @command="handleCommand">
            <div class="user-dropdown">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="user-name">{{ userInfo?.nickname || userInfo?.username || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import { 
  Bell, Sunny, Moon, Fold, Expand, User, UserFilled, ArrowDown, SwitchButton,
  DataLine, Message, DocumentCopy, Monitor
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const userStore = useUserStore()

// 图标映射
const iconMap = {
  Bell,
  DataLine,
  Message,
  DocumentCopy,
  User,
  Monitor
}

const isCollapse = ref(false)
const isDark = computed(() => themeStore.isDark)
const userInfo = computed(() => userStore.userInfo)

const routes = computed(() => {
  // 找到布局路由（path 为 '/'）
  const layoutRoute = router.options.routes.find(r => r.path === '/')
  if (!layoutRoute || !layoutRoute.children) {
    console.error('未找到布局路由或子路由')
    return []
  }
  // 返回子路由，并确保 path 是完整路径
  return layoutRoute.children
    .filter(r => !r.meta?.hideInMenu)
    .map(r => ({
      ...r,
      path: r.path.startsWith('/') ? r.path : `/${r.path}`
    }))
})

const currentRoute = computed(() => route.path)

const currentTitle = computed(() => {
  const layoutRoute = router.options.routes.find(r => r.path === '/')
  if (!layoutRoute || !layoutRoute.children) return ''
  
  const currentRoute = layoutRoute.children.find(r => r.path === route.path.replace('/', ''))
  return currentRoute?.meta?.title || ''
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const handleCommand = async (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (error) {
      // 取消退出
    }
  }
}

onMounted(async () => {
  // 加载用户信息
  try {
    await userStore.fetchUserInfo()
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  transition: width 0.3s;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-bottom: 1px solid var(--el-border-color);
  padding: 0 20px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-icon {
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: color 0.3s;
}

.collapse-icon:hover {
  color: var(--el-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: var(--el-fill-color-light);
}

.user-name {
  font-size: 14px;
  color: var(--el-text-color-regular);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  background-color: var(--el-bg-color-page);
  padding: 20px;
  overflow-y: auto;
}

/* 深色模式优化 */
html.dark .sidebar {
  background-color: #1a1a1a;
}

html.dark .header {
  background-color: #1a1a1a;
}

html.dark .main-content {
  background-color: #141414;
}
</style>

