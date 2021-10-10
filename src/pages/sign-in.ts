import { html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '../layouts/main';

@customElement('sign-in')
export class SignIn extends LitElement {
  protected render(): TemplateResult<1> {
    return html`
      <main-layout>
        <main>
          <p>로그인</p>
        </main>
      </main-layout>
    `;
  }
}
