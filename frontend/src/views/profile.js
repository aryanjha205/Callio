import QRCode from 'qrcode';
import { apiFetch, authState, showToast } from '../api.js';

export async function renderProfileView(container) {
  let user = authState.user;

  try {
    const res = await apiFetch('/api/users/me');
    authState.user = res;
    user = res;
  } catch (e) {
    console.warn('Could not refresh profile from API:', e);
  }

  const avatar = user.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  const profileUrl = `${window.location.origin}/#/u/${user.username}`;

  container.innerHTML = `
    <div class="row g-4 w-100 max-w-4xl mx-auto">
      
      <!-- Profile Card & QR Identity Card -->
      <div class="col-12 col-md-5">
        <div class="glass-card p-4 text-center text-light shadow-lg">
          
          <div class="position-relative d-inline-block mb-3">
            <img src="${avatar}" alt="${user.display_name}" class="avatar-xl rounded-circle border border-3 border-primary shadow-lg object-fit-cover" />
            <span class="status-indicator status-online position-absolute bottom-0 end-0 p-2"></span>
          </div>

          <h3 class="fw-bold mb-1">${user.display_name}</h3>
          <p class="text-primary font-monospace fs-6 mb-2">@${user.username}</p>
          <p class="text-secondary fs-7 mb-4 px-2">${user.bio || 'No bio set.'}</p>

          <!-- QR Code Canvas Container -->
          <div class="bg-white p-3 rounded-4 d-inline-block mb-3 shadow">
            <canvas id="qr-canvas" style="width: 160px; height: 160px;"></canvas>
          </div>
          <p class="text-secondary fs-8 mb-3">Scan to connect on Callio</p>

          <div class="d-flex flex-column gap-2">
            <button id="btn-share-profile" class="btn-3d btn-3d-primary w-100">
              <i class="bi bi-share-fill"></i> Share Profile Link
            </button>
            <button id="btn-download-qr" class="btn-3d btn-3d-secondary w-100">
              <i class="bi bi-download"></i> Download QR Identity
            </button>
          </div>

        </div>
      </div>

      <!-- Edit Profile Form -->
      <div class="col-12 col-md-7">
        <div class="glass-card p-4 p-md-5">
          <h4 class="text-light fw-bold mb-4 d-flex align-items-center gap-2">
            <i class="bi bi-pencil-square text-primary"></i> Edit Profile
          </h4>

          <form id="profile-edit-form">
            
            <div class="mb-3">
              <label class="form-label text-secondary fs-7 fw-semibold">Display Name</label>
              <input type="text" id="input-edit-name" class="form-control form-control-custom" value="${user.display_name}" required />
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary fs-7 fw-semibold">Profile Photo URL</label>
              <input type="url" id="input-edit-avatar" class="form-control form-control-custom" value="${user.profile_image_url || ''}" placeholder="https://example.com/photo.jpg" />
              <div class="form-text text-secondary fs-8">Provide an image URL (Unsplash, Imgur, Dicebear, etc.). Binary files are not stored in DB.</div>
            </div>

            <div class="mb-4">
              <label class="form-label text-secondary fs-7 fw-semibold">Bio</label>
              <textarea id="input-edit-bio" class="form-control form-control-custom" rows="3" placeholder="Tell your friends a bit about yourself...">${user.bio || ''}</textarea>
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="submit" id="btn-save-profile" class="btn-3d btn-3d-success btn-3d-lg px-4">
                <i class="bi bi-check-lg"></i> Save Changes
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  `;

  // Render QR Code onto canvas using 'qrcode' package
  const canvas = document.getElementById('qr-canvas');
  if (canvas) {
    QRCode.toCanvas(canvas, profileUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#0b0f19', light: '#ffffff' }
    }, (err) => { if (err) console.error('QR Render Error:', err); });
  }

  // Share Profile Action
  document.getElementById('btn-share-profile')?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Callio — ${user.display_name}`,
          text: `Connect with @${user.username} on Callio Real-Time Audio & Video Calling!`,
          url: profileUrl
        });
        showToast('Profile shared successfully!', 'success');
      } catch (e) { console.log('Share cancelled'); }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      showToast('Profile link copied to clipboard!', 'success');
    }
  });

  // Download QR Canvas Image Action
  document.getElementById('btn-download-qr')?.addEventListener('click', () => {
    if (canvas) {
      const link = document.createElement('a');
      link.download = `callio_${user.username}_qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Downloaded QR Code identity image!', 'success');
    }
  });

  // Handle Edit Profile Form Submit
  document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;

    try {
      const display_name = document.getElementById('input-edit-name').value.trim();
      const profile_image_url = document.getElementById('input-edit-avatar').value.trim();
      const bio = document.getElementById('input-edit-bio').value.trim();

      const updatedUser = await apiFetch('/api/profile/update', {
        method: 'POST',
        body: JSON.stringify({ display_name, profile_image_url, bio })
      });

      authState.user = updatedUser;
      showToast('Profile updated successfully!', 'success');
      renderProfileView(container);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'danger');
      btn.disabled = false;
    }
  });
}

