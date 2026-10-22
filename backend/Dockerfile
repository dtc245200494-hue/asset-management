# ====================================================================
# Dockerfile: Backend Quản lý Tài sản / Thiết bị (Node.js LTS Alpine)
# Áp dụng Hardening: Non-root User, Slim Base, Tối ưu bảo mật
# ====================================================================

FROM node:20-alpine AS base

# Cài đặt wget cho healthcheck và dumb-init để xử lý signals đúng cách
RUN apk add --no-cache dumb-init wget

WORKDIR /app

# Thiết lập biến môi trường production
ENV NODE_ENV=production
ENV PORT=3000

# Copy file định nghĩa phụ thuộc
COPY package*.json ./

# Cài đặt thư viện production
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy toàn bộ mã nguồn ứng dụng
COPY . .

# Hardening: Tạo thư mục logs và phân quyền cho người dùng không đặc quyền (node)
RUN mkdir -p logs && chown -R node:node /app

# Chuyển sang người dùng non-root 'node' (UID: 1000)
USER node

# Expose cổng ứng dụng
EXPOSE 3000

# Healthcheck xác thực ứng dụng còn hoạt động
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Khởi chạy ứng dụng qua dumb-init để quản lý PID 1 và graceful shutdown
CMD ["dumb-init", "node", "src/server.js"]
