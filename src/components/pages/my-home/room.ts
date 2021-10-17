import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, normalizeCSS } from '@styles/elements';
import dayjs from 'dayjs';

import '@components/structures/room-member';

@customElement('room-card')
export class RoomCard extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .room {
        display: block;
        background-color: var(--gray-100);
        border-radius: var(--border-radius-lg);
        padding: 12px 16px;
        height: 200px;
        cursor: pointer;
        color: var(--gray-700);
        font-size: var(--font-sm);
        position: relative;
        transition: box-shadow 0.3s var(--tr-in-out);
      }

      .room:hover {
        text-decoration: none;
      }

      .room__active {
        outline: 1px solid var(--indigo-400);
        background-image: linear-gradient(
          45deg,
          var(--green-50),
          var(--indigo-200)
        );
      }

      .room:hover {
        box-shadow: var(--shadow-lg);
      }

      .room__badge {
        font-weight: 700;
        background-color: var(--gray-300);
        padding: 3px 6px;
        border-radius: var(--border-radius-default);
        width: 270px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: width 0.3s var(--tr-in-out);
      }

      .room__active .room__badge {
        background-color: var(--indigo-300);
      }

      .room__badge:hover {
        width: 100%;
      }

      .room__time {
        position: absolute;
        bottom: 0;
        left: 0;
        padding: 12px 16px;
        font-size: var(--font-xs);
      }
    `,
  ];

  @property({ type: Object })
  public room: Room;

  @state()
  private _hostConnStateEnabled = false;

  @property({ type: Boolean })
  public myRoomEnabled = false;

  protected render(): TemplateResult {
    const myRoomClasses = {
      room__active: this.myRoomEnabled,
    };
    return html` <a
      href="/room/ready/${this.room.id}"
      class="room ${classMap(myRoomClasses)}"
    >
      <p class="room__badge">${this.room.id}</p>
      <room-member .room="${this.room}"></room-member>
      <div class="room__time">
        <p>
          종료시각: ${dayjs(this.room.expires_at).format('YYYY.MM.DD HH.mm')}
        </p>
      </div>
    </a>`;
  }
}
