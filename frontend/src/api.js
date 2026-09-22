const TOKEN_KEY = 'callio_access_token';
const BASE_URL = import.meta.env.VITE_API_URL || '';

export const authState = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
  }
};

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }
  
  const config = {
    ...options,
    headers
  };
  
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(fullUrl, config);
    if (res.status === 401) {
      authState.logout();
      window.location.hash = '#/auth';
      throw new Error('Unauthorized session. Please log in.');
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'API request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${fullUrl}]:`, err);
    throw err;
  }
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-primary';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-info-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white ${bgClass} border-0 show shadow-lg mb-2`;
  toastEl.role = 'alert';
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2 fw-semibold">
        <i class="bi ${icon} fs-5"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, 4000);
}
