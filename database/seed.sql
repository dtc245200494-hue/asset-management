-- ====================================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA)
-- Hệ thống Quản lý Tài sản / Thiết bị - Đề 16
-- ====================================================================

-- 1. Tài khoản mẫu được băm Bcrypt chuẩn (Mật khẩu: hien140106)
-- Bcrypt Hash: $2a$10$YRyiiGZgixrwtv6FVkPWVeBgYikCFAQePuXbdq5IEzZMRH2b88g/O
INSERT INTO users (username, password_hash, full_name, role, email) VALUES
('hien141', '$2a$10$YRyiiGZgixrwtv6FVkPWVeBgYikCFAQePuXbdq5IEzZMRH2b88g/O', 'Hoàng Trang Hiền', 'ADMIN', 'ictu245200494@ictu.edu.vn'),
('admin', '$2a$10$YRyiiGZgixrwtv6FVkPWVeBgYikCFAQePuXbdq5IEzZMRH2b88g/O', 'Quản trị viên Hệ thống', 'ADMIN', 'admin@asset.ictu.vn'),
('nhanvien1', '$2a$10$YRyiiGZgixrwtv6FVkPWVeBgYikCFAQePuXbdq5IEzZMRH2b88g/O', 'Nguyễn Văn An', 'STAFF', 'an.nv@asset.ictu.vn')
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- 2. Danh mục thiết bị
INSERT INTO categories (id, name, description) VALUES
(1, 'Máy tính & Laptop', 'Máy tính xách tay, máy trạm để bàn phục vụ công việc'),
(2, 'Màn hình hiển thị', 'Màn hình máy tính chuyên dụng, bảng tương tác'),
(3, 'Thiết bị in ấn', 'Máy in laser, máy in đa năng, máy scan'),
(4, 'Thiết bị trình chiếu', 'Máy chiếu hội trường, máy chiếu văn phòng'),
(5, 'Thiết bị mạng & Server', 'Router, Switch, Firewall, Máy chủ trung tâm'),
(6, 'Thiết bị văn phòng khác', 'Máy hủy tài liệu, điều hòa, UPS lưu điện')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Cập nhật sequence categories
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 3. Danh sách tài sản mẫu (18 thiết bị thực tế)
INSERT INTO assets (asset_code, name, category_id, purchase_date, price, status, location, notes) VALUES
('TS-LT-001', 'Laptop Dell XPS 15 9530 i9 32GB RAM', 1, '2024-01-15', 45000000.00, 'IN_USE', 'Phòng Giám đốc (Tầng 3)', 'Cấp phát cho Giám đốc điều hành'),
('TS-LT-002', 'MacBook Pro 16 inch M3 Pro 36GB', 1, '2024-03-20', 62000000.00, 'IN_USE', 'Phòng R&D (Phòng 302)', 'Cấp cho Trưởng nhóm phát triển phần mềm'),
('TS-LT-003', 'ThinkPad X1 Carbon Gen 11 i7', 1, '2023-11-10', 38500000.00, 'IN_USE', 'Phòng Kế toán (Phòng 201)', 'Máy kế toán trưởng'),
('TS-LT-004', 'Laptop ASUS TUF Gaming F15 (Đồ họa)', 1, '2023-08-05', 24000000.00, 'AVAILABLE', 'Kho CNTT (Tầng 1)', 'Dự phòng cho nhân viên thiết kế'),
('TS-LT-005', 'Laptop HP ProBook 450 G9 i5', 1, '2022-05-12', 17500000.00, 'MAINTENANCE', 'Trung tâm bảo hành FPT', 'Lỗi nguồn sạc, đang kiểm tra'),
('TS-LT-006', 'Laptop Dell Vostro 3568 (Đời cũ)', 1, '2019-02-18', 12000000.00, 'DISPOSED', 'Kho thanh lý', 'Hỏng mainboard, đã duyệt thanh lý Q1/2026'),

