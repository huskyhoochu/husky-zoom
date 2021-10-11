import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getDatabase, onValue, ref as dbRef, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import '../components/structures/header';
import '../components/structures/footer';
import { baseStyles, normalizeCSS } from '../styles/elements';

@customElement('my-home')
export class MyHome extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = [normalizeCSS, baseStyles];

  @property()
  roomId?: string = undefined;

  @property()
  roomLength = 0;

  createRoomBtnRef: Ref<HTMLButtonElement> = createRef();

  connectedCallback(): void {
    super.connectedCallback();

    const database = getDatabase();
    const roomsRef = dbRef(database, 'rooms');
    onValue(roomsRef, (snapshot) => {
      const rooms = snapshot.val();
      if (rooms) {
        this.roomLength = Object.keys(rooms).length;
      }
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
        const rooms = snapshot.val();
        if (rooms && Object.keys(rooms).length > 12) {
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
        .add(5, 'minutes')
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
        <p>현재 방 갯수: ${this.roomLength}</p>
        <button ${ref(this.createRoomBtnRef)} @click="${this.createRoom}">
          방 만들기
        </button>
        ${this.roomId
    ? html`
              <div>
                <p>방 링크 생성!</p>
                <a href="/room/${ifDefined(this.roomId)}"
                  >${window.location.origin + '/room/' + this.roomId}</a
                >
              </div>
            `
    : ''}
      </main>
      <main-footer></main-footer>
    `;
  }
}
