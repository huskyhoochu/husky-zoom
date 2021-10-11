import { html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { Router } from '@vaadin/router';

import '../components/structures/header';
import '../components/structures/footer';
import { baseStyles, normalizeCSS } from '../styles/elements';

@customElement('sign-in')
export class SignIn extends LitElement {
  static styles = [normalizeCSS, baseStyles];

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        Router.go('/');
      }
    });
  }

  private _callPopup(): void {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.log(errorCode);
      console.log(errorMessage);
      console.log(email);
      console.log(credential);
    });
  }

  protected render(): TemplateResult<1> {
    return html`
      <main-header></main-header>
      <main>
        <button @click="${this._callPopup}">로그인</button>
      </main>
    `;
  }
}
