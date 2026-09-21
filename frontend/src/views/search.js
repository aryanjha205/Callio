import { apiFetch, showToast } from '../api.js';

export function renderSearchView(container) {
  let searchTimeout = null;

  container.innerHTML = `
    <div class="w-100 max-w-2xl mx-auto">
      
      <div class="mb-4 text-center">
        <h2 class="text-light fw-bold mb-1">Find People</h2>
        <p class="text-secondary fs-6">Search by username to add friends and start calling</p>
      </div>

      <!-- Search Input Box -->
      <div class="glass-card p-3 mb-4">
        <div class="input-group input-group-lg border-0">
          <span class="input-group-text bg-transparent border-0 text-secondary">
            <i class="bi bi-search fs-4"></i>
          </span>
          <input type="text" id="input-search-username" class="form-control form-control-custom bg-transparent border-0 shadow-none text-light fs-5" placeholder="Search by @username or name..." autocomplete="off" />
        </div>
      </div>

      <!-- Search Results Area -->
      <div id="search-results-container">
        <div class="glass-card p-5 text-center text-secondary">
          <i class="bi bi-person-bounding-box display-3 mb-3"></i>
          <p class="fs-6">Type a username above to search for people on Callio</p>
        </div>
      </div>

    </div>
  `;

  const input = document.getElementById('input-search-username');
  const resultsEl = document.getElementById('search-results-container');

  input?.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const q = input.value.trim();

    if (!q) {
      resultsEl.innerHTML = `
        <div class="glass-card p-5 text-center text-secondary">
          <i class="bi bi-person-bounding-box display-3 mb-3"></i>
          <p class="fs-6">Type a username above to search for people on Callio</p>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
    `;

    searchTimeout = setTimeout(async () => {
      try {
        const users = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        
        if (!users || users.length === 0) {
          resultsEl.innerHTML = `
            <div class="glass-card p-4 text-center text-secondary">
              <i class="bi bi-emoji-frown fs-2 mb-2"></i>
              <p class="mb-0">No users found matching "${q}"</p>
            </div>
          `;
          return;
        }

        resultsEl.innerHTML = `
          <div class="d-flex flex-column gap-3">
            ${users.map(u => `
              <div class="glass-card p-3 d-flex align-items-center justify-content-between">
                
                <div class="d-flex align-items-center gap-3">
                  <div class="position-relative">
                    <img src="${u.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}" class="avatar-md rounded-circle border border-dark-subtle" />
                    <span class="status-indicator ${u.is_online ? 'status-online' : 'status-offline'} position-absolute bottom-0 end-0"></span>
                  </div>
                  <div>
                    <h6 class="text-light fw-bold mb-0">${u.display_name}</h6>
                    <small class="text-secondary">@${u.username}</small>
                    ${u.bio ? `<p class="text-secondary fs-8 mb-0 text-truncate" style="max-width: 250px;">${u.bio}</p>` : ''}
                  </div>
                </div>

                <div>
                  ${u.friendship_status === 'friends' ? `
                    <span class="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill">
                      <i class="bi bi-check-circle-fill me-1"></i> Friends
                    </span>
                  ` : u.friendship_status === 'request_sent' ? `
                    <span class="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill">
                      <i class="bi bi-clock me-1"></i> Request Sent
                    </span>
                  ` : u.friendship_status === 'request_received' ? `
                    <a href="#/friends" class="btn-3d btn-3d-success btn-3d-sm">Accept Request</a>
                  ` : `
                    <button class="btn-3d btn-3d-primary btn-3d-sm btn-send-request" data-username="${u.username}">
                      <i class="bi bi-person-plus-fill"></i> Add Friend
                    </button>
                  `}
                </div>

              </div>
            `).join('')}
          </div>
        `;

        resultsEl.querySelectorAll('.btn-send-request').forEach(btn => {
          btn.addEventListener('click', async () => {
            const username = btn.dataset.username;
            btn.disabled = true;
            btn.textContent = 'Sending...';

            try {
              await apiFetch('/api/friends/request', {
                method: 'POST',
                body: JSON.stringify({ receiver_username: username })
              });
              showToast(`Friend request sent to @${username}!`, 'success');
              btn.className = 'btn btn-sm btn-secondary rounded-pill disabled';
              btn.textContent = 'Request Sent';
            } catch (e) {
              showToast(e.message || 'Failed to send friend request', 'danger');
              btn.disabled = false;
              btn.textContent = 'Add Friend';
            }
          });
        });

      } catch (err) {
        resultsEl.innerHTML = `<div class="alert alert-danger">${err.message || 'Search error'}</div>`;
      }
    }, 300);
  });
}
