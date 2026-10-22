const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const client = require('prom-client');
const logger = require('./logger');
const { initializeDatabase } = require('./db');

// Import routes
const assetRoutes = require('./routes/assets');
const categoryRoutes = require('./routes/categories');
const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. PROMETHEUS METRICS SETUP
// ==========================================
const register = new client.Registry();

// Thu thập default metrics (CPU, Memory, Event Loop, GC)
client.collectDefaultMetrics({
  app: 'asset-management',
  prefix: 'asset_app_',
  timeout: 5000,
  register
});

// Custom metric: Tổng số lượt HTTP request
const httpRequestCounter = new client.Counter({
  name: 'asset_http_requests_total',
  help: 'Tổng số lượt HTTP request tới website quản lý tài sản',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Custom metric: Thời gian phản hồi HTTP request (Histogram)
const httpRequestDurationHistogram = new client.Histogram({
  name: 'asset_http_request_duration_seconds',
  help: 'Phân bố thời gian phản hồi của HTTP request (giây)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// ==========================================
// 2. MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware để đo latency & count request
app.use((req, res, next) => {
  // Bỏ qua endpoint /metrics và static files khỏi metrics nghiệp vụ nếu muốn
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    
    // Chuẩn hóa route label để tránh high cardinality
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route.replace(/\/\d+/g, '/:id'),
      status_code: res.statusCode.toString()
    };

    httpRequestCounter.inc(labels);
    httpRequestDurationHistogram.observe(labels, durationInSeconds);
  });
  next();
});

// Morgan HTTP logger tích hợp vào Winston
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim(), { type: 'http_access' })
    }
  })
);

// Phục vụ frontend tĩnh
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// 3. SPECIAL ENDPOINTS (MONITORING & DEMO)
// ==========================================

// Endpoint Prometheus Scrape
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Lỗi khi xuất Prometheus metrics', { error: err.message });
    res.status(500).end(err);
  }
});

// Health check endpoint cho Docker / Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Demo endpoint tạo ERROR log phục vụ kiểm thử Loki & Promtail
app.get('/api/test-error', (req, res) => {
  const errMsg = 'Mô phỏng lỗi hệ thống có chủ đích: Kết nối cơ sở dữ liệu bị gián đoạn giả lập!';
  logger.error(errMsg, {
    test_type: 'loki_promtail_verification',
    error_code: 'ERR_SIMULATED_500',
    requested_by: req.ip
  });
  res.status(500).json({
    success: false,
    message: errMsg,
    logql_hint: '{service="app"} |= "ERROR"'
  });
});

// ==========================================
// 4. API ROUTES
// ==========================================
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/auth', authRoutes);

// Fallback: Nếu không khớp route API, điều hướng về frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint không tồn tại' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Lỗi ngoại lệ chưa được xử lý (Unhandled Exception)', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi nội bộ máy chủ!'
  });
});

// ==========================================
// 5. KHỞI ĐỘNG SERVER
// ==========================================
app.listen(PORT, async () => {
  logger.info(`=======================================================`);
  logger.info(` Hệ thống Quản lý Tài sản / Thiết bị (Đề 16) đang chạy`);
  logger.info(` Cổng lắng nghe (PORT): ${PORT}`);
  logger.info(` Metrics URL: http://localhost:${PORT}/metrics`);
  logger.info(`=======================================================`);
  
  // Khởi tạo bảng và nạp seed dữ liệu nếu cần
  await initializeDatabase();
});
