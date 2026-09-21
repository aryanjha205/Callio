(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=t(n);fetch(n.href,a)}})();const K="callio_access_token",C={token:localStorage.getItem(K)||null,user:null,setToken(s){this.token=s,s?localStorage.setItem(K,s):localStorage.removeItem(K)},logout(){this.token=null,this.user=null,localStorage.removeItem(K)}};async function B(s,e={}){const t={"Content-Type":"application/json",...e.headers||{}};C.token&&(t.Authorization=`Bearer ${C.token}`);const i={...e,headers:t};try{const n=await fetch(s,i);if(n.status===401)throw C.logout(),window.location.hash="#/auth",new Error("Unauthorized session. Please log in.");const a=await n.json();if(!n.ok)throw new Error(a.detail||a.message||"API request failed");return a}catch(n){throw console.error(`API Error [${s}]:`,n),n}}function E(s,e="info"){const t=document.getElementById("toast-container");if(!t)return;const i=e==="success"?"bg-success":e==="danger"?"bg-danger":e==="warning"?"bg-warning text-dark":"bg-primary",n=e==="success"?"bi-check-circle-fill":e==="danger"?"bi-exclamation-octagon-fill":"bi-info-circle-fill",a=document.createElement("div");a.className=`toast align-items-center text-white ${i} border-0 show shadow-lg mb-2`,a.role="alert",a.innerHTML=`
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2 fw-semibold">
        <i class="bi ${n} fs-5"></i>
        <span>${s}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `,t.appendChild(a),setTimeout(()=>{a.classList.remove("show"),setTimeout(()=>a.remove(),300)},4e3)}class je{constructor(){this.ws=null,this.listeners=new Map,this.reconnectTimer=null,this.pingTimer=null,this.isExplicitClose=!1}connect(){if(!C.token||this.ws&&(this.ws.readyState===WebSocket.OPEN||this.ws.readyState===WebSocket.CONNECTING))return;this.isExplicitClose=!1;const e=window.location.protocol==="https:"?"wss:":"ws:",t=window.location.host,i=`${e}//${t}/ws?token=${encodeURIComponent(C.token)}`;console.log("[WebSocket] Connecting to",i),this.ws=new WebSocket(i),this.ws.onopen=()=>{console.log("[WebSocket] Connected successfully"),this.startHeartbeat(),this.emit("connected",null)},this.ws.onmessage=n=>{try{const a=JSON.parse(n.data);this.handleMessage(a)}catch(a){console.error("[WebSocket] Invalid JSON message:",a)}},this.ws.onclose=()=>{console.warn("[WebSocket] Connection closed"),this.stopHeartbeat(),this.emit("disconnected",null),!this.isExplicitClose&&C.token&&this.scheduleReconnect()},this.ws.onerror=n=>{console.error("[WebSocket] Connection error:",n)}}disconnect(){this.isExplicitClose=!0,this.stopHeartbeat(),this.reconnectTimer&&(clearTimeout(this.reconnectTimer),this.reconnectTimer=null),this.ws&&(this.ws.close(),this.ws=null)}send(e){return this.ws&&this.ws.readyState===WebSocket.OPEN?(this.ws.send(JSON.stringify(e)),!0):(console.warn("[WebSocket] Cannot send, socket not open:",e),!1)}startHeartbeat(){this.stopHeartbeat(),this.pingTimer=setInterval(()=>{this.send({type:"ping"})},2e4)}stopHeartbeat(){this.pingTimer&&(clearInterval(this.pingTimer),this.pingTimer=null)}scheduleReconnect(){this.reconnectTimer||(this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=null,C.token&&this.connect()},3e3))}handleMessage(e){const{type:t,event:i,data:n}=e;t!=="pong"&&(t==="notification"&&(i==="friend_request_received"?E(`${n.sender.display_name} (@${n.sender.username}) sent you a friend request!`,"info"):i==="friend_request_accepted"&&E(`${n.user.display_name} accepted your friend request!`,"success")),this.emit(t,e))}on(e,t){return this.listeners.has(e)||this.listeners.set(e,new Set),this.listeners.get(e).add(t),()=>this.off(e,t)}off(e,t){this.listeners.has(e)&&this.listeners.get(e).delete(t)}emit(e,t){this.listeners.has(e)&&this.listeners.get(e).forEach(i=>{try{i(t)}catch(n){console.error(`Error in WS listener [${e}]:`,n)}})}}const I=new je;class ze{constructor(){this.audioCtx=null,this.ringInterval=null}init(){if(!this.audioCtx){const e=window.AudioContext||window.webkitAudioContext;e&&(this.audioCtx=new e)}this.audioCtx&&this.audioCtx.state==="suspended"&&this.audioCtx.resume()}playRingtone(){if(this.stopRingtone(),this.init(),!this.audioCtx)return;const e=()=>{if(!this.audioCtx)return;const t=this.audioCtx.currentTime,i=this.audioCtx.createOscillator(),n=this.audioCtx.createOscillator(),a=this.audioCtx.createGain();i.frequency.setValueAtTime(440,t),n.frequency.setValueAtTime(480,t),a.gain.setValueAtTime(0,t),a.gain.linearRampToValueAtTime(.25,t+.05),a.gain.exponentialRampToValueAtTime(.001,t+1.2),i.connect(a),n.connect(a),a.connect(this.audioCtx.destination),i.start(t),n.start(t),i.stop(t+1.25),n.stop(t+1.25)};e(),this.ringInterval=setInterval(e,2500)}playRingback(){if(this.stopRingtone(),this.init(),!this.audioCtx)return;const e=()=>{if(!this.audioCtx)return;const t=this.audioCtx.currentTime,i=this.audioCtx.createOscillator(),n=this.audioCtx.createGain();i.frequency.setValueAtTime(425,t),n.gain.setValueAtTime(0,t),n.gain.linearRampToValueAtTime(.15,t+.05),n.gain.setValueAtTime(.15,t+1),n.gain.exponentialRampToValueAtTime(.001,t+1.05),i.connect(n),n.connect(this.audioCtx.destination),i.start(t),i.stop(t+1.1)};e(),this.ringInterval=setInterval(e,3e3)}playCallEndTone(){if(this.stopRingtone(),this.init(),!this.audioCtx)return;const e=this.audioCtx.currentTime,t=this.audioCtx.createOscillator(),i=this.audioCtx.createGain();t.frequency.setValueAtTime(300,e),t.frequency.exponentialRampToValueAtTime(150,e+.35),i.gain.setValueAtTime(.2,e),i.gain.exponentialRampToValueAtTime(.001,e+.35),t.connect(i),i.connect(this.audioCtx.destination),t.start(e),t.stop(e+.4)}stopRingtone(){this.ringInterval&&(clearInterval(this.ringInterval),this.ringInterval=null)}}const R=new ze;class We{constructor(){this.peerConnection=null,this.localStream=null,this.remoteStream=null,this.screenStream=null,this.currentCallId=null,this.targetUserId=null,this.peerUser=null,this.callType="audio",this.isCaller=!1,this.isMuted=!1,this.isCamOff=!1,this.isSharingScreen=!1,this.callStartTime=null,this.timerInterval=null,this.iceServers=[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"},{urls:"stun:stun2.l.google.com:19302"}],this.onStreamUpdate=null,this.onStateChange=null,this.onTimerUpdate=null,this.setupWsListeners()}setupWsListeners(){I.on("call_accepted",async e=>{console.log("[WebRTC] Call accepted by peer:",e),R.stopRingtone(),this.isCaller&&this.currentCallId===e.call_id&&await this.createAndSendOffer()}),I.on("sdp_offer",async e=>{console.log("[WebRTC] Received SDP offer:",e),this.currentCallId===e.call_id&&await this.handleOffer(e.sdp,e.from_user_id)}),I.on("sdp_answer",async e=>{console.log("[WebRTC] Received SDP answer:",e),this.currentCallId===e.call_id&&await this.handleAnswer(e.sdp)}),I.on("ice_candidate",async e=>{if(this.peerConnection&&e.candidate&&this.currentCallId===e.call_id)try{await this.peerConnection.addIceCandidate(new RTCIceCandidate(e.candidate))}catch(t){console.error("[WebRTC] Error adding ICE candidate:",t)}}),I.on("call_ended",e=>{console.log("[WebRTC] Call ended by peer"),R.playCallEndTone(),this.endCall(!1)}),I.on("call_rejected",e=>{console.log("[WebRTC] Call rejected/busy:",e),R.playCallEndTone(),this.endCall(!1)})}async startCall(e,t,i="audio"){this.currentCallId=null,this.targetUserId=e,this.peerUser=t,this.callType=i,this.isCaller=!0,this.isMuted=!1,this.isCamOff=!1,await this.acquireUserMedia(),this.onStateChange&&this.onStateChange("calling"),R.playRingback(),I.send({type:"call_initiate",target_user_id:e,call_type:i})}async acceptCall(e,t,i="audio"){R.stopRingtone(),this.currentCallId=e,this.targetUserId=t.id,this.peerUser=t,this.callType=i,this.isCaller=!1,this.isMuted=!1,this.isCamOff=!1,await this.acquireUserMedia(),this.initPeerConnection(),I.send({type:"call_response",call_id:e,accepted:!0}),this.onStateChange&&this.onStateChange("connecting")}rejectCall(e){R.stopRingtone(),I.send({type:"call_response",call_id:e,accepted:!1})}async acquireUserMedia(){try{const e={audio:!0,video:this.callType==="video"?{width:{ideal:1280},height:{ideal:720},facingMode:"user"}:!1};this.localStream=await navigator.mediaDevices.getUserMedia(e),this.onStreamUpdate&&this.onStreamUpdate({local:this.localStream,remote:this.remoteStream})}catch(e){throw console.error("[WebRTC] Media permission error:",e),alert(`Could not access ${this.callType==="video"?"camera/microphone":"microphone"}. Please check permissions.`),e}}initPeerConnection(){this.peerConnection&&this.peerConnection.close(),this.peerConnection=new RTCPeerConnection({iceServers:this.iceServers}),this.localStream&&this.localStream.getTracks().forEach(e=>{this.peerConnection.addTrack(e,this.localStream)}),this.remoteStream=new MediaStream,this.peerConnection.ontrack=e=>{console.log("[WebRTC] Received remote track:",e.track.kind),e.streams[0].getTracks().forEach(t=>{this.remoteStream.addTrack(t)}),this.onStreamUpdate&&this.onStreamUpdate({local:this.localStream,remote:this.remoteStream})},this.peerConnection.onicecandidate=e=>{e.candidate&&this.currentCallId&&I.send({type:"ice_candidate",call_id:this.currentCallId,target_user_id:this.targetUserId,candidate:e.candidate})},this.peerConnection.onconnectionstatechange=()=>{console.log("[WebRTC] Connection state:",this.peerConnection.connectionState),this.peerConnection.connectionState==="connected"?(R.stopRingtone(),this.startCallTimer(),this.onStateChange&&this.onStateChange("connected")):(this.peerConnection.connectionState==="disconnected"||this.peerConnection.connectionState==="failed")&&this.endCall(!1)}}async createAndSendOffer(){this.initPeerConnection();const e=await this.peerConnection.createOffer();await this.peerConnection.setLocalDescription(e),I.send({type:"sdp_offer",call_id:this.currentCallId,target_user_id:this.targetUserId,sdp:e})}async handleOffer(e,t){this.peerConnection||this.initPeerConnection(),await this.peerConnection.setRemoteDescription(new RTCSessionDescription(e));const i=await this.peerConnection.createAnswer();await this.peerConnection.setLocalDescription(i),I.send({type:"sdp_answer",call_id:this.currentCallId,target_user_id:this.targetUserId,sdp:i})}async handleAnswer(e){this.peerConnection&&await this.peerConnection.setRemoteDescription(new RTCSessionDescription(e))}toggleMute(){if(this.localStream){const e=this.localStream.getAudioTracks()[0];if(e)return e.enabled=!e.enabled,this.isMuted=!e.enabled,this.isMuted}return!1}toggleCamera(){if(this.localStream){const e=this.localStream.getVideoTracks()[0];if(e)return e.enabled=!e.enabled,this.isCamOff=!e.enabled,this.isCamOff}return!1}async toggleScreenShare(){if(this.isSharingScreen)return this.stopScreenShare(),!1;try{this.screenStream=await navigator.mediaDevices.getDisplayMedia({video:!0});const e=this.screenStream.getVideoTracks()[0],t=this.peerConnection.getSenders().find(i=>i.track&&i.track.kind==="video");return t&&t.replaceTrack(e),e.onended=()=>this.stopScreenShare(),this.isSharingScreen=!0,!0}catch(e){return console.error("[WebRTC] Screen share cancelled:",e),!1}}stopScreenShare(){var e;if(this.screenStream&&(this.screenStream.getTracks().forEach(t=>t.stop()),this.screenStream=null),this.localStream){const t=this.localStream.getVideoTracks()[0],i=(e=this.peerConnection)==null?void 0:e.getSenders().find(n=>n.track&&n.track.kind==="video");i&&t&&i.replaceTrack(t)}this.isSharingScreen=!1}startCallTimer(){this.callStartTime=new Date,this.timerInterval&&clearInterval(this.timerInterval),this.timerInterval=setInterval(()=>{if(this.callStartTime&&this.onTimerUpdate){const e=Math.floor((new Date-this.callStartTime)/1e3),t=String(Math.floor(e/60)).padStart(2,"0"),i=String(e%60).padStart(2,"0");this.onTimerUpdate(`${t}:${i}`)}},1e3)}stopCallTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null),this.callStartTime=null}endCall(e=!0){R.stopRingtone(),this.stopCallTimer(),e&&this.currentCallId&&this.targetUserId&&I.send({type:"call_end",call_id:this.currentCallId,target_user_id:this.targetUserId}),this.localStream&&(this.localStream.getTracks().forEach(t=>t.stop()),this.localStream=null),this.screenStream&&(this.screenStream.getTracks().forEach(t=>t.stop()),this.screenStream=null),this.peerConnection&&(this.peerConnection.close(),this.peerConnection=null),this.currentCallId=null,this.targetUserId=null,this.peerUser=null,this.remoteStream=null,this.onStateChange&&this.onStateChange("idle")}}const _=new We;function z(s,e,t,i=null){var l,o,c,d;const n=document.getElementById("call-overlay");if(!n)return;if(s==="idle"){n.classList.add("display-none"),n.innerHTML="";return}n.classList.remove("display-none");const a=(t==null?void 0:t.profile_image_url)||`https://api.dicebear.com/7.x/bottts/svg?seed=${t==null?void 0:t.username}`,r=e==="video";n.innerHTML=`
    <div class="d-flex flex-column h-100 justify-content-between position-relative">
      
      <!-- Top Call Header -->
      <div class="d-flex align-items-center justify-content-between z-3 px-3 py-2 glass-card bg-dark-subtle border-0">
        <div class="d-flex align-items-center gap-3">
          <div class="brand-logo-3d btn-3d-sm">
            <i class="bi ${r?"bi-camera-video-fill":"bi-telephone-fill"}"></i>
          </div>
          <div>
            <h5 class="mb-0 text-light fw-bold">${(t==null?void 0:t.display_name)||"Calling..."}</h5>
            <small class="text-secondary">@${(t==null?void 0:t.username)||"user"}</small>
          </div>
        </div>
        <div class="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill fs-7 fw-bold" id="call-timer-display">
          ${s==="calling"?"Ringing...":s==="connecting"?"Connecting...":"00:00"}
        </div>
      </div>

      <!-- Main Video/Audio Center Area -->
      <div class="flex-grow-1 position-relative my-3 d-flex align-items-center justify-content-center">
        
        ${r?`
          <div class="call-video-grid">
            <video id="remote-video-element" class="remote-video" autoplay playsinline></video>
            <div class="local-video-pip shadow-lg">
              <video id="local-video-element" autoplay playsinline muted></video>
            </div>
          </div>
        `:`
          <!-- Audio Call Pulsing Avatar Display -->
          <div class="text-center">
            <div class="pulse-ring mx-auto mb-4" style="width: 140px; height: 140px;">
              <img src="${a}" alt="${t==null?void 0:t.display_name}" class="w-100 h-100 rounded-circle border border-3 border-primary shadow-lg object-fit-cover" />
            </div>
            <h3 class="text-light fw-bold">${t==null?void 0:t.display_name}</h3>
            <p class="text-secondary fs-6">@${t==null?void 0:t.username}</p>
            <audio id="remote-audio-element" autoplay></audio>
          </div>
        `}

      </div>

      <!-- Bottom 3D Controls Bar -->
      <div class="call-controls-bar z-3">
        <button id="btn-toggle-mute" class="btn-3d ${_.isMuted?"btn-3d-danger":"btn-3d-secondary"} btn-3d-circle" title="Mute/Unmute Mic">
          <i class="bi ${_.isMuted?"bi-mic-mute-fill":"bi-mic-fill"}"></i>
        </button>

        ${r?`
          <button id="btn-toggle-cam" class="btn-3d ${_.isCamOff?"btn-3d-danger":"btn-3d-secondary"} btn-3d-circle" title="Turn Camera On/Off">
            <i class="bi ${_.isCamOff?"bi-camera-video-off-fill":"bi-camera-video-fill"}"></i>
          </button>
          
          <button id="btn-toggle-screen" class="btn-3d btn-3d-secondary btn-3d-circle" title="Share Screen">
            <i class="bi bi-display"></i>
          </button>
        `:""}

        <button id="btn-end-call" class="btn-3d btn-3d-danger btn-3d-circle" title="End Call">
          <i class="bi bi-telephone-x-fill fs-4"></i>
        </button>
      </div>

    </div>
  `,_.onStreamUpdate=({local:g,remote:u})=>{if(r){const f=document.getElementById("local-video-element"),p=document.getElementById("remote-video-element");f&&g&&(f.srcObject=g),p&&u&&(p.srcObject=u)}else{const f=document.getElementById("remote-audio-element");f&&u&&(f.srcObject=u)}},_.onTimerUpdate=g=>{const u=document.getElementById("call-timer-display");u&&(u.textContent=g)},(l=document.getElementById("btn-toggle-mute"))==null||l.addEventListener("click",()=>{const g=_.toggleMute(),u=document.getElementById("btn-toggle-mute");u&&(u.className=`btn-3d ${g?"btn-3d-danger":"btn-3d-secondary"} btn-3d-circle`,u.innerHTML=`<i class="bi ${g?"bi-mic-mute-fill":"bi-mic-fill"}"></i>`)}),(o=document.getElementById("btn-toggle-cam"))==null||o.addEventListener("click",()=>{const g=_.toggleCamera(),u=document.getElementById("btn-toggle-cam");u&&(u.className=`btn-3d ${g?"btn-3d-danger":"btn-3d-secondary"} btn-3d-circle`,u.innerHTML=`<i class="bi ${g?"bi-camera-video-off-fill":"bi-camera-video-fill"}"></i>`)}),(c=document.getElementById("btn-toggle-screen"))==null||c.addEventListener("click",async()=>{const g=await _.toggleScreenShare(),u=document.getElementById("btn-toggle-screen");u&&(u.className=`btn-3d ${g?"btn-3d-primary":"btn-3d-secondary"} btn-3d-circle`)}),(d=document.getElementById("btn-end-call"))==null||d.addEventListener("click",()=>{_.endCall(!0)})}function Je(s,e,t){var a,r;const i=document.getElementById("incoming-modal-container");if(!i)return;R.playRingtone();const n=e.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${e.username}`;i.innerHTML=`
    <div class="modal fade show d-block backdrop-blur" tabindex="-1" style="background: rgba(0,0,0,0.85); z-index: 2100;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card border-primary p-4 text-center">
          
          <div class="pulse-ring mx-auto mb-3" style="width: 100px; height: 100px;">
            <img src="${n}" alt="${e.display_name}" class="w-100 h-100 rounded-circle border border-2 border-primary object-fit-cover shadow" />
          </div>

          <h4 class="text-light fw-bold mb-1">${e.display_name}</h4>
          <p class="text-secondary mb-3">Incoming ${t==="video"?"Video":"Audio"} Call...</p>

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
  `,(a=document.getElementById("btn-accept-incoming"))==null||a.addEventListener("click",async()=>{i.innerHTML="",z("connecting",t,e,s),await _.acceptCall(s,e,t)}),(r=document.getElementById("btn-reject-incoming"))==null||r.addEventListener("click",()=>{i.innerHTML="",_.rejectCall(s)})}function Ke(s){let e=!0;function t(){var i,n,a;s.innerHTML=`
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
              <button id="tab-login" class="flex-grow-1 btn btn-sm ${e?"btn-primary fw-bold shadow-sm":"text-secondary border-0"} rounded-2 py-2">
                Sign In
              </button>
              <button id="tab-register" class="flex-grow-1 btn btn-sm ${e?"text-secondary border-0":"btn-primary fw-bold shadow-sm"} rounded-2 py-2">
                Create Account
              </button>
            </div>

            <form id="auth-form">
              ${e?"":`
                <div class="mb-3">
                  <label class="form-label text-secondary fs-7 fw-semibold">Display Name</label>
                  <input type="text" id="input-display-name" class="form-control form-control-custom" placeholder="e.g. Alex Rivera" required />
                </div>
              `}

              <div class="mb-3">
                <label class="form-label text-secondary fs-7 fw-semibold">${e?"Username or Email":"Username"}</label>
                <input type="text" id="input-username" class="form-control form-control-custom" placeholder="${e?"Enter username or email":"e.g. alex_rivera"}" required />
              </div>

              ${e?"":`
                <div class="mb-3">
                  <label class="form-label text-secondary fs-7 fw-semibold">Email Address</label>
                  <input type="email" id="input-email" class="form-control form-control-custom" placeholder="alex@example.com" required />
                </div>
              `}

              <div class="mb-4">
                <label class="form-label text-secondary fs-7 fw-semibold">Password</label>
                <input type="password" id="input-password" class="form-control form-control-custom" placeholder="••••••••" required />
              </div>

              <button type="submit" id="btn-submit-auth" class="btn-3d btn-3d-primary w-100 py-3 text-white fw-bold fs-6">
                ${e?"Sign In to Callio":"Create Free Account"}
              </button>
            </form>

          </div>

        </div>
      </div>
    `,(i=document.getElementById("tab-login"))==null||i.addEventListener("click",()=>{e=!0,t()}),(n=document.getElementById("tab-register"))==null||n.addEventListener("click",()=>{e=!1,t()}),(a=document.getElementById("auth-form"))==null||a.addEventListener("submit",async r=>{r.preventDefault();const l=document.getElementById("btn-submit-auth");l.disabled=!0,l.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span> Processing...';try{if(e){const o=document.getElementById("input-username").value.trim(),c=document.getElementById("input-password").value,d=await B("/api/auth/login",{method:"POST",body:JSON.stringify({username_or_email:o,password:c})});C.setToken(d.access_token),C.user=d.user,E(`Welcome back, ${d.user.display_name}!`,"success"),window.location.hash="#/friends"}else{const o=document.getElementById("input-display-name").value.trim(),c=document.getElementById("input-username").value.trim(),d=document.getElementById("input-email").value.trim(),g=document.getElementById("input-password").value,u=await B("/api/auth/register",{method:"POST",body:JSON.stringify({display_name:o,username:c,email:d,password:g})});C.setToken(u.access_token),C.user=u.user,E("Account created successfully!","success"),window.location.hash="#/friends"}}catch(o){E(o.message||"Authentication failed","danger"),l.disabled=!1,l.innerHTML=e?"Sign In to Callio":"Create Free Account"}})}t()}async function ue(s,e="list"){var i,n;s.innerHTML=`
    <div class="w-100">
      
      <!-- Top Sub-Navigation Tabs -->
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 class="text-light fw-bold mb-1">Friends & Contacts</h2>
          <p class="text-secondary fs-6 mb-0">Connect with your friends for audio and video calls</p>
        </div>

        <div class="d-flex gap-2 p-1 bg-dark-subtle rounded-3 border border-dark-subtle">
          <button id="subtab-friends" class="btn btn-sm ${e==="list"?"btn-primary fw-bold":"text-secondary border-0"} rounded-2 px-3 py-2">
            <i class="bi bi-people-fill me-1"></i> My Friends
          </button>
          <button id="subtab-requests" class="btn btn-sm ${e==="requests"?"btn-primary fw-bold":"text-secondary border-0"} rounded-2 px-3 py-2 position-relative">
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
  `,(i=document.getElementById("subtab-friends"))==null||i.addEventListener("click",()=>ue(s,"list")),(n=document.getElementById("subtab-requests"))==null||n.addEventListener("click",()=>ue(s,"requests"));const t=document.getElementById("friends-subview-content");e==="list"?await Se(t):e==="requests"&&await Q(t)}async function Se(s){try{const e=await B("/api/friends");if(!e||e.length===0){s.innerHTML=`
        <div class="glass-card p-5 text-center my-4">
          <i class="bi bi-person-workspace text-secondary display-1 mb-3"></i>
          <h4 class="text-light fw-bold">No friends added yet</h4>
          <p class="text-secondary max-w-md mx-auto mb-4">Find friends by their @username to make real-time audio and video calls!</p>
          <a href="#/search" class="btn-3d btn-3d-primary btn-3d-lg">
            <i class="bi bi-search"></i> Search Usernames
          </a>
        </div>
      `;return}s.innerHTML=`
      <div class="row g-3">
        ${e.map(t=>`
          <div class="col-12 col-md-6 col-lg-4">
            <div class="glass-card p-3 d-flex align-items-center justify-content-between h-100">
              
              <div class="d-flex align-items-center gap-3">
                <div class="position-relative">
                  <img src="${t.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${t.username}`}" alt="${t.display_name}" class="avatar-md rounded-circle border border-dark-subtle" />
                  <span class="status-indicator ${t.is_online?"status-online":"status-offline"} position-absolute bottom-0 end-0"></span>
                </div>
                <div>
                  <h6 class="text-light fw-bold mb-0">${t.display_name}</h6>
                  <small class="text-secondary">@${t.username}</small>
                  <div>
                    <span class="badge ${t.is_online?"bg-success-subtle text-success":"bg-secondary-subtle text-secondary"} fs-8">
                      ${t.is_online?"Online":"Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <button class="btn-3d btn-3d-success btn-3d-sm btn-audio-call" data-id="${t.id}" data-username="${t.username}" data-name="${t.display_name}" data-avatar="${t.profile_image_url||""}" title="Audio Call">
                  <i class="bi bi-telephone-fill"></i>
                </button>
                <button class="btn-3d btn-3d-primary btn-3d-sm btn-video-call" data-id="${t.id}" data-username="${t.username}" data-name="${t.display_name}" data-avatar="${t.profile_image_url||""}" title="Video Call">
                  <i class="bi bi-camera-video-fill"></i>
                </button>
                <button class="btn-3d btn-3d-secondary btn-3d-sm btn-unfriend" data-id="${t.id}" data-name="${t.display_name}" title="Remove Friend">
                  <i class="bi bi-person-x-fill text-danger"></i>
                </button>
              </div>

            </div>
          </div>
        `).join("")}
      </div>
    `,s.querySelectorAll(".btn-audio-call").forEach(t=>{t.addEventListener("click",async()=>{const i=parseInt(t.dataset.id),n={id:i,username:t.dataset.username,display_name:t.dataset.name,profile_image_url:t.dataset.avatar};z("calling","audio",n),await _.startCall(i,n,"audio")})}),s.querySelectorAll(".btn-video-call").forEach(t=>{t.addEventListener("click",async()=>{const i=parseInt(t.dataset.id),n={id:i,username:t.dataset.username,display_name:t.dataset.name,profile_image_url:t.dataset.avatar};z("calling","video",n),await _.startCall(i,n,"video")})}),s.querySelectorAll(".btn-unfriend").forEach(t=>{t.addEventListener("click",async()=>{const i=parseInt(t.dataset.id),n=t.dataset.name;if(confirm(`Are you sure you want to remove ${n} from your friends list?`))try{await B(`/api/friends/${i}`,{method:"DELETE"}),E(`Removed ${n} from friends`,"info"),await Se(s)}catch(a){E(a.message||"Failed to remove friend","danger")}})})}catch(e){s.innerHTML=`<div class="alert alert-danger">${e.message||"Error loading friends"}</div>`}}async function Q(s){try{const e=await B("/api/friends/requests"),t=e.incoming||[],i=e.outgoing||[];if(t.length===0&&i.length===0){s.innerHTML=`
        <div class="glass-card p-5 text-center my-4">
          <i class="bi bi-inbox text-secondary display-1 mb-3"></i>
          <h4 class="text-light fw-bold">No pending friend requests</h4>
          <p class="text-secondary max-w-md mx-auto">When someone sends you a friend request or when you send one, it will appear here.</p>
        </div>
      `;return}s.innerHTML=`
      <div class="row g-4">
        
        <!-- Incoming Requests -->
        <div class="col-12 col-lg-6">
          <h5 class="text-light fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-box-arrow-in-down-left text-primary"></i>
            Incoming Requests (${t.length})
          </h5>

          ${t.length===0?'<p class="text-secondary">No incoming requests.</p>':`
            <div class="d-flex flex-column gap-2">
              ${t.map(n=>`
                <div class="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-3">
                    <img src="${n.sender.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${n.sender.username}`}" class="avatar-md rounded-circle" />
                    <div>
                      <h6 class="text-light fw-bold mb-0">${n.sender.display_name}</h6>
                      <small class="text-secondary">@${n.sender.username}</small>
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn-3d btn-3d-success btn-3d-sm btn-accept-req" data-id="${n.id}">Accept</button>
                    <button class="btn-3d btn-3d-danger btn-3d-sm btn-reject-req" data-id="${n.id}">Reject</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Outgoing Sent Requests -->
        <div class="col-12 col-lg-6">
          <h5 class="text-light fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-box-arrow-up-right text-secondary"></i>
            Sent Requests (${i.length})
          </h5>

          ${i.length===0?'<p class="text-secondary">No sent requests pending.</p>':`
            <div class="d-flex flex-column gap-2">
              ${i.map(n=>`
                <div class="glass-card p-3 d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-3">
                    <img src="${n.receiver.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${n.receiver.username}`}" class="avatar-md rounded-circle" />
                    <div>
                      <h6 class="text-light fw-bold mb-0">${n.receiver.display_name}</h6>
                      <small class="text-secondary">@${n.receiver.username}</small>
                    </div>
                  </div>
                  <button class="btn-3d btn-3d-secondary btn-3d-sm btn-cancel-req" data-id="${n.id}">Cancel</button>
                </div>
              `).join("")}
            </div>
          `}
        </div>

      </div>
    `,s.querySelectorAll(".btn-accept-req").forEach(n=>{n.addEventListener("click",async()=>{try{await B(`/api/friends/request/${n.dataset.id}/accept`,{method:"POST"}),E("Friend request accepted!","success"),await Q(s)}catch(a){E(a.message,"danger")}})}),s.querySelectorAll(".btn-reject-req").forEach(n=>{n.addEventListener("click",async()=>{try{await B(`/api/friends/request/${n.dataset.id}/reject`,{method:"POST"}),E("Friend request rejected","info"),await Q(s)}catch(a){E(a.message,"danger")}})}),s.querySelectorAll(".btn-cancel-req").forEach(n=>{n.addEventListener("click",async()=>{try{await B(`/api/friends/request/${n.dataset.id}/cancel`,{method:"DELETE"}),E("Friend request cancelled","info"),await Q(s)}catch(a){E(a.message,"danger")}})})}catch(e){s.innerHTML=`<div class="alert alert-danger">${e.message||"Error loading requests"}</div>`}}function Ye(s){let e=null;s.innerHTML=`
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
  `;const t=document.getElementById("input-search-username"),i=document.getElementById("search-results-container");t==null||t.addEventListener("input",()=>{e&&clearTimeout(e);const n=t.value.trim();if(!n){i.innerHTML=`
        <div class="glass-card p-5 text-center text-secondary">
          <i class="bi bi-person-bounding-box display-3 mb-3"></i>
          <p class="fs-6">Type a username above to search for people on Callio</p>
        </div>
      `;return}i.innerHTML=`
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
    `,e=setTimeout(async()=>{try{const a=await B(`/api/users/search?q=${encodeURIComponent(n)}`);if(!a||a.length===0){i.innerHTML=`
            <div class="glass-card p-4 text-center text-secondary">
              <i class="bi bi-emoji-frown fs-2 mb-2"></i>
              <p class="mb-0">No users found matching "${n}"</p>
            </div>
          `;return}i.innerHTML=`
          <div class="d-flex flex-column gap-3">
            ${a.map(r=>`
              <div class="glass-card p-3 d-flex align-items-center justify-content-between">
                
                <div class="d-flex align-items-center gap-3">
                  <div class="position-relative">
                    <img src="${r.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${r.username}`}" class="avatar-md rounded-circle border border-dark-subtle" />
                    <span class="status-indicator ${r.is_online?"status-online":"status-offline"} position-absolute bottom-0 end-0"></span>
                  </div>
                  <div>
                    <h6 class="text-light fw-bold mb-0">${r.display_name}</h6>
                    <small class="text-secondary">@${r.username}</small>
                    ${r.bio?`<p class="text-secondary fs-8 mb-0 text-truncate" style="max-width: 250px;">${r.bio}</p>`:""}
                  </div>
                </div>

                <div>
                  ${r.friendship_status==="friends"?`
                    <span class="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill">
                      <i class="bi bi-check-circle-fill me-1"></i> Friends
                    </span>
                  `:r.friendship_status==="request_sent"?`
                    <span class="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill">
                      <i class="bi bi-clock me-1"></i> Request Sent
                    </span>
                  `:r.friendship_status==="request_received"?`
                    <a href="#/friends" class="btn-3d btn-3d-success btn-3d-sm">Accept Request</a>
                  `:`
                    <button class="btn-3d btn-3d-primary btn-3d-sm btn-send-request" data-username="${r.username}">
                      <i class="bi bi-person-plus-fill"></i> Add Friend
                    </button>
                  `}
                </div>

              </div>
            `).join("")}
          </div>
        `,i.querySelectorAll(".btn-send-request").forEach(r=>{r.addEventListener("click",async()=>{const l=r.dataset.username;r.disabled=!0,r.textContent="Sending...";try{await B("/api/friends/request",{method:"POST",body:JSON.stringify({receiver_username:l})}),E(`Friend request sent to @${l}!`,"success"),r.className="btn btn-sm btn-secondary rounded-pill disabled",r.textContent="Request Sent"}catch(o){E(o.message||"Failed to send friend request","danger"),r.disabled=!1,r.textContent="Add Friend"}})})}catch(a){i.innerHTML=`<div class="alert alert-danger">${a.message||"Search error"}</div>`}},300)})}var V={},Ge=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},Te={},$={};let pe;const Qe=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];$.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17};$.getSymbolTotalCodewords=function(e){return Qe[e]};$.getBCHDigit=function(s){let e=0;for(;s!==0;)e++,s>>>=1;return e};$.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');pe=e};$.isKanjiModeEnabled=function(){return typeof pe<"u"};$.toSJIS=function(e){return pe(e)};var ee={};(function(s){s.L={bit:1},s.M={bit:0},s.Q={bit:3},s.H={bit:2};function e(t){if(typeof t!="string")throw new Error("Param is not a string");switch(t.toLowerCase()){case"l":case"low":return s.L;case"m":case"medium":return s.M;case"q":case"quartile":return s.Q;case"h":case"high":return s.H;default:throw new Error("Unknown EC Level: "+t)}}s.isValid=function(i){return i&&typeof i.bit<"u"&&i.bit>=0&&i.bit<4},s.from=function(i,n){if(s.isValid(i))return i;try{return e(i)}catch{return n}}})(ee);function Ie(){this.buffer=[],this.length=0}Ie.prototype={get:function(s){const e=Math.floor(s/8);return(this.buffer[e]>>>7-s%8&1)===1},put:function(s,e){for(let t=0;t<e;t++)this.putBit((s>>>e-t-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(s){const e=Math.floor(this.length/8);this.buffer.length<=e&&this.buffer.push(0),s&&(this.buffer[e]|=128>>>this.length%8),this.length++}};var Ze=Ie;function J(s){if(!s||s<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=s,this.data=new Uint8Array(s*s),this.reservedBit=new Uint8Array(s*s)}J.prototype.set=function(s,e,t,i){const n=s*this.size+e;this.data[n]=t,i&&(this.reservedBit[n]=!0)};J.prototype.get=function(s,e){return this.data[s*this.size+e]};J.prototype.xor=function(s,e,t){this.data[s*this.size+e]^=t};J.prototype.isReserved=function(s,e){return this.reservedBit[s*this.size+e]};var Xe=J,_e={};(function(s){const e=$.getSymbolSize;s.getRowColCoords=function(i){if(i===1)return[];const n=Math.floor(i/7)+2,a=e(i),r=a===145?26:Math.ceil((a-13)/(2*n-2))*2,l=[a-7];for(let o=1;o<n-1;o++)l[o]=l[o-1]-r;return l.push(6),l.reverse()},s.getPositions=function(i){const n=[],a=s.getRowColCoords(i),r=a.length;for(let l=0;l<r;l++)for(let o=0;o<r;o++)l===0&&o===0||l===0&&o===r-1||l===r-1&&o===0||n.push([a[l],a[o]]);return n}})(_e);var Be={};const et=$.getSymbolSize,Ce=7;Be.getPositions=function(e){const t=et(e);return[[0,0],[t-Ce,0],[0,t-Ce]]};var $e={};(function(s){s.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};s.isValid=function(n){return n!=null&&n!==""&&!isNaN(n)&&n>=0&&n<=7},s.from=function(n){return s.isValid(n)?parseInt(n,10):void 0},s.getPenaltyN1=function(n){const a=n.size;let r=0,l=0,o=0,c=null,d=null;for(let g=0;g<a;g++){l=o=0,c=d=null;for(let u=0;u<a;u++){let f=n.get(g,u);f===c?l++:(l>=5&&(r+=e.N1+(l-5)),c=f,l=1),f=n.get(u,g),f===d?o++:(o>=5&&(r+=e.N1+(o-5)),d=f,o=1)}l>=5&&(r+=e.N1+(l-5)),o>=5&&(r+=e.N1+(o-5))}return r},s.getPenaltyN2=function(n){const a=n.size;let r=0;for(let l=0;l<a-1;l++)for(let o=0;o<a-1;o++){const c=n.get(l,o)+n.get(l,o+1)+n.get(l+1,o)+n.get(l+1,o+1);(c===4||c===0)&&r++}return r*e.N2},s.getPenaltyN3=function(n){const a=n.size;let r=0,l=0,o=0;for(let c=0;c<a;c++){l=o=0;for(let d=0;d<a;d++)l=l<<1&2047|n.get(c,d),d>=10&&(l===1488||l===93)&&r++,o=o<<1&2047|n.get(d,c),d>=10&&(o===1488||o===93)&&r++}return r*e.N3},s.getPenaltyN4=function(n){let a=0;const r=n.data.length;for(let o=0;o<r;o++)a+=n.data[o];return Math.abs(Math.ceil(a*100/r/5)-10)*e.N4};function t(i,n,a){switch(i){case s.Patterns.PATTERN000:return(n+a)%2===0;case s.Patterns.PATTERN001:return n%2===0;case s.Patterns.PATTERN010:return a%3===0;case s.Patterns.PATTERN011:return(n+a)%3===0;case s.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(a/3))%2===0;case s.Patterns.PATTERN101:return n*a%2+n*a%3===0;case s.Patterns.PATTERN110:return(n*a%2+n*a%3)%2===0;case s.Patterns.PATTERN111:return(n*a%3+(n+a)%2)%2===0;default:throw new Error("bad maskPattern:"+i)}}s.applyMask=function(n,a){const r=a.size;for(let l=0;l<r;l++)for(let o=0;o<r;o++)a.isReserved(o,l)||a.xor(o,l,t(n,o,l))},s.getBestMask=function(n,a){const r=Object.keys(s.Patterns).length;let l=0,o=1/0;for(let c=0;c<r;c++){a(c),s.applyMask(c,n);const d=s.getPenaltyN1(n)+s.getPenaltyN2(n)+s.getPenaltyN3(n)+s.getPenaltyN4(n);s.applyMask(c,n),d<o&&(o=d,l=c)}return l}})($e);var te={};const N=ee,Y=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],G=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];te.getBlocksCount=function(e,t){switch(t){case N.L:return Y[(e-1)*4+0];case N.M:return Y[(e-1)*4+1];case N.Q:return Y[(e-1)*4+2];case N.H:return Y[(e-1)*4+3];default:return}};te.getTotalCodewordsCount=function(e,t){switch(t){case N.L:return G[(e-1)*4+0];case N.M:return G[(e-1)*4+1];case N.Q:return G[(e-1)*4+2];case N.H:return G[(e-1)*4+3];default:return}};var Ae={},ne={};const j=new Uint8Array(512),Z=new Uint8Array(256);(function(){let e=1;for(let t=0;t<255;t++)j[t]=e,Z[e]=t,e<<=1,e&256&&(e^=285);for(let t=255;t<512;t++)j[t]=j[t-255]})();ne.log=function(e){if(e<1)throw new Error("log("+e+")");return Z[e]};ne.exp=function(e){return j[e]};ne.mul=function(e,t){return e===0||t===0?0:j[Z[e]+Z[t]]};(function(s){const e=ne;s.mul=function(i,n){const a=new Uint8Array(i.length+n.length-1);for(let r=0;r<i.length;r++)for(let l=0;l<n.length;l++)a[r+l]^=e.mul(i[r],n[l]);return a},s.mod=function(i,n){let a=new Uint8Array(i);for(;a.length-n.length>=0;){const r=a[0];for(let o=0;o<n.length;o++)a[o]^=e.mul(n[o],r);let l=0;for(;l<a.length&&a[l]===0;)l++;a=a.slice(l)}return a},s.generateECPolynomial=function(i){let n=new Uint8Array([1]);for(let a=0;a<i;a++)n=s.mul(n,new Uint8Array([1,e.exp(a)]));return n}})(Ae);const Le=Ae;function be(s){this.genPoly=void 0,this.degree=s,this.degree&&this.initialize(this.degree)}be.prototype.initialize=function(e){this.degree=e,this.genPoly=Le.generateECPolynomial(this.degree)};be.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const t=new Uint8Array(e.length+this.degree);t.set(e);const i=Le.mod(t,this.genPoly),n=this.degree-i.length;if(n>0){const a=new Uint8Array(this.degree);return a.set(i,n),a}return i};var tt=be,Me={},q={},ye={};ye.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40};var M={};const ke="[0-9]+",nt="[A-Z $%*+\\-./:]+";let W="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";W=W.replace(/u/g,"\\u");const it="(?:(?![A-Z0-9 $%*+\\-./:]|"+W+`)(?:.|[\r
]))+`;M.KANJI=new RegExp(W,"g");M.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");M.BYTE=new RegExp(it,"g");M.NUMERIC=new RegExp(ke,"g");M.ALPHANUMERIC=new RegExp(nt,"g");const st=new RegExp("^"+W+"$"),at=new RegExp("^"+ke+"$"),rt=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");M.testKanji=function(e){return st.test(e)};M.testNumeric=function(e){return at.test(e)};M.testAlphanumeric=function(e){return rt.test(e)};(function(s){const e=ye,t=M;s.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},s.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},s.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},s.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},s.MIXED={bit:-1},s.getCharCountIndicator=function(a,r){if(!a.ccBits)throw new Error("Invalid mode: "+a);if(!e.isValid(r))throw new Error("Invalid version: "+r);return r>=1&&r<10?a.ccBits[0]:r<27?a.ccBits[1]:a.ccBits[2]},s.getBestModeForData=function(a){return t.testNumeric(a)?s.NUMERIC:t.testAlphanumeric(a)?s.ALPHANUMERIC:t.testKanji(a)?s.KANJI:s.BYTE},s.toString=function(a){if(a&&a.id)return a.id;throw new Error("Invalid mode")},s.isValid=function(a){return a&&a.bit&&a.ccBits};function i(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return s.NUMERIC;case"alphanumeric":return s.ALPHANUMERIC;case"kanji":return s.KANJI;case"byte":return s.BYTE;default:throw new Error("Unknown mode: "+n)}}s.from=function(a,r){if(s.isValid(a))return a;try{return i(a)}catch{return r}}})(q);(function(s){const e=$,t=te,i=ee,n=q,a=ye,r=7973,l=e.getBCHDigit(r);function o(u,f,p){for(let y=1;y<=40;y++)if(f<=s.getCapacity(y,p,u))return y}function c(u,f){return n.getCharCountIndicator(u,f)+4}function d(u,f){let p=0;return u.forEach(function(y){const T=c(y.mode,f);p+=T+y.getBitsLength()}),p}function g(u,f){for(let p=1;p<=40;p++)if(d(u,p)<=s.getCapacity(p,f,n.MIXED))return p}s.from=function(f,p){return a.isValid(f)?parseInt(f,10):p},s.getCapacity=function(f,p,y){if(!a.isValid(f))throw new Error("Invalid QR Code version");typeof y>"u"&&(y=n.BYTE);const T=e.getSymbolTotalCodewords(f),b=t.getTotalCodewordsCount(f,p),w=(T-b)*8;if(y===n.MIXED)return w;const h=w-c(y,f);switch(y){case n.NUMERIC:return Math.floor(h/10*3);case n.ALPHANUMERIC:return Math.floor(h/11*2);case n.KANJI:return Math.floor(h/13);case n.BYTE:default:return Math.floor(h/8)}},s.getBestVersionForData=function(f,p){let y;const T=i.from(p,i.M);if(Array.isArray(f)){if(f.length>1)return g(f,T);if(f.length===0)return 1;y=f[0]}else y=f;return o(y.mode,y.getLength(),T)},s.getEncodedBits=function(f){if(!a.isValid(f)||f<7)throw new Error("Invalid QR Code version");let p=f<<12;for(;e.getBCHDigit(p)-l>=0;)p^=r<<e.getBCHDigit(p)-l;return f<<12|p}})(Me);var Re={};const fe=$,Pe=1335,ot=21522,Ee=fe.getBCHDigit(Pe);Re.getEncodedBits=function(e,t){const i=e.bit<<3|t;let n=i<<10;for(;fe.getBCHDigit(n)-Ee>=0;)n^=Pe<<fe.getBCHDigit(n)-Ee;return(i<<10|n)^ot};var Ne={};const lt=q;function D(s){this.mode=lt.NUMERIC,this.data=s.toString()}D.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)};D.prototype.getLength=function(){return this.data.length};D.prototype.getBitsLength=function(){return D.getBitsLength(this.data.length)};D.prototype.write=function(e){let t,i,n;for(t=0;t+3<=this.data.length;t+=3)i=this.data.substr(t,3),n=parseInt(i,10),e.put(n,10);const a=this.data.length-t;a>0&&(i=this.data.substr(t),n=parseInt(i,10),e.put(n,a*3+1))};var ct=D;const dt=q,ae=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function F(s){this.mode=dt.ALPHANUMERIC,this.data=s}F.getBitsLength=function(e){return 11*Math.floor(e/2)+6*(e%2)};F.prototype.getLength=function(){return this.data.length};F.prototype.getBitsLength=function(){return F.getBitsLength(this.data.length)};F.prototype.write=function(e){let t;for(t=0;t+2<=this.data.length;t+=2){let i=ae.indexOf(this.data[t])*45;i+=ae.indexOf(this.data[t+1]),e.put(i,11)}this.data.length%2&&e.put(ae.indexOf(this.data[t]),6)};var ut=F;const ft=q;function O(s){this.mode=ft.BYTE,typeof s=="string"?this.data=new TextEncoder().encode(s):this.data=new Uint8Array(s)}O.getBitsLength=function(e){return e*8};O.prototype.getLength=function(){return this.data.length};O.prototype.getBitsLength=function(){return O.getBitsLength(this.data.length)};O.prototype.write=function(s){for(let e=0,t=this.data.length;e<t;e++)s.put(this.data[e],8)};var mt=O;const ht=q,gt=$;function U(s){this.mode=ht.KANJI,this.data=s}U.getBitsLength=function(e){return e*13};U.prototype.getLength=function(){return this.data.length};U.prototype.getBitsLength=function(){return U.getBitsLength(this.data.length)};U.prototype.write=function(s){let e;for(e=0;e<this.data.length;e++){let t=gt.toSJIS(this.data[e]);if(t>=33088&&t<=40956)t-=33088;else if(t>=57408&&t<=60351)t-=49472;else throw new Error("Invalid SJIS character: "+this.data[e]+`
Make sure your charset is UTF-8`);t=(t>>>8&255)*192+(t&255),s.put(t,13)}};var pt=U,qe={exports:{}};(function(s){var e={single_source_shortest_paths:function(t,i,n){var a={},r={};r[i]=0;var l=e.PriorityQueue.make();l.push(i,0);for(var o,c,d,g,u,f,p,y,T;!l.empty();){o=l.pop(),c=o.value,g=o.cost,u=t[c]||{};for(d in u)u.hasOwnProperty(d)&&(f=u[d],p=g+f,y=r[d],T=typeof r[d]>"u",(T||y>p)&&(r[d]=p,l.push(d,p),a[d]=c))}if(typeof n<"u"&&typeof r[n]>"u"){var b=["Could not find a path from ",i," to ",n,"."].join("");throw new Error(b)}return a},extract_shortest_path_from_predecessor_list:function(t,i){for(var n=[],a=i;a;)n.push(a),t[a],a=t[a];return n.reverse(),n},find_path:function(t,i,n){var a=e.single_source_shortest_paths(t,i,n);return e.extract_shortest_path_from_predecessor_list(a,n)},PriorityQueue:{make:function(t){var i=e.PriorityQueue,n={},a;t=t||{};for(a in i)i.hasOwnProperty(a)&&(n[a]=i[a]);return n.queue=[],n.sorter=t.sorter||i.default_sorter,n},default_sorter:function(t,i){return t.cost-i.cost},push:function(t,i){var n={value:t,cost:i};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};s.exports=e})(qe);var bt=qe.exports;(function(s){const e=q,t=ct,i=ut,n=mt,a=pt,r=M,l=$,o=bt;function c(b){return unescape(encodeURIComponent(b)).length}function d(b,w,h){const m=[];let v;for(;(v=b.exec(h))!==null;)m.push({data:v[0],index:v.index,mode:w,length:v[0].length});return m}function g(b){const w=d(r.NUMERIC,e.NUMERIC,b),h=d(r.ALPHANUMERIC,e.ALPHANUMERIC,b);let m,v;return l.isKanjiModeEnabled()?(m=d(r.BYTE,e.BYTE,b),v=d(r.KANJI,e.KANJI,b)):(m=d(r.BYTE_KANJI,e.BYTE,b),v=[]),w.concat(h,m,v).sort(function(S,A){return S.index-A.index}).map(function(S){return{data:S.data,mode:S.mode,length:S.length}})}function u(b,w){switch(w){case e.NUMERIC:return t.getBitsLength(b);case e.ALPHANUMERIC:return i.getBitsLength(b);case e.KANJI:return a.getBitsLength(b);case e.BYTE:return n.getBitsLength(b)}}function f(b){return b.reduce(function(w,h){const m=w.length-1>=0?w[w.length-1]:null;return m&&m.mode===h.mode?(w[w.length-1].data+=h.data,w):(w.push(h),w)},[])}function p(b){const w=[];for(let h=0;h<b.length;h++){const m=b[h];switch(m.mode){case e.NUMERIC:w.push([m,{data:m.data,mode:e.ALPHANUMERIC,length:m.length},{data:m.data,mode:e.BYTE,length:m.length}]);break;case e.ALPHANUMERIC:w.push([m,{data:m.data,mode:e.BYTE,length:m.length}]);break;case e.KANJI:w.push([m,{data:m.data,mode:e.BYTE,length:c(m.data)}]);break;case e.BYTE:w.push([{data:m.data,mode:e.BYTE,length:c(m.data)}])}}return w}function y(b,w){const h={},m={start:{}};let v=["start"];for(let x=0;x<b.length;x++){const S=b[x],A=[];for(let P=0;P<S.length;P++){const L=S[P],H=""+x+P;A.push(H),h[H]={node:L,lastCount:0},m[H]={};for(let se=0;se<v.length;se++){const k=v[se];h[k]&&h[k].node.mode===L.mode?(m[k][H]=u(h[k].lastCount+L.length,L.mode)-u(h[k].lastCount,L.mode),h[k].lastCount+=L.length):(h[k]&&(h[k].lastCount=L.length),m[k][H]=u(L.length,L.mode)+4+e.getCharCountIndicator(L.mode,w))}}v=A}for(let x=0;x<v.length;x++)m[v[x]].end=0;return{map:m,table:h}}function T(b,w){let h;const m=e.getBestModeForData(b);if(h=e.from(w,m),h!==e.BYTE&&h.bit<m.bit)throw new Error('"'+b+'" cannot be encoded with mode '+e.toString(h)+`.
 Suggested mode is: `+e.toString(m));switch(h===e.KANJI&&!l.isKanjiModeEnabled()&&(h=e.BYTE),h){case e.NUMERIC:return new t(b);case e.ALPHANUMERIC:return new i(b);case e.KANJI:return new a(b);case e.BYTE:return new n(b)}}s.fromArray=function(w){return w.reduce(function(h,m){return typeof m=="string"?h.push(T(m,null)):m.data&&h.push(T(m.data,m.mode)),h},[])},s.fromString=function(w,h){const m=g(w,l.isKanjiModeEnabled()),v=p(m),x=y(v,h),S=o.find_path(x.map,"start","end"),A=[];for(let P=1;P<S.length-1;P++)A.push(x.table[S[P]].node);return s.fromArray(f(A))},s.rawSplit=function(w){return s.fromArray(g(w,l.isKanjiModeEnabled()))}})(Ne);const ie=$,re=ee,yt=Ze,wt=Xe,vt=_e,Ct=Be,me=$e,he=te,Et=tt,X=Me,xt=Re,St=q,oe=Ne;function Tt(s,e){const t=s.size,i=Ct.getPositions(e);for(let n=0;n<i.length;n++){const a=i[n][0],r=i[n][1];for(let l=-1;l<=7;l++)if(!(a+l<=-1||t<=a+l))for(let o=-1;o<=7;o++)r+o<=-1||t<=r+o||(l>=0&&l<=6&&(o===0||o===6)||o>=0&&o<=6&&(l===0||l===6)||l>=2&&l<=4&&o>=2&&o<=4?s.set(a+l,r+o,!0,!0):s.set(a+l,r+o,!1,!0))}}function It(s){const e=s.size;for(let t=8;t<e-8;t++){const i=t%2===0;s.set(t,6,i,!0),s.set(6,t,i,!0)}}function _t(s,e){const t=vt.getPositions(e);for(let i=0;i<t.length;i++){const n=t[i][0],a=t[i][1];for(let r=-2;r<=2;r++)for(let l=-2;l<=2;l++)r===-2||r===2||l===-2||l===2||r===0&&l===0?s.set(n+r,a+l,!0,!0):s.set(n+r,a+l,!1,!0)}}function Bt(s,e){const t=s.size,i=X.getEncodedBits(e);let n,a,r;for(let l=0;l<18;l++)n=Math.floor(l/3),a=l%3+t-8-3,r=(i>>l&1)===1,s.set(n,a,r,!0),s.set(a,n,r,!0)}function le(s,e,t){const i=s.size,n=xt.getEncodedBits(e,t);let a,r;for(a=0;a<15;a++)r=(n>>a&1)===1,a<6?s.set(a,8,r,!0):a<8?s.set(a+1,8,r,!0):s.set(i-15+a,8,r,!0),a<8?s.set(8,i-a-1,r,!0):a<9?s.set(8,15-a-1+1,r,!0):s.set(8,15-a-1,r,!0);s.set(i-8,8,1,!0)}function $t(s,e){const t=s.size;let i=-1,n=t-1,a=7,r=0;for(let l=t-1;l>0;l-=2)for(l===6&&l--;;){for(let o=0;o<2;o++)if(!s.isReserved(n,l-o)){let c=!1;r<e.length&&(c=(e[r]>>>a&1)===1),s.set(n,l-o,c),a--,a===-1&&(r++,a=7)}if(n+=i,n<0||t<=n){n-=i,i=-i;break}}}function At(s,e,t){const i=new yt;t.forEach(function(o){i.put(o.mode.bit,4),i.put(o.getLength(),St.getCharCountIndicator(o.mode,s)),o.write(i)});const n=ie.getSymbolTotalCodewords(s),a=he.getTotalCodewordsCount(s,e),r=(n-a)*8;for(i.getLengthInBits()+4<=r&&i.put(0,4);i.getLengthInBits()%8!==0;)i.putBit(0);const l=(r-i.getLengthInBits())/8;for(let o=0;o<l;o++)i.put(o%2?17:236,8);return Lt(i,s,e)}function Lt(s,e,t){const i=ie.getSymbolTotalCodewords(e),n=he.getTotalCodewordsCount(e,t),a=i-n,r=he.getBlocksCount(e,t),l=i%r,o=r-l,c=Math.floor(i/r),d=Math.floor(a/r),g=d+1,u=c-d,f=new Et(u);let p=0;const y=new Array(r),T=new Array(r);let b=0;const w=new Uint8Array(s.buffer);for(let S=0;S<r;S++){const A=S<o?d:g;y[S]=w.slice(p,p+A),T[S]=f.encode(y[S]),p+=A,b=Math.max(b,A)}const h=new Uint8Array(i);let m=0,v,x;for(v=0;v<b;v++)for(x=0;x<r;x++)v<y[x].length&&(h[m++]=y[x][v]);for(v=0;v<u;v++)for(x=0;x<r;x++)h[m++]=T[x][v];return h}function Mt(s,e,t,i){let n;if(Array.isArray(s))n=oe.fromArray(s);else if(typeof s=="string"){let c=e;if(!c){const d=oe.rawSplit(s);c=X.getBestVersionForData(d,t)}n=oe.fromString(s,c||40)}else throw new Error("Invalid data");const a=X.getBestVersionForData(n,t);if(!a)throw new Error("The amount of data is too big to be stored in a QR Code");if(!e)e=a;else if(e<a)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+a+`.
