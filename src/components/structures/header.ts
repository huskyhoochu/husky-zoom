import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { anchorStyles } from '../../styles/anchorStyles';

@customElement('main-header')
export class MainHeader extends LitElement {
  static styles = [
    anchorStyles,
    css`
      header {
        background-color: var(--gray-200);
        padding: 12px 16px;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: var(--shadow-md);
      }
    `,
  ];

  protected render(): TemplateResult<1> {
    return html`
      <header>
        <div>
          <a href="/">Home</a>
        </div>
        <div>
          <a href="/auth/login">Login</a>
        </div>
      </header>
    `;
  }
}
