# SƠ ĐỒ TRIỂN KHAI HỆ THỐNG (UML DEPLOYMENT DIAGRAM)
**Đề tài**: Đề 16 – Hệ thống Quản lý Tài sản / Thiết bị  
**Học phần**: Triển khai và Quản trị Hệ thống Phần mềm  
**Sinh viên thực hiện**: DTC245200494 (Hoàng Trang Hiền)  
**Môi trường thực tế**: Cloud VPS Ubuntu 24.04 LTS (`180.93.106.7`)  

---

## 1. Sơ Đồ Triển Khai UML (Deployment Diagram)

Sơ đồ thể hiện cụ thể:
1. **Thiết bị vật lý/máy khách (Client Device)** và trình duyệt.
2. **Máy chủ đám mây (Cloud VPS Node)**, hệ điều hành Ubuntu, Host Nginx và Docker Engine.
3. **Các Container thực thi («execution environment» / «container»)** và các tệp thành phần triển khai («artifact»).
4. **Các ổ đĩa lưu trữ bền vững («storage volume»)**.
5. **Cổng liên kết (Port Bindings) & Giao thức truyền thông (Protocols)** giữa các nút mạng.

```mermaid
flowchart TD
    %% Styling Classes
    classDef deviceNode fill:#f8fafc,stroke:#334155,stroke-width:2px,stroke-dasharray: 4 2,color:#0f172a;
    classDef hostService fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a;
    classDef containerNode fill:#ffffff,stroke:#2563eb,stroke-width:2px,color:#0f172a;
    classDef volumeNode fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#0f172a;
    classDef netZone fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,stroke-dasharray: 5 3,color:#0f172a;

    %% ==========================================
    %% NODE 1: CLIENT DEVICE
    %% ==========================================
    subgraph CLIENT_NODE ["«device» Máy Khách (Client / Admin Workstation)"]
        Browser["«execution environment»<br/>Web Browser (Chrome / Edge / Firefox)<br/>----------------------------------------<br/>• «artifact» HTML5 / CSS3 / Bootstrap 5<br/>• «artifact» Chart.js Dashboard Charts<br/>• «artifact» Session Token (JWT Bearer)"]
    end

    %% ==========================================
    %% NODE 2: CLOUD VPS SERVER
    %% ==========================================
    subgraph VPS_NODE ["«device» Cloud VPS Server (IP: 180.93.106.7) - Ubuntu 24.04 LTS x86_64"]

        subgraph HOST_SERVICES ["«execution environment» Dịch Vụ Cấp Host (OS Layer)"]
            HostNginx["«service» Host Nginx Reverse Proxy<br/>----------------------------------------<br/>• Listen: 0.0.0.0:80 (HTTP)<br/>• Listen: 0.0.0.0:443 (HTTPS TLSv1.3)<br/>• Rule: 301 Redirect HTTP -> HTTPS<br/>• Rule: Deny /stub_status (403 Forbidden)"]:::hostService
            
            HostCert["«artifact» Host SSL Storage<br/>/etc/nginx/ssl/asset-management/<br/>• server.crt (x509v3 SAN)<br/>• server.key (RSA 2048-bit)"]:::hostService
            
            HostLog["«storage» Docker Host Log Dir<br/>/var/lib/docker/containers/*-json.log"]:::volumeNode
        end

        subgraph DOCKER_ENGINE ["«execution environment» Docker Runtime Engine (Compose Orchestrated)"]

            %% --------------------------------------------------------
            %% ZONE 1: FRONTEND NETWORK
            %% --------------------------------------------------------
            subgraph NET_FRONTEND ["«network» Docker Bridge: frontend-net (172.20.0.0/16)"]
                
                CntNginx["«container» asset-nginx (:80, :443)<br/>[Image: nginx:1.25-alpine]<br/>-----------------------------------<br/>• «artifact» /etc/nginx/nginx.conf<br/>• «artifact» /etc/nginx/certs/server.crt<br/>• Security Headers: HSTS, CSP, X-Frame<br/>• Host Port Bind: 8081:80, 8443:443"]:::containerNode

                CntApp["«container» asset-app (:3000)<br/>[Image: asset-app (Node 20 Alpine)]<br/>-----------------------------------<br/>• «artifact» server.js, app.js<br/>• «artifact» Express RESTful APIs<br/>• Run as: node:node (UID 1000 non-root)<br/>• Middleware: RateLimiter & RBAC<br/>• Expose: Internal 3000/tcp"]:::containerNode

                CntPgadmin["«container» asset-pgadmin (:80)<br/>[Image: dpage/pgadmin4:8]<br/>-----------------------------------<br/>• Web Management Console GUI<br/>• Host Port Bind: 0.0.0.0:5050:80"]:::containerNode

                CntNginxExp["«container» asset-nginx-exporter (:9113)<br/>[Image: nginx/nginx-prometheus-exporter:1.1.0]<br/>-----------------------------------<br/>• Scrape Target: http://asset-nginx:80/stub_status<br/>• Expose: Internal 9113/tcp"]:::containerNode

                CntGrafana["«container» asset-grafana (:3000)<br/>[Image: grafana/grafana:10.4.0]<br/>-----------------------------------<br/>• «artifact» provisioning/datasources<br/>• «artifact» provisioning/dashboards<br/>• Host Port Bind: 0.0.0.0:3001:3000"]:::containerNode
            end

            %% --------------------------------------------------------
            %% ZONE 2: BACKEND NETWORK (ISOLATED)
            %% --------------------------------------------------------
            subgraph NET_BACKEND ["«network» Docker Bridge: backend-net (internal: true - CÔ LẬP TUYỆT ĐỐI)"]
                
                CntPostgres[("«container» asset-postgres (:5432)<br/>[Image: postgres:16-alpine]<br/>-----------------------------------<br/>• «artifact» /docker-entrypoint-initdb.d/init.sql<br/>• «artifact» /docker-entrypoint-initdb.d/seed.sql<br/>• DB: assetdb | User: assetuser<br/>• Port: Internal 5432 (KHÔNG MỞ RA NGOÀI)")]:::containerNode

                CntPgExp["«container» asset-postgres-exporter (:9187)<br/>[Image: postgres-exporter:v0.15.0]<br/>-----------------------------------<br/>• Expose: Internal 9187/tcp<br/>• Connection: postgresql://asset-postgres:5432/assetdb"]:::containerNode
            end

            %% --------------------------------------------------------
            %% ZONE 3: MONITORING NETWORK
            %% --------------------------------------------------------
            subgraph NET_MONITORING ["«network» Docker Bridge: monitoring-net (172.22.0.0/16)"]
                
                CntPrometheus["«container» asset-prometheus (:9090)<br/>[Image: prom/prometheus:v2.51.0]<br/>-----------------------------------<br/>• «artifact» /etc/prometheus/prometheus.yml<br/>• Scrape 4 targets: app, cadvisor, pg, nginx<br/>• Retention: 7 days TSDB<br/>• Host Port Bind: 0.0.0.0:9090:9090"]:::containerNode

                CntCadvisor["«container» asset-cadvisor (:8080)<br/>[Image: cadvisor:v0.49.1]<br/>-----------------------------------<br/>• Hardware & Container Resources<br/>• privileged: false (Hạ quyền)<br/>• Host Port Bind: 0.0.0.0:8088:8080"]:::containerNode

                CntLoki["«container» asset-loki (:3100)<br/>[Image: grafana/loki:3.0.0]<br/>-----------------------------------<br/>• «artifact» /etc/loki/local-config.yaml<br/>• Chunks & Log Index Storage<br/>• Host Port Bind: 127.0.0.1:3100:3100"]:::containerNode

                CntPromtail["«container» asset-promtail<br/>[Image: grafana/promtail:3.0.0]<br/>-----------------------------------<br/>• «artifact» /etc/promtail/config.yml<br/>• Read & Parse Container Logs<br/>• Network: Internal Agent"]:::containerNode
            end

            %% --------------------------------------------------------
            %% PERSISTENT VOLUMES
            %% --------------------------------------------------------
            VolPostgres[("«storage volume»<br/>postgres_data<br/>(Dữ liệu DB)")]:::volumeNode
            VolPgadmin[("«storage volume»<br/>pgadmin_data<br/>(Cấu hình pgAdmin)")]:::volumeNode
            VolGrafana[("«storage volume»<br/>grafana_data<br/>(Dashboards)")]:::volumeNode
            VolLoki[("«storage volume»<br/>loki_data<br/>(Log Chunks)")]:::volumeNode
            VolLogs[("«storage volume»<br/>app_logs<br/>(Winston Logs)")]:::volumeNode

        end
    end

    %% ==========================================
    %% MOUNT RELATIONSHIPS (VOLUMES TO CONTAINERS)
    %% ==========================================
    CntPostgres --- VolPostgres
    CntPgadmin --- VolPgadmin
    CntGrafana --- VolGrafana
    CntLoki --- VolLoki
    CntApp --- VolLogs
    HostLog -.->|"mount /var/lib/docker/containers (ro)"| CntPromtail
    HostCert -.->|"mount ./nginx/certs (ro)"| CntNginx

    %% ==========================================
    %% NETWORK PROTOCOLS & COMMUNICATION PATHS
    %% ==========================================
    Browser -->|"HTTP / TCP 80"| HostNginx
    Browser ==>|"HTTPS / TCP 443 (TLSv1.3 Encrypted)"| HostNginx
    Browser -.->|"HTTP / TCP 5050 (pgAdmin)"| CntPgadmin
    Browser -.->|"HTTP / TCP 3001 (Grafana)"| CntGrafana
    Browser -.->|"HTTP / TCP 9090 (Prometheus)"| CntPrometheus

    HostNginx -->|"Proxy SSL / TCP 8443 (HTTPS)"| CntNginx
    CntNginx -->|"Proxy Pass / TCP 3000 (HTTP)"| CntApp
    
    CntApp ==>|"TCP 5432 (SQL Connection Pool)"| CntPostgres
    CntPgadmin ==>|"TCP 5432 (Internal SQL)"| CntPostgres

    CntNginxExp -->|"HTTP / TCP 80 (/stub_status)"| CntNginx
    CntPgExp -->|"TCP 5432 (pg_stat_* queries)"| CntPostgres

    CntPrometheus -->|"Pull Metrics / TCP 3000 (/metrics)"| CntApp
    CntPrometheus -->|"Pull Metrics / TCP 9113"| CntNginxExp
    CntPrometheus -->|"Pull Metrics / TCP 9187"| CntPgExp
    CntPrometheus -->|"Pull Metrics / TCP 8080"| CntCadvisor

    CntGrafana -->|"PromQL Query / TCP 9090"| CntPrometheus
    CntGrafana -->|"LogQL Query / TCP 3100"| CntLoki

    CntPromtail -->|"Push Logs / TCP 3100"| CntLoki
```

