import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { baseStyles, normalizeCSS } from '@styles/elements';
import { router } from '@app';
import { Router } from '@vaadin/router';

import '@components/structures/header';
import '@components/structures/footer';
import '@components/structures/toast-stack';
import '@components/pages/room-ready/pw-compare-modal';
import { videoConfig } from '@config/video';

@customElement('room-ready')
export class RoomReady extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .title {
        color: var(--gray-700);
      }

      .video-wrapper {
        margin: 64px 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(720px, 1fr));
        grid-column-gap: 8px;
        grid-template-rows: 410px;
      }

      .video-section {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .video-section video {
        display: block;
        margin: 0 auto;
      }

      .loading {
        position: absolute;
        inset: 0;
        width: 120px;
        height: 120px;
        margin: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        animation-name: loop;
        animation-duration: 1s;
        animation-fill-mode: both;
        animation-timing-function: var(--tr-linear);
        animation-iteration-count: infinite;
      }

      .loading .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: 120px;
      }

      @keyframes loop {
        0% {
          transform: rotate(0);
        }

        50% {
          transform: rotate(180deg);
        }

        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ];

  @property({ type: Object })
  location = router.location;

  @state()
  private _isLoading = false;

  localVideoRef: Ref<HTMLVideoElement> = createRef();

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        Router.go('/auth/login');
      }
    });
    this.addEventListener('open-video', this.openLocalVideo);
  }

  disconnectedCallback(): void {
    this.removeEventListener('open-video', this.openLocalVideo);
    super.disconnectedCallback();
  }

  async openLocalVideo(): Promise<void> {
    this._isLoading = true;
    this.localVideoRef.value.srcObject =
      await navigator.mediaDevices.getUserMedia(videoConfig);
    this._isLoading = false;
  }

  protected render(): TemplateResult {
    return html`
      <main-header></main-header>
      <main>
        <div class="title">
          <h1>입장 준비</h1>
        </div>
        <div class="video-wrapper">
          <div class="video-section">
            ${this._isLoading
    ? html`
                  <div class="loading">
                    <span class="icon material-icons-outlined"> loop </span>
                  </div>
                `
    : ''}
            <video ${ref(this.localVideoRef)} autoplay playsinline></video>
          </div>
          <div class="info-section"></div>
        </div>
        <pw-compare-modal
          roomId="${this.location.params.id}"
        ></pw-compare-modal>
      </main>
      <main-footer></main-footer>
      <toast-stack></toast-stack>
    `;
  }
}
