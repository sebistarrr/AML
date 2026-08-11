import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

interface Tab {
  readonly path: string;
  readonly label: string;
}

/**
 * Bandeau de référence : logo du groupe, titre de l'application, compte,
 * langue, puis les quatre onglets de navigation. La structure et les
 * dimensions suivent le design de référence.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="reference-header">
      <div class="reference-logo">
        <!-- Logo dessiné en SVG : net à toute densité d'écran, et ses couleurs
             suivent les jetons du thème plutôt qu'une image figée. -->
        <svg class="logo" viewBox="0 0 168 87" preserveAspectRatio="xMidYMid meet" role="img">
          <title>AML — dispositif de screening LCB-FT</title>

          <g transform="translate(13 23)">
            <path
              class="logo__shield"
              d="M20 1.5 37.5 7.8V22.4C37.5 32.6 30.1 40.6 20 43.2 9.9 40.6 2.5 32.6 2.5 22.4V7.8Z"
            />
            <circle class="logo__lens" cx="18.4" cy="18.4" r="6.6" />
            <path class="logo__handle" d="M23.2 23.2 28.6 28.6" />
          </g>

          <text class="logo__word" x="63" y="51">AML</text>
          <text class="logo__tag" x="64" y="64">SCREENING LCB-FT</text>
        </svg>
      </div>

      <div class="reference-shell">
        <div class="reference-top-row">
          <div class="reference-title">AML PROJECT</div>

          <div class="reference-account">
            <button
              class="reference-user"
              type="button"
              [attr.aria-expanded]="accountOpen()"
              aria-haspopup="menu"
              (click)="accountOpen.set(!accountOpen())"
            >
              <span>{{ auth.accountLabel() }}</span>
              <span class="reference-user-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="11" fill="#002b7f" />
                  <circle cx="12" cy="8.2" r="3.2" fill="#fff" />
                  <path d="M5.8 19.1c.8-3.5 3-5.2 6.2-5.2s5.4 1.7 6.2 5.2" fill="#fff" />
                </svg>
              </span>
              <span class="material-symbols-outlined reference-chevron">expand_more</span>
            </button>

            @if (accountOpen()) {
              <div class="account-menu" role="menu">
                <p class="account-menu__label">Compte de démonstration</p>
                @for (user of auth.allUsers; track user.id) {
                  <button
                    type="button"
                    role="menuitemradio"
                    [attr.aria-checked]="user.id === auth.currentUser().id"
                    class="account-menu__item"
                    (click)="select(user.id)"
                  >
                    <span>{{ user.id }}</span>
                    <small>{{ user.group === 'LEVEL_1' ? 'Level 1' : 'Level 2' }}</small>
                  </button>
                }
              </div>
            }

            <button class="reference-language" type="button" aria-label="Langue">
              <span class="flag-uk" aria-hidden="true">
                <span class="uk-diagonal uk-d1"></span>
                <span class="uk-diagonal uk-d2"></span>
              </span>
              <span class="material-symbols-outlined reference-chevron">expand_more</span>
            </button>
          </div>
        </div>

        <nav class="reference-tabs" aria-label="Navigation principale">
          @for (tab of tabs; track tab.path) {
            <a
              [routerLink]="tab.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
              #link="routerLinkActive"
              [attr.aria-current]="link.isActive ? 'page' : null"
              >{{ tab.label }}</a
            >
          }
        </nav>
      </div>
    </header>
  `,
  styles: `
    .reference-header {
      height: var(--header-h);
      display: flex;
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      color: var(--navy);
    }

    .reference-logo {
      width: 168px;
      min-width: 168px;
      height: var(--header-h);
      border-right: 1px solid var(--line);
      background: var(--surface);
      overflow: hidden;
    }

    .logo {
      display: block;
      width: 100%;
      height: 100%;
    }

    .logo__shield {
      fill: var(--blue-50);
      stroke: var(--navy);
      stroke-width: 2.2;
      stroke-linejoin: round;
    }

    .logo__lens,
    .logo__handle {
      fill: none;
      stroke: var(--pink);
      stroke-width: 2.6;
      stroke-linecap: round;
    }

    .logo__word {
      fill: var(--navy);
      font-family: var(--font-sans);
      font-size: 27px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .logo__tag {
      fill: var(--muted);
      font-family: var(--font-sans);
      font-size: 7.2px;
      font-weight: 600;
      letter-spacing: 0.16em;
    }

    .reference-shell {
      flex: 1;
      min-width: 0;
    }

    .reference-top-row {
      height: 42px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--line);
    }

    .reference-title {
      padding-left: 17px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
      color: #0d3472;
    }

    .reference-account {
      position: relative;
      margin-left: auto;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 18px;
      padding-right: 12px;
    }

    .reference-user,
    .reference-language {
      height: 27px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 2px;
      background: var(--surface);
      color: #12366f;
      cursor: pointer;
    }

    .reference-user {
      min-width: 150px;
      padding-left: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .reference-user-icon {
      width: 18px;
      height: 18px;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .reference-user-icon svg {
      display: block;
      width: 18px;
      height: 18px;
    }

    .reference-chevron {
      margin: 0 5px;
      font-size: 16px;
      color: currentcolor;
    }

    .reference-language {
      min-width: 53px;
    }

    /* Drapeau britannique dessiné en CSS, sans image à charger. */
    .flag-uk {
      position: relative;
      display: inline-block;
      width: 20px;
      height: 13px;
      overflow: hidden;
      isolation: isolate;
      background: #17458f;
      border: 1px solid var(--line);
    }

    .flag-uk::before,
    .flag-uk::after {
      content: '';
      position: absolute;
      z-index: 2;
    }

    .flag-uk::before {
      left: 8px;
      top: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to right, #fff 0 25%, #d71945 25% 75%, #fff 75%);
    }

    .flag-uk::after {
      left: 0;
      top: 5px;
      width: 100%;
      height: 3px;
      background: linear-gradient(to bottom, #fff 0 20%, #d71945 20% 80%, #fff 80%);
    }

    .uk-diagonal {
      position: absolute;
      left: -3px;
      top: 5px;
      width: 26px;
      height: 3px;
      background: #fff;
      z-index: 1;
      transform-origin: center;
    }

    .uk-d1 {
      transform: rotate(32deg);
    }

    .uk-d2 {
      transform: rotate(-32deg);
    }

    .uk-diagonal::after {
      content: '';
      position: absolute;
      left: 0;
      top: 1px;
      width: 26px;
      height: 1px;
      background: #d71945;
    }

    .reference-tabs {
      height: 45px;
      display: flex;
      align-items: stretch;
      background: var(--surface);
    }

    .reference-tabs a {
      width: 159px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #17396f;
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      border-bottom: 2px solid transparent;
    }

    .reference-tabs a.active {
      color: var(--pink);
      background: var(--surface-2);
      border-bottom-color: var(--pink);
    }

    /* --- Menu de compte --- */
    .account-menu {
      position: absolute;
      top: 34px;
      right: 74px;
      z-index: var(--z-header);
      min-width: 200px;
      padding: 6px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      box-shadow: var(--shadow);
      animation: scale-in var(--dur-fast) var(--ease-out);
    }

    .account-menu__label {
      padding: 6px 8px;
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .account-menu__item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 32px;
      padding: 0 8px;
      border: 0;
      border-radius: 4px;
      background: transparent;
      font-size: 12px;
      cursor: pointer;
    }

    .account-menu__item:hover {
      background: var(--blue-50);
    }

    .account-menu__item[aria-checked='true'] {
      color: var(--pink);
      font-weight: 700;
    }

    .account-menu__item small {
      color: var(--muted);
    }

    @media (max-width: 720px) {
      .reference-header {
        height: 64px;
      }

      .reference-logo {
        width: 110px;
        min-width: 110px;
        height: 64px;
      }

      .reference-top-row {
        height: 32px;
      }

      .reference-title {
        padding-left: 10px;
        font-size: 11px;
      }

      /* Les quatre onglets ne tiennent plus dans la largeur : ils défilent
         horizontalement plutôt que d'élargir la page entière. */
      .reference-tabs {
        height: 32px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .reference-tabs::-webkit-scrollbar {
        display: none;
      }

      .reference-tabs a {
        width: auto;
        min-width: 92px;
        flex: 0 0 auto;
        padding: 0 10px;
        font-size: 9px;
      }

      .reference-user {
        min-width: 36px;
        width: 36px;
        padding: 0;
      }

      .reference-user > span:first-child,
      .reference-user .reference-chevron {
        display: none;
      }

      .reference-user-icon {
        margin: 0;
      }

      .reference-account {
        gap: 6px;
        padding-right: 6px;
      }

      .account-menu {
        right: 6px;
      }
    }
  `,
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class HeaderComponent {
  protected readonly auth = inject(AuthService);

  protected readonly accountOpen = signal(false);

  protected readonly tabs = computed<readonly Tab[]>(() => [
    { path: '/my-alerts', label: 'My alerts' },
    { path: '/alert-basket', label: 'Alert Basket' },
    { path: '/processed-alerts', label: 'Processed alerts' },
    { path: '/search-person', label: 'Search person' },
  ])();

  protected select(userId: string): void {
    this.auth.signInAs(userId);
    this.accountOpen.set(false);
  }

  /** Un clic hors du bandeau referme le menu de compte. */
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.accountOpen()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.reference-account')) return;
    this.accountOpen.set(false);
  }
}
