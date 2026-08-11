import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { findPerson } from '../../../core/data/persons.data';
import {
  ALERT_TYPOLOGIES,
  ALERT_TYPOLOGY_META,
  DECISION_META,
  PERSON_TYPE_META,
  RISK_LEVEL_META,
  USER_GROUP_META,
  sortableDate,
  type Alert,
  type AlertStatus,
  type AlertTypology,
  type Decision,
  type RiskComponent,
} from '../../../core/models';
import { AlertStore } from '../../../core/state/alert-store';
import { DashPipe } from '../../../shared/pipes/format.pipes';

type SortKey =
  'status' | 'reference' | 'alertDate' | 'typology' | 'circuit' | 'decision' | 'processedAt';

/**
 * Profil de risque d'une personne.
 *
 * L'écran répond à une question simple : que sait-on du risque porté par cette
 * personne, et sur quelles alertes ce jugement repose-t-il ? Le risque global
 * est celui de la composante la plus sévère — il n'est jamais moyenné, une
 * inscription au gel ne se compense pas.
 */
@Component({
  selector: 'app-person-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashPipe, UpperCasePipe],
  templateUrl: './person-profile.html',
  styleUrl: './person-profile.scss',
})
export class PersonProfileComponent {
  private readonly store = inject(AlertStore);
  private readonly router = inject(Router);

  /** Identifiant de la personne, lié au paramètre de route. */
  readonly personId = input.required<string>();

  protected readonly typologies = ALERT_TYPOLOGIES;
  protected readonly typologyMeta = ALERT_TYPOLOGY_META;
  protected readonly personTypeMeta = PERSON_TYPE_META;
  protected readonly riskMeta = RISK_LEVEL_META;
  protected readonly decisionMeta = DECISION_META;
  protected readonly groupMeta = USER_GROUP_META;

  protected readonly detailsOpen = signal(false);
  protected readonly openSections = signal<ReadonlySet<string>>(new Set());
  protected readonly query = signal('');
  protected readonly statusFilter = signal('');
  protected readonly typologyFilter = signal<AlertTypology | ''>('');
  protected readonly sortKey = signal<SortKey>('alertDate');
  protected readonly sortAsc = signal(false);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly selected = signal<Alert | null>(null);

  protected readonly person = computed(() => findPerson(this.personId()));

  protected readonly alerts = computed<readonly Alert[]>(() =>
    this.store.alertsOfPerson(this.personId()),
  );

  /** Statuts réellement portés par les alertes de la personne. */
  protected readonly statuses = computed(() => [
    ...new Set(this.alerts().map((alert) => alert.status)),
  ]);

  protected readonly risks = computed<readonly RiskComponent[]>(() => this.person()?.risks ?? []);

  /** Composante la plus sévère : c'est elle qui porte le risque global. */
  protected readonly globalRisk = computed<RiskComponent | null>(() => {
    const risks = this.risks();
    if (!risks.length) return null;
    return risks.reduce((worst, current) =>
      RISK_LEVEL_META[current.level].severity > RISK_LEVEL_META[worst.level].severity
        ? current
        : worst,
    );
  });

  protected readonly filtered = computed<readonly Alert[]>(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    const typology = this.typologyFilter();

    return this.alerts().filter((alert) => {
      if (status && alert.status !== status) return false;
      if (typology && alert.typology !== typology) return false;
      if (!query) return true;
      return [alert.reference, alert.detail, alert.user ?? '', alert.status]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  });

  protected readonly sorted = computed<readonly Alert[]>(() => {
    const key = this.sortKey();
    const direction = this.sortAsc() ? 1 : -1;

    return this.filtered()
      .slice()
      .sort((left, right) => compare(left, right, key) * direction);
  });

  protected readonly rows = computed<readonly Alert[]>(() => {
    const from = this.page() * this.pageSize();
    return this.sorted().slice(from, from + this.pageSize());
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.sorted().length / this.pageSize())),
  );

  protected readonly counterLabel = computed(() => {
    const total = this.sorted().length;
    return `${total} alerte${total > 1 ? 's' : ''}`;
  });

  protected readonly pageLabel = computed(() => {
    const total = this.sorted().length;
    if (!total) return '0 résultat';
    const from = this.page() * this.pageSize() + 1;
    const to = Math.min(from + this.pageSize() - 1, total);
    return `${from}–${to} sur ${total}`;
  });

  /* --- Interactions -------------------------------------------------------- */

  protected isOpen(section: string): boolean {
    return this.openSections().has(section);
  }

  protected toggleSection(section: string): void {
    this.openSections.update((sections) => {
      const next = new Set(sections);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortAsc.update((ascending) => !ascending);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
    this.page.set(0);
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortAsc() ? 'ascending' : 'descending';
  }

  /**
   * Couleur du statut dans le tableau : orange tant que l'alerte est ouverte,
   * rouge lorsqu'elle appelle une mesure, vert une fois écartée.
   */
  protected statusVariant(status: AlertStatus): 'open' | 'escalated' | 'closed' | 'blacklisted' {
    switch (status) {
      case 'TO_CLEAR_L1':
      case 'IN_PROCESS_L1':
      case 'IN_PROCESS_L2':
        return 'open';
      case 'ESCALATED_L2':
      case 'ENFORCED_SCRUTINY':
        return 'escalated';
      /* Noir plein, jamais rouge : l'inscription au gel doit se distinguer au
         premier coup d'œil d'une simple escalade. */
      case 'BLACKLISTED':
        return 'blacklisted';
      default:
        return 'closed';
    }
  }

  protected decisionVariant(decision: Decision): string {
    switch (decision) {
      case 'ENFORCED_SCRUTINY':
        return 'enhanced';
      case 'CLEARED_L1':
        return 'cleared';
      case 'CLEARED_L2':
        return 'validated';
      case 'BLACKLISTED':
        return 'blacklisted';
      default:
        return 'pending';
    }
  }

  protected openDrawer(alert: Alert): void {
    this.selected.set(alert);
  }

  protected closeDrawer(): void {
    this.selected.set(null);
  }

  protected resetPage(): void {
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(Math.min(Math.max(0, page), this.pageCount() - 1));
  }

  protected openAlert(alert: Alert): void {
    void this.router.navigate(['/alerts', alert.id]);
  }
}

function compare(left: Alert, right: Alert, key: SortKey): number {
  switch (key) {
    case 'alertDate':
      return sortableDate(left.alertDate).localeCompare(sortableDate(right.alertDate));
    case 'processedAt':
      return sortableDate(left.processedAt).localeCompare(sortableDate(right.processedAt));
    case 'decision':
      return (left.decision ?? '').localeCompare(right.decision ?? '');
    default:
      return String(left[key] ?? '').localeCompare(String(right[key] ?? ''), undefined, {
        numeric: true,
      });
  }
}