`);const r=At(e,t,n),l=ie.getSymbolSize(e),o=new wt(l);return Tt(o,e),It(o),_t(o,e),le(o,t,0),e>=7&&Bt(o,e),$t(o,r),isNaN(i)&&(i=me.getBestMask(o,le.bind(null,o,t))),me.applyMask(i,o),le(o,t,i),{modules:o,version:e,errorCorrectionLevel:t,maskPattern:i,segments:n}}Te.create=function(e,t){if(typeof e>"u"||e==="")throw new Error("No input text");let i=re.M,n,a;return typeof t<"u"&&(i=re.from(t.errorCorrectionLevel,re.M),n=X.from(t.version),a=me.from(t.maskPattern),t.toSJISFunc&&ie.setToSJISFunction(t.toSJISFunc)),Mt(e,n,i,a)};var De={},we={};(function(s){function e(t){if(typeof t=="number"&&(t=t.toString()),typeof t!="string")throw new Error("Color should be defined as hex string");let i=t.slice().replace("#","").split("");if(i.length<3||i.length===5||i.length>8)throw new Error("Invalid hex color: "+t);(i.length===3||i.length===4)&&(i=Array.prototype.concat.apply([],i.map(function(a){return[a,a]}))),i.length===6&&i.push("F","F");const n=parseInt(i.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:"#"+i.slice(0,6).join("")}}s.getOptions=function(i){i||(i={}),i.color||(i.color={});const n=typeof i.margin>"u"||i.margin===null||i.margin<0?4:i.margin,a=i.width&&i.width>=21?i.width:void 0,r=i.scale||4;return{width:a,scale:a?4:r,margin:n,color:{dark:e(i.color.dark||"#000000ff"),light:e(i.color.light||"#ffffffff")},type:i.type,rendererOpts:i.rendererOpts||{}}},s.getScale=function(i,n){return n.width&&n.width>=i+n.margin*2?n.width/(i+n.margin*2):n.scale},s.getImageWidth=function(i,n){const a=s.getScale(i,n);return Math.floor((i+n.margin*2)*a)},s.qrToImageData=function(i,n,a){const r=n.modules.size,l=n.modules.data,o=s.getScale(r,a),c=Math.floor((r+a.margin*2)*o),d=a.margin*o,g=[a.color.light,a.color.dark];for(let u=0;u<c;u++)for(let f=0;f<c;f++){let p=(u*c+f)*4,y=a.color.light;if(u>=d&&f>=d&&u<c-d&&f<c-d){const T=Math.floor((u-d)/o),b=Math.floor((f-d)/o);y=g[l[T*r+b]?1:0]}i[p++]=y.r,i[p++]=y.g,i[p++]=y.b,i[p]=y.a}}})(we);(function(s){const e=we;function t(n,a,r){n.clearRect(0,0,a.width,a.height),a.style||(a.style={}),a.height=r,a.width=r,a.style.height=r+"px",a.style.width=r+"px"}function i(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}s.render=function(a,r,l){let o=l,c=r;typeof o>"u"&&(!r||!r.getContext)&&(o=r,r=void 0),r||(c=i()),o=e.getOptions(o);const d=e.getImageWidth(a.modules.size,o),g=c.getContext("2d"),u=g.createImageData(d,d);return e.qrToImageData(u.data,a,o),t(g,c,d),g.putImageData(u,0,0),c},s.renderToDataURL=function(a,r,l){let o=l;typeof o>"u"&&(!r||!r.getContext)&&(o=r,r=void 0),o||(o={});const c=s.render(a,r,o),d=o.type||"image/png",g=o.rendererOpts||{};return c.toDataURL(d,g.quality)}})(De);var Fe={};const kt=we;function xe(s,e){const t=s.a/255,i=e+'="'+s.hex+'"';return t<1?i+" "+e+'-opacity="'+t.toFixed(2).slice(1)+'"':i}function ce(s,e,t){let i=s+e;return typeof t<"u"&&(i+=" "+t),i}function Rt(s,e,t){let i="",n=0,a=!1,r=0;for(let l=0;l<s.length;l++){const o=Math.floor(l%e),c=Math.floor(l/e);!o&&!a&&(a=!0),s[l]?(r++,l>0&&o>0&&s[l-1]||(i+=a?ce("M",o+t,.5+c+t):ce("m",n,0),n=0,a=!1),o+1<e&&s[l+1]||(i+=ce("h",r),r=0)):n++}return i}Fe.render=function(e,t,i){const n=kt.getOptions(t),a=e.modules.size,r=e.modules.data,l=a+n.margin*2,o=n.color.light.a?"<path "+xe(n.color.light,"fill")+' d="M0 0h'+l+"v"+l+'H0z"/>':"",c="<path "+xe(n.color.dark,"stroke")+' d="'+Rt(r,a,n.margin)+'"/>',d='viewBox="0 0 '+l+" "+l+'"',u='<svg xmlns="http://www.w3.org/2000/svg" '+(n.width?'width="'+n.width+'" height="'+n.width+'" ':"")+d+' shape-rendering="crispEdges">'+o+c+`</svg>
`;return typeof i=="function"&&i(null,u),u};const Pt=Ge,ge=Te,Oe=De,Nt=Fe;function ve(s,e,t,i,n){const a=[].slice.call(arguments,1),r=a.length,l=typeof a[r-1]=="function";if(!l&&!Pt())throw new Error("Callback required as last argument");if(l){if(r<2)throw new Error("Too few arguments provided");r===2?(n=t,t=e,e=i=void 0):r===3&&(e.getContext&&typeof n>"u"?(n=i,i=void 0):(n=i,i=t,t=e,e=void 0))}else{if(r<1)throw new Error("Too few arguments provided");return r===1?(t=e,e=i=void 0):r===2&&!e.getContext&&(i=t,t=e,e=void 0),new Promise(function(o,c){try{const d=ge.create(t,i);o(s(d,e,i))}catch(d){c(d)}})}try{const o=ge.create(t,i);n(null,s(o,e,i))}catch(o){n(o)}}V.create=ge.create;V.toCanvas=ve.bind(null,Oe.render);V.toDataURL=ve.bind(null,Oe.renderToDataURL);V.toString=ve.bind(null,function(s,e,t){return Nt.render(s,t)});async function Ue(s){var a,r,l;let e=C.user;try{const o=await B("/api/users/me");C.user=o,e=o}catch(o){console.warn("Could not refresh profile from API:",o)}const t=e.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${e.username}`,i=`${window.location.origin}/#/u/${e.username}`;s.innerHTML=`
    <div class="row g-4 w-100 max-w-4xl mx-auto">
      
      <!-- Profile Card & QR Identity Card -->
      <div class="col-12 col-md-5">
        <div class="glass-card p-4 text-center text-light shadow-lg">
          
          <div class="position-relative d-inline-block mb-3">
            <img src="${t}" alt="${e.display_name}" class="avatar-xl rounded-circle border border-3 border-primary shadow-lg object-fit-cover" />
            <span class="status-indicator status-online position-absolute bottom-0 end-0 p-2"></span>
          </div>

          <h3 class="fw-bold mb-1">${e.display_name}</h3>
          <p class="text-primary font-monospace fs-6 mb-2">@${e.username}</p>
          <p class="text-secondary fs-7 mb-4 px-2">${e.bio||"No bio set."}</p>

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
              <input type="text" id="input-edit-name" class="form-control form-control-custom" value="${e.display_name}" required />
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary fs-7 fw-semibold">Profile Photo URL</label>
              <input type="url" id="input-edit-avatar" class="form-control form-control-custom" value="${e.profile_image_url||""}" placeholder="https://example.com/photo.jpg" />
              <div class="form-text text-secondary fs-8">Provide an image URL (Unsplash, Imgur, Dicebear, etc.). Binary files are not stored in DB.</div>
            </div>

            <div class="mb-4">
              <label class="form-label text-secondary fs-7 fw-semibold">Bio</label>
              <textarea id="input-edit-bio" class="form-control form-control-custom" rows="3" placeholder="Tell your friends a bit about yourself...">${e.bio||""}</textarea>
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
  `;const n=document.getElementById("qr-canvas");n&&V.toCanvas(n,i,{width:160,margin:1,color:{dark:"#0b0f19",light:"#ffffff"}},o=>{o&&console.error("QR Render Error:",o)}),(a=document.getElementById("btn-share-profile"))==null||a.addEventListener("click",async()=>{if(navigator.share)try{await navigator.share({title:`Callio — ${e.display_name}`,text:`Connect with @${e.username} on Callio Real-Time Audio & Video Calling!`,url:i}),E("Profile shared successfully!","success")}catch{console.log("Share cancelled")}else await navigator.clipboard.writeText(i),E("Profile link copied to clipboard!","success")}),(r=document.getElementById("btn-download-qr"))==null||r.addEventListener("click",()=>{if(n){const o=document.createElement("a");o.download=`callio_${e.username}_qr.png`,o.href=n.toDataURL("image/png"),o.click(),E("Downloaded QR Code identity image!","success")}}),(l=document.getElementById("profile-edit-form"))==null||l.addEventListener("submit",async o=>{o.preventDefault();const c=document.getElementById("btn-save-profile");c.disabled=!0;try{const d=document.getElementById("input-edit-name").value.trim(),g=document.getElementById("input-edit-avatar").value.trim(),u=document.getElementById("input-edit-bio").value.trim(),f=await B("/api/profile/update",{method:"POST",body:JSON.stringify({display_name:d,profile_image_url:g,bio:u})});C.user=f,E("Profile updated successfully!","success"),Ue(s)}catch(d){E(d.message||"Failed to update profile","danger"),c.disabled=!1}})}async function Ve(s,e){var t;s.innerHTML=`
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
  `;try{const i=await B(`/api/users/${e}`),n=i.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${i.username}`,a=window.location.href;s.innerHTML=`
      <div class="w-100 max-w-md mx-auto py-4">
        <div class="glass-card p-4 p-sm-5 text-center text-light shadow-lg">
          
          <div class="position-relative d-inline-block mb-3">
            <img src="${n}" alt="${i.display_name}" class="avatar-xl rounded-circle border border-3 border-primary shadow-lg object-fit-cover" />
            <span class="status-indicator ${i.is_online?"status-online":"status-offline"} position-absolute bottom-0 end-0 p-2"></span>
          </div>

          <h3 class="fw-bold mb-1">${i.display_name}</h3>
          <p class="text-primary font-monospace fs-6 mb-2">@${i.username}</p>
          <p class="text-secondary fs-7 mb-4 px-2">${i.bio||"No bio set."}</p>

          <div class="bg-white p-3 rounded-4 d-inline-block mb-3 shadow">
            <canvas id="public-qr-canvas" style="width: 160px; height: 160px;"></canvas>
          </div>

          <div class="d-flex flex-column gap-2 mt-3">
            ${i.friendship_status==="friends"?`
              <div class="badge bg-success-subtle text-success py-2 fs-6 rounded-pill mb-2">
                <i class="bi bi-check-circle-fill"></i> Friends
              </div>
            `:i.friendship_status==="request_sent"?`
              <div class="badge bg-secondary-subtle text-secondary py-2 fs-6 rounded-pill mb-2">
                <i class="bi bi-clock"></i> Friend Request Pending
              </div>
            `:`
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
    `;const r=document.getElementById("public-qr-canvas");r&&V.toCanvas(r,a,{width:160,margin:1}),(t=document.getElementById("btn-public-add-friend"))==null||t.addEventListener("click",async()=>{const l=document.getElementById("btn-public-add-friend");l.disabled=!0;try{await B("/api/friends/request",{method:"POST",body:JSON.stringify({receiver_username:i.username})}),E(`Friend request sent to @${i.username}!`,"success"),Ve(s,e)}catch(o){E(o.message,"danger"),l.disabled=!1}})}catch{s.innerHTML=`
      <div class="glass-card p-5 text-center max-w-md mx-auto my-5">
        <i class="bi bi-exclamation-octagon text-danger display-3 mb-3"></i>
        <h4 class="text-light fw-bold">User Not Found</h4>
        <p class="text-secondary">The profile @${e} does not exist.</p>
        <a href="#/friends" class="btn-3d btn-3d-primary mt-2">Go to Friends</a>
      </div>
    `}}async function He(s,e="all"){var n;s.innerHTML=`
    <div class="w-100 max-w-4xl mx-auto">
      
      <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 class="text-light fw-bold mb-1">Call Logs</h2>
          <p class="text-secondary fs-6 mb-0">Persistent call history and redial contacts</p>
        </div>

        <!-- Filter Tabs -->
        <div class="d-flex gap-1 p-1 bg-dark-subtle rounded-3 border border-dark-subtle">
          <button class="btn btn-sm ${e==="all"?"btn-primary fw-bold":"text-secondary border-0"} rounded-2 px-3 py-2 btn-filter-history" data-filter="all">All</button>
          <button class="btn btn-sm ${e==="missed"?"btn-primary fw-bold":"text-secondary border-0"} rounded-2 px-3 py-2 btn-filter-history" data-filter="missed">Missed</button>
          <button class="btn btn-sm ${e==="incoming"?"btn-primary fw-bold":"text-secondary border-0"} rounded-2 px-3 py-2 btn-filter-history" data-filter="incoming">Incoming</button>
          <button class="btn btn-sm ${e==="outgoing"?"btn-primary fw-bold":"text-secondary border-0"} rounded-2 px-3 py-2 btn-filter-history" data-filter="outgoing">Outgoing</button>
        </div>
      </div>

      <div id="history-logs-container">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
      </div>

    </div>
  `,s.querySelectorAll(".btn-filter-history").forEach(a=>{a.addEventListener("click",()=>{He(s,a.dataset.filter)})});const t=document.getElementById("history-logs-container"),i=(n=C.user)==null?void 0:n.id;try{const a=await B(`/api/calls?filter_type=${e}`);if(!a||a.length===0){t.innerHTML=`
        <div class="glass-card p-5 text-center my-4">
          <i class="bi bi-journal-x text-secondary display-1 mb-3"></i>
          <h4 class="text-light fw-bold">No call history</h4>
          <p class="text-secondary max-w-md mx-auto">Your past audio and video call records will be displayed here.</p>
        </div>
      `;return}t.innerHTML=`
      <div class="d-flex flex-column gap-3">
        ${a.map(r=>{const l=r.caller_id===i,o=l?r.receiver:r.caller,c=r.status==="missed",d=r.call_type==="video",g=c?"bi-telephone-x-fill text-danger":l?"bi-arrow-up-right-circle-fill text-primary":"bi-arrow-down-left-circle-fill text-success",u=new Date(r.created_at).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),f=Math.floor(r.duration/60),p=r.duration%60,y=r.duration>0?`${f>0?`${f}m `:""}${p}s`:c?"Missed":"0s";return`
            <div class="glass-card p-3 d-flex align-items-center justify-content-between">
              
              <div class="d-flex align-items-center gap-3">
                <i class="bi ${g} fs-3"></i>
                <img src="${o.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${o.username}`}" class="avatar-md rounded-circle border border-dark-subtle" />
                <div>
                  <h6 class="text-light fw-bold mb-0">${o.display_name}</h6>
                  <small class="text-secondary">@${o.username} • ${u}</small>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge ${d?"bg-primary-subtle text-primary":"bg-info-subtle text-info"} fs-8">
                      <i class="bi ${d?"bi-camera-video":"bi-telephone"}"></i> ${r.call_type.toUpperCase()}
                    </span>
                    <span class="badge ${c?"bg-danger-subtle text-danger":"bg-secondary-subtle text-secondary"} fs-8">
                      ${y}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <button class="btn-3d btn-3d-success btn-3d-sm btn-redial" data-id="${o.id}" data-username="${o.username}" data-name="${o.display_name}" data-avatar="${o.profile_image_url||""}" data-type="${r.call_type}">
                  <i class="bi ${d?"bi-camera-video-fill":"bi-telephone-fill"}"></i> Call Back
                </button>
              </div>

            </div>
          `}).join("")}
      </div>
    `,t.querySelectorAll(".btn-redial").forEach(r=>{r.addEventListener("click",async()=>{const l=parseInt(r.dataset.id),o=r.dataset.type||"audio",c={id:l,username:r.dataset.username,display_name:r.dataset.name,profile_image_url:r.dataset.avatar};z("calling",o,c),await _.startCall(l,c,o)})})}catch(a){t.innerHTML=`<div class="alert alert-danger">${a.message||"Error loading call history"}</div>`}}async function de(){const s=window.location.hash||"#/friends",e=document.getElementById("main-content"),t=document.getElementById("main-header"),i=document.getElementById("mobile-nav");if(s.startsWith("#/u/")){const n=s.replace("#/u/","").trim();C.token?(t==null||t.classList.remove("display-none"),i==null||i.classList.remove("display-none")):(t==null||t.classList.add("display-none"),i==null||i.classList.add("display-none")),await Ve(e,n);return}if(!C.token){t==null||t.classList.add("display-none"),i==null||i.classList.add("display-none"),Ke(e);return}if(t==null||t.classList.remove("display-none"),i==null||i.classList.remove("display-none"),C.user){const n=document.getElementById("header-user-avatar"),a=document.getElementById("header-user-name");n&&(n.src=C.user.profile_image_url||`https://api.dicebear.com/7.x/bottts/svg?seed=${C.user.username}`),a&&(a.textContent=`@${C.user.username}`)}document.querySelectorAll(".nav-tab-btn, .mobile-nav-item").forEach(n=>{const a=n.dataset.tab;s.startsWith(`#/${a}`)?n.classList.add("active"):n.classList.remove("active")}),s.startsWith("#/search")?Ye(e):s.startsWith("#/profile")?await Ue(e):s.startsWith("#/history")?await He(e):await ue(e)}async function qt(){var s;if(C.token)try{const e=await B("/api/users/me");C.user=e,I.connect()}catch(e){console.warn("Initial session validation failed:",e),C.logout()}window.addEventListener("hashchange",de),(s=document.getElementById("btn-logout"))==null||s.addEventListener("click",()=>{I.disconnect(),C.logout(),E("Logged out successfully","info"),window.location.hash="#/auth",de()}),_.onStateChange=e=>{e==="idle"&&z("idle")},I.on("incoming_call",e=>{console.log("[App] Incoming call event:",e),Je(e.call_id,e.caller,e.call_type)}),I.on("call_outgoing_created",e=>{_.currentCallId=e.call_id}),await de()}document.addEventListener("DOMContentLoaded",qt);
//# sourceMappingURL=index-B7ni9SDs.js.map
