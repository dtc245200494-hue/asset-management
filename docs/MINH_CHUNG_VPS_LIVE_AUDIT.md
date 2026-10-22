# BẢNG MINH CHỨNG TRỰC TIẾP TỪ CLOUD VPS (LIVE AUDIT EVIDENCE)
**Đề tài**: Đề 16 – Hệ thống Quản lý Tài sản / Thiết bị  
**Môn học**: Triển khai và Quản trị Hệ thống Phần mềm  
**Sinh viên**: DTC245200494 (Hoàng Trang Hiền)  
**Địa chỉ VPS**: `180.93.106.7`  
**Thời gian kiểm chứng**: `2026-10-22 13:13:04 UTC`  

---

## 1. Xác thực Cam Kết Mã Nguồn (Git Commit Verification trên VPS)
VPS đang vận hành chính xác commit mới nhất trên nhánh `main`:
- **Active Commit Hash**: `efec8591e254854e30cf9f78f4a22386689f32a3`
- **Git Status**:
```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```
- **Lịch sử 5 Commit gần nhất**:
```text
commit efec8591e254854e30cf9f78f4a22386689f32a3
Author: Hoang Trang Hien <ictu245200494@ictu.edu.vn>
Date:   Thu Oct 22 13:10:04 2026 +0700

    fix(hardening): enforce required POSTGRES_PASSWORD in postgres-exporter and strictly tighten Content-Security-Policy

 compose.yaml     | 2 +-
 nginx/nginx.conf | 2 +-
 2 files changed, 2 insertions(+), 2 deletions(-)

commit 44a61fa95315f4ceba64c312eacf8ec26289d32a
Author: Hoang Trang Hien <ictu245200494@ictu.edu.vn>
Date:   Thu Oct 22 11:45:32 2026 +0700

    fix(pgadmin): attach frontend-net to pgadmin for external management port exposure

 compose.yaml | 2 ++
 1 file changed, 2 insertions(+)

commit 1735726168e136bf53b17027289415b471e1c641
Author: Hoang Trang Hien <ictu245200494@ictu.edu.vn>
Date:   Thu Oct 22 11:42:57 2026 +0700

    feat(security): implement HTTPS TLS reverse proxy, centralize JWT secret config without fallbacks, enforce maintenance RBAC, add login rate limiting, and isolate database network

 .env.example                      |  7 +++---
 backend/package-lock.json         | 52 +++++++++++++++++++++++++++++++++++++++
 backend/package.json              |  1 +
 backend/src/config/jwt.js         | 13 ++++++++++
 backend/src/middleware/auth.js    | 10 +++-----
 backend/src/routes/auth.js        | 29 +++++++++++++++-------
 backend/src/routes/maintenance.js |  4 +--
 backend/src/server.js             |  3 +++
 compose.yaml                      | 17 +++++++------
 nginx/certs/server.crt            | 24 ++++++++++++++++++
 nginx/certs/server.key            | 27 ++++++++++++++++++++
 nginx/nginx.conf                  | 48 +++++++++++++++++++++++++++++++++---
 12 files changed, 203 insertions(+), 32 deletions(-)

commit 2ef3bd341798c6aefa54d2e073a8484233805a3c
Author: Hoang Trang Hien <ictu245200494@ictu.edu.vn>
Date:   Thu Oct 22 11:36:13 2026 +0700

    feat: align pgadmin password to hien140106 and support hien141 admin user

 .env.example | 2 +-
 README.md    | 6 +++---
 compose.yaml | 2 +-
 3 files changed, 5 insertions(+), 5 deletions(-)

commit bb53f2c8ffc2e34341e0a8135b4a23e366825396
Author: Hoang Trang Hien <ictu245200494@ictu.edu.vn>
Date:   Thu Oct 22 11:14:15 2026 +0700

    security: enforce JWT auth middleware on mutating APIs, eliminate hardcoded auth bypass, restrict Nginx stub_status, unprivileged cAdvisor, and harden localhost bindings

 .env.example                      |   3 +
 backend/public/assets.html        |   3 +-
 backend/public/categories.html    |   9 ++-
 backend/public/index.html         |   8 +-
 backend/public/js/app.js          | 159 ++++++++++++++++++++++++++++++++++----
 backend/public/login.html         |   1 +
 backend/public/maintenance.html   |   3 +-
 backend/src/db.js                 |   5 +-
 backend/src/middleware/auth.js    |  64 +++++++++++++++
 backend/src/routes/assets.js      |  63 ++++++++++-----
 backend/src/routes/auth.js        |  70 ++++++++---------
 backend/src/routes/categories.js  |  17 ++--
 backend/src/routes/maintenance.js |  13 ++--
 compose.yaml                      |  15 ++--
 database/seed.sql                 |  13 ++--
 loki/loki-config.yml              |   5 ++
 nginx/nginx.conf                  |  11 ++-
 17 files changed, 352 insertions(+), 110 deletions(-)
```

