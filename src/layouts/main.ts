import { LitElement, css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '../components/structures/header';

@customElement('main-layout')
export class MainLayout extends LitElement {
  static styles = css`
    ::slotted(*) {
      margin: 32px 16px;
    }
  `;

  protected render(): TemplateResult<1> {
    return html`
      <main-header></main-header>
      <slot></slot>
    `;
  }
}
