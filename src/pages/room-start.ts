import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { io, Socket } from 'socket.io-client';
import { baseStyles, normalizeCSS, videoStyles } from '@styles/elements';
import { router } from '@app';
import { Router } from '@vaadin/router';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import parseErrMsg from '@fetcher/parseErrMsg';
import Fetcher from '@fetcher/index';
import {
  get,
  getDatabase,
  onValue,
  runTransaction,
  TransactionResult,
} from 'firebase/database';
import { ref as dbRef } from '@firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initRoom } from '@config/room';
import { videoConfig } from '@config/video';
import dayjs from 'dayjs';
import { iceServerConfig } from '@config/iceServers';

@customElement('room-start')
export class RoomStart extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    videoStyles,
    css`
      .title {
        color: var(--gray-700);
      }

      .video-wrapper {
        margin: 64px 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(720px, 1fr));
        grid-column-gap: 8px;
        grid-template-rows: 410px;
      }
    `,
  ];

  @state()
  private _user: UserInfo = {
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
  };

  @state()
  private _isLocalLoading = false;

  @state()
  private _isRemoteLoading = false;

  @state()
  private _localVideoRef: Ref<HTMLVideoElement> = createRef();

  @state()
  private _remoteVideoRef: Ref<HTMLVideoElement> = createRef();

  @state()
  private _peerConn: RTCPeerConnection = undefined;

  @property({ type: Object })
  public location = router.location;

  @property({ type: Object })
  public room: Room = initRoom;

  public socket: Socket = io();

  connectedCallback(): void {
    super.connectedCallback();
    this.sendToken().catch((e) => {
      let message = parseErrMsg(e);
      if (message === 'jwt expired') {
        message = '입장 토큰이 만료되었습니다. 다시 입장해주세요';
      }
      if (message === 'invalid token') {
        message = '토큰 형식이 잘못되었습니다. 다시 입장해주세요';
      }
      Router.go(`room/ready/${this.location.params.id}?message=${message}`);
    });
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this._user.uid = user.uid;
        this._user.email = user.email;
        this._user.photoURL = user.photoURL;
        this._user.displayName = user.displayName;
      } else {
        Router.go('/auth/login');
      }
    });
    this.socket.on('connect', async () => {
      await this.changeConnectionStatus('connecting');
      await this.openLocalVideo();
      this.initConn();
      this.socket.emit('join-room', this.location.params.id);
    });

    this.socket.on('user-connected', async () => {
      const database = getDatabase();
      const roomRef = dbRef(database, `rooms/${this.location.params.id}`);
      const snapshot = await get(roomRef);
      const room = snapshot.val() as Room;
      let iceRestart = false;
      if (
        this._user.uid === room.members.host.uid &&
        room.members.host.connection.disconnected_at
      ) {
        iceRestart = true;
      }
      if (
        this._user.uid === room.members.guest.uid &&
        room.members.guest.connection.disconnected_at
      ) {
        iceRestart = true;
      }
      const offer = await this._peerConn.createOffer({ iceRestart });
      await this._peerConn.setLocalDescription(offer);
      this.socket.emit('offer', offer, this.location.params.id);
    });

    this.socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      await this._peerConn.setRemoteDescription(offer);
      const answer = await this._peerConn.createAnswer();
      await this._peerConn.setLocalDescription(answer);
      this.socket.emit('answer', answer, this.location.params.id);
    });

    this.socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      await this._peerConn.setRemoteDescription(answer);
    });

    this.socket.on('ice', async (ice: RTCIceCandidate) => {
      await this._peerConn.addIceCandidate(ice);
    });

    const database = getDatabase();
    const roomRef = dbRef(database, `rooms/${this.location.params.id}`);
    onValue(roomRef, (snapshot) => {
      this.room = snapshot.val() as Room;
    });
    window.addEventListener('beforeunload', this.closeConnection);
  }

  disconnectedCallback(): void {
    (this._localVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => track.stop());
    (this._remoteVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => track.stop());
    window.removeEventListener('beforeunload', this.closeConnection);
    this.changeConnectionStatus('disconnected').finally(() => {
      super.disconnectedCallback();
    });
  }

  async changeConnectionStatus(
    status: 'disconnected' | 'connecting',
  ): Promise<TransactionResult> {
    const database = getDatabase();
    const roomRef = dbRef(database, `rooms/${this.location.params.id}`);
    return runTransaction(roomRef, (room: Room) => {
      if (room) {
        if (this._user.uid === room.members.host.uid) {
          room.members.host.connection.status = status;
          if (status === 'connecting') {
            room.members.host.connection.connected_at = dayjs(
              new Date(),
            ).format('YYYY-MM-DDTHH:mm:ss');
          }
          if (status === 'disconnected') {
            room.members.host.connection.disconnected_at = dayjs(
              new Date(),
            ).format('YYYY-MM-DDTHH:mm:ss');
          }
        } else {
          room.members.guest.connection.status = status;
          if (status === 'connecting') {
            room.members.guest.connection.connected_at = dayjs(
              new Date(),
            ).format('YYYY-MM-DDTHH:mm:ss');
          }
          if (status === 'disconnected') {
            room.members.guest.connection.disconnected_at = dayjs(
              new Date(),
            ).format('YYYY-MM-DDTHH:mm:ss');
          }
        }
      }
      return room;
    });
  }

  private async openLocalVideo(): Promise<void> {
    this._isLocalLoading = true;
    this._localVideoRef.value.srcObject =
      await window.navigator.mediaDevices.getUserMedia(videoConfig);
    this._isLocalLoading = false;
  }

  private initConn() {
    this._peerConn = new RTCPeerConnection(iceServerConfig);
    this._peerConn.addEventListener('icecandidate', this.handleIce);
    this._peerConn.addEventListener('addstream', this.handleAddStream);
    (this._localVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => {
        this._peerConn.addTrack(
          track,
          this._localVideoRef.value.srcObject as MediaStream,
        );
      });
  }

  private closeConnection = async (e: BeforeUnloadEvent): Promise<void> => {
    e.preventDefault();
    (this._localVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => track.stop());
    (this._remoteVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => track.stop());
    await this.changeConnectionStatus('disconnected');
  };

  private handleIce = (e: RTCPeerConnectionIceEvent) => {
    this.socket.emit('ice', e.candidate, this.location.params.id);
  };

  private handleAddStream = (e: any) => {
    this._remoteVideoRef.value.srcObject = e.stream;
  };

  async sendToken(): Promise<void> {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const body = {
      token,
    };
    await Fetcher.axios.post('/room/verify', body);
  }

  protected render(): TemplateResult {
    return html`
      <main-header></main-header>
      <main>
        <div class="title">
          <h1>대화 중</h1>
        </div>
        <div class="video-wrapper">
          <div class="video-section">
            ${this._isLocalLoading
    ? html`
                  <div class="loading">
                    <span class="icon material-icons-outlined">
                      autorenew
                    </span>
                  </div>
                `
    : ''}
            <video ${ref(this._localVideoRef)} autoplay playsinline></video>
          </div>
          <div class="video-section">
            ${this._isRemoteLoading
    ? html`
                  <div class="loading">
                    <span class="icon material-icons-outlined">
                      autorenew
                    </span>
                  </div>
                `
    : ''}
            <video ${ref(this._remoteVideoRef)} autoplay playsinline></video>
          </div>
        </div>
        <room-member .room="${this.room}"></room-member>
      </main>
      <main-footer></main-footer>
      <toast-stack></toast-stack>
    `;
  }
}