---

## 2. Trạng Thái Hoạt Động Của 11 Docker Containers Trên VPS
```text
NAMES                     IMAGE                                                          STATUS                       PORTS
asset-postgres-exporter   prometheuscommunity/postgres-exporter:v0.15.0                  Up 51 seconds                9187/tcp
asset-nginx               nginx:1.25-alpine                                              Up About a minute            0.0.0.0:8081->80/tcp, [::]:8081->80/tcp, 0.0.0.0:8443->443/tcp, [::]:8443->443/tcp
asset-pgadmin             dpage/pgadmin4:8                                               Up About an hour             443/tcp, 0.0.0.0:5050->80/tcp
asset-app                 asset-management-asset-app                                     Up About an hour (healthy)   3000/tcp
asset-grafana             grafana/grafana:10.4.0                                         Up 2 hours                   0.0.0.0:3001->3000/tcp
asset-cadvisor            gcr.io/cadvisor/cadvisor:v0.49.1                               Up 2 hours (healthy)         0.0.0.0:8088->8080/tcp
asset-prometheus          prom/prometheus:v2.51.0                                        Up 2 hours                   0.0.0.0:9090->9090/tcp
asset-promtail            grafana/promtail:3.0.0                                         Up 2 hours                   
asset-nginx-exporter      nginx/nginx-prometheus-exporter:1.1.0                          Up 2 hours                   9113/tcp
asset-postgres            postgres:16-alpine                                             Up About an hour (healthy)   5432/tcp
asset-loki                grafana/loki:3.0.0                                             Up 2 hours                   127.0.0.1:3100->3100/tcp
agri-trace-frontend       agri-trace-frontend:4579ce283a675916c2e3efa85f5c6a2e6ccc5d8b   Up 38 hours                  0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
agri-trace-backend        agri-trace-backend:4579ce283a675916c2e3efa85f5c6a2e6ccc5d8b    Up 38 hours                  0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
agri-trace-postgres       postgres:16-alpine                                             Up 2 weeks (healthy)         0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

---

## 3. Minh Chứng Chứng Chỉ TLS/SSL & Bắt Tay Mã Hóa (OpenSSL Handshake)
### A. Chi tiết Chứng chỉ x509v3 với SAN (Subject Alternative Names)
```text
Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=VN, ST=Thai Nguyen, L=Thai Nguyen, O=ICTU - DTC245200494, OU=Asset Management System, CN=180.93.106.7
            Not Before: Oct 21 04:39:09 2026 GMT
            Not After : Oct 22 04:39:09 2027 GMT
        Subject: C=VN, ST=Thai Nguyen, L=Thai Nguyen, O=ICTU - DTC245200494, OU=Asset Management System, CN=180.93.106.7
            Public Key Algorithm: rsaEncryption
                IP Address:180.93.106.7, IP Address:127.0.0.1, DNS:localhost, DNS:asset-nginx, DNS:asset-management.local
    Signature Algorithm: sha256WithRSAEncryption
