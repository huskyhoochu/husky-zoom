import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { animate, fadeOut, fadeIn } from '@lit-labs/motion';
import { baseStyles, normalizeCSS } from '../../styles/elements';

import './toast';
import { classMap } from 'lit/directives/class-map.js';

@customElement('toast-stack')
export class ToastStack extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      #toast-stack {
        position: fixed;
        bottom: 0;
        right: 0;
        margin-right: 20px;
        margin-bottom: 40px;
        height: auto;
      }

      .toast {
        width: 300px;
        height: 120px;
        border-radius: 8px;
        padding: 16px 20px;
        margin: 16px 0;
        font-size: var(--font-sm);
        font-weight: 700;
        box-shadow: var(--shadow-lg);
      }

      .toast.success {
        border: 1px solid var(--green-400);
        background-color: var(--green-50);
        color: var(--green-400);
      }

      .toast.danger {
        border: 1px solid var(--red-400);
        background-color: var(--red-50);
        color: var(--red-400);
      }
    `,
  ];

  @property({ type: Array })
  private _messages: ToastMessage[] = [];

  private _id = this._messages.length;

  private _removeMsgTimeout = (item: ToastMessage): Promise<NodeJS.Timeout> => {
    return Promise.resolve(
      setTimeout(() => {
        const swallowArr = [...this._messages];
        this._messages = swallowArr.filter((msg) => msg.id !== item.id);
      }, 1000 * 5),
    );
  };

  private _addToastEvent = async (
    e: CustomEvent<ToastEvent>,
  ): Promise<void> => {
    const newItem: ToastMessage = {
      id: this._id,
      intent: e.detail.intent,
      message: `${this._id} ${e.detail.message}`,
    };
    this._messages = [newItem, ...this._messages];
    this._id += 1;
    await this.updateComplete;
    await this._removeMsgTimeout(newItem);
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('add-toast', this._addToastEvent);
  }

  disconnectedCallback(): void {
    window.removeEventListener('add-toast', this._addToastEvent);
    super.disconnectedCallback();
  }

  protected render(): TemplateResult {
    const keyframeOptions = {
      duration: 500,
      fill: 'both' as FillMode,
    };
    return html`
      <div id="toast-stack">
        ${repeat(
    this._messages,
    (item) => item.id,
    (item) => {
      const intentClasses = {
        danger: item.intent === 'danger',
        success: item.intent === 'success',
      };
      return html`
              <div
                class="toast ${classMap(intentClasses)}"
                ${animate({
    keyframeOptions,
    id: item.id,
    in: fadeIn,
    out: this._messages.length > 1 ? undefined : fadeOut,
    stabilizeOut: true,
  })}
              >
                <p>${item.message}</p>
              </div>
            `;
    },
  )}
      </div>
    `;
  }
}
