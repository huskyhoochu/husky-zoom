import { LitElement, css, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-app')
export class SimpleGreeting extends LitElement {
  // Define scoped styles right with your component, in plain CSS
  static styles = css`
    :host {
      color: green;
    }
  `;

  // Declare reactive properties
  @property()
  name?: string = 'World';

  // Render the UI as a function of component state
  render(): TemplateResult<1> {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
