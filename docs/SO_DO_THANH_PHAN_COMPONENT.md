# SƠ ĐỒ THÀNH PHẦN HỆ THỐNG (UML COMPONENT DIAGRAM)
**Đề tài**: Đề 16 – Hệ thống Quản lý Tài sản / Thiết bị  
**Học phần**: Triển khai và Quản trị Hệ thống Phần mềm  
**Sinh viên thực hiện**: DTC245200494 (Hoàng Trang Hiền)  

---

## 1. Sơ Đồ Thành Phần UML (Component Diagram)

Sơ đồ mô tả cấu trúc mô-đun phần mềm, các giao diện cung cấp (**Provided Interfaces**) và giao diện yêu cầu (**Required Interfaces**), cùng mối quan hệ phụ thuộc giữa các thành phần nghiệp vụ, bảo mật, giám sát và lưu trữ.

```mermaid
flowchart TD
    %% Styling Classes
    classDef compNode fill:#ffffff,stroke:#1d4ed8,stroke-width:2px,color:#0f172a;
    classDef interfaceNode fill:#fef08a,stroke:#ca8a04,stroke-width:1.5px,color:#713f12;
    classDef subComp fill:#f1f5f9,stroke:#64748b,stroke-width:1.5px,color:#0f172a;
    classDef packageBox fill:#f8fafc,stroke:#334155,stroke-width:2px,stroke-dasharray: 4 2,color:#0f172a;

    %% ==========================================
    %% PACKAGE 1: PRESENTATION & CLIENT
    %% ==========================================
    subgraph PKG_CLIENT ["«subsystem» Giao Diện & Máy Khách (Presentation Tier)"]
        subgraph COMP_FRONTEND ["«component» WebClient Component"]
            UI_View["«subcomponent» UI Views<br/>(Dashboard, Assets, Maintenance, Login)"]:::subComp
            App_JS["«subcomponent» API Service<br/>(app.js, Token Storage, authFetch)"]:::subComp
            Chart_JS["«subcomponent» Charts Service<br/>(Chart.js Widget Render)"]:::subComp
        end
    end

    %% ==========================================
    %% PACKAGE 2: INGRESS & REVERSE PROXY
    %% ==========================================
    subgraph PKG_INGRESS ["«subsystem» Tầng Biên Mạng (Ingress & Proxy Tier)"]
        subgraph COMP_NGINX ["«component» NginxReverseProxy Component (asset-nginx)"]
            SSL_Term["«subcomponent» SSL/TLS Engine<br/>(TLSv1.3, x509v3 SAN Cert)"]:::subComp
            Sec_Headers["«subcomponent» Security Filter<br/>(HSTS, CSP Strict, X-Frame, Nosniff)"]:::subComp
            Redirect_Mod["«subcomponent» HTTP Redirector<br/>(301 Port 80 -> 443)"]:::subComp
            Stub_Mod["«subcomponent» Metrics Stub<br/>(Access Control /stub_status)"]:::subComp
        end
    end

    %% ==========================================
    %% PACKAGE 3: APPLICATION BACKEND
    %% ==========================================
    subgraph PKG_APP ["«subsystem» Tầng Nghiệp Vụ Ứng Dụng (Application Tier)"]
        subgraph COMP_BACKEND ["«component» AssetManagementBackend Component (asset-app)"]
            Auth_Mod["«subcomponent» AuthModule<br/>• Bcrypt Compare<br/>• Centralized jwt.js<br/>• RateLimiter (10req/15m)"]:::subComp
            Asset_Mod["«subcomponent» AssetModule<br/>• CRUD Assets<br/>• Check Dup Upper<br/>• Filter & Pagination"]:::subComp
            Maint_Mod["«subcomponent» MaintenanceModule<br/>• RBAC Middleware<br/>• Transaction History"]:::subComp
            Prom_Client["«subcomponent» MetricsCollector<br/>• prom-client<br/>• Latency & Counter"]:::subComp
            Winston_Log["«subcomponent» LoggingService<br/>• Winston JSON Logger"]:::subComp
        end
    end

    %% ==========================================
    %% PACKAGE 4: DATA PERSISTENCE
    %% ==========================================
    subgraph PKG_DATA ["«subsystem» Tầng Dữ Liệu Bền Vững (Persistence Tier)"]
        subgraph COMP_POSTGRES ["«component» PostgreSQLDatabase Component (asset-postgres)"]
            DB_Users[("«table» users<br/>(User, Role, Hash)")]:::subComp
            DB_Cats[("«table» categories")]:::subComp
            DB_Assets[("«table» assets")]:::subComp
            DB_Maint[("«table» maintenance_history")]:::subComp
        end

        subgraph COMP_PGADMIN ["«component» DatabaseAdmin Component (asset-pgadmin)"]
            PGA_Web["«subcomponent» Web GUI Console"]:::subComp
        end
    end

    %% ==========================================
    %% PACKAGE 5: OBSERVABILITY & LOGGING
    %% ==========================================
    subgraph PKG_MONITOR ["«subsystem» Tầng Giám Sát & Logging (Observability Tier)"]
        subgraph COMP_EXPORTERS ["«component» Exporters Suite"]
            Nginx_Exp["«component» NginxExporter (asset-nginx-exporter)"]:::subComp
            Pg_Exp["«component» PostgresExporter (asset-postgres-exporter)"]:::subComp
            Cadvisor_Comp["«component» cAdvisor (asset-cadvisor)"]:::subComp
        end

        subgraph COMP_PROMETHEUS ["«component» PrometheusCore Component (asset-prometheus)"]
            Prom_Scraper["«subcomponent» Scrape Engine (10s)"]:::subComp
            Prom_TSDB["«subcomponent» TSDB Storage (7d)"]:::subComp
        end

        subgraph COMP_GRAFANA ["«component» Visualization Component (asset-grafana)"]
            GF_Dash["«subcomponent» Dashboard Engine"]:::subComp
            GF_Prov["«subcomponent» Provisioning Loader"]:::subComp
        end

        subgraph COMP_LOGS ["«component» Logging System (Loki & Promtail)"]
            Promtail_Agent["«component» Promtail Agent (asset-promtail)"]:::subComp
            Loki_Store["«component» Loki Engine (asset-loki)"]:::subComp
        end
    end

    %% ==========================================
    %% PROVIDED INTERFACES (CÁC GIAO DIỆN CUNG CẤP)
    %% ==========================================
    Int_HTTPS(["«interface»<br/>IHTTPS_Ingress<br/>:443 (TLSv1.3)"]):::interfaceNode
    Int_HTTP(["«interface»<br/>IHTTP_Redirect<br/>:80 (301)"]):::interfaceNode
    Int_Auth(["«interface»<br/>IAuthAPI<br/>/api/auth/login"]):::interfaceNode
    Int_Asset(["«interface»<br/>IAssetAPI<br/>/api/assets"]):::interfaceNode
    Int_Maint(["«interface»<br/>IMaintenanceAPI<br/>/api/maintenance"]):::interfaceNode
    Int_DB(["«interface»<br/>IDatabaseAccess<br/>TCP :5432 (Internal)"]):::interfaceNode
    Int_AppMetrics(["«interface»<br/>IAppMetrics<br/>:3000/metrics"]):::interfaceNode
    Int_NginxStub(["«interface»<br/>INginxStubStatus<br/>/stub_status"]):::interfaceNode
    Int_PgMetrics(["«interface»<br/>IPgMetrics<br/>:9187/metrics"]):::interfaceNode
    Int_NgxMetrics(["«interface»<br/>INginxMetrics<br/>:9113/metrics"]):::interfaceNode
    Int_CadvisorMetrics(["«interface»<br/>IContainerMetrics<br/>:8080/metrics"]):::interfaceNode
    Int_PromQL(["«interface»<br/>IPromQLQuery<br/>:9090"]):::interfaceNode
    Int_LogPush(["«interface»<br/>ILogPushAPI<br/>:3100/push"]):::interfaceNode
    Int_LogQL(["«interface»<br/>ILogQLQuery<br/>:3100/query"]):::interfaceNode

    %% ==========================================
    %% COMPONENT LINKAGES & WIRING (DEPENDENCIES)
    %% ==========================================
    
    %% Ingress Provides
    COMP_NGINX --- Int_HTTPS
    COMP_NGINX --- Int_HTTP
    COMP_NGINX --- Int_NginxStub

    %% Frontend Requires Ingress
    COMP_FRONTEND ..> Int_HTTPS
    COMP_FRONTEND ..> Int_HTTP

    %% Nginx Requires Backend APIs
    COMP_NGINX ..> Int_Auth
    COMP_NGINX ..> Int_Asset
    COMP_NGINX ..> Int_Maint

    %% Backend Provides APIs
    COMP_BACKEND --- Int_Auth
    COMP_BACKEND --- Int_Asset
    COMP_BACKEND --- Int_Maint
    COMP_BACKEND --- Int_AppMetrics

    %% Backend Requires DB
    COMP_BACKEND ..> Int_DB
    COMP_PGADMIN ..> Int_DB
    Pg_Exp ..> Int_DB

    %% Database Provides Access
    COMP_POSTGRES --- Int_DB

    %% Exporters Wiring
    Nginx_Exp ..> Int_NginxStub
    Nginx_Exp --- Int_NgxMetrics
    Pg_Exp --- Int_PgMetrics
    Cadvisor_Comp --- Int_CadvisorMetrics

    %% Prometheus Scrapes
    Prom_Scraper ..> Int_AppMetrics
    Prom_Scraper ..> Int_NgxMetrics
    Prom_Scraper ..> Int_PgMetrics
    Prom_Scraper ..> Int_CadvisorMetrics
    COMP_PROMETHEUS --- Int_PromQL

    %% Grafana Queries
    COMP_GRAFANA ..> Int_PromQL
    COMP_GRAFANA ..> Int_LogQL

    %% Logging Pipeline
    Winston_Log -.->|"Container JSON Logs"| Promtail_Agent
    COMP_NGINX -.->|"Access Logs"| Promtail_Agent
    Promtail_Agent ..> Int_LogPush
    Loki_Store --- Int_LogPush
    Loki_Store --- Int_LogQL
```

