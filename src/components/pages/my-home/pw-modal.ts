import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, formStyles, normalizeCSS } from '@styles/elements';
import Fetcher from '@fetcher/index';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import '@components/structures/modal';
import parseErrMsg from '@fetcher/parseErrMsg';

@customElement('pw-modal')
export class PwModal extends LitElement {
  static styles = [normalizeCSS, baseStyles, formStyles, css``];

  @state()
  private _user = {
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
  };

  @state()
  private _isLoading = false;

  @property({ type: Boolean })
  public isOpen = false;

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this._user.uid = user.uid;
        this._user.email = user.email;
        this._user.displayName = user.displayName;
        this._user.photoURL = user.photoURL;
      } else {
        this._user.uid = '';
        this._user.email = '';
        this._user.displayName = '';
        this._user.photoURL = '';
      }
    });
  }

  private async _createRoom(e: SubmitEvent): Promise<void> {
    this._isLoading = true;
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const body = {
      password: formData.get('password'),
      uid: this._user.uid,
      email: this._user.email,
      display_name: this._user.displayName,
      photo_url: this._user.photoURL,
    };

    try {
      const resp = await Fetcher.axios.post('/room', body);
      const { okay, room_id } = resp.data as { okay: boolean; room_id: string };
      if (okay) {
        const sendRoomEvent = new CustomEvent('send-room-id', {
          detail: room_id,
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        this.dispatchEvent(sendRoomEvent);
        const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
          detail: {
            intent: 'success',
            title: '방 링크 생성',
            message: `${room_id} 방이 생성되었습니다`,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        this.dispatchEvent(toastEvent);
        this.isOpen = false;
      }
    } catch (e) {
      const message = parseErrMsg(e);
      const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
        detail: {
          intent: 'danger',
          title: '방 생성 오류',
          message,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      this.dispatchEvent(toastEvent);
      this.isOpen = false;
    } finally {
      this._isLoading = false;
    }
  }

  private _toggleModal(): void {
    this.isOpen = !this.isOpen;
    const event = new CustomEvent('modal-closed', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
  }

  protected render(): TemplateResult {
    const loadingClasses = {
      loading: this._isLoading,
    };

    return html`
      <main-modal title="비밀번호 생성" ?isOpen=${this.isOpen}>
        <form class="form" @submit="${this._createRoom}">
          <label for="password">
            <p>8자 이상 입력하세요</p>
            <input id="password" type="password" name="password" required />
          </label>
          <div class="form__button-group">
            <button @click="${this._toggleModal}" type="reset">취소</button>
            <button
              type="submit"
              class="${classMap(loadingClasses)}"
              ?disabled=${this._isLoading}
            >
              ${this._isLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        </form>
      </main-modal>
    `;
  }
}
