import { authState, showToast } from './api.js';

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.isExplicitClose = false;
  }

  connect() {
    if (!authState.token) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitClose = false;
    let wsUrl;

    if (import.meta.env.VITE_WS_URL) {
      wsUrl = `${import.meta.env.VITE_WS_URL}/ws?token=${encodeURIComponent(authState.token)}`;
    } else if (import.meta.env.VITE_API_URL) {
      const apiUrl = new URL(import.meta.env.VITE_API_URL);
      const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${apiUrl.host}/ws?token=${encodeURIComponent(authState.token)}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(authState.token)}`;
    }

    console.log('[WebSocket] Connecting to', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected successfully');
      this.startHeartbeat();
      this.emit('connected', null);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (err) {
        console.error('[WebSocket] Invalid JSON message:', err);
      }
    };

    this.ws.onclose = () => {
      console.warn('[WebSocket] Connection closed');
      this.stopHeartbeat();
      this.emit('disconnected', null);
      if (!this.isExplicitClose && authState.token) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WebSocket] Connection error:', err);
    };
  }

  disconnect() {
    this.isExplicitClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('[WebSocket] Cannot send, socket not open:', data);
    return false;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 20000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (authState.token) {
        this.connect();
      }
    }, 3000);
  }

  handleMessage(msg) {
    const { type, event, data } = msg;

    if (type === 'pong') return;

    if (type === 'notification') {
      if (event === 'friend_request_received') {
        showToast(`${data.sender.display_name} (@${data.sender.username}) sent you a friend request!`, 'info');
      } else if (event === 'friend_request_accepted') {
        showToast(`${data.user.display_name} accepted your friend request!`, 'success');
      }
    }

    this.emit(type, msg);
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.off(type, callback);
  }

  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  emit(type, payload) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(cb => {
        try { cb(payload); } catch (e) { console.error(`Error in WS listener [${type}]:`, e); }
      });
    }
  }
}

export const wsManager = new WebSocketManager();
