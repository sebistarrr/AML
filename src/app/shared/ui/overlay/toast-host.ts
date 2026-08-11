import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService, type ToastKind } from '../../../core/services/toast.service';

/** Pile de notifications, montée une seule fois au niveau de l'AppShell. */
@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" role="region" aria-live="polite" aria-label="Notifications">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [attr.data-kind]="toast.kind">
          <span class="material-symbols-outlined toast__glyph">{{ glyph(toast.kind) }}</span>

          <div class="toast__content">
            <p class="toast__title">{{ toast.title }}</p>
            @if (toast.detail) {
              <p class="toast__detail">{{ toast.detail }}</p>
            }
          </div>

          <button
            type="button"
            class="toast__close"
            (click)="toasts.dismiss(toast.id)"
            aria-label="Masquer la notification"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: min(400px, calc(100vw - 32px));
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-left: 4px solid var(--navy);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
      animation: fade-in var(--dur-base) var(--ease-out);
    }

    .toast[data-kind='success'] {
      border-left-color: var(--green);
    }

    .toast[data-kind='error'] {
      border-left-color: var(--red);
    }

    .toast[data-kind='warning'] {
      border-left-color: var(--orange);
    }

    .toast__glyph {
      font-size: 18px;
      color: var(--navy);
    }

    .toast[data-kind='success'] .toast__glyph {
      color: var(--green);
    }

    .toast[data-kind='error'] .toast__glyph {
      color: var(--red);
    }

    .toast[data-kind='warning'] .toast__glyph {
      color: var(--orange);
    }

    .toast__content {
      flex: 1;
      min-width: 0;
    }

    .toast__title {
      font-size: 13px;
      font-weight: 600;
    }

    .toast__detail {
      margin-top: 2px;
      color: var(--muted);
      font-size: 12px;
    }

    .toast__close {
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
    }

    .toast__close .material-symbols-outlined {
      font-size: 16px;
    }

    .toast__close:hover {
      background: var(--blue-50);
      color: var(--navy);
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);

  protected glyph(kind: ToastKind): string {
    switch (kind) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }
}
