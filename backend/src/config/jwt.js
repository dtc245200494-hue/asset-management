/**
 * Cấu hình JWT Secret tập trung (Security Hardening)
 * Bắt buộc biến môi trường SESSION_SECRET có độ dài tối thiểu 32 ký tự
 * Tuyệt đối loại bỏ giá trị dự phòng (fallback) để ngăn chặn rủi ro an ninh
 */

const JWT_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET || JWT_SECRET.trim().length < 32) {
  throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET chưa được cấu hình hợp lệ hoặc ngắn hơn 32 ký tự! Yêu cầu thiết lập biến môi trường SESSION_SECRET.');
}

module.exports = { JWT_SECRET };
