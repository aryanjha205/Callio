import { callEngine } from '../webrtc.js';
import { sounds } from '../sound.js';

export function renderCallOverlay(state, callType, peerUser, callId = null) {
  const container = document.getElementById('call-overlay');
  if (!container) return;

  if (state === 'idle') {
    container.classList.add('display-none');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('display-none');

  const avatar = peerUser?.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${peerUser?.username}`;
  const isVideo = callType === 'video';

  container.innerHTML = `
    <div class="d-flex flex-column h-100 justify-content-between position-relative">
      
      <!-- Top Call Header -->
      <div class="d-flex align-items-center justify-content-between z-3 px-3 py-2 glass-card bg-dark-subtle border-0">
        <div class="d-flex align-items-center gap-3">
          <div class="brand-logo-3d btn-3d-sm">
            <i class="bi ${isVideo ? 'bi-camera-video-fill' : 'bi-telephone-fill'}"></i>
          </div>
          <div>
            <h5 class="mb-0 text-light fw-bold">${peerUser?.display_name || 'Calling...'}</h5>
            <small class="text-secondary">@${peerUser?.username || 'user'}</small>
          </div>
        </div>
        <div class="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill fs-7 fw-bold" id="call-timer-display">
          ${state === 'calling' ? 'Ringing...' : state === 'connecting' ? 'Connecting...' : '00:00'}
        </div>
      </div>

      <!-- Main Video/Audio Center Area -->
      <div class="flex-grow-1 position-relative my-3 d-flex align-items-center justify-content-center">
        
        ${isVideo ? `
          <div class="call-video-grid">
            <video id="remote-video-element" class="remote-video" autoplay playsinline></video>
            <div class="local-video-pip shadow-lg">
              <video id="local-video-element" autoplay playsinline muted></video>
            </div>
          </div>
        ` : `
          <!-- Audio Call Pulsing Avatar Display -->
          <div class="text-center">
            <div class="pulse-ring mx-auto mb-4" style="width: 140px; height: 140px;">
              <img src="${avatar}" alt="${peerUser?.display_name}" class="w-100 h-100 rounded-circle border border-3 border-primary shadow-lg object-fit-cover" />
            </div>
            <h3 class="text-light fw-bold">${peerUser?.display_name}</h3>
            <p class="text-secondary fs-6">@${peerUser?.username}</p>
            <audio id="remote-audio-element" autoplay></audio>
          </div>
        `}

      </div>

      <!-- Bottom 3D Controls Bar -->
      <div class="call-controls-bar z-3">
        <button id="btn-toggle-mute" class="btn-3d ${callEngine.isMuted ? 'btn-3d-danger' : 'btn-3d-secondary'} btn-3d-circle" title="Mute/Unmute Mic">
          <i class="bi ${callEngine.isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}"></i>
        </button>

        ${isVideo ? `
          <button id="btn-toggle-cam" class="btn-3d ${callEngine.isCamOff ? 'btn-3d-danger' : 'btn-3d-secondary'} btn-3d-circle" title="Turn Camera On/Off">
            <i class="bi ${callEngine.isCamOff ? 'bi-camera-video-off-fill' : 'bi-camera-video-fill'}"></i>
          </button>
          
          <button id="btn-toggle-screen" class="btn-3d btn-3d-secondary btn-3d-circle" title="Share Screen">
            <i class="bi bi-display"></i>
          </button>
        ` : ''}

        <button id="btn-end-call" class="btn-3d btn-3d-danger btn-3d-circle" title="End Call">
          <i class="bi bi-telephone-x-fill fs-4"></i>
        </button>
      </div>

    </div>
  `;

  // Attach Stream elements
  callEngine.onStreamUpdate = ({ local, remote }) => {
    if (isVideo) {
      const localVid = document.getElementById('local-video-element');
      const remoteVid = document.getElementById('remote-video-element');
      if (localVid && local) localVid.srcObject = local;
      if (remoteVid && remote) remoteVid.srcObject = remote;
    } else {
      const remoteAud = document.getElementById('remote-audio-element');
      if (remoteAud && remote) remoteAud.srcObject = remote;
    }
  };

  callEngine.onTimerUpdate = (formattedTime) => {
    const timerDisplay = document.getElementById('call-timer-display');
    if (timerDisplay) timerDisplay.textContent = formattedTime;
  };

  // Button Controls Logic
  document.getElementById('btn-toggle-mute')?.addEventListener('click', () => {
    const muted = callEngine.toggleMute();
    const btn = document.getElementById('btn-toggle-mute');
    if (btn) {
      btn.className = `btn-3d ${muted ? 'btn-3d-danger' : 'btn-3d-secondary'} btn-3d-circle`;
      btn.innerHTML = `<i class="bi ${muted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}"></i>`;
    }
  });

  document.getElementById('btn-toggle-cam')?.addEventListener('click', () => {
    const camOff = callEngine.toggleCamera();
    const btn = document.getElementById('btn-toggle-cam');
    if (btn) {
      btn.className = `btn-3d ${camOff ? 'btn-3d-danger' : 'btn-3d-secondary'} btn-3d-circle`;
      btn.innerHTML = `<i class="bi ${camOff ? 'bi-camera-video-off-fill' : 'bi-camera-video-fill'}"></i>`;
    }
  });

  document.getElementById('btn-toggle-screen')?.addEventListener('click', async () => {
    const isSharing = await callEngine.toggleScreenShare();
    const btn = document.getElementById('btn-toggle-screen');
    if (btn) {
      btn.className = `btn-3d ${isSharing ? 'btn-3d-primary' : 'btn-3d-secondary'} btn-3d-circle`;
    }
  });

  document.getElementById('btn-end-call')?.addEventListener('click', () => {
    callEngine.endCall(true);
  });
}

// Incoming Call Dialog Modal
export function renderIncomingCallModal(callId, callerUser, callType) {
  const container = document.getElementById('incoming-modal-container');
  if (!container) return;

  sounds.playRingtone();
  const avatar = callerUser.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${callerUser.username}`;

  container.innerHTML = `
    <div class="modal fade show d-block backdrop-blur" tabindex="-1" style="background: rgba(0,0,0,0.85); z-index: 2100;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card border-primary p-4 text-center">
          
          <div class="pulse-ring mx-auto mb-3" style="width: 100px; height: 100px;">
            <img src="${avatar}" alt="${callerUser.display_name}" class="w-100 h-100 rounded-circle border border-2 border-primary object-fit-cover shadow" />
          </div>

          <h4 class="text-light fw-bold mb-1">${callerUser.display_name}</h4>
          <p class="text-secondary mb-3">Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call...</p>

          <div class="d-flex justify-content-center gap-4 mt-2">
            <button id="btn-reject-incoming" class="btn-3d btn-3d-danger btn-3d-circle" title="Decline Call">
              <i class="bi bi-telephone-x-fill fs-4"></i>
            </button>
            <button id="btn-accept-incoming" class="btn-3d btn-3d-success btn-3d-circle" title="Accept Call">
              <i class="bi bi-telephone-fill fs-4"></i>
            </button>
          </div>

        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-accept-incoming')?.addEventListener('click', async () => {
    container.innerHTML = '';
    renderCallOverlay('connecting', callType, callerUser, callId);
    await callEngine.acceptCall(callId, callerUser, callType);
  });

  document.getElementById('btn-reject-incoming')?.addEventListener('click', () => {
    container.innerHTML = '';
    callEngine.rejectCall(callId);
  });
}
