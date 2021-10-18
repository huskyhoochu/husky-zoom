import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { baseStyles, normalizeCSS } from '@styles/elements';
import { router } from '@app';
import { Router } from '@vaadin/router';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import '@components/structures/room-member';
import '@components/pages/room-ready/video-section';
import '@components/pages/room-ready/pw-compare-modal';
import { getDatabase, onValue } from 'firebase/database';
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

  connectedCallback(): void {
    super.connectedCallback();
    const database = getDatabase();
    const roomRef = dbRef(database, `rooms/${this.location.params.id}`);
    onValue(roomRef, (snapshot) => {
      this._room = snapshot.val() as Room;
    });
  }

  protected firstUpdated(): void {
    this.checkErrorParams();
  }

  checkErrorParams(): void {
    const searchParams = new URLSearchParams(window.location.search);
    const message = searchParams.get('message');
    if (message) {
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

  private async onEnterRoom(): Promise<void> {
    try {
      const resp = await Fetcher.axios.post('/room/jwt');
      const { okay, token } = resp.data as { okay: boolean; token: string };
      if (okay) {
        Router.go(`/room/start/${this.location.params.id}?token=${token}`);
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
          <video-section roomId="${this.location.params.id}"></video-section>
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
