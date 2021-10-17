import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { baseStyles, normalizeCSS } from '@styles/elements';
import { router } from '@app';
import { Router } from '@vaadin/router';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import parseErrMsg from '@fetcher/parseErrMsg';
import Fetcher from '@fetcher/index';

@customElement('room-start')
export class RoomStart extends LitElement {
  static styles = [normalizeCSS, baseStyles, css``];

  @property({ type: Object })
  location = router.location;

  connectedCallback(): void {
    super.connectedCallback();
    this.sendToken()
      .then(() => {
        alert('통과');
        // 커넥션 실행하자
      })
      .catch((e) => {
        // 에러 처리
        let message = parseErrMsg(e);
        if (message === 'jwt expired') {
          message = '입장 토큰이 만료되었습니다. 다시 입장해주세요';
        }
        if (message === 'invalid token') {
          message = '토큰 형식이 잘못되었습니다. 다시 입장해주세요';
        }
        Router.go(`room/ready/${this.location.params.id}?message=${message}`);
      });
  }

  async sendToken(): Promise<void> {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const body = {
      token,
    };
    await Fetcher.axios.post('/room/verify', body);
  }

  protected render(): TemplateResult {
    return html`
      <main-header></main-header>
      <main></main>
      <main-footer></main-footer>
      <toast-stack></toast-stack>
    `;
  }
}
