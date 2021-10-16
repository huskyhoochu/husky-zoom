import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { baseStyles, normalizeCSS } from '../../../styles/elements';

@customElement('room-skeleton')
export class RoomSkeleton extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .skeleton {
        background-color: var(--gray-200);
        border-radius: var(--border-radius-lg);
        padding: 12px 16px;
        height: 200px;
        cursor: pointer;
        position: relative;
        background-image: linear-gradient(
          90deg,
          var(--gray-50),
          var(--gray-200)
        );
        background-size: 200% 200%;
        animation: bg-animation 1.5s var(--tr-in-out) infinite;
      }

      @keyframes bg-animation {
        0% {
          background-position: 0;
        }
        50% {
          background-position: 70%;
        }
        100% {
          background-position: 0;
        }
      }

      .skeleton__badge {
        background-color: var(--gray-300);
        padding: 3px 6px;
        border-radius: var(--border-radius-default);
        width: 270px;
        height: 22px;
      }

      .skeleton__member {
        margin: 16px 0;
        display: flex;
        align-items: center;
      }

      .host {
        width: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .host__img {
        width: 70px;
        height: 70px;
        border-radius: 9999px;
        background-color: var(--gray-300);
      }

      .conn {
        margin: 8px 0;
        display: flex;
        align-items: center;
      }

      .conn__status {
        display: inline-block;
        width: var(--font-xs);
        height: var(--font-xs);
        border-radius: 9999px;
        background-color: var(--gray-400);
        margin-right: 4px;
      }

      .conn__comment {
        width: 34px;
        height: var(--font-xs);
        background-color: var(--gray-300);
      }

      .skeleton__time {
        position: absolute;
        bottom: 0;
        left: 0;
        margin: 12px 16px;
        background-color: var(--gray-300);
        width: 200px;
        height: 22px;
      }
    `,
  ];

  protected render(): TemplateResult {
    return html`
      <div class="skeleton">
        <p class="skeleton__badge"></p>
        <div class="skeleton__member">
          <div class="host">
            <div class="host__img"></div>
            <div class="conn">
              <span class="conn__status"></span>
              <span class="conn__comment"></span>
            </div>
          </div>
        </div>
        <div class="skeleton__time"></div>
      </div>
    `;
  }
}
