import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { baseStyles, normalizeCSS } from '../../styles/elements';
import { Router } from '@vaadin/router';

@customElement('main-header')
export class MainHeader extends LitElement {
  @state()
  private _auth: boolean;

  @state()
  private _user: {
    photoURL: string;
    email: string;
    displayName: string;
  };

  @state()
  private _dropdownEnabled: boolean;

  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      header {
        background-color: var(--indigo-900);
        padding: 12px 20px;
        font-size: var(--font-sm);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: var(--shadow-md);
        height: 40px;
      }

      header a {
        color: var(--gray-50);
      }

      .logout {
        cursor: pointer;
      }

      .wrapper {
        position: relative;
      }

      .profile {
        border-radius: 9999px;
        width: 24px;
        height: 24px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .profile__img {
        width: 24px;
        height: 24px;
        border-radius: 9999px;
      }

      .profile__dropdown:before {
        content: '';
        position: absolute;
        top: -9px;
        right: 12px;
        width: 16px;
        height: 16px;
        border: 1px solid var(--gray-700);
        border-top-left-radius: var(--border-radius-default);
        transform: rotate(45deg);
        background-color: white;
        border-bottom-color: white;
        border-right-color: white;
      }

      .profile__dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        display: none;
        width: 160px;
        border: 1px solid var(--gray-700);
        border-radius: var(--border-radius-default);
        font-weight: 400;
        padding: 8px;
        background-color: white;
        font-size: var(--font-xs);
        text-align: left;
      }

      .profile__dropdown p {
        margin: 4px 0;
      }

      .profile__logout {
        padding: 4px;
        margin: 4px 0;
        width: 100%;
      }

      .active {
        display: block;
      }
    `,
  ];

  constructor() {
    super();
    this._user = {
      email: '',
      photoURL: '',
      displayName: '',
    };
    this._auth = false;
    this._dropdownEnabled = false;
  }

  connectedCallback(): void {
    super.connectedCallback();

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this._user.email = user.email;
        this._user.photoURL = user.photoURL;
        this._user.displayName = user.displayName;
        this._auth = true;
      } else {
        this._user.email = '';
        this._user.photoURL = '';
        this._user.displayName = '';
        this._auth = false;
      }
    });
  }

  _signOut(): void {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        Router.go('/');
      })
      .catch((error) => {
        const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
          detail: {
            intent: 'danger',
            title: '로그아웃 오류',
            message: error.message,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        this.dispatchEvent(toastEvent);
      });
  }

  _toggleDropdown(): void {
    this._dropdownEnabled = !this._dropdownEnabled;
  }

  protected render(): TemplateResult<1> {
    const classes = {
      active: this._dropdownEnabled,
    };
    return html`
      <header>
        <div>
          <a href="/">Home</a>
        </div>
        ${this._auth
    ? html`
              <div class="wrapper">
                <button class="profile" @click=${this._toggleDropdown}>
                  <img
                    class="profile__img"
                    src=${this._user.photoURL}
                    alt=${this._user.displayName}
                  />
                </button>
                <div class="profile__dropdown ${classMap(classes)}">
                  <p>${this._user.email}</p>
                  <p>${this._user.displayName}</p>
                  <button class="profile__logout" @click=${this._signOut}>
                    로그아웃
                  </button>
                </div>
              </div>
            `
    : html`
              <div>
                <a href="/auth/login">로그인</a>
              </div>
            `}
      </header>
    `;
  }
}
