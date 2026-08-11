/**
 * Utilisateurs, groupes d'habilitation, entités et matrice des droits.
 *
 * Avertissement d'architecture : les permissions exposées ici pilotent
 * uniquement l'affichage. Elles ne constituent pas une couche de sécurité.
 * Toute action reste contrôlée côté backend, seul juge de l'habilitation
 * réelle de l'utilisateur.
 */

/** Groupe d'habilitation, affiché tel quel en colonne « User group ». */
export type UserGroup = 'LEVEL_1' | 'LEVEL_2';

export interface UserGroupMeta {
  /** Libellé affiché dans les corbeilles et l'écran de traitement. */
  readonly label: string;
  readonly description: string;
  readonly level: 1 | 2;
}

export const USER_GROUP_META: Record<UserGroup, UserGroupMeta> = {
  LEVEL_1: {
    label: 'Level 1',
    description:
      'Premier filtre. Écarte les correspondances manifestement fausses et escalade les cas nécessitant une analyse approfondie.',
    level: 1,
  },
  LEVEL_2: {
    label: 'Level 2',
    description:
      "Analyste conformité de l'entité. Prononce les décisions de clôture et d'inscription sous mesure de gel.",
    level: 2,
  },
};

/* -----------------------------------------------------------------------------
   Entités et sous-entités du groupe
   -------------------------------------------------------------------------- */

export interface Entity {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  /** Sous-entités rattachées. Une entité sans filiale se porte elle-même. */
  readonly subEntities: readonly string[];
}

/* -----------------------------------------------------------------------------
   Utilisateurs
   -------------------------------------------------------------------------- */

export interface User {
  /** Identifiant de connexion, affiché en colonne « User » (ex. STRAN). */
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly group: UserGroup;
  readonly entityId: string;
}

/** Forme d'affichage du compte dans le bandeau : « TRAN Sébastien ». */
export function accountLabel(user: Pick<User, 'firstName' | 'lastName'>): string {
  return `${user.lastName.toUpperCase()} ${user.firstName}`;
}

export function initials(user: Pick<User, 'firstName' | 'lastName'>): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

/* -----------------------------------------------------------------------------
   Permissions
   -------------------------------------------------------------------------- */

export type Permission =
  | 'alert:view'
  | 'alert:comment'
  | 'alert:assign'
  | 'alert:assign-others'
  | 'decision:clear-l1'
  | 'decision:escalate'
  | 'decision:clear-l2'
  | 'decision:blacklist'
  | 'person:search'
  | 'export:alerts';

const ANALYST_BASE: readonly Permission[] = [
  'alert:view',
  'alert:comment',
  'alert:assign',
  'person:search',
];

export const PERMISSIONS_BY_GROUP: Record<UserGroup, readonly Permission[]> = {
  LEVEL_1: [...ANALYST_BASE, 'decision:clear-l1', 'decision:escalate'],
  LEVEL_2: [
    ...ANALYST_BASE,
    'alert:assign-others',
    'decision:clear-l2',
    'decision:blacklist',
    'export:alerts',
  ],
};
