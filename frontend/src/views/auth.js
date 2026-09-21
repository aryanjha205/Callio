import { apiFetch, authState, showToast } from '../api.js';

export function renderAuthView(container) {
  let isLogin = true;

  function render() {
    container.innerHTML = `
      <div class="row justify-content-center align-items-center w-100 my-auto py-4">
        <div class="col-12 col-sm-10 col-md-8 col-lg-5">
          
          <div class="text-center mb-4">
            <div class="brand-logo-3d mx-auto mb-3" style="width: 64px; height: 64px; font-size: 2rem;">
              <i class="bi bi-telephone-fill"></i>
            </div>
            <h2 class="fw-extrabold text-light mb-1">Callio</h2>
            <p class="text-secondary fs-6">Real-Time Audio & Video Calling directly from your browser</p>
          </div>

          <div class="glass-card p-4 p-sm-5">
            
            <!-- Auth Toggle Tabs -->
            <div class="d-flex p-1 bg-dark-subtle rounded-3 mb-4 border border-dark-subtle">
              <button id="tab-login" class="flex-grow-1 btn btn-sm ${isLogin ? 'btn-primary fw-bold shadow-sm' : 'text-secondary border-0'} rounded-2 py-2">
                Sign In
              </button>
              <button id="tab-register" class="flex-grow-1 btn btn-sm ${!isLogin ? 'btn-primary fw-bold shadow-sm' : 'text-secondary border-0'} rounded-2 py-2">
                Create Account
              </button>
            </div>

            <form id="auth-form">
              ${!isLogin ? `
                <div class="mb-3">
                  <label class="form-label text-secondary fs-7 fw-semibold">Display Name</label>
                  <input type="text" id="input-display-name" class="form-control form-control-custom" placeholder="e.g. Alex Rivera" required />
                </div>
              ` : ''}

              <div class="mb-3">
                <label class="form-label text-secondary fs-7 fw-semibold">${isLogin ? 'Username or Email' : 'Username'}</label>
                <input type="text" id="input-username" class="form-control form-control-custom" placeholder="${isLogin ? 'Enter username or email' : 'e.g. alex_rivera'}" required />
              </div>

              ${!isLogin ? `
                <div class="mb-3">
                  <label class="form-label text-secondary fs-7 fw-semibold">Email Address</label>
                  <input type="email" id="input-email" class="form-control form-control-custom" placeholder="alex@example.com" required />
                </div>
              ` : ''}

              <div class="mb-4">
                <label class="form-label text-secondary fs-7 fw-semibold">Password</label>
                <input type="password" id="input-password" class="form-control form-control-custom" placeholder="••••••••" required />
              </div>

              <button type="submit" id="btn-submit-auth" class="btn-3d btn-3d-primary w-100 py-3 text-white fw-bold fs-6">
                ${isLogin ? 'Sign In to Callio' : 'Create Free Account'}
              </button>
            </form>

          </div>

        </div>
      </div>
    `;

    document.getElementById('tab-login')?.addEventListener('click', () => {
      isLogin = true;
      render();
    });

    document.getElementById('tab-register')?.addEventListener('click', () => {
      isLogin = false;
      render();
    });

    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-auth');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Processing...`;

      try {
        if (isLogin) {
          const username_or_email = document.getElementById('input-username').value.trim();
          const password = document.getElementById('input-password').value;
          
          const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username_or_email, password })
          });
          
          authState.setToken(res.access_token);
          authState.user = res.user;
          showToast(`Welcome back, ${res.user.display_name}!`, 'success');
          window.location.hash = '#/friends';
        } else {
          const display_name = document.getElementById('input-display-name').value.trim();
          const username = document.getElementById('input-username').value.trim();
          const email = document.getElementById('input-email').value.trim();
          const password = document.getElementById('input-password').value;

          const res = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ display_name, username, email, password })
          });

          authState.setToken(res.access_token);
          authState.user = res.user;
          showToast(`Account created successfully!`, 'success');
          window.location.hash = '#/friends';
        }
      } catch (err) {
        showToast(err.message || 'Authentication failed', 'danger');
        submitBtn.disabled = false;
        submitBtn.innerHTML = isLogin ? 'Sign In to Callio' : 'Create Free Account';
      }
    });
  }

  render();
}
