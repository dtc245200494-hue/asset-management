const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

// GET /api/categories - Lấy danh sách danh mục và số lượng tài sản tương ứng
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT c.*, COUNT(a.id)::int AS asset_count
      FROM categories c
      LEFT JOIN assets a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.id ASC;
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Lỗi khi truy vấn danh mục', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// POST /api/categories - Tạo mới danh mục
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống' });
    }

    const check = await db.query('SELECT id FROM categories WHERE name ILIKE $1', [name.trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Danh mục này đã tồn tại' });
    }

    const result = await db.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description || '']
    );

    logger.info(`Đã tạo danh mục mới: ${name}`, { category_id: result.rows[0].id });
    res.status(201).json({ success: true, message: 'Thêm danh mục thành công', data: result.rows[0] });
  } catch (error) {
    logger.error('Lỗi tạo danh mục', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// DELETE /api/categories/:id - Xóa danh mục (chỉ khi không có tài sản)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const countCheck = await db.query('SELECT COUNT(*) FROM assets WHERE category_id = $1', [id]);
    if (parseInt(countCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể xóa danh mục này vì đang có ${countCheck.rows[0].count} tài sản thuộc danh mục` 
      });
    }

    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    logger.info(`Đã xóa danh mục ID=${id}`);
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    logger.error(`Lỗi xóa danh mục ID=${req.params.id}`, { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
