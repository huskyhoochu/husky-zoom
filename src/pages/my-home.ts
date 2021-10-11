import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
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
  members: number;
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
        float: right;
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
  rooms: Room[] = [];

  createRoomBtnRef: Ref<HTMLButtonElement> = createRef();

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
      } else {
        this._auth = false;
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

  _sendNewRoomInfo(roomId: string): Promise<void> {
    const database = getDatabase();
    return set(dbRef(database, 'rooms/' + roomId), {
      id: roomId,
      created_at: dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
      expires_at: dayjs(new Date())
        .add(3, 'minutes')
        .format('YYYY-MM-DDTHH:mm:ss'),
      members: 0,
    });
  }

  async createRoom(): Promise<void> {
    try {
      const isRoomOK = await this._checkIsNewRoomOK();

      if (isRoomOK) {
        const newRoomId = uuidv4();
        await this._sendNewRoomInfo(newRoomId);
        this.roomId = newRoomId;
        const createRoomBtn = this.createRoomBtnRef.value;
        createRoomBtn.disabled = true;
      }
    } catch (e) {
      alert(e.message);
    }
  }

  // Render the UI as a function of component state
  render(): TemplateResult<1> {
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
    (r: Room) => html` <div class="room">
              <p class="room__badge">${r.id}</p>
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