---

## 2. Bảng Mô Tả Các Thành Phần Trong Sơ Đồ Triển Khai

| Nút / Thành phần (Node / Artifact) | Phân loại UML | Môi trường / Công nghệ | Vai trò & Đặc tính kỹ thuật |
|---|---|---|---|
| **Client / Admin Workstation** | `«device»` | Windows / macOS / Linux Browser | Trình duyệt gửi request HTTP/HTTPS và lưu trữ JWT token trong session |
| **Cloud VPS Server** | `«device»` | Ubuntu 24.04 LTS (IP: `180.93.106.7`) | Máy chủ đám mây chạy toàn bộ hệ thống |
| **Host Nginx** | `«execution environment»` | Nginx Daemon trên OS host | Đón đầu cổng 80 & 443, tự động chuyển hướng 301, chặn truy cập `/stub_status` |
| **Docker Engine** | `«execution environment»` | Docker Engine 26.x + Compose | Điều phối 11 containers, 3 networks và 5 volumes |
| **`asset-nginx`** | `«container»` | Nginx 1.25 Alpine | Kết thúc phiên TLS (TLS Termination), áp dụng Security Headers, proxy sang App |
| **`asset-app`** | `«container»` | Node.js 20 Alpine (Custom) | Chạy Express API dưới quyền user `node` (non-root), rate limiting, xác thực JWT, RBAC |
| **`asset-postgres`** | `«container»` | PostgreSQL 16 Alpine | Lưu trữ DB tài sản; **chỉ nằm trong mạng `backend-net internal: true`, cổng 5432 không mở ra ngoài** |
| **`asset-pgadmin`** | `«container»` | pgAdmin 4 v8 | Cung cấp giao diện đồ họa quản trị DB qua cổng 5050 |
| **`asset-prometheus`** | `«container»` | Prometheus 2.51.0 | Thu thập metrics định kỳ 10s từ 4 exporter qua `monitoring-net`, lưu TSDB 7 ngày |
| **`asset-grafana`** | `«container»` | Grafana 10.4.0 | Dashboard trực quan hóa chỉ số (PromQL) và nhật ký log (LogQL) qua cổng 3001 |
| **`asset-cadvisor`** | `«container»` | Google cAdvisor v0.49.1 | Đo CPU, RAM, Disk I/O container; cấu hình **`privileged: false`** và `no-new-privileges: true` |
| **`asset-postgres-exporter`**| `«container»` | postgres-exporter v0.15.0 | Đọc `pg_stat_*` nội bộ từ database và cấp metrics dạng Prometheus qua cổng 9187 |
| **`asset-nginx-exporter`** | `«container»` | nginx-prometheus-exporter 1.1.0 | Đọc chỉ số kết nối từ `/stub_status` của Nginx qua cổng 9113 |
| **`asset-loki`** | `«container»` | Grafana Loki 3.0.0 | Cơ sở dữ liệu lưu trữ log chunks và metadata nhãn; hỗ trợ truy vấn LogQL |
| **`asset-promtail`** | `«container»` | Grafana Promtail 3.0.0 | Log agent mount `/var/lib/docker/containers` đọc log JSON của container và đẩy về Loki |
| **Volumes (`postgres_data`,...)**| `«storage volume»` | Docker Named Volumes | Lưu trữ bền vững dữ liệu DB, cấu hình Grafana, file logs không bị mất khi restart container |

