import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { baseStyles, normalizeCSS } from '../../styles/elements';
import dayjs from 'dayjs';

@customElement('room-card')
export class RoomCard extends LitElement {
  static styles = [
    normalizeCSS,
    baseStyles,
    css`
      .room {
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

      .room__member {
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
        margin-right: 4px;
      }

      .conn__active {
        background-color: var(--green-400);
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
    const hostClasses = {
      conn__active: this._hostConnStateEnabled,
      hidden: false,
    };
    const myRoomClasses = {
      room__active: this.myRoomEnabled,
      hidden: false,
    };
    return html` <div class="room ${classMap(myRoomClasses)}">
      <p class="room__badge">${this.room.id}</p>
      <div class="room__member">
        <div class="host">
          <img
            class="host__img"
            src=${this.room.members.host.photo_url}
            alt=${this.room.members.host.display_name}
          />
          <div class="conn">
            <span class="conn__status ${classMap(hostClasses)}"></span>
          </div>
        </div>
      </div>
      <div class="room__time">
        <p>
          종료시각: ${dayjs(this.room.expires_at).format('YYYY.MM.YY HH.mm')}
        </p>
      </div>
    </div>`;
  }
}
