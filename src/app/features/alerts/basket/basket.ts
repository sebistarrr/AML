import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ENTITY_NAMES, SUB_ENTITY_NAMES, USER_IDS } from '../../../core/data/reference.data';
import {
  ALERT_TYPOLOGIES,
  ALERT_TYPOLOGY_META,
  CLOSED_ALERT_STATUSES,
  OPEN_ALERT_STATUSES,
  PERSON_TYPE_META,
  USER_GROUP_META,
  sortableDate,
  type Alert,
  type AlertStatus,
  type AlertTypology,
  type PersonType,
  type UserGroup,
} from '../../../core/models';
import { AlertStore } from '../../../core/state/alert-store';
import { ToastService } from '../../../core/services/toast.service';
import { DashPipe, RatePipe } from '../../../shared/pipes/format.pipes';
import { DrawerComponent } from '../../../shared/ui/overlay/drawer';
import { ModalComponent } from '../../../shared/ui/overlay/modal';

/** Corbeille affichée, déduite de la route. */
export type BasketScope = 'mine' | 'open' | 'processed';

/** Colonne du tableau : clé de tri et libellé, dans l'ordre des maquettes. */
interface Column {
  readonly key: SortKey;
  readonly label: string;
}

type SortKey =
  | 'status'
  | 'personId'
  | 'systemId'
  | 'personType'
  | 'alertDate'
  | 'id'
  | 'typology'
  | 'subEntity'
  | 'entity'
  | 'userGroup'
  | 'user'
  | 'maxRate';

const COLUMNS: readonly Column[] = [
  { key: 'status', label: 'Status' },
  { key: 'personId', label: 'Person ID' },
  { key: 'systemId', label: 'System ID' },
  { key: 'personType', label: 'Person type' },
  { key: 'alertDate', label: 'Alert date' },
  { key: 'id', label: 'Alert ID' },
  { key: 'typology', label: 'Typology alert' },
  { key: 'subEntity', label: 'Sub-entity' },
  { key: 'entity', label: 'Entity' },
  { key: 'userGroup', label: 'User group' },
  { key: 'user', label: 'User' },
  { key: 'maxRate', label: 'Max rate (%)' },
];

/** État du panneau de filtres, tel qu'ouvert par « Filter and sort ». */
interface Filters {
  statuses: AlertStatus[];
  personId: string;
  systemId: string;
  personType: PersonType | '';
  startDate: string;
  endDate: string;
  alertId: string;
  typology: AlertTypology | '';
  entity: string;
  subEntity: string;
  userGroup: UserGroup | '';
  user: string;
  minRate: string;
  maxRate: string;
}

function emptyFilters(): Filters {
  return {
    statuses: [],
    personId: '',
    systemId: '',
    personType: '',
    startDate: '',
    endDate: '',
    alertId: '',
    typology: '',
    entity: '',
    subEntity: '',
    userGroup: '',
    user: '',
    minRate: '',
    maxRate: '',
  };
}

/**
 * Corbeilles d'alertes.
 *
 * Un seul composant sert les trois onglets : « My alerts », « Alert Basket »
 * et « Processed alerts ». Ils partagent le même tableau, le même panneau de
 * filtres et le même paginateur ; seuls le périmètre des alertes et les
 * actions disponibles changent.
 */
