import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { baseStyles, formStyles, normalizeCSS } from '@styles/elements';
import { classMap } from 'lit/directives/class-map.js';

import '@components/structures/modal';
import Fetcher from '@fetcher/index';
import parseErrMsg from '@fetcher/parseErrMsg';

@customElement('pw-compare-modal')
export class PwCompareModal extends LitElement {
  static styles = [normalizeCSS, baseStyles, formStyles, css``];

  @property({ type: String })
  public roomId = '';

  @property({ type: Boolean })
  public isOpen = true;

  @property({ type: Function })
  public onCancelCallback(): void {
    window.location.assign('/');
  }

  @state()
  private _isLoading = false;

  private async _checkPassword(e: SubmitEvent): Promise<void> {
    this._isLoading = true;
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const body = {
      password: formData.get('password'),
      room_id: this.roomId,
    };

    try {
      const resp = await Fetcher.axios.post('/room/check', body);
      const { okay } = resp.data as { okay: boolean };
      if (okay) {
        this.isOpen = false;
        const event = new CustomEvent('open-video', {
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        this.dispatchEvent(event);
      }
    } catch (e) {
      const message = parseErrMsg(e);
      const toastEvent = new CustomEvent<ToastEvent>('add-toast', {
        detail: {
          intent: 'danger',
          title: '인증 오류',
          message,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      this.dispatchEvent(toastEvent);
    } finally {
      this._isLoading = false;
    }
  }

  private _toggleModal(): void {
    this.isOpen = !this.isOpen;
    const event = new CustomEvent('modal-closed', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
    this.onCancelCallback();
  }

  protected render(): TemplateResult {
    const loadingClasses = {
      loading: this._isLoading,
    };
    return html`
      <main-modal
        title="비밀번호 확인"
        ?isOpen="${this.isOpen}"
        .onCancelCallback="${this.onCancelCallback}"
      >
        <form class="form" @submit="${this._checkPassword}">
          <label for="password">
            <input id="password" type="password" name="password" required />
          </label>
          <div class="form__button-group">
            <button @click="${this._toggleModal}" type="reset">취소</button>
            <button
              type="submit"
              class="${classMap(loadingClasses)}"
              ?disabled=${this._isLoading}
            >
              ${this._isLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        </form>
      </main-modal>
    `;
  }
}
