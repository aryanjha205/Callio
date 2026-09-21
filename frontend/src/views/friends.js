import { apiFetch, showToast } from '../api.js';
import { callEngine } from '../webrtc.js';
import { renderCallOverlay } from '../components/callOverlay.js';

export async function renderFriendsView(container, subTab = 'list') {
  container.innerHTML = `
    <div class="w-100">
      
      <!-- Top Sub-Navigation Tabs -->
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 class="text-light fw-bold mb-1">Friends & Contacts</h2>
          <p class="text-secondary fs-6 mb-0">Connect with your friends for audio and video calls</p>
        </div>

        <div class="d-flex gap-2 p-1 bg-dark-subtle rounded-3 border border-dark-subtle">
          <button id="subtab-friends" class="btn btn-sm ${subTab === 'list' ? 'btn-primary fw-bold' : 'text-secondary border-0'} rounded-2 px-3 py-2">
            <i class="bi bi-people-fill me-1"></i> My Friends
          </button>
          <button id="subtab-requests" class="btn btn-sm ${subTab === 'requests' ? 'btn-primary fw-bold' : 'text-secondary border-0'} rounded-2 px-3 py-2 position-relative">
            <i class="bi bi-person-plus-fill me-1"></i> Requests
            <span id="requests-badge-count" class="badge bg-danger rounded-pill display-none position-absolute top-0 start-100 translate-middle"></span>
          </button>
          <a href="#/search" class="btn btn-sm text-secondary border-0 rounded-2 px-3 py-2">
            <i class="bi bi-search me-1"></i> Find People
          </a>
        </div>
      </div>

      <!-- Main Content Sub-View -->
      <div id="friends-subview-content">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      </div>

    </div>
  `;

  document.getElementById('subtab-friends')?.addEventListener('click', () => renderFriendsView(container, 'list'));
  document.getElementById('subtab-requests')?.addEventListener('click', () => renderFriendsView(container, 'requests'));

  const contentEl = document.getElementById('friends-subview-content');

  if (subTab === 'list') {
    await loadFriendsList(contentEl);
  } else if (subTab === 'requests') {
    await loadRequestsList(contentEl);
  }
}

