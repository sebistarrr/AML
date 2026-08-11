/**
 * Référentiel métier — AML PROJECT.
 *
 * Tous les libellés, codes et variantes de couleur des énumérations sont
 * centralisés ici : c'est la seule source de vérité pour l'affichage d'un
 * statut, d'une typologie d'alerte, d'une décision ou d'un niveau de risque.
 * Aucun composant ne redéfinit un libellé localement.
 *
 * Les valeurs suivent le design de référence : codes de statut en capitales,
 * typologies d'alerte limitées aux quatre dispositifs de screening du groupe.
 */

/* -----------------------------------------------------------------------------
   Typologie d'alerte — les quatre seuls dispositifs de screening
   -------------------------------------------------------------------------- */

export type AlertTypology = 'SANCTION' | 'PEP' | 'RCA' | 'HRTC';

export const ALERT_TYPOLOGIES: readonly AlertTypology[] = [
  'SANCTION',
  'PEP',
  'RCA',
  'HRTC',
] as const;

export interface AlertTypologyMeta {
  /** Libellé affiché dans les corbeilles et l'onglet de traitement. */
  readonly label: string;
  /** Libellé français, utilisé par les écrans de profil de risque. */
  readonly labelFr: string;
  readonly description: string;
  /** Icône Material Symbols associée au dispositif. */
  readonly icon: string;
}

export const ALERT_TYPOLOGY_META: Record<AlertTypology, AlertTypologyMeta> = {
  SANCTION: {
    label: 'Asset Freeze',
    labelFr: 'Gel des avoirs',
    description:
      'Correspondance avec une personne ou une entité figurant sur une liste de sanctions internationales (UE, OFAC, ONU, HM Treasury).',
    icon: 'ac_unit',
  },
  PEP: {
    label: 'Politically Exposed Person',
    labelFr: 'Personne politiquement exposée',
    description:
      'Correspondance avec une personne exerçant ou ayant exercé une fonction publique importante, soumise à une vigilance renforcée.',
    icon: 'workspace_premium',
  },
  RCA: {
    label: 'Relatives and Close Associates',
    labelFr: "Proche ou associé d'une personne listée",
    description:
      "Correspondance avec un membre de la famille ou un associé proche d'une personne politiquement exposée ou sanctionnée.",
    icon: 'verified_user',
  },
  HRTC: {
    label: 'High Risk Third Country',
    labelFr: 'Pays tiers à haut risque',
    description:
      'Rattachement du client à un pays tiers présentant des carences stratégiques dans son dispositif de lutte contre le blanchiment.',
    icon: 'public',
  },
};

/* -----------------------------------------------------------------------------
   Statut de l'alerte dans le workflow
   -------------------------------------------------------------------------- */

export type AlertStatus =
  | 'TO_CLEAR_L1'
  | 'IN_PROCESS_L1'
  | 'ESCALATED_L2'
  | 'IN_PROCESS_L2'
  | 'CLEARED_L1'
  | 'CLEARED_L2'
  | 'ENFORCED_SCRUTINY'
  | 'BLACKLISTED';

/** Statuts d'une alerte encore ouverte — ordre du filtre « Status ». */
export const OPEN_ALERT_STATUSES: readonly AlertStatus[] = [
  'TO_CLEAR_L1',
  'IN_PROCESS_L1',
  'ESCALATED_L2',
  'IN_PROCESS_L2',
] as const;

/** Statuts terminaux, présents dans la corbeille « Processed alerts ». */
export const CLOSED_ALERT_STATUSES: readonly AlertStatus[] = [
  'CLEARED_L1',
  'CLEARED_L2',
  'ENFORCED_SCRUTINY',
  'BLACKLISTED',
] as const;

export const ALERT_STATUSES: readonly AlertStatus[] = [
  ...OPEN_ALERT_STATUSES,
  ...CLOSED_ALERT_STATUSES,
] as const;

/** Palette de pastilles partagée par les statuts, décisions et niveaux de risque. */
export type Tone = 'neutral' | 'info' | 'warning' | 'critical' | 'success' | 'black';

export interface AlertStatusMeta {
  readonly description: string;
  readonly tone: Tone;
  /** Niveau d'habilitation en charge de l'alerte à ce stade. */
  readonly level: 1 | 2 | null;
}

export const ALERT_STATUS_META: Record<AlertStatus, AlertStatusMeta> = {
  TO_CLEAR_L1: {
    description: 'Alerte générée par le moteur de screening, en attente de prise en charge.',
    tone: 'info',
    level: 1,
  },
  IN_PROCESS_L1: {
    description: 'Analyse en cours par un analyste de niveau 1.',
    tone: 'warning',
    level: 1,
  },
  ESCALATED_L2: {
    description: 'Transmise au niveau 2 pour décision réglementaire.',
    tone: 'critical',
    level: 2,
  },
  IN_PROCESS_L2: {
    description: 'Analyse en cours par un analyste de niveau 2.',
    tone: 'warning',
    level: 2,
  },
  CLEARED_L1: {
    description: 'Alerte écartée au niveau 1 : aucun risque retenu.',
    tone: 'success',
    level: 1,
  },
  CLEARED_L2: {
    description: 'Alerte écartée au niveau 2 : aucun risque retenu.',
    tone: 'success',
    level: 2,
  },
  ENFORCED_SCRUTINY: {
    description: 'Client placé sous vigilance renforcée à la suite de la décision.',
    tone: 'critical',
    level: 2,
  },
  BLACKLISTED: {
    description: 'Correspondance avérée : le client est inscrit sous mesure de gel.',
    tone: 'black',
    level: 2,
  },
};

export function isClosedStatus(status: AlertStatus): boolean {
  return CLOSED_ALERT_STATUSES.includes(status);
}

