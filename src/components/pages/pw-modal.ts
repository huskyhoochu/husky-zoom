import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, normalizeCSS } from '../../styles/elements';
import Fetcher from '../../fetcher';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@customElement('pw-modal')
export class PwModal extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .modal__background {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(17, 24, 39, 0.5);
        width: 100vw;
        height: 100vh;
        align-items: center;
        justify-content: center;
        display: none;
      }

      .modal__body {
        background-color: white;
        width: 300px;
        height: 200px;
        border-radius: 8px;
        padding: 16px;
        box-shadow: var(--shadow-lg);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: var(--font-2xl);
      }

      .close__btn {
        background-color: transparent;
        outline: none;
      }

      .close__btn:hover {
        outline: none;
      }

      .active {
        display: flex;
      }

      .form {
        display: block;
        margin: 16px 0;
      }

      label p {
        margin-bottom: 4px;
        font-size: var(--font-xs);
        font-weight: 700;
        color: var(--gray-400);
      }

      .form input {
        width: 100%;
        padding: 4px;
        font-size: var(--font-lg);
      }

      .form__button-group {
        margin-top: 24px;
        display: grid;
        grid: auto-flow / 130px 130px;
        grid-column-gap: 8px;
      }

      .form__button-group button {
        padding: 8px 0;
      }

      .form__button-group button[type='submit'] {
        background-color: var(--indigo-500);
        color: white;
      }

      .form__button-group button[type='submit'].loading {
        opacity: 0.5;
      }
    `,
  ];

  @state()
  private _user = {
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
  };

  @state()
  private _isLoading = false;

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

  @property({ type: Boolean })
  public isOpen = false;

  public async _createRoom(e: SubmitEvent): Promise<void> {
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
        const event = new CustomEvent('send-room-id', {
          detail: room_id,
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        this.dispatchEvent(event);
        this.isOpen = false;
      }
    } catch (e) {
      console.log(e.message);
    } finally {
      this._isLoading = false;
    }
  }

  _toggleModal(): void {
    this.isOpen = !this.isOpen;
    const event = new CustomEvent('modal-closed', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
  }

  protected render(): TemplateResult {
    const openClasses = {
      active: this.isOpen,
    };

    const loadingClasses = {
      loading: this._isLoading,
    };

    return html`
      <div class="modal__background ${classMap(openClasses)}">
        <div class="modal__body">
          <div class="header">
            <h3>비밀번호 작성</h3>
            <button
              class="close__btn"
              type="button"
              @click="${this._toggleModal}"
            >
              <span class="icon material-icons-outlined"> close </span>
            </button>
          </div>
          <form class="form" @submit="${this._createRoom}">
            <label for="password">
              <p>8자 이상 입력하세요</p>
              <input id="password" type="password" name="password" />
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
        </div>
      </div>
    `;
  }
}
