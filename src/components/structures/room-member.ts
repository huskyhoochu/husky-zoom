import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, normalizeCSS } from '@styles/elements';

@customElement('room-member')
export class RoomMember extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .room__member {
        margin: 16px 0;
        display: flex;
        align-items: center;
      }

      .member {
        width: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .member__img {
        width: 70px;
        height: 70px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon {
        font-family: 'Material Icons', serif;
        font-style: normal;
        font-size: 80px;
        color: var(--gray-500);
      }

      .conn {
        margin: 8px 0;
        font-size: var(--font-xs);
        display: flex;
        align-items: center;
      }

      .conn__status {
        display: inline-block;
        width: var(--font-xs);
        height: var(--font-xs);
        border-radius: 9999px;
        background-color: var(--gray-400);
      }

      .conn__active {
        background-color: var(--green-400);
      }
    `,
  ];

  @property({ type: Object })
  public room: Room;

  protected render(): TemplateResult {
    const hostClasses = {
      active: this.room.members.host.connection.is_connected,
    };
    const guestClasses = {
      active: this.room.members.guest.connection.is_connected,
    };

    return html`
      <div class="room__member">
        <div class="member">
          <img
            class="member__img"
            src=${this.room.members.host.photo_url}
            alt=${this.room.members.host.display_name}
          />
          <div class="conn">
            <span class="conn__status ${classMap(hostClasses)}"></span>
          </div>
        </div>
        <div class="member">
          ${this.room.members.guest.uid
    ? html`
                <img
                  class="member__img"
                  src=${this.room.members.guest.photo_url}
                  alt=${this.room.members.guest.display_name}
                />
              `
    : html`
                <div class="member__img">
                  <span class="icon material-icons-outlined">
                    account_circle
                  </span>
                </div>
              `}
          <div class="conn">
            <span class="conn__status ${classMap(guestClasses)}"></span>
          </div>
        </div>
      </div>
    `;
  }
}