async function loadFriendsList(container) {
  try {
    const friends = await apiFetch('/api/friends');
    
    if (!friends || friends.length === 0) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-4">
          <i class="bi bi-person-workspace text-secondary display-1 mb-3"></i>
          <h4 class="text-light fw-bold">No friends added yet</h4>
          <p class="text-secondary max-w-md mx-auto mb-4">Find friends by their @username to make real-time audio and video calls!</p>
          <a href="#/search" class="btn-3d btn-3d-primary btn-3d-lg">
            <i class="bi bi-search"></i> Search Usernames
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="row g-3">
        ${friends.map(f => `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="glass-card p-3 d-flex align-items-center justify-content-between h-100">
              
              <div class="d-flex align-items-center gap-3">
                <div class="position-relative">
                  <img src="${f.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}" alt="${f.display_name}" class="avatar-md rounded-circle border border-dark-subtle" />
                  <span class="status-indicator ${f.is_online ? 'status-online' : 'status-offline'} position-absolute bottom-0 end-0"></span>
                </div>
                <div>
                  <h6 class="text-light fw-bold mb-0">${f.display_name}</h6>
                  <small class="text-secondary">@${f.username}</small>
                  <div>
                    <span class="badge ${f.is_online ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} fs-8">
                      ${f.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <button class="btn-3d btn-3d-success btn-3d-sm btn-audio-call" data-id="${f.id}" data-username="${f.username}" data-name="${f.display_name}" data-avatar="${f.profile_image_url || ''}" title="Audio Call">
                  <i class="bi bi-telephone-fill"></i>
                </button>
                <button class="btn-3d btn-3d-primary btn-3d-sm btn-video-call" data-id="${f.id}" data-username="${f.username}" data-name="${f.display_name}" data-avatar="${f.profile_image_url || ''}" title="Video Call">
                  <i class="bi bi-camera-video-fill"></i>
                </button>
                <button class="btn-3d btn-3d-secondary btn-3d-sm btn-unfriend" data-id="${f.id}" data-name="${f.display_name}" title="Remove Friend">
                  <i class="bi bi-person-x-fill text-danger"></i>
                </button>
              </div>

            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Audio Call listener
    container.querySelectorAll('.btn-audio-call').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const peerUser = { id, username: btn.dataset.username, display_name: btn.dataset.name, profile_image_url: btn.dataset.avatar };
        renderCallOverlay('calling', 'audio', peerUser);
        await callEngine.startCall(id, peerUser, 'audio');
      });
    });

    // Video Call listener
    container.querySelectorAll('.btn-video-call').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const peerUser = { id, username: btn.dataset.username, display_name: btn.dataset.name, profile_image_url: btn.dataset.avatar };
        renderCallOverlay('calling', 'video', peerUser);
        await callEngine.startCall(id, peerUser, 'video');
      });
    });

    // Unfriend listener
    container.querySelectorAll('.btn-unfriend').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        if (confirm(`Are you sure you want to remove ${name} from your friends list?`)) {
          try {
            await apiFetch(`/api/friends/${id}`, { method: 'DELETE' });
            showToast(`Removed ${name} from friends`, 'info');
            await loadFriendsList(container);
          } catch (e) {
            showToast(e.message || 'Failed to remove friend', 'danger');
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message || 'Error loading friends'}</div>`;
  }
}

async function loadRequestsList(container) {
  try {
    const data = await apiFetch('/api/friends/requests');
    const incoming = data.incoming || [];
    const outgoing = data.outgoing || [];

    if (incoming.length === 0 && outgoing.length === 0) {
      container.innerHTML = `
        <div class="glass-card p-5 text-center my-4">
          <i class="bi bi-inbox text-secondary display-1 mb-3"></i>
          <h4 class="text-light fw-bold">No pending friend requests</h4>
          <p class="text-secondary max-w-md mx-auto">When someone sends you a friend request or when you send one, it will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="row g-4">
        
        <!-- Incoming Requests -->
        <div class="col-12 col-lg-6">
          <h5 class="text-light fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-box-arrow-in-down-left text-primary"></i>
            Incoming Requests (${incoming.length})
          </h5>

          ${incoming.length === 0 ? '<p class="text-secondary">No incoming requests.</p>' : `
            <div class="d-flex flex-column gap-2">
              ${incoming.map(r => `
                <div class="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-3">
                    <img src="${r.sender.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.sender.username}`}" class="avatar-md rounded-circle" />
                    <div>
                      <h6 class="text-light fw-bold mb-0">${r.sender.display_name}</h6>
                      <small class="text-secondary">@${r.sender.username}</small>
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn-3d btn-3d-success btn-3d-sm btn-accept-req" data-id="${r.id}">Accept</button>
                    <button class="btn-3d btn-3d-danger btn-3d-sm btn-reject-req" data-id="${r.id}">Reject</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Outgoing Sent Requests -->
        <div class="col-12 col-lg-6">
          <h5 class="text-light fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-box-arrow-up-right text-secondary"></i>
            Sent Requests (${outgoing.length})
          </h5>

          ${outgoing.length === 0 ? '<p class="text-secondary">No sent requests pending.</p>' : `
            <div class="d-flex flex-column gap-2">
              ${outgoing.map(r => `
                <div class="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-3">
                    <img src="${r.receiver.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.receiver.username}`}" class="avatar-md rounded-circle" />
                    <div>
                      <h6 class="text-light fw-bold mb-0">${r.receiver.display_name}</h6>
                      <small class="text-secondary">@${r.receiver.username}</small>
                    </div>
                  </div>
                  <button class="btn-3d btn-3d-secondary btn-3d-sm btn-cancel-req" data-id="${r.id}">Cancel</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    `;

    // Action listeners
    container.querySelectorAll('.btn-accept-req').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`/api/friends/request/${btn.dataset.id}/accept`, { method: 'POST' });
          showToast('Friend request accepted!', 'success');
          await loadRequestsList(container);
        } catch (e) { showToast(e.message, 'danger'); }
      });
    });

    container.querySelectorAll('.btn-reject-req').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`/api/friends/request/${btn.dataset.id}/reject`, { method: 'POST' });
          showToast('Friend request rejected', 'info');
          await loadRequestsList(container);
        } catch (e) { showToast(e.message, 'danger'); }
      });
    });

    container.querySelectorAll('.btn-cancel-req').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`/api/friends/request/${btn.dataset.id}/cancel`, { method: 'DELETE' });
          showToast('Friend request cancelled', 'info');
          await loadRequestsList(container);
        } catch (e) { showToast(e.message, 'danger'); }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">${err.message || 'Error loading requests'}</div>`;
  }
}
