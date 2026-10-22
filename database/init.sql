-- ====================================================================
-- ĐỀ 16: HỆ THỐNG QUẢN LÝ TÀI SẢN / THIẾT BỊ
-- Môn: Triển khai và Quản trị Hệ thống Phần mềm
-- Sinh viên: DTC245200494
-- ====================================================================

-- 1. Bảng USERS (Người dùng hệ thống)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'STAFF', -- ADMIN, MANAGER, STAFF
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng CATEGORIES (Danh mục tài sản)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng ASSETS (Thông tin tài sản / thiết bị)
-- Trạng thái: 'IN_USE' (Đang sử dụng), 'MAINTENANCE' (Đang bảo trì), 'AVAILABLE' (Sẵn sàng), 'DISPOSED' (Đã thanh lý)
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    location VARCHAR(150) NOT NULL DEFAULT 'Kho chính',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng MAINTENANCE_HISTORY (Lịch sử bảo dưỡng / sửa chữa)
CREATE TABLE IF NOT EXISTS maintenance_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    performed_by VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status_after VARCHAR(30) NOT NULL DEFAULT 'IN_USE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance_history(asset_id);
