# SƠ ĐỒ QUAN HỆ CƠ SỞ DỮ LIỆU (ENTITY RELATIONSHIP DIAGRAM - ERD)
**Đề tài**: Đề 16 – Hệ thống Quản lý Tài sản / Thiết bị  
**Học phần**: Triển khai và Quản trị Hệ thống Phần mềm  
**Sinh viên thực hiện**: DTC245200494 (Hoàng Trang Hiền)  
**Hệ quản trị CSDL**: PostgreSQL 16 Alpine (`assetdb`)  

---

## 1. Sơ Đồ ERD Quan Hệ Giữa Các Bảng (Entity Relationship Diagram)

Hệ thống cơ sở dữ liệu gồm 4 bảng thực thể được chuẩn hóa đến dạng chuẩn **3NF (Third Normal Form)**, kết nối chặt chẽ thông qua các khóa chính (**Primary Key**) và khóa ngoại (**Foreign Key**):

```mermaid
erDiagram
    USERS ||--o{ ASSETS : "được bàn giao / sử dụng (1:N)"
    USERS ||--o{ MAINTENANCE_HISTORY : "lập phiếu / ghi nhận bảo trì (1:N)"
    CATEGORIES ||--o{ ASSETS : "phân loại danh mục (1:N)"
    ASSETS ||--o{ MAINTENANCE_HISTORY : "lịch sử sửa chữa / bảo dưỡng (1:N)"

    USERS {
        serial id PK "Khóa chính tự tăng"
        varchar username UK "Tên đăng nhập duy nhất"
        varchar password_hash "Mật khẩu băm Bcrypt"
        varchar full_name "Họ và tên cán bộ/nhân viên"
        varchar role "Vai trò: ADMIN | MANAGER | STAFF"
        varchar email UK "Email liên hệ"
        timestamptz created_at "Thời điểm tạo tài khoản"
    }

    CATEGORIES {
        serial id PK "Khóa chính danh mục"
        varchar name UK "Tên danh mục thiết bị"
        text description "Mô tả phân loại tài sản"
        timestamptz created_at "Thời điểm khởi tạo"
    }

    ASSETS {
        serial id PK "Khóa chính thiết bị"
        varchar asset_code UK "Mã tài sản chuẩn hóa (TS-...)"
        varchar name "Tên chi tiết thiết bị"
        integer category_id FK "Khóa ngoại -> categories(id)"
        integer assigned_to_user_id FK "Khóa ngoại -> users(id) (Người sử dụng)"
        date purchase_date "Ngày mua thiết bị"
        numeric price "Giá trị tài sản (VNĐ)"
        varchar status "Trạng thái: IN_USE | AVAILABLE | MAINTENANCE | DISPOSED"
        varchar location "Vị trí lắp đặt / Phòng ban"
        text notes "Ghi chú thêm"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian cập nhật"
    }

    MAINTENANCE_HISTORY {
        serial id PK "Khóa chính lịch sử bảo dưỡng"
        integer asset_id FK "Khóa ngoại -> assets(id)"
        integer user_id FK "Khóa ngoại -> users(id) (Người lập phiếu)"
        date maintenance_date "Ngày thực hiện bảo dưỡng"
        varchar performed_by "Đơn vị / Kỹ thuật viên thực hiện"
        text description "Nội dung chi tiết sửa chữa"
        numeric cost "Chi phí phát sinh (VNĐ)"
        varchar status_after "Tình trạng sau bảo dưỡng: IN_USE | AVAILABLE"
        timestamptz created_at "Thời gian ghi nhận"
    }
```

---

## 2. Bảng Danh Mục Các Khóa Ngoại (Foreign Keys Matrix)

| Bảng Chứa Khóa Ngoại | Cột Khóa Ngoại | Bảng Được Tham Chiếu | Cột Khóa Chính | Ý Nghĩa Nghiệp Vụ & Ràng Buộc |
|---|---|---|---|---|
| **`assets`** | `category_id` | **`categories`** | `id` | **ON DELETE RESTRICT**: Không được xóa danh mục nếu đang có tài sản trực thuộc. |
| **`assets`** | `assigned_to_user_id` | **`users`** | `id` | **ON DELETE SET NULL**: Khi xóa nhân viên, tài sản tự động chuyển về trạng thái chưa gán người dùng. |
| **`maintenance_history`** | `asset_id` | **`assets`** | `id` | **ON DELETE CASCADE**: Khi thanh lý/xóa thiết bị, toàn bộ lịch sử sửa chữa của thiết bị đó sẽ được xóa đồng bộ. |
| **`maintenance_history`** | `user_id` | **`users`** | `id` | **ON DELETE SET NULL**: Người dùng/Admin lập phiếu ghi nhận bảo trì trong hệ thống. |

---

## 3. Các Chỉ Mục (Indexes) Tối Ưu Hóa Hiệu Năng
- `idx_assets_category_id` trên `assets(category_id)`: Tăng tốc lọc tài sản theo danh mục.
- `idx_assets_assigned_to` trên `assets(assigned_to_user_id)`: Tăng tốc truy vấn danh sách tài sản được bàn giao cho từng nhân viên.
- `idx_assets_status` trên `assets(status)`: Tối ưu thống kê trên Dashboard (IN_USE, AVAILABLE,...).
- `idx_maintenance_asset_id` trên `maintenance_history(asset_id)`: Tăng tốc truy vấn toàn bộ lịch sử sửa chữa của 1 thiết bị.
- `idx_maintenance_user_id` trên `maintenance_history(user_id)`: Tối ưu tra cứu nhật ký bảo trì do từng kỹ thuật viên lập.
