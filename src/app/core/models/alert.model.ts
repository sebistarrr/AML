/**
 * L'alerte : l'objet central de la plateforme.
 *
 * Elle relie une personne du référentiel à une fiche listée par le
 * fournisseur de données (Factiva), porte le détail du rapprochement calculé
 * par le moteur de similarité, et suit son propre cycle de vie dans le
 * workflow niveau 1 / niveau 2.
 */

import type {
  AlertStatus,
  AlertTypology,
  Circuit,
  Decision,
  PersonType,
  ReconciliationSource,
} from './reference.model';
import type { UserGroup } from './user.model';

/**
 * Une ligne du tableau de rapprochement par similarité. La première ligne
 * porte la source `PERSON` (les données du référentiel), les suivantes les
 * fiches `FACTIVA` rapprochées, avec leur taux.
 */
export interface ReconciliationRow {
  readonly source: ReconciliationSource;
  /** Taux de similarité en %, absent sur la ligne de référence. */
  readonly rate: number | null;
  readonly surname: string | null;
  readonly alternateName: string | null;
  readonly usualGivenName: string | null;
  readonly givenNames: string | null;
  readonly gender: string | null;
  readonly birthDate: string | null;
  readonly birthYear: string | null;
  readonly birthPlaceCode: string | null;
  readonly birthCountry: string | null;
  readonly addressCountryCode: string | null;
  readonly citizenshipCountry: string | null;
}

/** Action tracée dans l'onglet « Alert history ». */
export type AlertHistoryAction =
  'ALERT_GENERATED' | 'ALERT_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'DECISION_TAKEN';

export const ALERT_HISTORY_ACTION_LABELS: Record<AlertHistoryAction, string> = {
  ALERT_GENERATED: 'Alert generated',
  ALERT_ASSIGNED: 'Alert assigned',
  STATUS_CHANGED: 'Status changed',
  COMMENT_ADDED: 'Comment added',
  DECISION_TAKEN: 'Decision taken',
};

/**
 * Événement d'historique. Le journal est traité comme un registre en écriture
 * seule : aucun écran n'expose de modification ni de suppression d'entrée.
 */
export interface AlertHistoryEvent {
  readonly id: string;
  readonly alertId: number;
  /** Horodatage au format JJ/MM/AAAA HH:MM. */
  readonly date: string;
  readonly action: AlertHistoryAction;
  /** Identifiant de connexion de l'auteur, `null` pour le moteur de screening. */
  readonly user: string | null;
  readonly userGroup: UserGroup | null;
  readonly previousValue: string | null;
  readonly newValue: string | null;
  readonly comment: string | null;
}

export interface Alert {
  /** Identifiant métier, affiché en colonne « Alert ID ». */
  readonly id: number;
  /** Référence lisible du type ALERTE-2026-001, affichée sur le profil client. */
  readonly reference: string;
  readonly status: AlertStatus;
  readonly typology: AlertTypology;

  readonly personId: string;
  readonly personType: PersonType;
  readonly systemId: string;
  readonly entity: string;
  readonly subEntity: string;

  /** Date de génération, au format JJ/MM/AAAA. */
  readonly alertDate: string;
  /** Horodatage complet, affiché sur l'écran de traitement. */
  readonly alertDateTime: string;

  /** Taux de similarité maximal du rapprochement, en %. */
  readonly maxRate: number;
  /** Identifiant de la fiche du fournisseur de données, absent pour un HRTC. */
  readonly factivaId: string | null;
  /**
   * Détail affiché sur le profil client : référence de la fiche listée, ou
   * code pays pour une alerte de pays tiers à haut risque.
   */
  readonly detail: string;
  readonly circuit: Circuit;

  readonly userGroup: UserGroup | null;
  /** Identifiant de connexion de l'analyste affecté. */
  readonly user: string | null;

  readonly reconciliation: readonly ReconciliationRow[];

  readonly decision: Decision | null;
  readonly justification: string | null;
  /** Date de traitement, au format JJ/MM/AAAA. */
  readonly processedAt: string | null;
}

/* -----------------------------------------------------------------------------
   Calculs dérivés — sans effet de bord, réutilisables partout
   -------------------------------------------------------------------------- */

/** Convertit une date JJ/MM/AAAA en clé triable AAAAMMJJ. */
export function sortableDate(date: string | null): string {
  if (!date) return '';
  const [day, month, year] = date.split(/[/ ]/);
  return `${year ?? ''}${month ?? ''}${day ?? ''}`;
}

/** Taux formaté comme dans les corbeilles : « 99.5202 % ». */
export function formatRate(rate: number | null): string {
  if (rate === null) return '-';
  return `${Number(rate.toFixed(4))} %`;
}
