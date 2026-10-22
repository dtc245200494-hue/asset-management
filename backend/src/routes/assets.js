const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/assets - Danh sách tài sản (Công khai đọc dữ liệu)
router.get('/', async (req, res) => {
  try {
    const { q, status, category_id } = req.query;
    let query = `
      SELECT a.*, c.name AS category_name
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (a.asset_code ILIKE $${params.length} OR a.name ILIKE $${params.length} OR a.location ILIKE $${params.length})`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    if (category_id && category_id !== 'ALL') {
      params.push(parseInt(category_id, 10));
      query += ` AND a.category_id = $${params.length}`;
    }

    query += ` ORDER BY a.id DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    logger.error('Lỗi khi truy vấn danh sách tài sản', { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi truy vấn tài sản' });
  }
});

// GET /api/assets/:id - Chi tiết 1 tài sản kèm lịch sử bảo trì
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assetQuery = `
      SELECT a.*, c.name AS category_name
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      WHERE a.id = $1
    `;
    const assetRes = await db.query(assetQuery, [id]);

    if (assetRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản' });
    }

    const maintQuery = `
      SELECT * FROM maintenance_history
      WHERE asset_id = $1
      ORDER BY maintenance_date DESC
    `;
    const maintRes = await db.query(maintQuery, [id]);

    const asset = assetRes.rows[0];
    asset.maintenance_history = maintRes.rows;

    res.json({ success: true, data: asset });
  } catch (error) {
    logger.error(`Lỗi khi lấy chi tiết tài sản ID=${req.params.id}`, { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// POST /api/assets - Thêm tài sản mới (BẮT BUỘC ĐĂNG NHẬP VỚI QUYỀN ADMIN HOẶC MANAGER)
router.post('/', authenticateToken, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { asset_code, name, category_id, purchase_date, price, status, location, notes } = req.body;

    if (!asset_code || !name || !category_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ: Mã tài sản, Tên và Danh mục' });
    }

    // Chuẩn hóa mã tài sản thành chữ in hoa TRƯỚC KHI kiểm tra trùng
    const normalizedCode = asset_code.trim().toUpperCase();

    // Kiểm tra trùng mã tài sản
    const checkDup = await db.query('SELECT id FROM assets WHERE UPPER(asset_code) = $1', [normalizedCode]);
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Mã tài sản "${normalizedCode}" đã tồn tại trên hệ thống` });
    }

    const insertQuery = `
      INSERT INTO assets (asset_code, name, category_id, purchase_date, price, status, location, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      normalizedCode,
      name.trim(),
      parseInt(category_id, 10),
      purchase_date || new Date().toISOString().split('T')[0],
      parseFloat(price) || 0,
      status || 'AVAILABLE',
      location ? location.trim() : 'Kho chính',
      notes ? notes.trim() : ''
    ];

    const result = await db.query(insertQuery, values);
    logger.info(`Đã thêm mới tài sản [${normalizedCode}] bởi user: ${req.user.username}`);
    res.status(201).json({ success: true, message: 'Thêm tài sản thành công', data: result.rows[0] });
  } catch (error) {
    // Bắt mã lỗi UNIQUE CONSTRAINT của PostgreSQL (code 23505)
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Mã tài sản đã tồn tại trên cơ sở dữ liệu (Unique constraint violation)' });
    }
    logger.error('Lỗi khi thêm mới tài sản', { error: error.message, body: req.body });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi thêm tài sản: ' + error.message });
  }
});

// PUT /api/assets/:id - Cập nhật thông tin tài sản (BẮT BUỘC ĐĂNG NHẬP)
router.put('/:id', authenticateToken, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_code, name, category_id, purchase_date, price, status, location, notes } = req.body;

    const checkExist = await db.query('SELECT id, asset_code FROM assets WHERE id = $1', [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản để cập nhật' });
    }

    const normalizedCode = asset_code ? asset_code.trim().toUpperCase() : checkExist.rows[0].asset_code;

    // Nếu đổi mã, kiểm tra trùng mã khác
    if (asset_code && normalizedCode !== checkExist.rows[0].asset_code) {
      const dupCheck = await db.query('SELECT id FROM assets WHERE UPPER(asset_code) = $1 AND id <> $2', [normalizedCode, id]);
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Mã tài sản "${normalizedCode}" đã thuộc về thiết bị khác` });
      }
    }

    const updateQuery = `
      UPDATE assets
      SET 
        asset_code = $1,
        name = COALESCE($2, name),
        category_id = COALESCE($3, category_id),
        purchase_date = COALESCE($4, purchase_date),
        price = COALESCE($5, price),
        status = COALESCE($6, status),
        location = COALESCE($7, location),
        notes = COALESCE($8, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *;
    `;

    const values = [
      normalizedCode,
      name ? name.trim() : null,
      category_id ? parseInt(category_id, 10) : null,
      purchase_date || null,
      price !== undefined ? parseFloat(price) : null,
      status || null,
      location ? location.trim() : null,
      notes ? notes.trim() : null,
      id
    ];

    const result = await db.query(updateQuery, values);
    logger.info(`Cập nhật thành công tài sản ID=${id} [${normalizedCode}] bởi user: ${req.user.username}`);
    res.json({ success: true, message: 'Cập nhật tài sản thành công', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Mã tài sản đã tồn tại trên cơ sở dữ liệu' });
    }
    logger.error(`Lỗi cập nhật tài sản ID=${req.params.id}`, { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật tài sản' });
  }
});

// DELETE /api/assets/:id - Xóa tài sản (BẮT BUỘC QUYỀN ADMIN)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM assets WHERE id = $1 RETURNING asset_code, name', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản cần xóa' });
    }

    logger.warn(`Tài sản ID=${id} [${result.rows[0].asset_code}] ĐÃ BỊ XÓA bởi user: ${req.user.username}`);
    res.json({ success: true, message: `Đã xóa tài sản ${result.rows[0].asset_code} thành công` });
  } catch (error) {
    logger.error(`Lỗi khi xóa tài sản ID=${req.params.id}`, { error: error.message });
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa tài sản' });
  }
});

module.exports = router;
