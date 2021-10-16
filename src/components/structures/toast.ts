import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { baseStyles, normalizeCSS } from '../../styles/elements';

@customElement('global-toast')
export class Toast extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .toast {
        width: 100px;
        height: 100px;
        background-color: green;
        position: relative;
      }
    `,
  ];

  @property({ type: String })
  public message = '';

  protected render(): TemplateResult {
    return html` <div class="toast">${this.message}</div> `;
  }
}
