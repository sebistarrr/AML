import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

import { focusFirst, trapFocus } from '../../util/focus-trap';

/**
 * Panneau latéral droit.
 *
 * Utilisé par le panneau « Filter » des corbeilles : titre, corps défilant,
 * pied d'actions collant. Se ferme à la touche Échap et au clic sur le voile.
 */
@Component({
  selector: 'app-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="drawer__scrim" (click)="close.emit()" aria-hidden="true"></div>

      <aside
        #panel
        class="drawer__panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        tabindex="-1"
        (keydown.escape)="close.emit()"
      >
        <header class="drawer__head">
          <h2 class="drawer__title">{{ title() }}</h2>
          <button
            type="button"
            class="drawer__close"
            (click)="close.emit()"
            aria-label="Fermer le panneau"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="drawer__body">
          <ng-content />
        </div>

        <footer class="drawer__foot">
          <ng-content select="[drawer-actions]" />
        </footer>
      </aside>
    }
  `,
  styles: `
    .drawer__scrim {
      position: fixed;
      inset: 0;
      z-index: var(--z-drawer);
      background: rgb(2 15 35 / 32%);
    }

    .drawer__panel {
      position: fixed;
      top: 0;
      right: 0;
      z-index: var(--z-drawer);
      height: 100dvh;
      width: min(480px, 96vw);
      display: flex;
      flex-direction: column;
      background: var(--surface);
      box-shadow: -16px 0 36px rgb(0 0 0 / 18%);
      animation: slide-in-right var(--dur-base) var(--ease-out);
    }

    .drawer__head {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 56px;
      padding: 0 18px;
    }

    .drawer__title {
      flex: 1;
      color: var(--navy);
      font-size: 15px;
      font-weight: 500;
    }

    .drawer__close {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--text);
      cursor: pointer;
    }

    .drawer__close:hover {
      background: var(--blue-50);
    }

    .drawer__body {
      flex: 1;
      min-height: 0;
      padding: 0 18px 12px;
      overflow-y: auto;
    }

    .drawer__foot {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 14px 18px 20px;
      border-top: 1px solid var(--line);
    }
  `,
})
export class DrawerComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly close = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private release: (() => void) | null = null;

  constructor() {
    effect(() => {
      const element = this.panel()?.nativeElement;

      if (this.open() && element) {
        this.release = trapFocus(element);
        focusFirst(element);
        return;
      }

      this.release?.();
      this.release = null;
    });
  }
}