@Component({
  selector: 'app-basket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DrawerComponent, ModalComponent, DashPipe, RatePipe],
  templateUrl: './basket.html',
  styleUrl: './basket.scss',
})
export class BasketComponent {
  private readonly store = inject(AlertStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** Périmètre transmis par la route (`data: { scope }`). */
  readonly scope = input<BasketScope>('open');

  protected readonly columns = COLUMNS;
  protected readonly typologies = ALERT_TYPOLOGIES;
  protected readonly typologyMeta = ALERT_TYPOLOGY_META;
  protected readonly personTypeMeta = PERSON_TYPE_META;
  protected readonly groupMeta = USER_GROUP_META;
  protected readonly entities = ENTITY_NAMES;
  protected readonly subEntities = SUB_ENTITY_NAMES;
  protected readonly users = USER_IDS;
  protected readonly personTypes: readonly PersonType[] = ['NATURAL', 'LEGAL'];
  protected readonly groups: readonly UserGroup[] = ['LEVEL_1', 'LEVEL_2'];

  /** Statuts proposés au filtre : ceux que la corbeille peut contenir. */
  protected readonly statusOptions = computed<readonly AlertStatus[]>(() =>
    this.scope() === 'processed' ? CLOSED_ALERT_STATUSES : OPEN_ALERT_STATUSES,
  );

  protected readonly title = computed(() => {
    switch (this.scope()) {
      case 'mine':
        return 'My alerts';
      case 'processed':
        return 'Processed alerts';
      default:
        return 'Alert Basket';
    }
  });

  /** La corbeille des alertes traitées est en lecture seule. */
  protected readonly selectable = computed(() => this.scope() !== 'processed');

  protected readonly filterOpen = signal(false);
  protected readonly actionsOpen = signal(false);
  protected readonly assignOpen = signal(false);

  /** Filtres en cours de saisie, appliqués seulement au clic sur « Search ». */
  protected readonly draft = signal<Filters>(emptyFilters());
  protected readonly applied = signal<Filters>(emptyFilters());

  protected readonly sortKey = signal<SortKey>('alertDate');
  protected readonly sortAsc = signal(true);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly selection = signal<ReadonlySet<number>>(new Set());

  protected readonly assignGroup = signal<UserGroup>('LEVEL_2');
  protected readonly assignUser = signal<string>('');
  protected readonly assignComment = signal('');

  constructor() {
    /* Changer d'onglet remet la corbeille à son état d'ouverture : filtres
       vidés, sélection vide, première page. */
    effect(() => {
      this.scope();
      this.draft.set(emptyFilters());
      this.applied.set(emptyFilters());
      this.selection.set(new Set());
      this.page.set(0);
    });
  }

  /* --- Sélection des alertes du périmètre --------------------------------- */

  private readonly scoped = computed<readonly Alert[]>(() => {
    switch (this.scope()) {
      case 'mine':
        return this.store.myAlerts();
      case 'processed':
        return this.store.processedAlerts();
      default:
        return this.store.openAlerts();
    }
  });

  protected readonly filtered = computed<readonly Alert[]>(() => {
    const filters = this.applied();
    const minRate = filters.minRate === '' ? null : Number(filters.minRate);
    const maxRate = filters.maxRate === '' ? null : Number(filters.maxRate);
    const start = filters.startDate ? filters.startDate.replaceAll('-', '') : null;
    const end = filters.endDate ? filters.endDate.replaceAll('-', '') : null;

    return this.scoped().filter((alert) => {
      if (filters.statuses.length && !filters.statuses.includes(alert.status)) return false;
      if (
        filters.personId &&
        !alert.personId.toLowerCase().includes(filters.personId.toLowerCase())
      )
        return false;
      if (
        filters.systemId &&
        !alert.systemId.toLowerCase().includes(filters.systemId.toLowerCase())
      )
        return false;
      if (filters.personType && alert.personType !== filters.personType) return false;
      if (filters.alertId && !String(alert.id).includes(filters.alertId.trim())) return false;
      if (filters.typology && alert.typology !== filters.typology) return false;
      if (filters.entity && alert.entity !== filters.entity) return false;
      if (filters.subEntity && alert.subEntity !== filters.subEntity) return false;
      if (filters.userGroup && alert.userGroup !== filters.userGroup) return false;
      if (filters.user && alert.user !== filters.user) return false;
      if (minRate !== null && alert.maxRate < minRate) return false;
      if (maxRate !== null && alert.maxRate > maxRate) return false;

      const date = sortableDate(alert.alertDate);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  });

  protected readonly sorted = computed<readonly Alert[]>(() => {
    const key = this.sortKey();
    const direction = this.sortAsc() ? 1 : -1;

    return this.filtered()
      .slice()
      .sort((left, right) => {
        const comparison = compare(left, right, key);
        /* À date égale, l'ordre des identifiants garde le tableau stable. */
        return (comparison !== 0 ? comparison : left.id - right.id) * direction;
      });
  });

  protected readonly total = computed(() => this.sorted().length);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly rows = computed<readonly Alert[]>(() => {
    const from = this.page() * this.pageSize();
    return this.sorted().slice(from, from + this.pageSize());
  });

  /** Libellé du paginateur : « 1 - 10 of 706 ». */
  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (!total) return '0 of 0';
    const from = this.page() * this.pageSize() + 1;
    const to = Math.min(from + this.pageSize() - 1, total);
    return `${from} - ${to} of ${total}`;
  });

  protected readonly allOnPageSelected = computed(() => {
    const rows = this.rows();
    if (!rows.length) return false;
    const selection = this.selection();
    return rows.every((alert) => selection.has(alert.id));
  });

  protected readonly selectionCount = computed(() => this.selection().size);

  protected readonly canAssignOthers = computed(() => this.auth.has('alert:assign-others'));

  /* --- Interactions -------------------------------------------------------- */

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

  protected toggleRow(alertId: number): void {
    this.selection.update((selection) => {
      const next = new Set(selection);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  }

  protected toggleAllOnPage(): void {
    const rows = this.rows();
    const shouldSelect = !this.allOnPageSelected();
    this.selection.update((selection) => {
      const next = new Set(selection);
      for (const alert of rows) {
        if (shouldSelect) next.add(alert.id);
        else next.delete(alert.id);
      }
      return next;
    });
  }

  protected isSelected(alertId: number): boolean {
    return this.selection().has(alertId);
  }

  protected open(alert: Alert): void {
    void this.router.navigate(['/alerts', alert.id]);
  }

  protected changePageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(Math.min(Math.max(0, page), this.pageCount() - 1));
  }

  /* --- Panneau de filtres --------------------------------------------------- */

  protected openFilters(): void {
    this.draft.set({ ...this.applied(), statuses: [...this.applied().statuses] });
    this.filterOpen.set(true);
  }

  protected patchDraft<K extends keyof Filters>(key: K, value: Filters[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  protected toggleStatus(status: AlertStatus): void {
    this.draft.update((draft) => ({
      ...draft,
      statuses: draft.statuses.includes(status)
        ? draft.statuses.filter((candidate) => candidate !== status)
        : [...draft.statuses, status],
    }));
  }

  protected isStatusChecked(status: AlertStatus): boolean {
    return this.draft().statuses.includes(status);
  }

  protected readonly hasDraftFilter = computed(() => {
    const draft = this.draft();
    return (
      draft.statuses.length > 0 ||
      Object.entries(draft).some(([key, value]) => key !== 'statuses' && value !== '')
    );
  });

  protected clearFilters(): void {
    this.draft.set(emptyFilters());
  }

  protected applyFilters(): void {
    this.applied.set({ ...this.draft(), statuses: [...this.draft().statuses] });
    this.page.set(0);
    this.filterOpen.set(false);
  }

  /* --- Actions groupées ----------------------------------------------------- */

  protected openAssign(): void {
    this.actionsOpen.set(false);
    if (!this.selectionCount()) {
      this.toasts.info('Aucune alerte sélectionnée', 'Cochez au moins une alerte à affecter.');
      return;
    }
    this.assignUser.set(this.auth.currentUser().id);
    this.assignGroup.set(this.auth.currentUser().group);
    this.assignComment.set('');
    this.assignOpen.set(true);
  }

  protected confirmAssign(): void {
    const user = this.assignUser();
    if (!user) return;

    for (const alertId of this.selection()) {
      this.store.assign(alertId, this.assignGroup(), user, this.assignComment());
    }

    this.toasts.success(
      `${this.selectionCount()} alerte(s) affectée(s)`,
      `Affectation à ${user} (${this.groupMeta[this.assignGroup()].label}).`,
    );
    this.selection.set(new Set());
    this.assignOpen.set(false);
  }

  protected exportSelection(): void {
    this.actionsOpen.set(false);
    const rows = this.sorted().filter((alert) => this.selection().has(alert.id));
    const scope = rows.length ? rows : this.sorted();
    this.toasts.success(
      'Export préparé',
      `${scope.length} alerte(s) seront transmises au service d'export.`,
    );
  }
}

/** Comparaison d'une colonne, dans l'ordre naturel de la donnée affichée. */
function compare(left: Alert, right: Alert, key: SortKey): number {
  switch (key) {
    case 'id':
      return left.id - right.id;
    case 'maxRate':
      return left.maxRate - right.maxRate;
    case 'alertDate':
      return sortableDate(left.alertDate).localeCompare(sortableDate(right.alertDate));
    case 'personType':
      return PERSON_TYPE_META[left.personType].label.localeCompare(
        PERSON_TYPE_META[right.personType].label,
      );
    case 'typology':
      return ALERT_TYPOLOGY_META[left.typology].label.localeCompare(
        ALERT_TYPOLOGY_META[right.typology].label,
      );
    default: {
      const leftValue = String(left[key] ?? '');
      const rightValue = String(right[key] ?? '');
      return leftValue.localeCompare(rightValue, undefined, { numeric: true });
    }
  }
}
