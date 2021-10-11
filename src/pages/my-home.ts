import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { v4 as uuidv4 } from 'uuid';

import '../components/structures/header';
import '../components/structures/footer';
import { baseStyles, normalizeCSS } from '../styles/elements';

@customElement('my-home')
export class MyHome extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = [normalizeCSS, baseStyles];

  @property()
  roomId?: string = undefined;

  createRoomBtnRef: Ref<HTMLButtonElement> = createRef();

  /* TODO: 방 만들기 절차
   *  - 방 만들기를 누르면 먼저 방 갯수가 제한을 넘기지 않는지 서버에 확인한다
   *  - 괜찮으면 랜덤 uuid를 생성한다
   *  - 서버에 새로 발급된 방 정보를 보낸다
   *  - 유저에게 링크를 제공한다
   * */
  _checkIsNewRoomOK(): Promise<boolean> {
    return Promise.resolve(true);
  }

  _sendNewRoomInfo(roomId: string): Promise<void> {
    return Promise.resolve();
  }

  async createRoom(): Promise<void> {
    const isRoomOK = await this._checkIsNewRoomOK();

    if (isRoomOK) {
      const newRoomId = uuidv4();
      await this._sendNewRoomInfo(newRoomId);
      this.roomId = newRoomId;
      const createRoomBtn = this.createRoomBtnRef.value;
      createRoomBtn.disabled = true;
    } else {
      alert('방 생성 제한 갯수가 가득 찼습니다. 다음에 만들어주세요');
    }
  }

  // Render the UI as a function of component state
  render(): TemplateResult<1> {
    return html`
      <main-header></main-header>
      <main>
        <h1>환영합니다!</h1>
        <p>채팅방을 만들어 주세요.</p>
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
