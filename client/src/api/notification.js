import request from '@/utils/request'

// 获取通知列表
export const getNotificationList = (params) => {
  return request.get('/notifications', { params })
}

// 获取通知详情
export const getNotificationDetail = (id) => {
  return request.get(`/notifications/${id}`)
}

// 创建通知
export const createNotification = (data) => {
  return request.post('/notifications', data)
}

// 更新通知
export const updateNotification = (id, data) => {
  return request.put(`/notifications/${id}`, data)
}

// 暂停/恢复通知
export const toggleNotification = (id) => {
  return request.put(`/notifications/${id}/toggle`)
}

// 删除通知
export const deleteNotification = (id) => {
  return request.delete(`/notifications/${id}`)
}



