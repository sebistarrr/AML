import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../header/header';
import { ToastHostComponent } from '../../shared/ui/overlay/toast-host';

/**
 * Coquille applicative : bandeau de référence, zone de contenu, surcouches.
 *
 * La navigation tient entièrement dans les onglets du bandeau, comme dans les
 * maquettes : il n'y a ni menu latéral ni second niveau de navigation.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, ToastHostComponent],
  template: `
    <a class="shell__skip" href="#contenu">Aller au contenu principal</a>

    <app-header />

    <main class="shell__content" id="contenu" tabindex="-1">
      <router-outlet />
    </main>

    <app-toast-host />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* Lien d'évitement : premier élément tabulable de la page, révélé au focus. */
    .shell__skip {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: calc(var(--z-toast) + 1);
      padding: 8px 16px;
      border-radius: 6px;
      background: var(--navy-solid);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: var(--shadow);
      transform: translateY(-200%);
      transition: transform var(--dur-fast) var(--ease-out);
    }

    .shell__skip:focus-visible {
      transform: translateY(0);
    }

    .shell__content {
      flex: 1;
      min-width: 0;
      background: var(--bg);
    }

    /* Le composant routé étant recréé à chaque navigation, l'animation se
       rejoue sans machinerie supplémentaire. */
    .shell__content > * {
      display: block;
      animation: fade-in var(--dur-base) var(--ease-out);
    }
  `,
})
export class AppShellComponent {}