/* -----------------------------------------------------------------------------
   Décisions de clôture — libellés repris de l'écran de traitement
   -------------------------------------------------------------------------- */

export type Decision =
  'CLEARED_L1' | 'ESCALATED_L2' | 'CLEARED_L2' | 'ENFORCED_SCRUTINY' | 'BLACKLISTED';

export interface DecisionMeta {
  /** Libellé du bouton radio de l'écran de traitement. */
  readonly label: string;
  /** Libellé français, utilisé par le tableau d'alertes du profil de risque. */
  readonly labelFr: string;
  readonly tone: Tone;
  /** Niveau habilité à prononcer la décision. */
  readonly requiredLevel: 1 | 2;
  /**
   * Vrai lorsque la décision est proposée dans le panneau de traitement.
   * La vigilance renforcée découle d'une revue périodique du profil client,
   * pas de la clôture d'une alerte : elle n'y figure donc pas.
   */
  readonly offeredInPanel: boolean;
  /** Statut porté par l'alerte une fois la décision enregistrée. */
  readonly resultingStatus: AlertStatus;
  /** Ce que la décision déclenche concrètement. */
  readonly consequence: string;
}

export const DECISION_META: Record<Decision, DecisionMeta> = {
  CLEARED_L1: {
    label: 'Cleared alert - No Risk - Level 1',
    labelFr: 'Écartée',
    tone: 'success',
    requiredLevel: 1,
    offeredInPanel: true,
    resultingStatus: 'CLEARED_L1',
    consequence:
      "L'alerte est clôturée sans suite. Aucune mesure de vigilance renforcée n'est déclenchée sur la personne.",
  },
  ESCALATED_L2: {
    label: 'Escalate to Level 2',
    labelFr: 'Escaladée',
    tone: 'critical',
    requiredLevel: 1,
    offeredInPanel: true,
    resultingStatus: 'ESCALATED_L2',
    consequence: "L'alerte est transmise au niveau 2 pour décision réglementaire.",
  },
  CLEARED_L2: {
    label: 'Cleared alert - No Risk - Level 2',
    labelFr: 'Validée',
    tone: 'success',
    requiredLevel: 2,
    offeredInPanel: true,
    resultingStatus: 'CLEARED_L2',
    consequence:
      "L'alerte est clôturée après analyse de niveau 2. Le rapprochement est mémorisé afin de limiter la régénération d'alertes identiques.",
  },
  ENFORCED_SCRUTINY: {
    label: 'Enforced scrutiny',
    labelFr: 'Vigilance renforcée',
    tone: 'critical',
    requiredLevel: 2,
    offeredInPanel: false,
    resultingStatus: 'ENFORCED_SCRUTINY',
    consequence:
      'La personne est placée sous vigilance renforcée : ses opérations font l’objet d’un suivi rapproché.',
  },
  BLACKLISTED: {
    label: 'Blacklisted - Under Sanctions',
    labelFr: 'Blacklistée',
    tone: 'black',
    requiredLevel: 2,
    offeredInPanel: true,
    resultingStatus: 'BLACKLISTED',
    consequence:
      "La personne est inscrite sous mesure de gel des avoirs, la relation d'affaires est bloquée et un dossier de déclaration de soupçon est ouvert.",
  },
};

/** Décisions proposées dans le panneau, au niveau d'habilitation indiqué. */
export function decisionsForLevel(level: 1 | 2): readonly Decision[] {
  return (Object.keys(DECISION_META) as Decision[]).filter(
    (decision) =>
      DECISION_META[decision].requiredLevel === level && DECISION_META[decision].offeredInPanel,
  );
}

/** Longueur maximale de la justification, imposée par le formulaire de décision. */
export const JUSTIFICATION_MAX_LENGTH = 1000;

/* -----------------------------------------------------------------------------
   Type de personne
   -------------------------------------------------------------------------- */

export type PersonType = 'NATURAL' | 'LEGAL';

export interface PersonTypeMeta {
  readonly label: string;
  readonly labelFr: string;
  readonly icon: string;
}

export const PERSON_TYPE_META: Record<PersonType, PersonTypeMeta> = {
  NATURAL: { label: 'Natural Person', labelFr: 'Personne physique', icon: 'person' },
  LEGAL: { label: 'Legal Entity', labelFr: 'Personne morale', icon: 'apartment' },
};

/* -----------------------------------------------------------------------------
   Niveau de risque d'un composant du profil client
   -------------------------------------------------------------------------- */

export type RiskLevel =
  'Sans risque' | 'Données incomplètes' | 'Alerte en cours' | 'Vigilance renforcée' | 'Blacklisté';

export interface RiskLevelMeta {
  /** Poids de sévérité : le risque global est le composant le plus élevé. */
  readonly severity: number;
  /** Classe de couleur utilisée par le profil de risque. */
  readonly variant: 'risk-green' | 'risk-grey' | 'risk-orange' | 'risk-red' | 'risk-black';
}

export const RISK_LEVEL_META: Record<RiskLevel, RiskLevelMeta> = {
  'Sans risque': { severity: 1, variant: 'risk-green' },
  'Données incomplètes': { severity: 2, variant: 'risk-grey' },
  'Alerte en cours': { severity: 3, variant: 'risk-orange' },
  'Vigilance renforcée': { severity: 4, variant: 'risk-red' },
  Blacklisté: { severity: 5, variant: 'risk-black' },
};

/* -----------------------------------------------------------------------------
   Circuit d'alimentation du moteur de screening
   -------------------------------------------------------------------------- */

export type Circuit = 'Temps réel' | 'Batch';

/* -----------------------------------------------------------------------------
   Source d'une ligne de rapprochement
   -------------------------------------------------------------------------- */

export type ReconciliationSource = 'PERSON' | 'FACTIVA';
