import request from '@/utils/request'

// 用户登录
export const login = (data) => {
  return request.post('/api/auth/login', data)
}

// 获取当前用户信息
export const getUserInfo = () => {
  return request.get('/api/auth/me')
}

// 修改密码
export const changePassword = (data) => {
  return request.put('/api/auth/change-password', data)
}

// 修改个人信息
export const updateProfile = (data) => {
  return request.put('/api/auth/profile', data)
}

// 创建用户
export const createUser = (data) => {
  return request.post('/api/auth/create-user', data)
}



