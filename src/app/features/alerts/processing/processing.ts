import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { USER_IDS } from '../../../core/data/reference.data';
import {
  ALERT_HISTORY_ACTION_LABELS,
  ALERT_STATUS_META,
  ALERT_TYPOLOGY_META,
  DECISION_META,
  JUSTIFICATION_MAX_LENGTH,
  PERSON_TYPE_META,
  USER_GROUP_META,
  decisionsForLevel,
  isClosedStatus,
  type Decision,
  type UserGroup,
} from '../../../core/models';
import { AlertStore } from '../../../core/state/alert-store';
import { ToastService } from '../../../core/services/toast.service';
import { DashPipe, RatePipe } from '../../../shared/pipes/format.pipes';
import { ModalComponent } from '../../../shared/ui/overlay/modal';

type Tab = 'person' | 'alert' | 'history';

/** Colonnes du tableau de rapprochement, dans l'ordre de la maquette. */
const RECONCILIATION_COLUMNS = [
  'Source',
  'Rate',
  'Surname',
  'Alternate name',
  'Usual given name',
  'List of given names',
  'Gender',
  'Date of birth',
  'Year of birth',
  'Place code of birth',
  'Country of birth',
  'Country code of the address',
  'Citizenship country',
] as const;

/**
 * Poste de travail d'analyse d'une alerte.
 *
 * Trois onglets — la personne, l'alerte, son historique — et deux actions
 * transverses : commenter et affecter. La décision se prend dans l'onglet de
 * l'alerte, sous le tableau de rapprochement qui la motive.
 */
@Component({
  selector: 'app-processing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, DashPipe, RatePipe],
  templateUrl: './processing.html',
  styleUrl: './processing.scss',
})
export class ProcessingComponent {
  private readonly store = inject(AlertStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toasts = inject(ToastService);

  /** Identifiant de l'alerte, lié au paramètre de route. */
  readonly alertId = input.required<string>();

  protected readonly reconciliationColumns = RECONCILIATION_COLUMNS;
  protected readonly typologyMeta = ALERT_TYPOLOGY_META;
  protected readonly personTypeMeta = PERSON_TYPE_META;
  protected readonly statusMeta = ALERT_STATUS_META;
  protected readonly groupMeta = USER_GROUP_META;
  protected readonly decisionMeta = DECISION_META;
  protected readonly historyLabels = ALERT_HISTORY_ACTION_LABELS;
  protected readonly users = USER_IDS;
  protected readonly groups: readonly UserGroup[] = ['LEVEL_1', 'LEVEL_2'];
  protected readonly maxJustification = JUSTIFICATION_MAX_LENGTH;

  protected readonly tab = signal<Tab>('alert');
  protected readonly commentOpen = signal(false);
  protected readonly assignOpen = signal(false);
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());

  protected readonly commentDraft = signal('');
  protected readonly assignGroup = signal<UserGroup>('LEVEL_2');
  protected readonly assignUser = signal('');
  protected readonly assignComment = signal('');

  protected readonly decision = signal<Decision | null>(null);
  protected readonly justification = signal('');

  protected readonly reconciliationPageSize = signal(10);
  protected readonly reconciliationPage = signal(0);

  protected readonly alert = computed(() => this.store.byId(Number(this.alertId())));
  protected readonly person = computed(() => {
    const alert = this.alert();
    return alert ? this.store.personOf(alert) : undefined;
  });

  protected readonly comments = computed(() => this.store.commentsOf(Number(this.alertId())));
  protected readonly history = computed(() => this.store.historyOf(Number(this.alertId())));

  /** Décisions ouvertes au niveau d'habilitation du compte courant. */
  protected readonly availableDecisions = computed(() => decisionsForLevel(this.auth.level()));

  protected readonly isClosed = computed(() => {
    const alert = this.alert();
    return alert ? isClosedStatus(alert.status) : false;
  });

  protected readonly canDecide = computed(
    () => !this.isClosed() && this.availableDecisions().length > 0,
  );

  protected readonly canValidate = computed(
    () => this.decision() !== null && this.justification().trim().length > 0,
  );

  /** Ligne de référence du référentiel : elle reste en tête, hors pagination. */
  private readonly referenceRow = computed(() =>
    this.alert()?.reconciliation.find((row) => row.source === 'PERSON'),
  );

  /** Fiches rapprochées : ce sont elles que compte le paginateur. */
  private readonly matchedRows = computed(
    () => this.alert()?.reconciliation.filter((row) => row.source !== 'PERSON') ?? [],
  );

  protected readonly reconciliationRows = computed(() => {
    const from = this.reconciliationPage() * this.reconciliationPageSize();
    const page = this.matchedRows().slice(from, from + this.reconciliationPageSize());
    const reference = this.referenceRow();
    return reference ? [reference, ...page] : page;
  });

  protected readonly reconciliationRange = computed(() => {
    const total = this.matchedRows().length;
    if (!total) return '0 of 0';
    const from = this.reconciliationPage() * this.reconciliationPageSize() + 1;
    const to = Math.min(from + this.reconciliationPageSize() - 1, total);
    return `${from} - ${to} of ${total}`;
  });

  protected readonly personTabLabel = computed(() => {
    const alert = this.alert();
    return `Person details - ${alert ? PERSON_TYPE_META[alert.personType].label : ''}`;
  });

  protected readonly alertTabLabel = computed(() => {
    const alert = this.alert();
    return `Alert details - ${alert ? ALERT_TYPOLOGY_META[alert.typology].label : ''}`;
  });

  /* --- Interactions -------------------------------------------------------- */

  protected back(): void {
    this.location.back();
  }

  protected isCollapsed(section: string): boolean {
    return this.collapsed().has(section);
  }

  protected toggleSection(section: string): void {
    this.collapsed.update((sections) => {
      const next = new Set(sections);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  protected openPersonProfile(): void {
    const person = this.person();
    if (person) void this.router.navigate(['/person', person.id]);
  }

  protected openComment(): void {
    this.commentDraft.set('');
    this.commentOpen.set(true);
  }

  protected submitComment(): void {
    const body = this.commentDraft().trim();
    if (!body) return;
    this.store.addComment(Number(this.alertId()), body);
    this.commentOpen.set(false);
    this.toasts.success('Commentaire ajouté', "Il est tracé dans l'historique de l'alerte.");
  }

  protected openAssign(): void {
    const alert = this.alert();
    this.assignGroup.set(alert?.userGroup ?? this.auth.currentUser().group);
    this.assignUser.set(alert?.user ?? this.auth.currentUser().id);
    this.assignComment.set('');
    this.assignOpen.set(true);
  }

  protected submitAssign(): void {
    const user = this.assignUser();
    if (!user) return;
    this.store.assign(Number(this.alertId()), this.assignGroup(), user, this.assignComment());
    this.assignOpen.set(false);
    this.toasts.success('Alerte affectée', `Affectation à ${user}.`);
  }

  protected submitDecision(): void {
    const decision = this.decision();
    if (!decision || !this.canValidate()) return;
    this.store.decide(Number(this.alertId()), decision, this.justification());
    this.decision.set(null);
    this.justification.set('');
    this.toasts.success('Décision enregistrée', DECISION_META[decision].consequence);
  }
}
