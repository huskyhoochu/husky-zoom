import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { baseStyles, normalizeCSS } from '@styles/elements';

@customElement('main-footer')
export class MainFooter extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,

    css`
      footer {
        position: fixed;
        background-color: var(--indigo-900);
        left: 0;
        right: 0;
        bottom: 0;
        color: var(--gray-50);
        font-size: var(--font-xs);
        height: 34px;
        padding: 6px 20px;
        display: flex;
        align-items: center;
        justify-content: end;
      }
    `,
  ];

  protected render(): TemplateResult<1> {
    return html`
      <footer>
        <p>Copyright © 2021 Huskyhoochu</p>
      </footer>
    `;
  }
}
