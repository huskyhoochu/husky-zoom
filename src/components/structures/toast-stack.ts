import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { animate, fadeIn, fadeOut } from '@lit-labs/motion';
import { baseStyles, normalizeCSS } from '@styles/elements';

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

      .toast__title {
        display: flex;
        align-items: center;
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom-color: inherit;
        padding-bottom: 6px;
        margin-bottom: 10px;
      }

      .toast__title .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: var(--font-2xl);
        display: inline-block;
        margin-right: 4px;
      }
    `,
  ];

  @property({ type: Array })
  private _messages: ToastMessage[] = [];

  private _id = this._messages.length;

  private _removeMsgTimeout = (item: ToastMessage): Promise<void> => {
    const timeout = setTimeout(() => {
      const swallowArr = [...this._messages];
      this._messages = swallowArr.filter((msg) => msg.id !== item.id);
      clearTimeout(timeout);
    }, 1000 * 5);
    return Promise.resolve();
  };

  private _addToastEvent = async (
    e: CustomEvent<ToastEvent>,
  ): Promise<void> => {
    const newItem: ToastMessage = {
      id: this._id,
      intent: e.detail.intent,
      title: e.detail.title,
      message: e.detail.message,
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
                <div class="toast__title">
                  ${item.intent === 'success'
    ? html`
                        <span class="icon material-icons-outlined">
                          check_circle_outline
                        </span>
                      `
    : html`
                        <span class="icon material-icons-outlined">
                          error_outline
                        </span>
                      `}
                  <h3>${item.title}</h3>
                </div>
                <p>${item.message}</p>
              </div>
            `;
    },
  )}
      </div>
    `;
  }
}
