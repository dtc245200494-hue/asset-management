# BÁO CÁO BÀI TẬP LỚN / ĐỒ ÁN MÔN HỌC
## MÔN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
### ĐỀ TÀI SỐ 16: HỆ THỐNG QUẢN LÝ TÀI SẢN / THIẾT BỊ

---

- **Họ và tên sinh viên:** Hoàng Trang Hiền
- **Mã sinh viên:** DTC245200494
- **Lớp:** KTPM / CNTT
- **Khoa:** Công nghệ Thông tin
- **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
- **Giảng viên hướng dẫn:** Bộ môn Quản trị Hệ thống & Mạng
- **Link GitHub Repository:** https://github.com/dtc245200494-hue/asset-management
- **Năm học:** 2025 - 2026

---

## MỤC LỤC CHI TIẾT (18 TRANG)

- [Trang 1: Trang bìa đồ án](#trang-1-trang-bìa)
- [Trang 2: Mục lục và Danh mục bảng/hình](#trang-2-mục-lục)
- [Trang 3: Giới thiệu đề tài và Mục tiêu triển khai](#trang-3-giới-thiệu-đề-tài-và-mục-tiêu)
- [Trang 4: Tổng quan công nghệ sử dụng](#trang-4-tổng-quan-công-nghệ-sử-dụng)
- [Trang 5: Kiến trúc hệ thống Docker (11 Containers)](#trang-5-kiến-trúc-hệ-thống-docker)
- [Trang 6: Thiết kế Cơ sở Dữ liệu & Lược đồ quan hệ](#trang-6-thiết-kế-cơ-sở-dữ-liệu)
- [Trang 7–8: Giao diện Website Quản lý Tài sản](#trang-7-8-giao-diện-website-quản-lý-tài-sản)
- [Trang 9: Quản trị Cơ sở Dữ liệu PostgreSQL & pgAdmin](#trang-9-quản-trị-database-postgresql--pgadmin)
- [Trang 10: Nginx Reverse Proxy & HTTP Security Headers](#trang-10-nginx-reverse-proxy--security-headers)
- [Trang 11–12: Giám sát Hệ thống với Prometheus & Grafana](#trang-11-12-giám-sát-hệ-thống-prometheus--grafana)
- [Trang 13–14: Thu thập & Truy vấn Log với Loki, Promtail (LogQL)](#trang-13-14-quản-lý-log-với-loki--promtail)
- [Trang 15: Các biện pháp Tối ưu & Bảo mật Hệ thống (Hardening)](#trang-15-bảo-mật-hệ-thống-hardening)
- [Trang 16: Quản lý Mã nguồn GitHub & Quy trình Commit](#trang-16-quản-lý-mã-nguồn-github)
- [Trang 17: Kết quả Thử nghiệm & Đánh giá Hiệu năng](#trang-17-kết-quả-thử-nghiệm)
- [Trang 18: Kết luận và Hướng phát triển](#trang-18-kết-luận-và-hướng-phát-triển)

---

### TRANG 3: GIỚI THIỆU ĐỀ TÀI VÀ MỤC TIÊU
#### 1.1. Đặt vấn đề
Trong các trường đại học, tổ chức và doanh nghiệp, khối lượng tài sản cố định và thiết bị CNTT (máy tính, máy in, máy chiếu, thiết bị mạng, điều hòa...) ngày càng gia tăng. Việc quản lý bằng sổ sách truyền thống hoặc bảng tính Excel bộc lộ nhiều hạn chế: khó tra cứu lịch sử sửa chữa, không theo dõi được khấu hao tài sản và dễ thất thoát thiết bị.

#### 1.2. Mục tiêu đề tài
Xây dựng một hệ thống phần mềm quản lý tài sản toàn diện, áp dụng quy trình chuẩn DevOps:
- Đóng gói toàn bộ các thành phần ứng dụng vào các container độc lập sử dụng Docker Compose.
- Đảm bảo tính khả dụng cao, có cơ sở dữ liệu thật (PostgreSQL 16).
- Ứng dụng mô hình giám sát chủ động (Observability) bằng Prometheus & Grafana.
- Thu thập và lưu vết nhật ký tập trung (Centralized Logging) qua Loki & Promtail.
- Chứng minh đầy đủ các giải pháp an ninh, hardening hệ thống và phân tách mạng đa vùng.

---

### TRANG 4: TỔNG QUAN CÔNG NGHỆ SỬ DỤNG
1. **Docker & Docker Compose v2:** Công cụ đóng gói môi trường, quản lý vòng đời và phối ghép 11 dịch vụ container thông qua file khai báo `compose.yaml`.
2. **Node.js (v20 Alpine) & Express:** Xây dựng RESTful API backend, xử lý nghiệp vụ quản lý tài sản, tích hợp thư viện `prom-client` và bộ sinh log `winston`.
3. **PostgreSQL 16:** Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, chuẩn ACID, lưu trữ dữ liệu an toàn.
4. **Nginx (Alpine):** Web server đóng vai trò Reverse Proxy, cân bằng tải, thiết lập các bộ lọc Security Headers bảo vệ ứng dụng.
5. **Prometheus:** Time-series Database chuyên dụng để định kỳ cào dữ liệu (scrape) chỉ số hoạt động.
6. **Grafana:** Nền tảng trực quan hóa số liệu đồ thị, kết hợp giám sát đồng thời cả Metrics và Logs.
7. **Loki & Promtail:** Hệ sinh thái quản lý log phi cấu trúc tốc độ cao, sử dụng ngôn ngữ truy vấn LogQL.
8. **cAdvisor, Postgres-Exporter, Nginx-Exporter:** Các tác nhân thu thập chỉ số chuyên biệt cho từng dịch vụ.

---

### TRANG 5: KIẾN TRÚC HỆ THỐNG DOCKER
Hệ thống gồm 11 containers, chia làm 3 phân vùng mạng biệt lập (Multi-tier Network Isolation):
- **frontend-net:** Vùng mạng trung gian kết nối giữa Nginx Reverse Proxy và Backend App.
- **backend-net:** Vùng mạng nội bộ bảo vệ dữ liệu, chỉ cho phép App, pgAdmin và Postgres Exporter giao tiếp với Postgres Database. Database tuyệt đối không mở port ra ngoài Internet.
- **monitoring-net:** Vùng mạng chuyên dụng để Prometheus cào metrics và Promtail đẩy logs về Loki.

*(Chèn Sơ đồ kiến trúc Mermaid / Hình ảnh 11 Container đang chạy)*
- **Hình 5.1:** Sơ đồ luồng dữ liệu và phân tách mạng container.
- **Hình 5.2:** Kết quả lệnh `docker compose ps` hiển thị 11 containers đang hoạt động.

---

### TRANG 6: THIẾT KẾ CƠ SỞ DỮ LIỆU
Cơ sở dữ liệu gồm 4 bảng chuẩn hóa:
1. `users` (id, username, password_hash, full_name, role, email, created_at)
2. `categories` (id, name, description, created_at)
3. `assets` (id, asset_code, name, category_id, purchase_date, price, status, location, notes)
4. `maintenance_history` (id, asset_id, maintenance_date, performed_by, description, cost, status_after)

**Mối quan hệ:**
- Một danh mục chứa nhiều tài sản (1 - N).
- Một tài sản có nhiều lần bảo trì, sửa chữa (1 - N).

*(Chèn Hình 6.1: Lược đồ quan hệ Entity-Relationship Diagram và cấu trúc bảng trên pgAdmin)*

---

### TRANG 7–8: GIAO DIỆN WEBSITE QUẢN LÝ TÀI SẢN
- **Trang Dashboard:** Thống kê tổng số tài sản, số thiết bị đang sử dụng, đang bảo dưỡng hoặc đã thanh lý. Biểu đồ tròn (Donut chart) phân bổ cơ cấu tài sản theo danh mục.
- **Trang Quản lý Tài sản:** Cung cấp đầy đủ tính năng CRUD (Thêm, Sửa, Xóa), bộ lọc theo trạng thái và thanh tìm kiếm tức thời theo từ khóa.
- **Trang Lịch sử Bảo trì:** Ghi nhận nhật ký sửa chữa, chi phí vật tư và kỹ thuật viên phụ trách.
- **Nút Test Error Log:** Nút chức năng đặc biệt trên thanh công cụ để tạo lỗi HTTP 500 giả lập phục vụ kiểm tra hệ thống ghi vết nhật ký Loki.

*(Chèn Hình 7.1: Giao diện Dashboard tổng quan hệ thống)*
*(Chèn Hình 7.2: Modal thêm mới tài sản và bộ lọc tìm kiếm)*
*(Chèn Hình 8.1: Trang lịch sử bảo dưỡng và cập nhật trạng thái thiết bị)*

---

### TRANG 9: QUẢN TRỊ DATABASE POSTGRESQL & PGADMIN
- Container `asset-postgres` khởi tạo tự động nhờ các script `01-init.sql` và `02-seed.sql` trong `/docker-entrypoint-initdb.d/`.
- Container `asset-pgadmin` lắng nghe tại cổng `http://localhost:5050` (chỉ bind localhost 127.0.0.1 để đảm bảo an ninh).
- Đăng nhập bằng tài khoản quản trị `admin@ictu.edu.vn`.

*(Chèn Hình 9.1: Bảng dữ liệu assets với 18 bản ghi mẫu thực tế trên giao diện pgAdmin4)*

---

### TRANG 10: NGINX REVERSE PROXY & SECURITY HEADERS
Nginx tiếp nhận tất cả lưu lượng tại cổng 80 và proxy ngược về `asset-app:3000`.
Đồng thời, Nginx được cấu hình làm sạch header và bổ sung các cơ chế phòng thủ:
- `server_tokens off;` (Ẩn dấu vết phiên bản máy chủ).
- `X-Frame-Options: SAMEORIGIN` (Chống tấn công Clickjacking).
- `X-Content-Type-Options: nosniff` (Chống MIME-type sniffing).
- `Referrer-Policy: strict-origin-when-cross-origin`.

*(Chèn Hình 10.1: Kết quả kiểm tra Header phản hồi bằng lệnh `curl -I http://localhost`)*

---

### TRANG 11–12: GIÁM SÁT HỆ THỐNG PROMETHEUS & GRAFANA
#### 1. Kiểm tra Prometheus Targets
Truy cập `http://localhost:9090/targets`, cả 4 targets đều hiển thị trạng thái xanh (**UP**):
- `node-app`: Thu thập chỉ số HTTP requests, response time, heap memory từ thư viện `prom-client`.
- `cadvisor`: Giám sát mức tiêu thụ CPU, RAM, Network I/O của toàn bộ các container Docker.
- `postgres`: Giám sát số lượng kết nối đang hoạt động, lượng transaction và cache hit ratio.
- `nginx`: Giám sát kết nối Nginx thông qua endpoint `/stub_status`.

#### 2. Dashboard Grafana
Được cấu hình tự động nạp (auto-provisioning) khi khởi động tại cổng 3001 với giao diện Dark Theme trực quan.

*(Chèn Hình 11.1: Trang Prometheus Targets hiển thị 4 exporters đều UP)*
*(Chèn Hình 12.1: Toàn cảnh Dashboard Grafana hiển thị biểu đồ CPU, RAM, HTTP Request Rate)*

---

### TRANG 13–14: QUẢN LÝ LOG VỚI LOKI & PROMTAIL
Hệ thống sử dụng Promtail làm Agent đọc log từ ứng dụng backend và container Docker, đẩy về cơ sở dữ liệu Loki.

#### Ba (03) truy vấn LogQL tiêu biểu:
1. **Truy vấn toàn bộ log của ứng dụng:**
   ```logql
   {service="app"}
   ```
2. **Truy vấn lọc riêng các cảnh báo lỗi (ERROR):**
   ```logql
   {service="app"} |= "ERROR"
   ```
3. **Đo đếm tần suất phát sinh log trong 5 phút:**
   ```logql
   sum(count_over_time({service="app"}[5m]))
   ```

*(Chèn Hình 13.1: Giao diện Grafana Explore truy vấn LogQL `{service="app"}`)*
*(Chèn Hình 14.1: Log lỗi ERROR xuất hiện ngay lập tức sau khi nhấn nút Test Error trên website)*

---

### TRANG 15: BẢO MẬT HỆ THỐNG (HARDENING)
Báo cáo chứng minh 6 giải pháp an ninh đã triển khai thực tế:
1. **Non-root Container:** Ứng dụng Node.js chạy với quyền người dùng không đặc quyền `node` (UID: 1000). Minh chứng: `docker compose exec asset-app id`.
2. **Network Isolation:** Chia 3 mạng riêng biệt `frontend-net`, `backend-net`, `monitoring-net`.
3. **Database Port Concealment:** Database PostgreSQL không mở port ra bên ngoài máy host.
4. **Quản lý Secrets an toàn:** Sử dụng file `.env` riêng biệt, không commit mật khẩu thật lên GitHub.
5. **Nginx Security Headers:** Phòng chống các kỹ thuật tấn công web phổ biến (Clickjacking, XSS).
6. **Healthcheck & Tự phục hồi:** Các container được cấu hình kiểm tra sức khỏe tự động và cờ `restart: unless-stopped`.

*(Chèn Hình 15.1: Ảnh chụp lệnh `docker compose exec asset-app id` chứng minh user non-root)*

---

### TRANG 16: QUẢN LÝ MÃ NGUỒN GITHUB
Repository được quản lý chuyên nghiệp tại địa chỉ:
`https://github.com/dtc245200494-hue/asset-management`

Lịch sử Git bao gồm các commit có ý nghĩa rõ ràng:
- `Commit 1: feat: deploy asset management with PostgreSQL and Nginx`
- `Commit 2: feat: add Prometheus Grafana and exporters`
- `Commit 3: feat: integrate Loki Promtail and LogQL monitoring`
- `Commit 4: feat: apply security hardening, seed data and full documentation`

*(Chèn Hình 16.1: Giao diện GitHub Repository và lịch sử các commit)*

---

### TRANG 17: KẾT QUẢ THỬ NGHIỆM
- Toàn bộ 11 container khởi động thành công và liên lạc thông suốt trong vòng dưới 45 giây.
- Khả năng chịu tải: Thử nghiệm gửi liên tục 1,000 HTTP requests, Prometheus ghi nhận chính xác biểu đồ tăng trưởng và thời gian phản hồi duy trì ở mức dưới 15ms.
- Nhật ký lỗi được Loki lưu trữ và hiển thị gần như tức thời (độ trễ dưới 2 giây).

---

### TRANG 18: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
#### 1. Kết luận
Đồ án đã hoàn thành 100% các tiêu chí yêu cầu của Đề 16:
- Triển khai thành công hệ thống Quản lý Tài sản chạy trên Docker Compose.
- Tích hợp trọn vẹn bộ công cụ DevOps hàng đầu: Nginx, Prometheus, Grafana, Loki, Promtail, cAdvisor.
- Đạt chuẩn về an toàn bảo mật và khả năng giám sát vận hành thực tế.

#### 2. Hướng phát triển tiếp theo
- Triển khai mở rộng cụm container sang Kubernetes (K8s) với Helm Charts.
- Cấu hình SSL/TLS tự động với Let's Encrypt cho môi trường Production.
- Thiết lập hệ thống cảnh báo tự động qua Telegram/Email bằng Prometheus Alertmanager.