('TS-MN-001', 'Màn hình Dell UltraSharp U2723QE 4K', 2, '2024-02-01', 14800000.00, 'IN_USE', 'Phòng R&D (Phòng 302)', 'Màn hình chuẩn màu thiết kế'),
('TS-MN-002', 'Màn hình LG 27UP850N-W 4K Type-C', 2, '2023-10-15', 9800000.00, 'IN_USE', 'Phòng Giám đốc (Tầng 3)', 'Kết nối dock Type-C cho laptop'),
('TS-MN-003', 'Màn hình Samsung ViewFinity S6 2K', 2, '2024-01-10', 6500000.00, 'AVAILABLE', 'Kho CNTT (Tầng 1)', 'Hàng mới lưu kho'),
('TS-MN-004', 'Màn hình ViewSonic 24 inch IPS', 2, '2022-04-10', 3200000.00, 'IN_USE', 'Phòng Hành chính (Phòng 102)', 'Trang bị nhân viên văn phòng'),

('TS-PR-001', 'Máy in HP LaserJet Pro MFP M428fdw', 3, '2023-06-20', 13500000.00, 'IN_USE', 'Sảnh tầng 2 (Khu in chung)', 'In đảo mặt, scan mạng, wifi'),
('TS-PR-002', 'Máy in màu Canon LBP623Cdw Laser', 3, '2023-09-12', 9200000.00, 'IN_USE', 'Phòng Kế hoạch (Phòng 204)', 'Chuyên in báo cáo tài chính màu'),
('TS-PR-003', 'Máy in Brother HL-L2366DW', 3, '2021-12-05', 3800000.00, 'MAINTENANCE', 'Phòng Kỹ thuật IT', 'Kẹt giấy liên tục, đang thay rulo cuốn'),

('TS-PJ-001', 'Máy chiếu Epson EB-X06 3600 ANSI', 4, '2023-04-18', 11900000.00, 'IN_USE', 'Phòng họp lớn (Phòng 301)', 'Họp hội đồng quản trị và đào tạo'),
('TS-PJ-002', 'Máy chiếu Sony VPL-EX455', 4, '2020-07-22', 15200000.00, 'DISPOSED', 'Kho thanh lý', 'Cháy bóng đèn cao áp, thanh lý linh kiện'),

('TS-NW-001', 'Cisco Catalyst 2960X 24 Port Gigabit', 5, '2022-08-30', 28000000.00, 'IN_USE', 'Tủ Rack Server Phòng 101', 'Switch trung tâm tầng 1'),
('TS-NW-002', 'Router DrayTek Vigor 2927 Dual-WAN', 5, '2023-03-15', 5600000.00, 'IN_USE', 'Tủ Rack Server Phòng 101', 'Cân bằng tải 2 đường truyền Viettel & VNPT'),
('TS-NW-003', 'UPS APC Smart-UPS 3000VA LCD 230V', 6, '2023-05-10', 32500000.00, 'IN_USE', 'Phòng Server Data Center', 'Lưu điện máy chủ khi cúp điện')
ON CONFLICT (asset_code) DO NOTHING;

-- 4. Dữ liệu Lịch sử bảo trì mẫu
INSERT INTO maintenance_history (asset_id, maintenance_date, performed_by, description, cost, status_after) VALUES
((SELECT id FROM assets WHERE asset_code = 'TS-LT-005'), '2026-03-15', 'Trung tâm FPT Services', 'Kiểm tra mạch sạc và thay thế pin zin theo máy', 1850000.00, 'MAINTENANCE'),
((SELECT id FROM assets WHERE asset_code = 'TS-PR-003'), '2026-03-20', 'Kỹ thuật viên IT nội bộ', 'Vệ sinh hộp mực, bôi trơn bánh răng, thay cụm gạt mực', 450000.00, 'MAINTENANCE'),
((SELECT id FROM assets WHERE asset_code = 'TS-PJ-001'), '2025-11-10', 'Bảo hành Epson Việt Nam', 'Bảo dưỡng định kỳ, thổi bụi thấu kính, kiểm tra bóng đèn', 800000.00, 'IN_USE'),
((SELECT id FROM assets WHERE asset_code = 'TS-LT-001'), '2025-09-05', 'Kỹ thuật viên IT nội bộ', 'Vệ sinh tản nhiệt tra keo kim loại lỏng, nâng cấp SSD 2TB', 3200000.00, 'IN_USE'),
((SELECT id FROM assets WHERE asset_code = 'TS-NW-002'), '2025-06-18', 'Kỹ thuật viên Mạng', 'Cập nhật Firmware phiên bản bảo mật mới nhất, cấu hình VPN', 0.00, 'IN_USE');
