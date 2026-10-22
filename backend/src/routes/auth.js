const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const logger = require('../logger');
const { authenticateToken } = require('../middleware/auth');
const { JWT_SECRET } = require('../config/jwt');

// Chống brute force: Giới hạn tối đa 10 lần thử đăng nhập trong 15 phút cho mỗi IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Tài khoản hoặc IP đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Phát hiện tần suất thử mật khẩu bất thường (Rate Limit Exceeded) từ IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// POST /api/auth/login - Đăng nhập chuẩn mã hóa bcrypt 100% kèm Rate Limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const userRes = await db.query('SELECT * FROM users WHERE LOWER(username) = $1', [cleanUsername]);
    
    if (userRes.rows.length === 0) {
      logger.warn(`Đăng nhập thất bại: Tài khoản không tồn tại [${cleanUsername}]`);
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const user = userRes.rows[0];

    // Kiểm tra mật khẩu bằng thuật toán băm an toàn Bcrypt (Không cho phép fallback mật khẩu cố định)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn(`Đăng nhập thất bại: Sai mật khẩu tài khoản [${user.username}]`);
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    // Tạo token sử dụng JWT_SECRET tập trung bắt buộc
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    logger.info(`Đăng nhập thành công: User ${user.username} [Vai trò: ${user.role}]`);

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
    logger.error('Lỗi ngoại lệ trong quá trình đăng nhập', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ trong quá trình xác thực' });
  }
});

// GET /api/auth/me - Lấy thông tin phiên làm việc hiện tại
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
