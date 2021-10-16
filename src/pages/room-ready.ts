import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import '../components/structures/header';
import '../components/structures/footer';
import { baseStyles, normalizeCSS } from '../styles/elements';
import { router } from '../index';
import { Router } from '@vaadin/router';

import '../components/pages/room-ready/pw-compare-modal';

@customElement('room-ready')
export class RoomReady extends LitElement {
  static styles = [normalizeCSS, baseStyles, css``];

  @property({ type: Object })
  location = router.location;

  @state()
  pwModalOpen = true;

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        Router.go('/');
      }
    });
  }

  protected render(): TemplateResult {
    return html`
      <main-header></main-header>
      <main>
        <h1>${this.location.params.id}</h1>
        <pw-compare-modal></pw-compare-modal>
      </main>
      <main-footer></main-footer>
    `;
  }
}