---

## 2. Bảng Thống Kê Các Thành Phần & Giao Diện (Components & Interfaces)

| Nhóm Thành Phần | Tên Component | Giao diện Cung cấp (Provided) | Giao diện Yêu cầu (Required) | Chức năng chi tiết |
|---|---|---|---|---|
| **Presentation Tier** | `WebClient Component` | — | `IHTTPS_Ingress`, `IAuthAPI`, `IAssetAPI` | Giao diện người dùng trên trình duyệt (HTML5/CSS3/Chart.js), gửi HTTP request có kèm Bearer Token JWT. |
| **Ingress Tier** | `NginxReverseProxy Component` | `IHTTPS_Ingress` (:443), `IHTTP_Redirect` (:80), `INginxStubStatus` | `IAuthAPI`, `IAssetAPI`, `IMaintenanceAPI` | Kết thúc phiên TLSv1.3, tiêm Security Headers (HSTS, CSP, X-Frame), điều hướng request đến backend. |
| **Application Tier** | `AssetManagementBackend Component` | `IAuthAPI`, `IAssetAPI`, `IMaintenanceAPI`, `IAppMetrics` | `IDatabaseAccess` | Chạy Node.js Express, Rate Limiter chống Brute Force, băm mật khẩu Bcrypt, phân quyền RBAC và thu thập metrics `prom-client`. |
| **Persistence Tier** | `PostgreSQLDatabase Component` | `IDatabaseAccess` (TCP :5432) | — | Quản trị dữ liệu tài sản, người dùng, danh mục; cách ly trong mạng `backend-net internal: true`. |
| **Database GUI** | `DatabaseAdmin Component` | `IWebConsole` (Port 5050) | `IDatabaseAccess` | Giao diện quản trị PostgreSQL qua pgAdmin 4. |
| **Exporters Suite** | `Exporters Component` | `IPgMetrics`, `INginxMetrics`, `IContainerMetrics` | `IDatabaseAccess`, `INginxStubStatus` | Nhóm adapter chuyển đổi dữ liệu thô của hệ thống thành chuẩn metrics Prometheus. |
| **Metrics Core** | `PrometheusCore Component` | `IPromQLQuery` (:9090) | `IAppMetrics`, `IPgMetrics`, `INginxMetrics`, `IContainerMetrics` | Động cơ kéo metrics định kỳ 10s, lưu trữ chuỗi thời gian TSDB 7 ngày. |
| **Visualization** | `Visualization Component` | `IGrafanaWeb` (:3001) | `IPromQLQuery`, `ILogQLQuery` | Dashboard trực quan hóa trạng thái hệ thống, biểu đồ tài nguyên và truy vấn log. |
| **Logging Pipeline**| `Loki & Promtail Components` | `ILogPushAPI`, `ILogQLQuery` | Container Log Files (`/var/lib/docker/containers`) | Promtail đọc log stream, gắn nhãn metadata đẩy về Loki; Loki lập chỉ mục và cấp API LogQL. |

