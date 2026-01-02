import request from '@/utils/request'

// 获取所有SMTP配置
export const getSmtpList = () => {
  return request.get('/api/smtp')
}

// 获取活跃的SMTP配置
export const getActiveSmtp = () => {
  return request.get('/api/smtp/active')
}

// 创建SMTP配置
export const createSmtp = (data) => {
  return request.post('/api/smtp', data)
}

// 更新SMTP配置
export const updateSmtp = (id, data) => {
  return request.put(`/api/smtp/${id}`, data)
}

// 启用/禁用SMTP配置
export const toggleSmtp = (id) => {
  return request.put(`/api/smtp/${id}/toggle`)
}

// 测试SMTP配置
export const testSmtp = (id) => {
  return request.post(`/api/smtp/${id}/test`)
}

// 删除SMTP配置
export const deleteSmtp = (id) => {
  return request.delete(`/api/smtp/${id}`)
}



