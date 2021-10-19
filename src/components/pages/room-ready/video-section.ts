import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { baseStyles, normalizeCSS, videoStyles } from '@styles/elements';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { videoConfig } from '@config/video';
import {
  getDatabase,
  runTransaction,
  TransactionResult,
} from 'firebase/database';
import { ref as dbRef } from '@firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Router } from '@vaadin/router';

@customElement('video-section')
export class VideoSection extends LitElement {
  static styles = [normalizeCSS, baseStyles, videoStyles, css``];

  @property({ type: String })
  public roomId = '';

  @state()
  private _user: UserInfo = {
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
  };

  @state()
  private _isLoading = false;

  @state()
  private _localVideoRef: Ref<HTMLVideoElement> = createRef();

  connectedCallback(): void {
    super.connectedCallback();
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this._user.uid = user.uid;
        this._user.email = user.email;
        this._user.photoURL = user.photoURL;
        this._user.displayName = user.displayName;
      } else {
        Router.go('/auth/login');
      }
    });
    window.addEventListener('open-video', this.openLocalVideo);
    window.addEventListener('beforeunload', this.closeConnection);
  }

  disconnectedCallback(): void {
    (this._localVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => track.stop());
    window.removeEventListener('open-video', this.openLocalVideo);
    window.removeEventListener('beforeunload', this.closeConnection);
    this.changeConnectionStatus('disconnected').finally(() => {
      super.disconnectedCallback();
    });
  }

  openLocalVideo = async (): Promise<void> => {
    this._isLoading = true;
    await this.changeConnectionStatus('ready');
    this._localVideoRef.value.srcObject =
      await window.navigator.mediaDevices.getUserMedia(videoConfig);
    this._isLoading = false;
  };

  async changeConnectionStatus(
    status: 'disconnected' | 'ready',
  ): Promise<TransactionResult> {
    const database = getDatabase();
    const roomRef = dbRef(database, `rooms/${this.roomId}`);
    return runTransaction(roomRef, (room: Room) => {
      if (room) {
        if (this._user.uid === room.members.host.uid) {
          room.members.host.connection.status = status;
        } else {
          room.members.guest.connection.status = status;
          room.members.guest.uid = this._user.uid;
          room.members.guest.email = this._user.email;
          room.members.guest.photo_url = this._user.photoURL;
          room.members.guest.display_name = this._user.displayName;
        }
      }
      return room;
    });
  }

  private closeConnection = async (e: BeforeUnloadEvent): Promise<void> => {
    e.preventDefault();
    (this._localVideoRef.value.srcObject as MediaStream)
      ?.getTracks()
      .forEach((track) => track.stop());
    await this.changeConnectionStatus('disconnected');
  };

  protected render(): TemplateResult {
    return html`
      <div class="video-section">
        ${this._isLoading
    ? html`
              <div class="loading">
                <span class="icon material-icons-outlined"> autorenew </span>
              </div>
            `
    : ''}
        <video ${ref(this._localVideoRef)} autoplay playsinline></video>
      </div>
    `;
  }
}
