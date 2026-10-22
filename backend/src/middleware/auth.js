const jwt = require('jsonwebtoken');
const logger = require('../logger');

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('CRITICAL SECURITY ERROR: SESSION_SECRET (JWT_SECRET) is missing in environment variables!');
}

/**
 * Middleware xác thực JWT Token bắt buộc
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    logger.warn(`Truy cập bị từ chối (401): Không có Bearer token [${req.method} ${req.originalUrl}] - IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực tài khoản. Vui lòng đăng nhập để thực hiện thao tác này.'
    });
  }

  const secret = process.env.SESSION_SECRET || 'fallback-secret-for-dev-only';
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      logger.warn(`Truy cập bị từ chối (401): Token không hợp lệ hoặc đã hết hạn [${req.method} ${req.originalUrl}]`);
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware phân quyền theo vai trò (Role-based access control)
 * @param  {...string} allowedRoles - Danh sách các vai trò được phép (ví dụ: 'ADMIN', 'MANAGER')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa được xác thực danh tính' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Từ chối quyền truy cập (403): User ${req.user.username} (${req.user.role}) không có quyền gọi [${req.method} ${req.originalUrl}]`);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có đủ quyền hạn để thực hiện thao tác này.'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
