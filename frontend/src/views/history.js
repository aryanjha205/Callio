import { apiFetch, authState, showToast } from '../api.js';
import { callEngine } from '../webrtc.js';
import { renderCallOverlay } from '../components/callOverlay.js';

export async function renderHistoryView(container, filterType = 'all') {
  container.innerHTML = `
    <div class="w-100 max-w-4xl mx-auto">
      
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 class="text-light fw-bold mb-1">Call Logs</h2>
          <p class="text-secondary fs-6 mb-0">Persistent call history and redial contacts</p>
        </div>

        <!-- Filter Tabs -->
        <div class="d-flex gap-1 p-1 bg-dark-subtle rounded-3 border border-dark-subtle">
          <button class="btn btn-sm ${filterType === 'all' ? 'btn-primary fw-bold' : 'text-secondary border-0'} rounded-2 px-3 py-2 btn-filter-history" data-filter="all">All</button>
          <button class="btn btn-sm ${filterType === 'missed' ? 'btn-primary fw-bold' : 'text-secondary border-0'} rounded-2 px-3 py-2 btn-filter-history" data-filter="missed">Missed</button>
          <button class="btn btn-sm ${filterType === 'incoming' ? 'btn-primary fw-bold' : 'text-secondary border-0'} rounded-2 px-3 py-2 btn-filter-history" data-filter="incoming">Incoming</button>
          <button class="btn btn-sm ${filterType === 'outgoing' ? 'btn-primary fw-bold' : 'text-secondary border-0'} rounded-2 px-3 py-2 btn-filter-history" data-filter="outgoing">Outgoing</button>
        </div>
      </div>

      <div id="history-logs-container">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      </div>

    </div>
  `;

  container.querySelectorAll('.btn-filter-history').forEach(btn => {
    btn.addEventListener('click', () => {
      renderHistoryView(container, btn.dataset.filter);
    });
  });

  const logsContainer = document.getElementById('history-logs-container');
  const currentUserId = authState.user?.id;

  try {
    const calls = await apiFetch(`/api/calls?filter_type=${filterType}`);

    if (!calls || calls.length === 0) {
      logsContainer.innerHTML = `
        <div class="glass-card p-5 text-center my-4">
          <i class="bi bi-journal-x text-secondary display-1 mb-3"></i>
          <h4 class="text-light fw-bold">No call history</h4>
          <p class="text-secondary max-w-md mx-auto">Your past audio and video call records will be displayed here.</p>
        </div>
      `;
      return;
    }

    logsContainer.innerHTML = `
      <div class="d-flex flex-column gap-3">
        ${calls.map(c => {
          const isOutgoing = c.caller_id === currentUserId;
          const peer = isOutgoing ? c.receiver : c.caller;
          const isMissed = c.status === 'missed';
          const isVideo = c.call_type === 'video';
          
          const iconClass = isMissed 
            ? 'bi-telephone-x-fill text-danger' 
            : isOutgoing 
            ? 'bi-arrow-up-right-circle-fill text-primary' 
            : 'bi-arrow-down-left-circle-fill text-success';

          const formattedDate = new Date(c.created_at).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          const mins = Math.floor(c.duration / 60);
          const secs = c.duration % 60;
          const durationStr = c.duration > 0 ? `${mins > 0 ? `${mins}m ` : ''}${secs}s` : (isMissed ? 'Missed' : '0s');

          return `
            <div class="glass-card p-3 d-flex align-items-center justify-content-between">
              
              <div class="d-flex align-items-center gap-3">
                <i class="bi ${iconClass} fs-3"></i>
                <img src="${peer.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${peer.username}`}" class="avatar-md rounded-circle border border-dark-subtle" />
                <div>
                  <h6 class="text-light fw-bold mb-0">${peer.display_name}</h6>
                  <small class="text-secondary">@${peer.username} • ${formattedDate}</small>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge ${isVideo ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} fs-8">
                      <i class="bi ${isVideo ? 'bi-camera-video' : 'bi-telephone'}"></i> ${c.call_type.toUpperCase()}
                    </span>
                    <span class="badge ${isMissed ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'} fs-8">
                      ${durationStr}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <button class="btn-3d btn-3d-success btn-3d-sm btn-redial" data-id="${peer.id}" data-username="${peer.username}" data-name="${peer.display_name}" data-avatar="${peer.profile_image_url || ''}" data-type="${c.call_type}">
                  <i class="bi ${isVideo ? 'bi-camera-video-fill' : 'bi-telephone-fill'}"></i> Call Back
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    logsContainer.querySelectorAll('.btn-redial').forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = parseInt(btn.dataset.id);
        const callType = btn.dataset.type || 'audio';
        const peerUser = { id: targetId, username: btn.dataset.username, display_name: btn.dataset.name, profile_image_url: btn.dataset.avatar };
        
        renderCallOverlay('calling', callType, peerUser);
        await callEngine.startCall(targetId, peerUser, callType);
      });
    });

  } catch (err) {
    logsContainer.innerHTML = `<div class="alert alert-danger">${err.message || 'Error loading call history'}</div>`;
  }
}