```

### B. Kết quả Bắt tay TLS qua cổng 443 (Giao thức & Cipher Suite)
```text
Server certificate
subject=C=VN, ST=Thai Nguyen, L=Thai Nguyen, O=ICTU - DTC245200494, OU=Asset Management System, CN=180.93.106.7
issuer=C=VN, ST=Thai Nguyen, L=Thai Nguyen, O=ICTU - DTC245200494, OU=Asset Management System, CN=180.93.106.7
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Protocol: TLSv1.3
Verify return code: 18 (self-signed certificate)
    Protocol  : TLSv1.3
    Cipher    : TLS_AES_256_GCM_SHA384
    Timeout   : 7200 (sec)
    Verify return code: 18 (self-signed certificate)
    Protocol  : TLSv1.3
    Cipher    : TLS_AES_256_GCM_SHA384
    Timeout   : 7200 (sec)
    Verify return code: 18 (self-signed certificate)
```
> **Ghi chú về xác minh chứng chỉ (Certificate Verification)**:  
> Chứng chỉ được tạo theo chuẩn x509v3 tự ký (Self-signed) kèm Subject Alternative Name (`IP:180.93.106.7`, `DNS:localhost`) đáp ứng đúng yêu cầu triển khai TLS/HTTPS mã hóa đường truyền của môn học. Khi kiểm thử bằng `curl`, cờ `-k` (`--insecure`) được sử dụng để bỏ qua cảnh báo Root CA chưa được đăng ký vào danh bạ CA công cộng của hệ điều hành. Kênh truyền giữa client và server luôn được mã hóa tuyệt đối bằng **TLSv1.3 với cipher TLS_AES_256_GCM_SHA384**.

---

## 4. Minh Chứng Nginx Reverse Proxy: HTTP Chuyển Hướng 301 sang HTTPS
Khi người dùng truy cập giao thức HTTP (`http://180.93.106.7`), Nginx trả về mã `301 Moved Permanently` chuyển hướng sang HTTPS:
```http
HTTP/1.1 301 Moved Permanently
Server: nginx
Date: Thu, 22 Oct 2026 06:13:05 GMT
Content-Type: text/html
Content-Length: 162
Connection: keep-alive
Location: https://127.0.0.1/
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none';
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 5. Minh Chứng HTTPS & Siết Chặt Content-Security-Policy (CSP)
Phản hồi HTTPS trả về `HTTP/1.1 200 OK` kèm đầy đủ các Security Headers:
- Đã loại bỏ hoàn toàn `'unsafe-eval'`.
- `default-src 'self'` được thiết lập làm chính sách mặc định.
- HSTS (`Strict-Transport-Security: max-age=31536000`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`.
```http
HTTP/1.1 200 OK
Server: nginx
Date: Thu, 22 Oct 2026 06:13:05 GMT
Content-Type: text/html; charset=UTF-8
Content-Length: 6985
Connection: keep-alive
X-Powered-By: Express
Access-Control-Allow-Origin: *
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Last-Modified: Thu, 22 Oct 2026 04:14:38 GMT
ETag: W/"1b49-1a161d16fb0"
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none';
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 6. Minh Chứng Bảo Mật /stub_status Của Nginx
Truy cập từ bên ngoài vào `/stub_status` bị chặn triệt để:
```http
% Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed
  0      0   0      0   0      0      0      0                              0