// Public User Identity Card View (`#/u/{username}`)
export async function renderPublicUserCardView(container, username) {
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
  `;

  try {
    const user = await apiFetch(`/api/users/${username}`);
    const avatar = user.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
    const profileUrl = window.location.href;

    container.innerHTML = `
      <div class="w-100 max-w-md mx-auto py-4">
        <div class="glass-card p-4 p-sm-5 text-center text-light shadow-lg">
          
          <div class="position-relative d-inline-block mb-3">
            <img src="${avatar}" alt="${user.display_name}" class="avatar-xl rounded-circle border border-3 border-primary shadow-lg object-fit-cover" />
            <span class="status-indicator ${user.is_online ? 'status-online' : 'status-offline'} position-absolute bottom-0 end-0 p-2"></span>
          </div>

          <h3 class="fw-bold mb-1">${user.display_name}</h3>
          <p class="text-primary font-monospace fs-6 mb-2">@${user.username}</p>
          <p class="text-secondary fs-7 mb-4 px-2">${user.bio || 'No bio set.'}</p>

          <div class="bg-white p-3 rounded-4 d-inline-block mb-3 shadow">
            <canvas id="public-qr-canvas" style="width: 160px; height: 160px;"></canvas>
          </div>

          <div class="d-flex flex-column gap-2 mt-3">
            ${user.friendship_status === 'friends' ? `
              <div class="badge bg-success-subtle text-success py-2 fs-6 rounded-pill mb-2">
                <i class="bi bi-check-circle-fill"></i> Friends
              </div>
            ` : user.friendship_status === 'request_sent' ? `
              <div class="badge bg-secondary-subtle text-secondary py-2 fs-6 rounded-pill mb-2">
                <i class="bi bi-clock"></i> Friend Request Pending
              </div>
            ` : `
              <button id="btn-public-add-friend" class="btn-3d btn-3d-primary w-100">
                <i class="bi bi-person-plus-fill"></i> Send Friend Request
              </button>
            `}

            <a href="#/friends" class="btn-3d btn-3d-secondary w-100">
              <i class="bi bi-arrow-left"></i> Back to Callio App
            </a>
          </div>

        </div>
      </div>
    `;

    const canvas = document.getElementById('public-qr-canvas');
    if (canvas) {
      QRCode.toCanvas(canvas, profileUrl, { width: 160, margin: 1 });
    }

    document.getElementById('btn-public-add-friend')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-public-add-friend');
      btn.disabled = true;
      try {
        await apiFetch('/api/friends/request', {
          method: 'POST',
          body: JSON.stringify({ receiver_username: user.username })
        });
        showToast(`Friend request sent to @${user.username}!`, 'success');
        renderPublicUserCardView(container, username);
      } catch (e) {
        showToast(e.message, 'danger');
        btn.disabled = false;
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="glass-card p-5 text-center max-w-md mx-auto my-5">
        <i class="bi bi-exclamation-octagon text-danger display-3 mb-3"></i>
        <h4 class="text-light fw-bold">User Not Found</h4>
        <p class="text-secondary">The profile @${username} does not exist.</p>
        <a href="#/friends" class="btn-3d btn-3d-primary mt-2">Go to Friends</a>
      </div>
    `;
  }
}
