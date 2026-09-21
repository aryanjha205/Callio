import { wsManager } from './ws.js';
import { sounds } from './sound.js';

export class CallEngine {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    
    this.currentCallId = null;
    this.targetUserId = null;
    this.peerUser = null;
    this.callType = 'audio'; // 'audio' or 'video'
    this.isCaller = false;
    
    this.isMuted = false;
    this.isCamOff = false;
    this.isSharingScreen = false;
    
    this.callStartTime = null;
    this.timerInterval = null;
    
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    this.onStreamUpdate = null;
    this.onStateChange = null;
    this.onTimerUpdate = null;
    
    this.setupWsListeners();
  }

  setupWsListeners() {
    wsManager.on('call_accepted', async (msg) => {
      console.log('[WebRTC] Call accepted by peer:', msg);
      sounds.stopRingtone();
      if (this.isCaller && this.currentCallId === msg.call_id) {
        await this.createAndSendOffer();
      }
    });

    wsManager.on('sdp_offer', async (msg) => {
      console.log('[WebRTC] Received SDP offer:', msg);
      if (this.currentCallId === msg.call_id) {
        await this.handleOffer(msg.sdp, msg.from_user_id);
      }
    });

    wsManager.on('sdp_answer', async (msg) => {
      console.log('[WebRTC] Received SDP answer:', msg);
      if (this.currentCallId === msg.call_id) {
        await this.handleAnswer(msg.sdp);
      }
    });

    wsManager.on('ice_candidate', async (msg) => {
      if (this.peerConnection && msg.candidate && this.currentCallId === msg.call_id) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch (e) {
          console.error('[WebRTC] Error adding ICE candidate:', e);
        }
      }
    });

    wsManager.on('call_ended', (msg) => {
      console.log('[WebRTC] Call ended by peer');
      sounds.playCallEndTone();
      this.endCall(false);
    });

    wsManager.on('call_rejected', (msg) => {
      console.log('[WebRTC] Call rejected/busy:', msg);
      sounds.playCallEndTone();
      this.endCall(false);
    });
  }

  async startCall(targetUserId, peerUser, callType = 'audio') {
    this.currentCallId = null;
    this.targetUserId = targetUserId;
    this.peerUser = peerUser;
    this.callType = callType;
    this.isCaller = true;
    this.isMuted = false;
    this.isCamOff = false;

    // Acquire Media Stream
    await this.acquireUserMedia();

    // Notify UI state
    if (this.onStateChange) this.onStateChange('calling');

    // Play Ringback tone
    sounds.playRingback();

    // Send call initiate message to backend WS
    wsManager.send({
      type: 'call_initiate',
      target_user_id: targetUserId,
      call_type: callType
    });
  }

  async acceptCall(callId, callerUser, callType = 'audio') {
    sounds.stopRingtone();
    this.currentCallId = callId;
    this.targetUserId = callerUser.id;
    this.peerUser = callerUser;
    this.callType = callType;
    this.isCaller = false;
    this.isMuted = false;
    this.isCamOff = false;

    // Acquire Media Stream
    await this.acquireUserMedia();

    // Create RTCPeerConnection instance
    this.initPeerConnection();

    // Notify backend accepted
    wsManager.send({
      type: 'call_response',
      call_id: callId,
      accepted: true
    });

    if (this.onStateChange) this.onStateChange('connecting');
  }

  rejectCall(callId) {
    sounds.stopRingtone();
    wsManager.send({
      type: 'call_response',
      call_id: callId,
      accepted: false
    });
  }

  async acquireUserMedia() {
    try {
      const constraints = {
        audio: true,
        video: this.callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.onStreamUpdate) {
        this.onStreamUpdate({ local: this.localStream, remote: this.remoteStream });
      }
    } catch (err) {
      console.error('[WebRTC] Media permission error:', err);
      alert(`Could not access ${this.callType === 'video' ? 'camera/microphone' : 'microphone'}. Please check permissions.`);
      throw err;
    }
  }

  initPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote track stream
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      if (this.onStreamUpdate) {
        this.onStreamUpdate({ local: this.localStream, remote: this.remoteStream });
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallId) {
        wsManager.send({
          type: 'ice_candidate',
          call_id: this.currentCallId,
          target_user_id: this.targetUserId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        sounds.stopRingtone();
        this.startCallTimer();
        if (this.onStateChange) this.onStateChange('connected');
      } else if (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed') {
        this.endCall(false);
      }
    };
  }

  async createAndSendOffer() {
    this.initPeerConnection();
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    wsManager.send({
      type: 'sdp_offer',
      call_id: this.currentCallId,
      target_user_id: this.targetUserId,
      sdp: offer
    });
  }

  async handleOffer(sdp, fromUserId) {
    if (!this.peerConnection) {
      this.initPeerConnection();
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    wsManager.send({
      type: 'sdp_answer',
      call_id: this.currentCallId,
      target_user_id: this.targetUserId,
      sdp: answer
    });
  }

  async handleAnswer(sdp) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
        return this.isMuted;
      }
    }
    return false;
  }

  toggleCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isCamOff = !videoTrack.enabled;
        return this.isCamOff;
      }
    }
    return false;
  }

  async toggleScreenShare() {
    if (!this.isSharingScreen) {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = this.screenStream.getVideoTracks()[0];
        
        const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => this.stopScreenShare();
        this.isSharingScreen = true;
        return true;
      } catch (e) {
        console.error('[WebRTC] Screen share cancelled:', e);
        return false;
      }
    } else {
      this.stopScreenShare();
      return false;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
    this.isSharingScreen = false;
  }

  startCallTimer() {
    this.callStartTime = new Date();
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.callStartTime && this.onTimerUpdate) {
        const elapsed = Math.floor((new Date() - this.callStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        this.onTimerUpdate(`${mins}:${secs}`);
      }
    }, 1000);
  }

  stopCallTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.callStartTime = null;
  }

  endCall(notifyPeer = true) {
    sounds.stopRingtone();
    this.stopCallTimer();

    if (notifyPeer && this.currentCallId && this.targetUserId) {
      wsManager.send({
        type: 'call_end',
        call_id: this.currentCallId,
        target_user_id: this.targetUserId
      });
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.currentCallId = null;
    this.targetUserId = null;
    this.peerUser = null;
    this.remoteStream = null;

    if (this.onStateChange) this.onStateChange('idle');
  }
}

export const callEngine = new CallEngine();
