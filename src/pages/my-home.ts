import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, onValue, ref as dbRef } from 'firebase/database';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';

import '../components/structures/header';
import '../components/structures/footer';
import '../components/pages/room';
import '../components/pages/skeleton';
import '../components/pages/pw-modal';
import { baseStyles, normalizeCSS } from '../styles/elements';

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

  closeModal(): void {
    this.isModalOpen = false;
  }

  sendRoomId(e: CustomEvent): void {
    this.roomId = e.detail;
  }

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    this.addEventListener('modal-closed', this.closeModal);
    this.addEventListener('send-room-id', this.sendRoomId);
    const socket = io();
    socket.on('delete-room', (roomId) => {
      alert(`방이 삭제됨, ${roomId}`);
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
      this.rooms = Object.values(snapshot.val() || {}).sort(
        (a: Room, b: Room) =>
          dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      ) as Room[];
      this._isInitial = false;
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('modal-closed', this.closeModal);
    this.removeEventListener('send-room-id', this.sendRoomId);
  }

  _checkIsNewRoomOK(): Promise<boolean> {
    const database = getDatabase();
    const roomsRef = dbRef(database, 'rooms');
    return new Promise<boolean>((resolve, reject) => {
      onValue(roomsRef, (snapshot) => {
        const rooms = snapshot.val() || {};
        if (Object.keys(rooms).length > 11) {
          reject(
            new Error('방 생성 제한 갯수가 가득 찼습니다. 다음에 만들어주세요'),
          );
        } else {
          resolve(true);
        }
      });
    });
  }

  _checkAlreadyMyRoom(): Promise<boolean> {
    const database = getDatabase();
    const roomsRef = dbRef(database, 'rooms');
    return new Promise<boolean>((resolve, reject) => {
      onValue(roomsRef, (snapshot) => {
        const rooms = Object.values(snapshot.val() || {}) as Room[];
        const myRoom = rooms.find(
          (room) => this._user.uid === room.members.host.uid,
        );
        if (myRoom) {
          reject(new Error('이미 방을 개설하셨습니다.'));
        } else {
          resolve(true);
        }
      });
    });
  }

  async readyRoom(): Promise<void> {
    try {
      await this._checkIsNewRoomOK();
      await this._checkAlreadyMyRoom();
      this.isModalOpen = !this.isModalOpen;
    } catch (e) {
      alert(e.message);
    }
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ): void {
    console.log(name, _old, value);
    super.attributeChangedCallback(name, _old, value);
  }

  // const createRoomBtn = this.createRoomBtnRef.value;
  // createRoomBtn.disabled = true;

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
          <h1>환영합니다!</h1>
          <p>채팅방을 만들어 주세요.</p>
          <p>현재 방 갯수: ${this.rooms.length} / 12</p>
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
                  <span>방 만들기</span>
                </button>
              `
    : html`
                <div class="create__alert">
                  <span class="icon material-icons-outlined">
                    error_outline
                  </span>
                  <p>대화방을 개설하려면 로그인해주세요.</p>
                </div>
              `}
          ${this.roomId
    ? html`
                <div class="create__link">
                  <p>방 링크 생성!</p>
                  <a href="/room/ready/${ifDefined(this.roomId)}"
                    >${window.location.origin + '/room/ready/' + this.roomId}</a
                  >
                  <p class="description">
                    위의 링크를 누르거나 목록에 새로 만들어진 방 버튼을
                    누르세요.
                  </p>
                </div>
              `
    : ''}
        </div>

        <div class="room-wrapper">
          ${this._isInitial
    ? Array.from({ length: 3 }).map(() => this.renderInitial())
    : this.rooms.map((r: Room) => this.renderRoom(r))}
        </div>
        <pw-modal ?isOpen=${this.isModalOpen}></pw-modal>
      </main>
      <main-footer></main-footer>
    `;
  }
}
