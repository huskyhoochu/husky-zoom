import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, normalizeCSS } from '../../styles/elements';

@customElement('main-modal')
export class MainModal extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .modal__background {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(17, 24, 39, 0.5);
        width: 100vw;
        height: 100vh;
        align-items: center;
        justify-content: center;
        display: none;
      }

      .modal__body {
        background-color: white;
        width: 300px;
        height: 200px;
        border-radius: 8px;
        padding: 16px;
        box-shadow: var(--shadow-lg);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: var(--font-2xl);
      }

      .close__btn {
        background-color: transparent;
        outline: none;
      }

      .close__btn:hover {
        outline: none;
      }

      .active {
        display: flex;
      }
    `,
  ];

  @property({ type: Boolean })
  public isOpen = false;

  @property({ type: String })
  public title = '';

  @property({ type: Function })
  public onCancelCallback?: () => void = undefined;

  private _cancelModal(): void {
    this.isOpen = !this.isOpen;
    const event = new CustomEvent('modal-closed', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
  }

  protected render(): TemplateResult {
    const openClasses = {
      active: this.isOpen,
    };
    return html`
      <div class="modal__background ${classMap(openClasses)}">
        <div class="modal__body">
          <div class="header">
            <h3>${this.title}</h3>
            <button
              class="close__btn"
              type="button"
              @click=${this._cancelModal}
            >
              <span class="icon material-icons-outlined"> close </span>
            </button>
          </div>
          <slot></slot>
        </div>
      </div>
    `;
  }
}
