const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

router.get('/stats', async (req, res) => {
  try {
    // 1. Tổng quan số lượng theo trạng thái
    const statusQuery = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'IN_USE') AS in_use,
        COUNT(*) FILTER (WHERE status = 'MAINTENANCE') AS maintenance,
        COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available,
        COUNT(*) FILTER (WHERE status = 'DISPOSED') AS disposed,
        COALESCE(SUM(price), 0) AS total_value
      FROM assets;
    `;
    const statusRes = await db.query(statusQuery);

    // 2. Tổng số lượt và chi phí bảo trì
    const maintQuery = `
      SELECT 
        COUNT(*) AS total_maintenance,
        COALESCE(SUM(cost), 0) AS total_maint_cost
      FROM maintenance_history;
    `;
    const maintRes = await db.query(maintQuery);

    // 3. Phân bố theo danh mục
    const catQuery = `
      SELECT c.name, COUNT(a.id) AS asset_count
      FROM categories c
      LEFT JOIN assets a ON c.id = a.category_id
      GROUP BY c.id, c.name
      ORDER BY asset_count DESC;
    `;
    const catRes = await db.query(catQuery);

    // 4. Danh sách 5 tài sản mới nhất
    const recentQuery = `
      SELECT a.id, a.asset_code, a.name, a.price, a.status, a.location, c.name AS category_name
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 5;
    `;
    const recentRes = await db.query(recentQuery);

    const stats = {
      summary: statusRes.rows[0],
      maintenance: maintRes.rows[0],
      categories: catRes.rows,
      recentAssets: recentRes.rows
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Lỗi khi lấy thống kê dashboard', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy dữ liệu thống kê' });
  }
});

module.exports = router;
