import request from '@/utils/request'

// ========== 联系人管理 ==========

// 获取联系人列表
export const getContactList = (params) => {
  return request.get('/api/contacts', { params })
}

// 获取联系人详情
export const getContactDetail = (id) => {
  return request.get(`/api/contacts/${id}`)
}

// 创建联系人
export const createContact = (data) => {
  return request.post('/api/contacts', data)
}

// 更新联系人
export const updateContact = (id, data) => {
  return request.put(`/api/contacts/${id}`, data)
}

// 启用/禁用联系人
export const toggleContact = (id) => {
  return request.put(`/api/contacts/${id}/toggle`)
}

// 删除联系人
export const deleteContact = (id) => {
  return request.delete(`/api/contacts/${id}`)
}

// ========== 分组管理 ==========

// 获取分组列表
export const getGroupList = () => {
  return request.get('/api/contacts/groups/list')
}

// 创建分组
export const createGroup = (data) => {
  return request.post('/api/contacts/groups', data)
}

// 更新分组
export const updateGroup = (id, data) => {
  return request.put(`/api/contacts/groups/${id}`, data)
}

// 删除分组
export const deleteGroup = (id) => {
  return request.delete(`/api/contacts/groups/${id}`)
}

// 获取分组成员
export const getGroupMembers = (id) => {
  return request.get(`/api/contacts/groups/${id}/members`)
}



