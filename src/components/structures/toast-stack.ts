import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { baseStyles, normalizeCSS } from '../../styles/elements';

import './toast';

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
    `,
  ];

  @property({ type: Array })
  private _messages: ToastMessage[] = [];

  private _id = this._messages.length;

  private _removeMsgTimeout = (item: ToastMessage): Promise<NodeJS.Timeout> => {
    return Promise.resolve(
      setTimeout(() => {
        this._messages = this._messages.filter((msg) => msg.id !== item.id);
      }, 1000 * 10),
    );
  };

  private _addToastEvent = async (e: CustomEvent): Promise<void> => {
    const newItem: ToastMessage = {
      id: this._id,
      message: `${this._id} ${e.detail}`,
    };
    this._messages = this._messages.concat(newItem);
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
    return html`
      <div id="toast-stack">
        ${repeat(
    this._messages,
    (item) => item.id,
    (item) => html`
            <global-toast message="${item.message}"></global-toast>
          `,
  )}
      </div>
    `;
  }
}
