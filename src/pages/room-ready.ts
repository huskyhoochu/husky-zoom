import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { baseStyles, normalizeCSS } from '@styles/elements';
import { router } from '@app';
import { Router } from '@vaadin/router';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import '@components/structures/room-member';
import '@components/pages/room-ready/pw-compare-modal';
import { videoConfig } from '@config/video';
import {
  getDatabase,
  onValue,
  runTransaction,
  TransactionResult,
} from 'firebase/database';
import { ref as dbRef } from '@firebase/database';
import { initRoom } from '@config/room';
import parseErrMsg from '@fetcher/parseErrMsg';
import Fetcher from '@fetcher/index';

@customElement('room-ready')
export class RoomReady extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
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

      .video-section {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .video-section video {
        display: block;
        margin: 0 auto;
      }

      .loading {
        position: absolute;
        inset: 0;
        width: 120px;
        height: 120px;
        margin: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        animation-name: loop;
        animation-duration: 1s;
        animation-fill-mode: both;
        animation-timing-function: var(--tr-linear);
        animation-iteration-count: infinite;
      }

      .loading .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: 120px;
      }

      @keyframes loop {
        0% {
          transform: rotate(0);
        }

        50% {
          transform: rotate(180deg);
        }

        100% {
          transform: rotate(360deg);
        }
      }

      .status {
        color: var(--gray-700);
        font-size: var(--font-sm);
        font-weight: 700;
      }

      .dashboard {
        width: 50%;
        margin: 32px auto;
      }

      .hint {
        color: var(--gray-500);
        font-size: var(--font-xs);
        font-weight: 700;
      }

      .button-group {
        display: grid;
        grid: auto-flow / 50% 50%;
        grid-column-gap: 8px;
        margin: 16px 0;
      }

      .button-group button {
        padding: 8px 0;
      }

      .button-group button[type='submit'] {
        background-color: var(--indigo-500);
        color: white;
      }
    `,
  ];

  @property({ type: Object })
  location = router.location;

  @state()
  private _room: Room = initRoom;

  @state()
  private _user: UserInfo = {
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
  };

  @state()
  private _isLoading = false;

  localVideoRef: Ref<HTMLVideoElement> = createRef();

  connectedCallback(): void {
    super.connectedCallback();
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
    const database = getDatabase();
    const roomRef = dbRef(database, `rooms/${this.location.params.id}`);
    onValue(roomRef, (snapshot) => {
      this._room = snapshot.val() as Room;
    });
    this.addEventListener('open-video', this.openLocalVideo);
    window.addEventListener('beforeunload', this.closeConnection);
  }

  disconnectedCallback(): void {
    window.removeEventListener('beforeunload', this.closeConnection);
    this.changeConnectionStatus('disconnected').finally(() => {
      super.disconnectedCallback();
    });
  }

  async openLocalVideo(): Promise<void> {
    this._isLoading = true;
    await this.changeConnectionStatus('ready');
    this.localVideoRef.value.srcObject =
      await navigator.mediaDevices.getUserMedia(videoConfig);
    this._isLoading = false;
  }

  async changeConnectionStatus(
    status: 'disconnected' | 'ready',
  ): Promise<TransactionResult> {
    const database = getDatabase();
    const roomRef = dbRef(database, `rooms/${this.location.params.id}`);
    return runTransaction(roomRef, (room: Room) => {
      if (room) {
        if (this._user.uid === room.members.host.uid) {
          room.members.host.connection.status = status;
        } else {
          room.members.guest.connection.status = status;
          room.members.guest.uid = this._user.uid;
          room.members.guest.email = this._user.email;
          room.members.guest.photo_url = this._user.photoURL;
          room.members.guest.display_name = this._user.displayName;
        }
      }
      return room;
    });
  }

  private closeConnection = async (e: BeforeUnloadEvent): Promise<void> => {
    e.preventDefault();
    await this.changeConnectionStatus('disconnected');
  };

  private async onEnterRoom(): Promise<void> {
    try {
      const resp = await Fetcher.axios.post('/room/jwt');
      const { okay, token } = resp.data as { okay: boolean; token: string };
      if (okay) {
        Router.go(`/room/start?token=${token}`);
      }
    } catch (e) {
      const message = parseErrMsg(e);
      const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
        detail: {
          intent: 'danger',
          title: '입장 오류',
          message,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      this.dispatchEvent(toastEvent);
    }
  }

  protected render(): TemplateResult {
    return html`
      <main-header></main-header>
      <main>
        <div class="title">
          <h1>입장 준비</h1>
        </div>
        <div class="video-wrapper">
          <div class="video-section">
            ${this._isLoading
    ? html`
                  <div class="loading">
                    <span class="icon material-icons-outlined">
                      autorenew
                    </span>
                  </div>
                `
    : ''}
            <video ${ref(this.localVideoRef)} autoplay playsinline></video>
          </div>
          <div class="info-section">
            <p class="status">현재 참여 중인 인원</p>
            <div class="dashboard">
              <room-member .room="${this._room}"></room-member>
              <p class="hint">
                채팅하기로 한 파트너가 맞는지 확인하셨으면 입장하기를
                눌러주세요.
              </p>
              <div class="button-group">
                <button type="reset" @click="${() => Router.go('/')}">
                  나가기
                </button>
                <button type="submit" @click="${this.onEnterRoom}">
                  입장하기
                </button>
              </div>
            </div>
          </div>
        </div>
        <pw-compare-modal
          roomId="${this.location.params.id}"
        ></pw-compare-modal>
      </main>
      <main-footer></main-footer>
      <toast-stack></toast-stack>
    `;
  }
}
