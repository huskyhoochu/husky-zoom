import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, onValue, ref as dbRef, get } from 'firebase/database';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import '@components/pages/my-home/room';
import '@components/pages/my-home/skeleton';
import '@components/pages/my-home/pw-modal';
import { baseStyles, normalizeCSS } from '@styles/elements';

@customElement('my-home')
export class MyHome extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .greeting {
        color: var(--gray-700);
        text-align: right;
      }

      .greeting p {
        margin: 8px 0;
        font-size: var(--font-sm);
      }

      .create {
        height: 140px;
      }

      .create__alert {
        background-color: var(--yellow-50);
        border: 1px solid var(--yellow-400);
        color: var(--yellow-400);
        font-weight: 700;
        padding: 12px;
        border-radius: 8px;
        display: inline-block;
      }

      .create__link {
        margin: 16px 0;
        background-color: var(--green-50);
        border: 1px solid var(--green-400);
        color: var(--green-400);
        font-weight: 700;
        padding: 12px;
        border-radius: 8px;
        display: inline-block;
      }

      .create__link a {
        display: block;
        margin: 8px 0;
      }

      .description {
        font-size: var(--font-xs);
      }

      .create__btn {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 9999px;
        width: 120px;
        height: 60px;
        padding: 0 16px;
        font-size: var(--font-sm);
      }

      .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: var(--font-2xl);
      }

      .room-wrapper {
        margin: 36px 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-gap: 16px;
      }
    `,
  ];

  @state()
  private _auth = false;

  @state()
  private _isInitial = true;

  @state()
  private _hostConnStateEnabled = false;

  @state()
  private _user: {
    uid: string;
  };

  @state()
  rooms: Room[] = [];

  @property({ type: Boolean })
  public isModalOpen = false;

  @property({ type: String })
  public roomId = '';

  createRoomBtnRef: Ref<HTMLButtonElement> = createRef();

  constructor() {
    super();

    this._user = {
      uid: '',
    };
  }

  private _closeModal(): void {
    this.isModalOpen = false;
  }

  private _sendRoomId(e: CustomEvent): void {
    this.roomId = e.detail;
    const createRoomBtn = this.createRoomBtnRef.value;
    createRoomBtn.disabled = true;
  }

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    this.addEventListener('modal-closed', this._closeModal);
    this.addEventListener('send-room-id', this._sendRoomId);
    const socket = io();
    socket.on('delete-room', (roomId) => {
      const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
        detail: {
          intent: 'success',
          title: '??? ?????? ??????',
          message: `${roomId} ?????? ?????????????????????`,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      this.dispatchEvent(toastEvent);
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this._auth = true;
        this._user.uid = user.uid;
      } else {
        this._auth = false;
        this._user.uid = '';
      }
    });

    const database = getDatabase();
    const roomsRef = dbRef(database, 'rooms');
    onValue(roomsRef, (snapshot) => {
      let snapshotRooms = Object.values(snapshot.val() || {}).sort(
        (a: Room, b: Room) =>
          dayjs(b.created_at).unix() - dayjs(a.created_at).unix(),
      ) as Room[];

      const myRoom = snapshotRooms.find(
        (room) => room.members.host.uid === this._user.uid,
      );

      if (myRoom) {
        snapshotRooms = snapshotRooms.filter(
          (room) => room.members.host.uid !== this._user.uid,
        );
        snapshotRooms = [myRoom, ...snapshotRooms];
      }
      this.rooms = snapshotRooms;
      this._isInitial = false;
    });
  }

  async _checkIsNewRoomOK(): Promise<boolean> {
    const database = getDatabase();
    const roomsRef = dbRef(database, 'rooms');
    const snapshot = await get(roomsRef);
    const rooms = Object.values(snapshot.val() || {}) as Room[];
    if (rooms.length > 11) {
      throw new Error('??? ?????? ?????? ????????? ?????? ????????????. ????????? ??????????????????');
    } else {
      return true;
    }
  }

  async _checkAlreadyMyRoom(): Promise<boolean> {
    const database = getDatabase();
    const roomsRef = dbRef(database, 'rooms');
    const snapshot = await get(roomsRef);
    const rooms = Object.values(snapshot.val() || {}) as Room[];
    const myRoom = rooms.find(
      (room) => this._user.uid === room.members.host.uid,
    );
    if (myRoom) {
      throw new Error('?????? ?????? ?????????????????????.');
    } else {
      return true;
    }
  }

  async readyRoom(): Promise<void> {
    try {
      await this._checkIsNewRoomOK();
      await this._checkAlreadyMyRoom();
      this.isModalOpen = !this.isModalOpen;
    } catch (e) {
      const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
        detail: {
          intent: 'danger',
          title: '??? ?????? ??????',
          message: e.message,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      this.dispatchEvent(toastEvent);
    }
  }

  renderInitial(): TemplateResult {
    return html` <room-skeleton></room-skeleton>`;
  }

  renderRoom(room: Room): TemplateResult {
    return html` <room-card
      .room="${room}"
      ?myRoomEnabled="${this._user.uid === room.members.host.uid}"
    ></room-card>`;
  }

  // Render the UI as a function of component state
  render(): TemplateResult<1> {
    return html`
      <main-header></main-header>
      <main>
        <div class="greeting">
          <h1>???????????????!</h1>
          <p>???????????? ????????? ?????????.</p>
          <p>?????? ??? ??????: ${this.rooms.length} / 12</p>
        </div>

        <div class="create">
          ${this._auth
    ? html`
                <button
                  class="create__btn"
                  ${ref(this.createRoomBtnRef)}
                  @click="${this.readyRoom}"
                >
                  <span class="icon material-icons-outlined"> add_task </span>
                  <span>??? ?????????</span>
                </button>
              `
    : html`
                <div class="create__alert">
                  <span class="icon material-icons-outlined">
                    error_outline
                  </span>
                  <p>???????????? ??????????????? ?????????????????????.</p>
                </div>
              `}
          ${this.roomId
    ? html`
                <div class="create__link">
                  <p>??? ?????? ??????!</p>
                  <a href="/room/ready/${ifDefined(this.roomId)}"
                    >${window.location.origin + '/room/ready/' + this.roomId}</a
                  >
                  <p class="description">
                    ?????? ????????? ???????????? ????????? ?????? ???????????? ??? ?????????
                    ????????????.
                  </p>
                </div>
              `
    : ''}
        </div>

        <div class="room-wrapper">
          ${this._isInitial
    ? Array.from({ length: 3 }).map(() => this.renderInitial())
    : repeat(
      this.rooms,
      (room) => room.id,
      (room) => this.renderRoom(room),
    )}
        </div>
        <pw-modal ?isOpen=${this.isModalOpen}></pw-modal>
      </main>
      <main-footer></main-footer>
      <toast-stack></toast-stack>
    `;
  }
}