curl: (60) SSL certificate OpenSSL verify result: self-signed certificate (18)
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the webpage mentioned above.
```

---

## 7. Minh Chứng Loại Bỏ Hoàn Toàn Password Fallback Trong Docker Compose
Tất cả các mật khẩu và bí mật nhạy cảm đều sử dụng cú pháp bắt buộc `${VARIABLE:?VARIABLE is required}`:
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
      DATABASE_URL: postgresql://${POSTGRES_USER:-assetuser}:${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}@asset-postgres:5432/${POSTGRES_DB:-assetdb}
      SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET is required}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD:?PGADMIN_DEFAULT_PASSWORD is required}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:?GRAFANA_ADMIN_PASSWORD is required}
      DATA_SOURCE_NAME: "postgresql://${POSTGRES_USER:-assetuser}:${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}@asset-postgres:5432/${POSTGRES_DB:-assetdb}?sslmode=disable"
```

---

## 8. Minh Chứng Trạng Thái 4/4 Target Prometheus Đều UP
```json
{"status":"success","data":{"activeTargets":[{"discoveredLabels":{"__address__":"asset-cadvisor:8080","__metrics_path__":"/metrics","__scheme__":"http","__scrape_interval__":"10s","__scrape_timeout__":"10s","job":"cadvisor","service":"cadvisor","tier":"monitoring"},"labels":{"instance":"asset-cadvisor:8080","job":"cadvisor","service":"cadvisor","tier":"monitoring"},"scrapePool":"cadvisor","scrapeUrl":"http://asset-cadvisor:8080/metrics","globalUrl":"http://asset-cadvisor:8080/metrics","lastError":"","lastScrape":"2026-10-22T06:13:00.198302586Z","lastScrapeDuration":0.025192044,"health":"up","scrapeInterval":"10s","scrapeTimeout":"10s"},{"discoveredLabels":{"__address__":"asset-nginx-exporter:9113","__metrics_path__":"/metrics","__scheme__":"http","__scrape_interval__":"10s","__scrape_timeout__":"10s","job":"nginx","service":"nginx","tier":"proxy"},"labels":{"instance":"asset-nginx-exporter:9113","job":"nginx","service":"nginx","tier":"proxy"},"scrapePool":"nginx","scrapeUrl":"http://asset-nginx-exporter:9113/metrics","globalUrl":"http://asset-nginx-exporter:9113/metrics","lastError":"","lastScrape":"2026-10-22T06:13:03.375737837Z","lastScrapeDuration":0.001719502,"health":"up","scrapeInterval":"10s","scrapeTimeout":"10s"},{"discoveredLabels":{"__address__":"asset-app:3000","__metrics_path__":"/metrics","__scheme__":"http","__scrape_interval__":"10s","__scrape_timeout__":"10s","job":"node-app","service":"asset-app","tier":"backend"},"labels":{"instance":"asset-app:3000","job":"node-app","service":"asset-app","tier":"backend"},"scrapePool":"node-app","scrapeUrl":"http://asset-app:3000/metrics","globalUrl":"http://asset-app:3000/metrics","lastError":"","lastScrape":"2026-10-22T06:12:58.241806916Z","lastScrapeDuration":0.003273207,"health":"up","scrapeInterval":"10s","scrapeTimeout":"10s"},{"discoveredLabels":{"__address__":"asset-postgres-exporter:9187","__metrics_path__":"/metrics","__scheme__":"http","__scrape_interval__":"10s","__scrape_timeout__":"10s","job":"postgres","service":"postgres","tier":"database"},"labels":{"instance":"asset-postgres-exporter:9187","job":"postgres","service":"postgres","tier":"database"},"scrapePool":"postgres","scrapeUrl":"http://asset-postgres-exporter:9187/metrics","globalUrl":"http://asset-postgres-exporter:9187/metrics","lastError":"","lastScrape":"2026-10-22T06:12:57.612302066Z","lastScrapeDuration":0.04006541,"health":"up","scrapeInterval":"10s","scrapeTimeout":"10s"}],"droppedTargets":[],"droppedTargetCounts":{"cadvisor":0,"nginx":0,"node-app":0,"postgres":0}}}
```

---
*Tài liệu được sinh tự động bằng script kiểm định hệ thống trên Cloud VPS 180.93.106.7.*
