import { html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Router } from '@vaadin/router';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import { baseStyles, normalizeCSS } from '@styles/elements';

@customElement('sign-in')
export class SignIn extends LitElement {
  static styles = [normalizeCSS, baseStyles];

  private _callPopup(): void {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then(() => {
        Router.go('/');
      })
      .catch((error) => {
        const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
          detail: {
            intent: 'danger',
            title: '로그인 오류',
            message: error.message,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        this.dispatchEvent(toastEvent);
      });
  }

  protected render(): TemplateResult<1> {
    return html`
      <main-header></main-header>
      <main>
        <button @click="${this._callPopup}">로그인</button>
      </main>
      <main-footer></main-footer>
      <toast-stack></toast-stack>
    `;
  }
}
