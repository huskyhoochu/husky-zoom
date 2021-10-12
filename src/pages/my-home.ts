import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, onValue, ref as dbRef, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import '../components/structures/header';
import '../components/structures/footer';
import '../components/pages/room';
import '../components/pages/skeleton';
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

      .create__link p {
        margin-bottom: 8px;
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
  roomId?: string = undefined;

  @state()
  private _auth = false;

  @state()
  private _isInitial = true;

  @state()
  private _hostConnStateEnabled = false;

  @state()
  private _user: {
    photoURL: string;
    email: string;
    displayName: string;
    uid: string;
  };

  @state()
  rooms: Room[] = [];

  createRoomBtnRef: Ref<HTMLButtonElement> = createRef();

  constructor() {
    super();

    this._user = {
      photoURL: '',
      email: '',
      displayName: '',
      uid: '',
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    const socket = io();
    socket.on('delete-room', (roomId) => {
      alert(`방이 삭제됨, ${roomId}`);
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this._auth = true;
        this._user.uid = user.uid;
        this._user.email = user.email;
        this._user.displayName = user.displayName;
        this._user.photoURL = user.photoURL;
      } else {
        this._auth = false;
        this._user.uid = '';
        this._user.email = '';
        this._user.displayName = '';
        this._user.photoURL = '';
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

  _sendNewRoomInfo(roomId: string): Promise<void> {
    const database = getDatabase();
    return set(dbRef(database, 'rooms/' + roomId), {
      id: roomId,
      created_at: dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
      expires_at: dayjs(new Date())
        .add(3, 'minutes')
        .format('YYYY-MM-DDTHH:mm:ss'),
      members: {
        host: {
          uid: this._user.uid,
          email: this._user.email,
          display_name: this._user.displayName,
          photo_url: this._user.photoURL,
          connection: {
            is_connected: false,
            connected_at: '',
            disconnected_at: '',
          },
        },
        guest: {
          uid: '',
          email: '',
          display_name: '',
          photo_url: '',
          connection: {
            is_connected: false,
            connected_at: '',
            disconnected_at: '',
          },
        },
      },
    });
  }

  async createRoom(): Promise<void> {
    try {
      await this._checkIsNewRoomOK();
      await this._checkAlreadyMyRoom();

      const newRoomId = uuidv4();
      await this._sendNewRoomInfo(newRoomId);
      this.roomId = newRoomId;
      const createRoomBtn = this.createRoomBtnRef.value;
      createRoomBtn.disabled = true;
    } catch (e) {
      alert(e.message);
    }
  }

  renderInitial(): TemplateResult {
    return html`<room-skeleton></room-skeleton>`;
  }

  renderRoom(room: Room): TemplateResult {
    return html`<room-card
      .room=${room}
      ?myRoomEnabled=${this._user.uid === room.members.host.uid}
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
                  @click="${this.createRoom}"
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
                </div>
              `
    : ''}
        </div>

        <div class="room-wrapper">
          ${this._isInitial
    ? Array.from({ length: 3 }).map(() => this.renderInitial())
    : this.rooms.map((r: Room) => this.renderRoom(r))}
        </div>
      </main>
      <main-footer></main-footer>
    `;
  }
}
