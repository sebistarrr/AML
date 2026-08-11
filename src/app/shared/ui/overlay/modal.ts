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
 * Boîte de dialogue modale.
 *
 * Coquille générique : elle gère le voile, le focus, la touche Échap et la
 * mise en page. Le contenu et les actions sont projetés par l'appelant. Le
 * gabarit — bandeau de titre gris, corps blanc, action de validation en bas à
 * droite — est celui des dialogues « Add a comment » et « Assign an alert ».
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="modal__scrim" (click)="close.emit()" aria-hidden="true"></div>

      <div class="modal__wrap">
        <div
          #panel
          class="modal__panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          tabindex="-1"
          (keydown.escape)="close.emit()"
        >
          <header class="modal__head">
            <h2 class="modal__title">{{ title() }}</h2>
            <button type="button" class="modal__close" (click)="close.emit()" aria-label="Fermer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <div class="modal__body">
            <ng-content />
          </div>

          <footer class="modal__foot">
            <ng-content select="[modal-actions]" />
          </footer>
        </div>
      </div>
    }
  `,
  styles: `
    .modal__scrim {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      background: rgb(2 15 35 / 42%);
    }

    .modal__wrap {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      display: grid;
      place-items: center;
      padding: 20px;
      pointer-events: none;
    }

    .modal__panel {
      pointer-events: auto;
      width: min(640px, 100%);
      max-height: calc(100dvh - 40px);
      display: flex;
      flex-direction: column;
      background: var(--surface);
      box-shadow: 0 18px 48px rgb(0 0 0 / 22%);
      animation: scale-in var(--dur-base) var(--ease-out);
    }

    .modal__head {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 58px;
      padding: 0 18px;
      background: var(--surface-2);
    }

    .modal__title {
      flex: 1;
      color: var(--navy);
      font-size: 15px;
      font-weight: 500;
    }

    .modal__close {
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

    .modal__close:hover {
      background: var(--blue-50);
    }

    .modal__body {
      flex: 1;
      min-height: 0;
      padding: 18px;
      overflow-y: auto;
      background: var(--surface);
    }

    .modal__foot {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 18px 18px;
      background: var(--surface);
    }
  `,
})
export class ModalComponent {
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
        document.body.style.overflow = 'hidden';
        return;
      }

      this.release?.();
      this.release = null;
      document.body.style.overflow = '';
    });
  }
}
