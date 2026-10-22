const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

// GET /api/maintenance - Danh sách lịch sử bảo trì
router.get('/', async (req, res) => {
  try {
    const { asset_id } = req.query;
    let query = `
      SELECT m.*, a.asset_code, a.name AS asset_name, c.name AS category_name
      FROM maintenance_history m
      JOIN assets a ON m.asset_id = a.id
      JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (asset_id) {
      params.push(parseInt(asset_id, 10));
      query += ` AND m.asset_id = $${params.length}`;
    }

    query += ` ORDER BY m.maintenance_date DESC, m.id DESC;`;

    const result = await db.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    logger.error('Lỗi khi truy vấn lịch sử bảo trì', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// POST /api/maintenance - Thêm mới bản ghi bảo dưỡng & cập nhật trạng thái thiết bị
router.post('/', async (req, res) => {
  try {
    const { asset_id, maintenance_date, performed_by, description, cost, status_after } = req.body;

    if (!asset_id || !performed_by || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp: Thiết bị, Người thực hiện và Nội dung sửa chữa' 
      });
    }

    const checkAsset = await db.query('SELECT id, asset_code, name FROM assets WHERE id = $1', [asset_id]);
    if (checkAsset.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
    }

    // Bắt đầu transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO maintenance_history (asset_id, maintenance_date, performed_by, description, cost, status_after)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        parseInt(asset_id, 10),
        maintenance_date || new Date().toISOString().split('T')[0],
        performed_by.trim(),
        description.trim(),
        parseFloat(cost) || 0,
        status_after || 'IN_USE'
      ];
      const maintRes = await client.query(insertQuery, values);

      // Cập nhật trạng thái của tài sản theo status_after
      if (status_after) {
        await client.query(
          'UPDATE assets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [status_after, asset_id]
        );
      }

      await client.query('COMMIT');
      logger.info(`Ghi nhận bảo trì cho thiết bị ${checkAsset.rows[0].asset_code}`, { 
        record_id: maintRes.rows[0].id, 
        cost 
      });

      res.status(201).json({ 
        success: true, 
        message: 'Ghi nhận bảo trì thành công', 
        data: maintRes.rows[0] 
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Lỗi khi thêm lịch sử bảo trì', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu bảo trì: ' + error.message });
  }
});

// DELETE /api/maintenance/:id - Xóa bản ghi bảo trì
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM maintenance_history WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi bảo trì' });
    }

    logger.info(`Đã xóa bản ghi bảo trì ID=${id}`);
    res.json({ success: true, message: 'Xóa bản ghi bảo trì thành công' });
  } catch (error) {
    logger.error(`Lỗi xóa bản ghi bảo trì ID=${req.params.id}`, { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
