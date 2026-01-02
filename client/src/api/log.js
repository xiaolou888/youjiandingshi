import request from '@/utils/request'

// 获取发送日志
export const getLogList = (params) => {
  return request.get('/api/logs', { params })
}

// 获取统计数据
export const getLogStats = () => {
  return request.get('/api/logs/stats')
}

// 清空日志
export const clearLogs = (days) => {
  return request.delete('/api/logs/clear', { params: { days } })
}



