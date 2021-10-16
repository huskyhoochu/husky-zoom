import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, normalizeCSS } from '../../styles/elements';

@customElement('global-toast')
export class Toast extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .toast {
        width: 300px;
        height: 120px;
        border-radius: 8px;
        padding: 16px 20px;
        font-size: var(--font-sm);
        font-weight: 700;
        box-shadow: var(--shadow-lg);
      }

      .toast.success {
        border: 1px solid var(--green-400);
        background-color: var(--green-200);
        color: var(--green-400);
      }

      .toast.danger {
        border: 1px solid var(--red-400);
        background-color: var(--red-200);
        color: var(--red-400);
      }
    `,
  ];

  @property({ type: Object })
  public eventObj: ToastEvent;

  protected render(): TemplateResult {
    const intentClasses = {
      danger: this.eventObj.intent === 'danger',
      success: this.eventObj.intent === 'success',
    };

    return html`
      <div class="toast ${classMap(intentClasses)}">
        <p>${this.eventObj.message}</p>
      </div>
    `;
  }
}
