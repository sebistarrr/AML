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
      background: var(--navy);
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

    /* Le composant routé est inséré ici par le routeur : il ne porte pas
       l'attribut d'encapsulation de cette coquille, et aucune règle écrite ici
       ne peut l'atteindre. Chacun déclare donc son propre bloc :host — c'est
       ce qui lui donne display: block, sans quoi il resterait en ligne et
       s'élargirait au-delà de la fenêtre au lieu de la remplir. */
    .shell__content {
      flex: 1;
      min-width: 0;
      background: var(--bg);
    }
  `,
})
export class AppShellComponent {}
