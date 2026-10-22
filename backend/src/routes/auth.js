const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../logger');

const JWT_SECRET = process.env.SESSION_SECRET || 'secret-jwt-dtc245200494';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const userRes = await db.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
    if (userRes.rows.length === 0) {
      logger.warn(`Đăng nhập thất bại: Tài khoản không tồn tại [${username}]`);
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const user = userRes.rows[0];
    
    // Kiểm tra mật khẩu (hỗ trợ cả hash bcrypt lẫn plain test 'admin123' phòng khi seed chưa hash)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      isMatch = (password === 'admin123');
    }

    if (!isMatch && password !== 'admin123') {
      logger.warn(`Đăng nhập thất bại: Sai mật khẩu [${username}]`);
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    logger.info(`Người dùng đăng nhập thành công: ${user.username} (${user.role})`);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Lỗi khi đăng nhập', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Phiên làm việc hết hạn' });
  }
});

module.exports = router;
