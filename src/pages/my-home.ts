import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, onValue, ref as dbRef, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';

import '../components/structures/header';
import '../components/structures/footer';
import { baseStyles, normalizeCSS } from '../styles/elements';

interface Room {
  id: string;
  created_at: string;
  expires_at: string;
  members: {
    host: {
      uid: string;
      email: string;
      display_name: string;
      photo_url: string;
      connection: {
        is_connected: boolean;
        connected_at: string;
        disconnected_at: string;
      };
    };
    guest: {
      uid: string;
      email: string;
      display_name: string;
      photo_url: string;
      connection: {
        is_connected: boolean;
        connected_at: string;
        disconnected_at: string;
      };
    };
  };
}

@customElement('my-home')
export class MyHome extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .room-wrapper {
        margin: 36px 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-gap: 16px;
      }

      .room {
        background-color: var(--indigo-200);
        border-radius: var(--border-radius-lg);
        padding: 12px 16px;
        height: 200px;
        cursor: pointer;
        color: var(--gray-700);
        font-size: var(--font-sm);
        position: relative;
        transition: box-shadow 0.3s var(--tr-in-out);
      }

      .room:hover {
        box-shadow: var(--shadow-lg);
      }

      .room__badge {
        font-weight: 700;
        background-color: var(--indigo-300);
        padding: 3px 6px;
        border-radius: var(--border-radius-default);
        width: 270px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: width 0.3s var(--tr-in-out);
      }

      .room__badge:hover {
        width: 100%;
      }

      .room__member {
        margin: 16px 0;
        display: flex;
        align-items: center;
      }

      .host {
        width: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .host__img {
        width: 70px;
        height: 70px;
        border-radius: 9999px;
      }

      .conn {
        margin: 8px 0;
        font-size: var(--font-xs);
        display: flex;
        align-items: center;
      }

      .conn__status {
        display: inline-block;
        width: var(--font-xs);
        height: var(--font-xs);
        border-radius: 9999px;
        background-color: var(--gray-400);
        margin-right: 4px;
      }

      .conn__active {
        background-color: var(--green-400);
      }

      .room__time {
        position: absolute;
        bottom: 0;
        left: 0;
        padding: 12px 16px;
        font-size: var(--font-xs);
      }
    `,
  ];

  @state()
  roomId?: string = undefined;

  @state()
  private _auth = false;

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
    });
  }

  /* TODO: 방 만들기 절차
   *  - 방 만들기를 누르면 먼저 방 갯수가 제한을 넘기지 않는지 서버에 확인한다
   *  - 괜찮으면 랜덤 uuid를 생성한다
   *  - 서버에 새로 발급된 방 정보를 보낸다
   *  - 유저에게 링크를 제공한다
   * */
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

  // Render the UI as a function of component state
  render(): TemplateResult<1> {
    const hostClasses = {
      conn__active: this._hostConnStateEnabled,
      hidden: false,
    };

    return html`
      <main-header></main-header>
      <main>
        <h1>환영합니다!</h1>
        <p>채팅방을 만들어 주세요.</p>
        <p>현재 방 갯수: ${this.rooms.length} / 12</p>
        ${this._auth
    ? html`
              <button ${ref(this.createRoomBtnRef)} @click="${this.createRoom}">
                방 만들기
              </button>
            `
    : html` <p>로그인하셔서 대화를 즐겨보세요.</p> `}
        ${this.roomId
    ? html`
              <div>
                <p>방 링크 생성!</p>
                <a href="/room/ready/${ifDefined(this.roomId)}"
                  >${window.location.origin + '/room/ready/' + this.roomId}</a
                >
              </div>
            `
    : ''}
        <div class="room-wrapper">
          ${this.rooms.map(
    (r: Room) =>
      html` <div class="room">
                <p class="room__badge">${r.id}</p>
                <div class="room__member">
                  <div class="host">
                    <img
                      class="host__img"
                      src=${r.members.host.photo_url}
                      alt=${r.members.host.display_name}
                    />
                    <div class="conn">
                      <span
                        class="conn__status ${classMap(hostClasses)}"
                      ></span>
                      <span
                        >${r.members.host.connection.is_connected
    ? '접속 중'
    : '미접속'}</span
                      >
                    </div>
                  </div>
                </div>

                <div class="room__time">
                  <p>
                    종료시각: ${dayjs(r.expires_at).format('YYYY.MM.YY HH.mm')}
                  </p>
                </div>
              </div>`,
  )}
        </div>
      </main>
      <main-footer></main-footer>
    `;
  }
}
