const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { hashPassword, comparePassword, generateToken, authMiddleware } = require('../utils/auth');

/**
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    // 查询用户
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND status = 1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 生成Token
    const token = generateToken(user);

    // 返回用户信息（不包含密码）
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

/**
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, nickname, email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

/**
 * 修改密码
 */
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 验证必填字段
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请输入旧密码和新密码' });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }

    // 查询当前用户
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = users[0];

    // 验证旧密码
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '旧密码错误' });
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
});

/**
 * 修改个人信息
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, email } = req.body;

    // 更新信息
    await db.query(
      'UPDATE users SET nickname = ?, email = ? WHERE id = ?',
      [nickname || '', email || '', req.user.id]
    );

    res.json({ success: true, message: '信息更新成功' });
  } catch (error) {
    console.error('更新信息失败:', error);
    res.status(500).json({ success: false, message: '更新信息失败' });
  }
});

/**
 * 创建用户（仅管理员，暂时允许所有登录用户）
 */
router.post('/create-user', authMiddleware, async (req, res) => {
  try {
    const { username, password, nickname, email } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
    }

    // 检查用户名是否存在
    const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    await db.query(
      'INSERT INTO users (username, password, nickname, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nickname || '', email || '']
    );

    res.json({ success: true, message: '用户创建成功' });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ success: false, message: '创建用户失败' });
  }
});

module.exports = router;


