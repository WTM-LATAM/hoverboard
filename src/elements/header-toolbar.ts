import { Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState } from '../store';
import { initialDialogState } from '../store/dialogs/state';
import { initialRoutingState, RoutingState } from '../store/routing/state';
import { initialTicketsState, TicketsState } from '../store/tickets/state';
import { TempAny } from '../temp-any';
import './shared-styles';

@customElement('header-toolbar')
export class HeaderToolbar extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          --iron-icon-fill-color: currentColor;
          display: block;
          z-index: 1;
          border-bottom: 1px solid var(--divider-color);
          background-color: var(--primary-background-color);
          transition: background-color var(--animation), border-bottom-color var(--animation),
            color var(--animation);
          color: var(--primary-text-color);
        }

        :host([transparent]) {
          --iron-icon-fill-color: var(--hero-font-color, '#fff');
          background-color: transparent;
          border-bottom-color: transparent;
          color: var(--hero-font-color, '#fff');
        }

        :host([transparent]) .toolbar-logo {
          background-color: var(--hero-logo-color);
          opacity: var(--hero-logo-opacity, 1);
        }

        app-toolbar {
          margin: 0 auto;
          padding: 0 16px;
          height: auto;
          max-width: var(--max-container-width);
        }

        .toolbar-logo {
          display: block;
          width: 180px;
          height: 32px;
          background-color: var(--default-primary-color);
          transition: background-color var(--animation);
          -webkit-mask: url('/images/logo-monochrome.svg') no-repeat;
        }

        .nav-items {
          --paper-tabs-selection-bar-color: var(--default-primary-color);
          --paper-tabs: {
            height: 64px;
          }
        }

        .nav-item a {
          padding: 0 14px;
          color: inherit;
          text-transform: uppercase;
        }

        .profile-image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-position: center;
          background-size: cover;
        }

        .dropdown-panel {
          padding: 24px;
          max-width: 300px;
          background: #fff;
          font-size: 16px;
          color: var(--primary-text-color);
        }

        .dropdown-panel p {
          margin-top: 0;
        }

        .dropdown-panel .panel-actions {
          margin: 0 -16px -16px 0;
        }

        .profile-details .profile-image {
          margin-right: 16px;
          width: 48px;
          height: 48px;
        }

        .profile-name,
        .profile-email {
          font-size: 14px;
          display: block;
          white-space: nowrap;
          color: var(--secondary-text-color);
        }

        .profile-action {
          margin-top: 4px;
          text-transform: uppercase;
          color: var(--default-primary-color);
          font-size: 14px;
          cursor: pointer;
        }

        paper-button iron-icon {
          margin-right: 8px;
          --iron-icon-fill-color: var(--hero-font-color);
        }

        .buy-button {
          margin-top: 12px;
        }

        @media (min-width: 640px) {
          app-toolbar {
            padding: 0 36px;
            height: initial;
          }
        }
      </style>

      <app-toolbar class="header">
        <div>
          <paper-icon-button
            icon="hoverboard:menu"
            hidden$="[[viewport.isLaptopPlus]]"
            aria-label="menu"
            on-click="openDrawer"
          ></paper-icon-button>
        </div>
        <div layout horizontal center flex>
          <a
            class="toolbar-logo"
            href="/"
            hidden$="[[!viewport.isLaptopPlus]]"
            layout
            horizontal
            title="{$ title $}"
          ></a>
        </div>

        <paper-tabs
          class="nav-items"
          selected="[[route.route]]"
          attr-for-selected="name"
          hidden$="[[!viewport.isLaptopPlus]]"
          role="navigation"
          noink
        >
          {% for nav in navigation %}
          <paper-tab name="{$ nav.route $}" class="nav-item" link>
            <a href="{$ nav.permalink $}" layout vertical center-center>{$ nav.label $}</a>
          </paper-tab>
          {% endfor %}

          <a
            href$="[[ticketUrl]]"
            target="_blank"
            rel="noopener noreferrer"
            ga-on="click"
            ga-event-category="ticket button"
            ga-event-action="buy_click"
          >
            <paper-button class="buy-button" primary>{$ buyTicket $}</paper-button>
          </a>
        </paper-tabs>

      </app-toolbar>
    `;
  }

  @property({ type: Object })
  route: RoutingState = initialRoutingState;
  @property({ type: Boolean, notify: true })
  drawerOpened: boolean;
  @property({ type: Object })
  tickets: TicketsState = initialTicketsState;

  @property({ type: Object })
  private viewport = {};
  @property({ type: Object })
  private heroSettings = {};
  @property({ type: Object })
  private dialogs = initialDialogState;
  @property({ type: Object })
  private user = {};
  @property({ type: Boolean, reflectToAttribute: true })
  private transparent = false;

  stateChanged(state: RootState) {
    this.dialogs = state.dialogs;
    this.route = state.routing;
    this.user = state.user;
    this.tickets = state.tickets;
    this.heroSettings = state.ui.heroSettings;
    this.viewport = state.ui.viewport;
  }

  connectedCallback() {
    super.connectedCallback();
    (window as TempAny).HOVERBOARD.Elements.HeaderToolbar = this;
    this._onScroll = this._onScroll.bind(this);
    window.addEventListener('scroll', this._onScroll);
    this._onScroll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this._onScroll);
  }

  openDrawer() {
    this.drawerOpened = true;
  }

  _onScroll() {
    this.transparent = document.documentElement.scrollTop === 0;
  }

  @computed('tickets')
  get ticketUrl() {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const availableTicket = this.tickets.data.find((ticket) => ticket.available);
      return (availableTicket || this.tickets.data[0]).url;
    } else {
      return '';
    }
  }

  @observe('heroSettings')
  _setToolbarSettings(settings) {
    if (!settings) return;
    this.updateStyles({
      '--hero-font-color': settings.fontColor || '',
      '--hero-logo-opacity': settings.hideLogo ? '0' : '1',
      '--hero-logo-color': settings.backgroundImage ? '#fff' : 'var(--default-primary-color)',
    });
  }
}
