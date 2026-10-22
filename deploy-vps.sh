#!/bin/bash
# ====================================================================
# SCRIPT TRIỂN KHAI TỰ ĐỘNG LÊN VPS UBUNTU - ĐỀ 16
# Sinh viên: Hoàng Trang Hiền - MSV: DTC245200494
# ====================================================================

set -e

echo "======================================================================="
echo "   TRIỂN KHAI HỆ THỐNG QUẢN LÝ TÀI SẢN / THIẾT BỊ (ĐỀ 16) LÊN VPS      "
echo "======================================================================="

# 1. Cài đặt Docker & Docker Compose nếu chưa có
if ! command -v docker &> /dev/null; then
    echo "[1/4] Đang cài đặt Docker và Docker Compose Plugin..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo ">> Cài đặt Docker hoàn tất."
else
    echo "[1/4] Docker đã được cài đặt: $(docker --version)"
fi

# 2. Tạo file cấu hình môi trường .env
if [ ! -f .env ]; then
    echo "[2/4] Tạo file .env từ .env.example..."
    cp .env.example .env
else
    echo "[2/4] File .env đã tồn tại."
fi

# 3. Khởi chạy 11 Container qua Docker Compose
echo "[3/4] Đang khởi động 11 Containers hệ thống (Build images & pull dependencies)..."
sudo docker compose up -d --build

# 4. Kiểm tra trạng thái
echo "[4/4] Kiểm tra trạng thái các dịch vụ..."
sudo docker compose ps

echo "======================================================================="
echo "   HỆ THỐNG ĐÃ SẴN SÀNG TRÊN VPS!                                      "
echo "   - Website (Nginx):      http://$(curl -s ifconfig.me)"
echo "   - Grafana Dashboard:    http://$(curl -s ifconfig.me):3001"
echo "   - Prometheus Targets:   http://$(curl -s ifconfig.me):9090/targets"
echo "   - pgAdmin4:             http://$(curl -s ifconfig.me):5050"
echo "======================================================================="