---

## 3. Các Luồng Giao Tiếp Chính Trong Sơ Đồ

1. **Luồng Người dùng Web (HTTPS Flow)**:  
   `Browser` $\xrightarrow{\text{HTTPS :443 (TLSv1.3)}}$ `Host Nginx` $\xrightarrow{\text{Proxy SSL :8443}}$ `asset-nginx` $\xrightarrow{\text{Proxy Pass :3000}}$ `asset-app` $\xrightarrow{\text{SQL Pool :5432}}$ `asset-postgres`.
2. **Luồng Chuyển Hướng Tự Động (HTTP 301 Redirect)**:  
   `Browser` $\xrightarrow{\text{HTTP :80}}$ `Host Nginx` $\xrightarrow{\text{HTTP 301}}$ Trình duyệt tự động chuyển sang `https://180.93.106.7/`.
3. **Luồng Thu Thập Metrics (Prometheus Scrape Flow)**:  
   `asset-prometheus` định kỳ 10 giây kéo dữ liệu song song từ 4 đích:
   - `asset-app:3000/metrics` (Latency, Request Counts).
   - `asset-cadvisor:8080/metrics` (CPU, Memory, Network của từng Container).
   - `asset-postgres-exporter:9187/metrics` (Số kết nối DB, query latency, tuples).
   - `asset-nginx-exporter:9113/metrics` (Active connections, Reading, Writing, Waiting).
4. **Luồng Thu Thập & Truy Vấn Log (Loki / LogQL Flow)**:  
   `Docker Containers (stdout/stderr)` $\rightarrow$ `/var/lib/docker/containers/*-json.log` $\xrightarrow{\text{Mount (ro)}}$ `asset-promtail` $\xrightarrow{\text{Push Stream :3100}}$ `asset-loki` $\xleftarrow{\text{LogQL Query}}$ `asset-grafana`.
