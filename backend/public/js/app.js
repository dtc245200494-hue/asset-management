// ====================================================================
// APP.JS - Hệ thống Quản lý Tài sản / Thiết bị - Đề 16
// Xử lý API, tương tác giao diện, bảo mật JWT và cập nhật trạng thái
// ====================================================================

const API = {
  // Quản lý Token & Session
  getToken() {
    return localStorage.getItem('asset_token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('asset_user'));
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem('asset_token', token);
    localStorage.setItem('asset_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('asset_token');
    localStorage.removeItem('asset_user');
  },

  logout() {
    API.clearSession();
    window.location.href = '/login.html';
  },

  // Header kèm JWT Token bắt buộc cho các thao tác ghi dữ liệu (POST, PUT, DELETE)
  getHeaders(customHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...customHeaders };
    const token = API.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Wrapper fetch tự động xử lý 401 Unauthorized
  async authFetch(url, options = {}) {
    options.headers = API.getHeaders(options.headers || {});
    const res = await fetch(url, options);

    if (res.status === 401) {
      API.showToast('Phiên làm việc hết hạn hoặc yêu cầu đăng nhập. Đang chuyển hướng...', 'danger');
      API.clearSession();
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
      throw new Error('Yêu cầu xác thực tài khoản (401 Unauthorized)');
    }

    if (res.status === 403) {
      API.showToast('Bạn không có đủ quyền hạn để thực hiện thao tác này (403 Forbidden)', 'danger');
      throw new Error('Từ chối quyền hạn (403 Forbidden)');
    }

    return res;
  },

  // Cập nhật UI người dùng đăng nhập trên Navbar
  updateAuthUI() {
    const user = API.getUser();
    const authContainer = document.getElementById('navbarUserArea');
    if (!authContainer) return;

    if (user && user.username) {
      authContainer.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary px-3 py-2">
            <i class="bi bi-person-check-fill me-1"></i>${user.username} (${user.role})
          </span>
          <button class="btn btn-outline-danger btn-sm" onclick="API.logout()" title="Đăng xuất">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      `;
    } else {
      authContainer.innerHTML = `
        <a href="/login.html" class="btn btn-primary btn-sm">
          <i class="bi bi-person-circle me-1"></i>Đăng nhập
        </a>
      `;
    }
  },

  // Format tiền tệ VNĐ
  formatCurrency(value) {
    if (!value) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  },

  // Format ngày tháng DD/MM/YYYY
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  },

  // Trả về nhãn trạng thái HTML
  renderStatusBadge(status) {
    switch (status) {
      case 'IN_USE':
        return '<span class="badge-status badge-in-use"><i class="bi bi-play-circle me-1"></i>Đang sử dụng</span>';
      case 'AVAILABLE':
        return '<span class="badge-status badge-available"><i class="bi bi-check-circle me-1"></i>Sẵn sàng</span>';
      case 'MAINTENANCE':
        return '<span class="badge-status badge-maintenance"><i class="bi bi-tools me-1"></i>Đang bảo trì</span>';
      case 'DISPOSED':
        return '<span class="badge-status badge-disposed"><i class="bi bi-x-circle me-1"></i>Đã thanh lý</span>';
      default:
        return `<span class="badge bg-secondary">${status}</span>`;
    }
  },

  // Hiển thị Toast thông báo
  showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'text-bg-success' : (type === 'danger' ? 'text-bg-danger' : 'text-bg-warning');
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="bi ${icon} fs-5"></i>
            <div>${message}</div>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  },

  // Kích hoạt lỗi giả lập để test Loki & Promtail
  async triggerTestError() {
    try {
      API.showToast('Đang gửi request gây lỗi tới backend...', 'warning');
      const res = await fetch('/api/test-error');
      const data = await res.json();
      API.showToast(`Đã ghi log ERROR: "${data.message}". Hãy kiểm tra Grafana Loki Explore!`, 'danger');
    } catch (err) {
      API.showToast('Request gây lỗi thành công! Log ERROR đã được ghi nhận trên Loki.', 'danger');
    }
  }
};

// ==========================================
// 1. TRANG DASHBOARD
// ==========================================
async function loadDashboard() {
  API.updateAuthUI();
  try {
    const res = await fetch('/api/dashboard/stats');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const { summary, maintenance, categories, recentAssets } = json.data;

    // Cập nhật các thẻ thông số
    document.getElementById('statTotalAssets').innerText = summary.total || 0;
    document.getElementById('statInUse').innerText = summary.in_use || 0;
    document.getElementById('statMaintenance').innerText = summary.maintenance || 0;
    document.getElementById('statDisposed').innerText = summary.disposed || 0;
    document.getElementById('statTotalValue').innerText = API.formatCurrency(summary.total_value);
    document.getElementById('statTotalMaint').innerText = `${maintenance.total_maintenance || 0} lượt (${API.formatCurrency(maintenance.total_maint_cost)})`;

    // Vẽ biểu đồ phân bố danh mục (Chart.js)
    const ctx = document.getElementById('categoryChart');
    if (ctx && categories.length > 0) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categories.map(c => c.name),
          datasets: [{
            data: categories.map(c => c.asset_count),
            backgroundColor: [
              '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } }
          }
        }
      });
    }

    // Danh sách tài sản mới nhất
    const tbody = document.getElementById('recentAssetsTable');
    if (tbody) {
      if (recentAssets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có tài sản nào</td></tr>';
      } else {
        tbody.innerHTML = recentAssets.map((a, i) => `
          <tr>
            <td class="text-muted fw-bold">${i + 1}</td>
            <td><span class="fw-semibold text-primary">${a.asset_code}</span></td>
            <td><strong>${a.name}</strong></td>
            <td><span class="badge bg-light text-dark border">${a.category_name}</span></td>
            <td>${API.formatCurrency(a.price)}</td>
            <td>${API.renderStatusBadge(a.status)}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Lỗi nạp dashboard:', err);
    API.showToast('Không thể tải dữ liệu Dashboard: ' + err.message, 'danger');
  }
}

// ==========================================
// 2. TRANG QUẢN LÝ TÀI SẢN
// ==========================================
let allCategories = [];

async function loadCategoriesSelect(selectId, defaultOption = 'Chọn danh mục...') {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    if (allCategories.length === 0) {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) allCategories = json.data;
    }
    sel.innerHTML = `<option value="">${defaultOption}</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (e) {
    console.error(e);
  }
}

async function loadAssetsList() {
  API.updateAuthUI();
  const tbody = document.getElementById('assetsTableBody');
  if (!tbody) return;

  const q = document.getElementById('searchInput')?.value.trim() || '';
  const status = document.getElementById('filterStatus')?.value || 'ALL';
  const category_id = document.getElementById('filterCategory')?.value || 'ALL';

  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm me-2"></div>Đang tải dữ liệu...</td></tr>';

  try {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (status !== 'ALL') params.append('status', status);
    if (category_id !== 'ALL') params.append('category_id', category_id);

    const res = await fetch(`/api/assets?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const assets = json.data;
    document.getElementById('assetCountBadge').innerText = `${assets.length} thiết bị`;

    if (assets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>Không tìm thấy thiết bị nào phù hợp</td></tr>';
      return;
    }

    tbody.innerHTML = assets.map((a, i) => `
      <tr>
        <td class="text-muted">${i + 1}</td>
        <td><span class="fw-bold text-primary font-monospace">${a.asset_code}</span></td>
        <td>
          <div class="fw-semibold">${a.name}</div>
          <small class="text-muted">${a.notes || 'Không có ghi chú'}</small>
        </td>
        <td><span class="badge bg-light text-dark border">${a.category_name}</span></td>
        <td class="fw-semibold">${API.formatCurrency(a.price)}</td>
        <td>${API.renderStatusBadge(a.status)}</td>
        <td><i class="bi bi-geo-alt me-1 text-danger"></i>${a.location}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-info me-1" onclick="viewAssetDetail(${a.id})" title="Chi tiết"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editAssetModal(${a.id})" title="Chỉnh sửa (Cần đăng nhập)"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteAsset(${a.id}, '${a.asset_code}')" title="Xóa (Cần quyền Admin)"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
  }
}

// Thêm mới hoặc cập nhật tài sản (Bảo vệ bằng JWT)
async function saveAsset(e) {
  e.preventDefault();
  const id = document.getElementById('assetId')?.value;
  const payload = {
    asset_code: document.getElementById('assetCode').value.trim(),
    name: document.getElementById('assetName').value.trim(),
    category_id: document.getElementById('assetCategory').value,
    purchase_date: document.getElementById('assetPurchaseDate').value,
    price: document.getElementById('assetPrice').value,
    status: document.getElementById('assetStatus').value,
    location: document.getElementById('assetLocation').value.trim(),
    notes: document.getElementById('assetNotes').value.trim()
  };

  try {
    const url = id ? `/api/assets/${id}` : '/api/assets';
    const method = id ? 'PUT' : 'POST';

    const res = await API.authFetch(url, {
      method,
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    API.showToast(id ? 'Cập nhật tài sản thành công!' : 'Thêm mới tài sản thành công!');
    const modal = bootstrap.Modal.getInstance(document.getElementById('assetModal'));
    if (modal) modal.hide();
    loadAssetsList();
  } catch (err) {
    API.showToast(err.message, 'danger');
  }
}

// Mở modal thêm tài sản
function openCreateAssetModal() {
  if (!API.getToken()) {
    API.showToast('Vui lòng đăng nhập để thêm mới tài sản!', 'warning');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }
  document.getElementById('assetForm').reset();
  document.getElementById('assetId').value = '';
  document.getElementById('assetModalTitle').innerText = 'Thêm mới Thiết bị / Tài sản';
  document.getElementById('assetCode').removeAttribute('readonly');
  loadCategoriesSelect('assetCategory');
  const modal = new bootstrap.Modal(document.getElementById('assetModal'));
  modal.show();
}

// Chỉnh sửa tài sản
async function editAssetModal(id) {
  if (!API.getToken()) {
    API.showToast('Vui lòng đăng nhập để chỉnh sửa tài sản!', 'warning');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }
  try {
    const res = await fetch(`/api/assets/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const a = json.data;
    document.getElementById('assetId').value = a.id;
    document.getElementById('assetCode').value = a.asset_code;
    document.getElementById('assetCode').setAttribute('readonly', true);
    document.getElementById('assetName').value = a.name;
    await loadCategoriesSelect('assetCategory');
    document.getElementById('assetCategory').value = a.category_id;
    document.getElementById('assetPurchaseDate').value = a.purchase_date ? a.purchase_date.split('T')[0] : '';
    document.getElementById('assetPrice').value = a.price;
    document.getElementById('assetStatus').value = a.status;
    document.getElementById('assetLocation').value = a.location;
    document.getElementById('assetNotes').value = a.notes || '';

    document.getElementById('assetModalTitle').innerText = `Chỉnh sửa: ${a.asset_code}`;
    const modal = new bootstrap.Modal(document.getElementById('assetModal'));
    modal.show();
  } catch (err) {
    API.showToast('Không lấy được dữ liệu tài sản: ' + err.message, 'danger');
  }
}

// Xem chi tiết kèm lịch sử bảo trì
async function viewAssetDetail(id) {
  try {
    const res = await fetch(`/api/assets/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    const a = json.data;

    let content = `
      <div class="row g-3">
        <div class="col-md-6"><strong>Mã thiết bị:</strong> <span class="text-primary">${a.asset_code}</span></div>
        <div class="col-md-6"><strong>Tên thiết bị:</strong> ${a.name}</div>
        <div class="col-md-6"><strong>Danh mục:</strong> ${a.category_name}</div>
        <div class="col-md-6"><strong>Giá trị:</strong> ${API.formatCurrency(a.price)}</div>
        <div class="col-md-6"><strong>Trạng thái:</strong> ${API.renderStatusBadge(a.status)}</div>
        <div class="col-md-6"><strong>Vị trí đặt:</strong> ${a.location}</div>
        <div class="col-md-12"><strong>Ghi chú:</strong> ${a.notes || 'Không có'}</div>
      </div>
      <hr>
      <h6 class="fw-bold mt-3 mb-2"><i class="bi bi-clock-history me-1"></i>Lịch sử bảo trì (${a.maintenance_history.length})</h6>
    `;

    if (a.maintenance_history.length === 0) {
      content += '<p class="text-muted small">Chưa có lịch sử bảo trì nào.</p>';
    } else {
      content += `
        <div class="table-responsive">
          <table class="table table-sm table-bordered">
            <thead class="table-light"><tr><th>Ngày</th><th>Người thực hiện</th><th>Nội dung</th><th>Chi phí</th></tr></thead>
            <tbody>
              ${a.maintenance_history.map(m => `
                <tr>
                  <td>${API.formatDate(m.maintenance_date)}</td>
                  <td>${m.performed_by}</td>
                  <td>${m.description}</td>
                  <td>${API.formatCurrency(m.cost)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    document.getElementById('detailModalBody').innerHTML = content;
    new bootstrap.Modal(document.getElementById('detailModal')).show();
  } catch (err) {
    API.showToast(err.message, 'danger');
  }
}

// Xóa tài sản (Bảo vệ bằng JWT Token - Yêu cầu quyền Admin)
async function deleteAsset(id, code) {
  if (!API.getToken()) {
    API.showToast('Vui lòng đăng nhập với quyền Quản trị viên để xóa tài sản!', 'warning');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }

  if (!confirm(`Bạn có chắc chắn muốn xóa tài sản [${code}] không? Hành động này sẽ xóa cả lịch sử bảo trì liên quan!`)) {
    return;
  }

  try {
    const res = await API.authFetch(`/api/assets/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    API.showToast(`Đã xóa tài sản ${code} thành công!`);
    loadAssetsList();
  } catch (err) {
    API.showToast(err.message, 'danger');
  }
}

// ==========================================
// 3. TRANG LỊCH SỬ BẢO TRÌ
// ==========================================
async function loadMaintenanceList() {
  API.updateAuthUI();
  const tbody = document.getElementById('maintenanceTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/maintenance');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const records = json.data;
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">Chưa có bản ghi bảo trì nào</td></tr>';
      return;
    }

    tbody.innerHTML = records.map((m, i) => `
      <tr>
        <td class="text-muted">${i + 1}</td>
        <td><span class="fw-bold text-primary font-monospace">${m.asset_code}</span></td>
        <td><strong>${m.asset_name}</strong></td>
        <td>${API.formatDate(m.maintenance_date)}</td>
        <td><i class="bi bi-person me-1 text-muted"></i>${m.performed_by}</td>
        <td>${m.description}</td>
        <td class="fw-semibold text-danger">${API.formatCurrency(m.cost)}</td>
        <td>${API.renderStatusBadge(m.status_after)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteMaintenance(${m.id})" title="Xóa (Cần quyền Admin)"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger py-4 text-center">Lỗi: ${err.message}</td></tr>`;
  }
}

async function openCreateMaintenanceModal() {
  if (!API.getToken()) {
    API.showToast('Vui lòng đăng nhập để ghi nhận bảo trì!', 'warning');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }
  const sel = document.getElementById('maintAssetId');
  if (sel) {
    const res = await fetch('/api/assets');
    const json = await res.json();
    if (json.success) {
      sel.innerHTML = '<option value="">Chọn thiết bị cần bảo trì...</option>' +
        json.data.map(a => `<option value="${a.id}">[${a.asset_code}] ${a.name} (${a.location})</option>`).join('');
    }
  }
  document.getElementById('maintDate').value = new Date().toISOString().split('T')[0];
  new bootstrap.Modal(document.getElementById('maintenanceModal')).show();
}

async function saveMaintenance(e) {
  e.preventDefault();
  const payload = {
    asset_id: document.getElementById('maintAssetId').value,
    maintenance_date: document.getElementById('maintDate').value,
    performed_by: document.getElementById('maintTechnician').value.trim(),
    cost: document.getElementById('maintCost').value,
    description: document.getElementById('maintDescription').value.trim(),
    status_after: document.getElementById('maintStatusAfter').value
  };

  try {
    const res = await API.authFetch('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    API.showToast('Ghi nhận thông tin bảo trì thành công!');
    bootstrap.Modal.getInstance(document.getElementById('maintenanceModal')).hide();
    loadMaintenanceList();
  } catch (err) {
    API.showToast(err.message, 'danger');
  }
}

async function deleteMaintenance(id) {
  if (!API.getToken()) {
    API.showToast('Vui lòng đăng nhập với quyền Quản trị viên để xóa bản ghi bảo trì!', 'warning');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }

  if (!confirm('Bạn có chắc chắn muốn xóa bản ghi bảo trì này không?')) return;

  try {
    const res = await API.authFetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    API.showToast('Đã xóa bản ghi bảo trì thành công!');
    loadMaintenanceList();
  } catch (err) {
    API.showToast(err.message, 'danger');
  }
}
