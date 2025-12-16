const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../utils/auth');

// 所有接口都需要登录
router.use(authMiddleware);

// ========== 联系人管理 ==========

// 获取所有联系人
router.get('/', async (req, res) => {
  try {
    const { status, group_id, keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT c.* FROM contacts c WHERE 1=1';
    const params = [];

    // 按状态筛选
    if (status !== undefined && status !== '') {
      query += ' AND c.status = ?';
      params.push(parseInt(status));
    }

    // 按分组筛选
    if (group_id) {
      query += ' AND c.id IN (SELECT contact_id FROM contact_group_relation WHERE group_id = ?)';
      params.push(parseInt(group_id));
    }

    // 关键词搜索
    if (keyword) {
      query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.department LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM contacts c WHERE 1=1';
    const countParams = [];
    
    if (status !== undefined && status !== '') {
      countQuery += ' AND c.status = ?';
      countParams.push(parseInt(status));
    }
    if (group_id) {
      countQuery += ' AND c.id IN (SELECT contact_id FROM contact_group_relation WHERE group_id = ?)';
      countParams.push(parseInt(group_id));
    }
    if (keyword) {
      countQuery += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.department LIKE ?)';
      const searchKeyword = `%${keyword}%`;
      countParams.push(searchKeyword, searchKeyword, searchKeyword);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取联系人失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个联系人详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM contacts WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '联系人不存在' });
    }

    // 获取该联系人所属分组
    const [groups] = await db.query(`
      SELECT g.* FROM contact_groups g
      INNER JOIN contact_group_relation r ON g.id = r.group_id
      WHERE r.contact_id = ?
    `, [id]);

    res.json({ success: true, data: { ...rows[0], groups } });
  } catch (error) {
    console.error('获取联系人详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建联系人
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, department, position, tags, remark, group_ids } = req.body;

    // 验证必填字段
    if (!name || !email) {
      return res.status(400).json({ success: false, message: '姓名和邮箱为必填项' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    // 检查邮箱是否已存在
    const [existing] = await db.query('SELECT id FROM contacts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '该邮箱已存在' });
    }

    // 插入联系人
    const [result] = await db.query(
      'INSERT INTO contacts (name, email, phone, department, position, tags, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone || '', department || '', position || '', tags || '', remark || '']
    );

    const contactId = result.insertId;

    // 添加到分组
    if (group_ids && Array.isArray(group_ids) && group_ids.length > 0) {
      const values = group_ids.map(gid => [contactId, gid]);
      await db.query(
        'INSERT INTO contact_group_relation (contact_id, group_id) VALUES ?',
        [values]
      );
    }

    res.json({ success: true, message: '创建成功', id: contactId });
  } catch (error) {
    console.error('创建联系人失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新联系人
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, position, tags, remark, group_ids } = req.body;

    // 验证必填字段
    if (!name || !email) {
      return res.status(400).json({ success: false, message: '姓名和邮箱为必填项' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    // 检查邮箱是否被其他联系人使用
    const [existing] = await db.query('SELECT id FROM contacts WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '该邮箱已被其他联系人使用' });
    }

    // 更新联系人
    await db.query(
      'UPDATE contacts SET name = ?, email = ?, phone = ?, department = ?, position = ?, tags = ?, remark = ? WHERE id = ?',
      [name, email, phone || '', department || '', position || '', tags || '', remark || '', id]
    );

    // 更新分组关系
    await db.query('DELETE FROM contact_group_relation WHERE contact_id = ?', [id]);
    if (group_ids && Array.isArray(group_ids) && group_ids.length > 0) {
      const values = group_ids.map(gid => [id, gid]);
      await db.query(
        'INSERT INTO contact_group_relation (contact_id, group_id) VALUES ?',
        [values]
      );
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新联系人失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 启用/禁用联系人
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT status FROM contacts WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '联系人不存在' });
    }

    const newStatus = rows[0].status === 1 ? 0 : 1;
    await db.query('UPDATE contacts SET status = ? WHERE id = ?', [newStatus, id]);

    res.json({ success: true, message: newStatus === 1 ? '已启用' : '已禁用' });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除联系人
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== 分组管理 ==========

// 获取所有分组
router.get('/groups/list', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, COUNT(r.contact_id) as member_count
      FROM contact_groups g
      LEFT JOIN contact_group_relation r ON g.id = r.group_id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取分组失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建分组
router.post('/groups', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '分组名称不能为空' });
    }

    const [result] = await db.query(
      'INSERT INTO contact_groups (name, description) VALUES (?, ?)',
      [name, description || '']
    );

    res.json({ success: true, message: '创建成功', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '分组名称已存在' });
    }
    console.error('创建分组失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新分组
router.put('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '分组名称不能为空' });
    }

    await db.query(
      'UPDATE contact_groups SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '分组名称已存在' });
    }
    console.error('更新分组失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除分组
router.delete('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM contact_groups WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除分组失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取分组成员
router.get('/groups/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT c.* FROM contacts c
      INNER JOIN contact_group_relation r ON c.id = r.contact_id
      WHERE r.group_id = ?
      ORDER BY c.name
    `, [id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取分组成员失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