---

## 3. Các Nguyên Tắc Thiết Kế Thành Phần Được Áp Dụng

1. **Nguyên lý Đóng gói (Encapsulation)**:  
   Mỗi thành phần (Component) độc lập với nhau, ẩn giấu chi tiết cài đặt bên trong và chỉ giao tiếp với nhau qua các **Giao diện chuẩn hóa (Interfaces)**: REST API (JSON), SQL (TCP), PromQL, LogQL.
2. **Nguyên lý Phân tách Trách nhiệm (Separation of Concerns - SoC)**:  
   - Tầng Ingress chỉ chịu trách nhiệm định tuyến và bảo vệ biên mạng (TLS, Headers, Rate-limit).
   - Tầng Application chỉ xử lý logic nghiệp vụ và phân quyền dữ liệu.
   - Tầng Database chỉ quản lý tính toàn vẹn và giao dịch ACID.
   - Tầng Observability hoàn toàn tách biệt, không gây ảnh hưởng đến hiệu năng phục vụ của tầng ứng dụng chính.
3. **Nguyên lý Cách ly An ninh (Security by Isolation)**:  
   Thành phần cơ sở dữ liệu (`PostgreSQLDatabase`) không cung cấp giao diện ra ngoài Internet, chỉ cung cấp giao diện nội bộ `IDatabaseAccess` cho các thành phần được cấp phép (`AssetManagementBackend`, `PostgresExporter`, `DatabaseAdmin`).
