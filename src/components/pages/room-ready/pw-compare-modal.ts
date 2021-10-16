import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { baseStyles, normalizeCSS } from '../../../styles/elements';

import '../../structures/modal';
@customElement('pw-compare-modal')
export class PwCompareModal extends LitElement {
  static styles = [normalizeCSS, baseStyles, css``];

  @property({ type: Boolean })
  public isOpen = true;

  @property({ type: Function })
  public onCancelCallback(): void {
    window.location.assign('/');
  }

  protected render(): TemplateResult {
    return html`
      <main-modal
        title="비밀번호 입력"
        ?isOpen="${this.isOpen}"
        .onCancelCallback="${this.onCancelCallback}"
      >
        <form>
          <label for="password">
            <p>8자 이상 입력하세요</p>
            <input id="password" type="password" name="password" />
          </label>
        </form>
      </main-modal>
    `;
  }
}
