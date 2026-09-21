import { authState, apiFetch, showToast } from './api.js';
import { wsManager } from './ws.js';
import { callEngine } from './webrtc.js';
import { renderCallOverlay, renderIncomingCallModal } from './components/callOverlay.js';

import { renderAuthView } from './views/auth.js';
import { renderFriendsView } from './views/friends.js';
import { renderSearchView } from './views/search.js';
import { renderProfileView, renderPublicUserCardView } from './views/profile.js';
import { renderHistoryView } from './views/history.js';

// --- SPA Router ---
async function handleRouting() {
  const hash = window.location.hash || '#/friends';
  const mainContent = document.getElementById('main-content');
  const mainHeader = document.getElementById('main-header');
  const mobileNav = document.getElementById('mobile-nav');

  // Handle Public Profile Card route (`#/u/{username}`)
  if (hash.startsWith('#/u/')) {
    const username = hash.replace('#/u/', '').trim();
    if (authState.token) {
      mainHeader?.classList.remove('display-none');
      mobileNav?.classList.remove('display-none');
    } else {
      mainHeader?.classList.add('display-none');
      mobileNav?.classList.add('display-none');
    }
    await renderPublicUserCardView(mainContent, username);
    return;
  }

  // Unauthenticated user -> redirect to #/auth
  if (!authState.token) {
    mainHeader?.classList.add('display-none');
    mobileNav?.classList.add('display-none');
    renderAuthView(mainContent);
    return;
  }

  // Authenticated user UI Header Setup
  mainHeader?.classList.remove('display-none');
  mobileNav?.classList.remove('display-none');

  if (authState.user) {
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerName = document.getElementById('header-user-name');
    if (headerAvatar) headerAvatar.src = authState.user.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${authState.user.username}`;
    if (headerName) headerName.textContent = `@${authState.user.username}`;
  }

  // Active Tab Highlight
  document.querySelectorAll('.nav-tab-btn, .mobile-nav-item').forEach(el => {
    const tab = el.dataset.tab;
    if (hash.startsWith(`#/${tab}`)) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Route Dispatcher
  if (hash.startsWith('#/search')) {
    renderSearchView(mainContent);
  } else if (hash.startsWith('#/profile')) {
    await renderProfileView(mainContent);
  } else if (hash.startsWith('#/history')) {
    await renderHistoryView(mainContent);
  } else {
    // Default: Friends
    await renderFriendsView(mainContent);
  }
}

// Global App Initialization
async function initApp() {
  // Validate token on app start
  if (authState.token) {
    try {
      const user = await apiFetch('/api/users/me');
      authState.user = user;
      wsManager.connect();
    } catch (e) {
      console.warn('Initial session validation failed:', e);
      authState.logout();
    }
  }

  // Router Listeners
  window.addEventListener('hashchange', handleRouting);
  
  // Logout Action
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    wsManager.disconnect();
    authState.logout();
    showToast('Logged out successfully', 'info');
    window.location.hash = '#/auth';
    handleRouting();
  });

  // Call Engine Global Overlay Listener
  callEngine.onStateChange = (state) => {
    if (state === 'idle') {
      renderCallOverlay('idle');
    }
  };

  // WebSocket Global Listeners
  wsManager.on('incoming_call', (msg) => {
    console.log('[App] Incoming call event:', msg);
    renderIncomingCallModal(msg.call_id, msg.caller, msg.call_type);
  });

  wsManager.on('call_outgoing_created', (msg) => {
    callEngine.currentCallId = msg.call_id;
  });

  // Initial Route Load
  await handleRouting();
}

document.addEventListener('DOMContentLoaded', initApp);
