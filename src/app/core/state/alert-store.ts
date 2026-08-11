/**
 * Source de vérité des alertes.
 *
 * Toutes les mutations passent par ce store, et chacune écrit son propre
 * événement d'historique : il n'existe aucun chemin permettant de modifier une
 * alerte sans laisser de trace. Le journal est traité comme un registre en
 * écriture seule — aucun écran n'expose de modification ni de suppression
 * d'entrée.
 */

import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { ALERTS } from '../data/alerts.data';
import { findPerson } from '../data/persons.data';
import {
  DECISION_META,
  isClosedStatus,
  type Alert,
  type AlertHistoryEvent,
  type Decision,
  type Person,
  type UserGroup,
} from '../models';

/** Commentaire libre porté par une alerte. */
export interface AlertComment {
  readonly id: string;
  readonly alertId: number;
  readonly user: string;
  readonly userGroup: UserGroup;
  readonly createdAt: string;
  readonly body: string;
}

function now(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Historique initial reconstitué à partir du cycle de vie de l'alerte. */
function initialHistory(alert: Alert): AlertHistoryEvent[] {
  const events: AlertHistoryEvent[] = [
    {
      id: `${alert.id}-generated`,
      alertId: alert.id,
      date: alert.alertDateTime,
      action: 'ALERT_GENERATED',
      user: null,
      userGroup: null,
      previousValue: null,
      newValue: 'TO_CLEAR_L1',
      comment: null,
    },
  ];

  if (alert.user) {
    events.push({
      id: `${alert.id}-assigned`,
      alertId: alert.id,
      date: alert.alertDateTime,
      action: 'ALERT_ASSIGNED',
      user: alert.user,
      userGroup: alert.userGroup,
      previousValue: null,
      newValue: alert.user,
      comment: null,
    });
  }

  if (alert.status !== 'TO_CLEAR_L1') {
    events.push({
      id: `${alert.id}-status`,
      alertId: alert.id,
      date: alert.alertDateTime,
      action: 'STATUS_CHANGED',
      user: alert.user,
      userGroup: alert.userGroup,
      previousValue: 'TO_CLEAR_L1',
      newValue: alert.status,
      comment: null,
    });
  }

  if (alert.decision && alert.processedAt) {
    events.push({
      id: `${alert.id}-decision`,
      alertId: alert.id,
      date: `${alert.processedAt} 16:04`,
      action: 'DECISION_TAKEN',
      user: alert.user,
      userGroup: alert.userGroup,
      previousValue: null,
      newValue: DECISION_META[alert.decision].label,
      comment: alert.justification,
    });
  }

  return events;
}

@Injectable({ providedIn: 'root' })
export class AlertStore {
  private readonly auth = inject(AuthService);

  private readonly _alerts = signal<readonly Alert[]>(ALERTS);
  private readonly _comments = signal<readonly AlertComment[]>([]);
  private readonly _history = signal<readonly AlertHistoryEvent[]>(ALERTS.flatMap(initialHistory));

  private sequence = 0;

  readonly alerts = this._alerts.asReadonly();
  readonly comments = this._comments.asReadonly();
  readonly history = this._history.asReadonly();

  /** Alertes encore ouvertes — corbeille « Alert Basket ». */
  readonly openAlerts = computed(() =>
    this._alerts().filter((alert) => !isClosedStatus(alert.status)),
  );

  /** Alertes traitées — corbeille « Processed alerts ». */
  readonly processedAlerts = computed(() =>
    this._alerts().filter((alert) => isClosedStatus(alert.status)),
  );

  /** Alertes ouvertes affectées au compte courant — corbeille « My alerts ». */
  readonly myAlerts = computed(() => {
    const userId = this.auth.currentUser().id;
    return this.openAlerts().filter((alert) => alert.user === userId);
  });

  byId(alertId: number): Alert | undefined {
    return this._alerts().find((alert) => alert.id === alertId);
  }

  personOf(alert: Alert): Person | undefined {
    return findPerson(alert.personId);
  }

  alertsOfPerson(personId: string): readonly Alert[] {
    return this._alerts().filter((alert) => alert.personId === personId);
  }

  commentsOf(alertId: number): readonly AlertComment[] {
    return this._comments().filter((comment) => comment.alertId === alertId);
  }

  historyOf(alertId: number): readonly AlertHistoryEvent[] {
    return this._history()
      .filter((event) => event.alertId === alertId)
      .slice()
      .reverse();
  }

  /* --- Mutations ---------------------------------------------------------- */

  /** Affecte l'alerte à un analyste et trace le commentaire d'affectation. */
  assign(alertId: number, group: UserGroup, user: string, comment: string): void {
    const alert = this.byId(alertId);
    if (!alert) return;

    this.patch(alertId, {
      user,
      userGroup: group,
      status: alert.status === 'TO_CLEAR_L1' ? 'IN_PROCESS_L1' : alert.status,
    });

    this.trace({
      alertId,
      action: 'ALERT_ASSIGNED',
      previousValue: alert.user,
      newValue: user,
      comment: comment.trim() || null,
    });
  }

  addComment(alertId: number, body: string): void {
    const author = this.auth.currentUser();
    this._comments.update((comments) => [
      ...comments,
      {
        id: `c-${++this.sequence}`,
        alertId,
        user: author.id,
        userGroup: author.group,
        createdAt: now(),
        body: body.trim(),
      },
    ]);

    this.trace({
      alertId,
      action: 'COMMENT_ADDED',
      previousValue: null,
      newValue: null,
      comment: body.trim(),
    });
  }

  /** Enregistre une décision : statut, justification et date de traitement. */
  decide(alertId: number, decision: Decision, justification: string): void {
    const alert = this.byId(alertId);
    if (!alert) return;

    const meta = DECISION_META[decision];
    const author = this.auth.currentUser();

    this.patch(alertId, {
      status: meta.resultingStatus,
      decision,
      justification: justification.trim(),
      processedAt: now().slice(0, 10),
      user: author.id,
      userGroup: author.group,
    });

    this.trace({
      alertId,
      action: 'DECISION_TAKEN',
      previousValue: alert.status,
      newValue: meta.label,
      comment: justification.trim(),
    });
  }

  /* --- Écritures internes ------------------------------------------------- */

  private patch(alertId: number, changes: Partial<Alert>): void {
    this._alerts.update((alerts) =>
      alerts.map((alert) => (alert.id === alertId ? { ...alert, ...changes } : alert)),
    );
  }

  private trace(event: Omit<AlertHistoryEvent, 'id' | 'date' | 'user' | 'userGroup'>): void {
    const author = this.auth.currentUser();
    this._history.update((history) => [
      ...history,
      {
        ...event,
        id: `h-${++this.sequence}`,
        date: now(),
        user: author.id,
        userGroup: author.group,
      },
    ]);
  }
}
