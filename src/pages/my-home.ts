import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '../components/structures/header';
import '../components/structures/footer';
import { baseStyles, normalizeCSS } from '../styles/elements';

@customElement('my-home')
export class MyHome extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = [normalizeCSS, baseStyles];

  // Declare reactive properties
  @property()
  name?: string = 'World';

  // Render the UI as a function of component state
  render(): TemplateResult<1> {
    return html`
      <main-header></main-header>
      <main>
        <p>${this.name}</p>
      </main>
      <main-footer></main-footer>
    `;
  }
}
