import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'

const routes = [
  {
    path: '/install',
    name: 'Install',
    component: () => import('@/views/Install.vue'),
    meta: { title: '系统安装', noAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'DataLine' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '通知管理', icon: 'Bell' }
      },
      {
        path: 'smtp',
        name: 'SmtpConfig',
        component: () => import('@/views/SmtpConfig.vue'),
        meta: { title: '邮箱配置', icon: 'Message' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/Logs.vue'),
        meta: { title: '发送记录', icon: 'DocumentCopy' }
      },
      {
        path: 'contacts',
        name: 'Contacts',
        component: () => import('@/views/Contacts.vue'),
        meta: { title: '收件人管理', icon: 'User' }
      },
      {
        path: 'monitor',
        name: 'Monitor',
        component: () => import('@/views/Monitor.vue'),
        meta: { title: '发送监控', icon: 'Monitor' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', icon: 'User', hideInMenu: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const installCompleted = localStorage.getItem('install_completed')
  
  // 检查是否需要安装（首次访问且未完成安装）
  if (!installCompleted && to.path !== '/install') {
    try {
      const response = await fetch('http://localhost:3000/api/install/status')
      const data = await response.json()
      
      // 如果系统未安装，跳转到安装页面
      if (!data.installed) {
        next('/install')
        return
      } else {
        localStorage.setItem('install_completed', 'true')
      }
    } catch (error) {
      // 如果后端未启动，仍然允许访问安装页面
      if (to.path !== '/install' && to.path !== '/login') {
        next('/install')
        return
      }
    }
  }
  
  // 如果访问安装页面但已经安装，跳转到登录页
  if (to.path === '/install' && installCompleted) {
    next('/login')
    return
  }
  
  // 如果是登录页，已登录则跳转首页
  if (to.path === '/login') {
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  // 如果不是登录页且没有token，跳转登录
  if (!token && !to.meta.noAuth) {
    next('/login')
    return
  }

  next()
})

export default router

