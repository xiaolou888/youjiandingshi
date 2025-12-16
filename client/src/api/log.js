import request from '@/utils/request'

// 获取发送日志
export const getLogList = (params) => {
  return request.get('/logs', { params })
}

// 获取统计数据
export const getLogStats = () => {
  return request.get('/logs/stats')
}

// 清空日志
export const clearLogs = (days) => {
  return request.delete('/logs/clear', { params: { days } })
}


