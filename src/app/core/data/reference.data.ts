/**
 * Référentiel des filiales et des comptes utilisateurs.
 *
 * Les filiales, sous-entités, identifiants système et comptes sont **fictifs**.
 * Ils alimentent les colonnes « Entity », « Sub-entity », « User group » et
 * « User » des corbeilles, ainsi que les filtres du panneau de recherche.
 *
 * Deux règles tiennent le jeu de données :
 *   - cinq filiales, pas davantage ;
 *   - un identifiant système par filiale, porté par la filiale elle-même.
 */

import type { Entity, User } from '../models';

export const ENTITIES = [
  {
    id: 'nordia',
    name: 'Nordia Life',
    country: 'Irlande',
    subEntity: 'Nordia Life DAC',
    systemId: 'SYS_NORDIA',
  },
  {
    id: 'astrea',
    name: 'Astrea Assurances',
    country: 'France',
    subEntity: 'Astrea France',
    systemId: 'SYS_ASTREA',
  },
  {
    id: 'verema',
    name: 'Verema Seguros',
    country: 'Espagne',
    subEntity: 'Verema España',
    systemId: 'SYS_VEREMA',
  },
  {
    id: 'lumina',
    name: 'Lumina Vita',
    country: 'Italie',
    subEntity: 'Lumina Italia',
    systemId: 'SYS_LUMINA',
  },
  {
    id: 'helvia',
    name: 'Helvia Insurance',
    country: 'Luxembourg',
    subEntity: 'Helvia Luxembourg',
    systemId: 'SYS_HELVIA',
  },
] as const satisfies readonly Entity[];

/** Clé d'une filiale — l'union des identifiants ci-dessus. */
export type EntityId = (typeof ENTITIES)[number]['id'];

const ENTITY_INDEX = new Map(ENTITIES.map((entity) => [entity.id, entity]));

export function entityOf(id: EntityId): Entity {
  return ENTITY_INDEX.get(id)!;
}

/** Noms de filiale, dans l'ordre du filtre « Entity ». */
export const ENTITY_NAMES: readonly string[] = ENTITIES.map((entity) => entity.name);

/** Sous-entités, pour le filtre « Sub-entity ». */
export const SUB_ENTITY_NAMES: readonly string[] = ENTITIES.map((entity) => entity.subEntity);

/** Identifiants système — un par filiale, d'où l'égalité des deux longueurs. */
export const SYSTEM_IDS: readonly string[] = ENTITIES.map((entity) => entity.systemId);

/* -----------------------------------------------------------------------------
   Comptes
   -------------------------------------------------------------------------- */

export const USERS: readonly User[] = [
  {
    id: 'STRAN',
    firstName: 'Sébastien',
    lastName: 'Tran',
    email: 'sebastien.tran@example.com',
    group: 'LEVEL_2',
    entityId: 'lumina',
  },
  {
    id: 'ADUBOIS',
    firstName: 'Alice',
    lastName: 'Dubois',
    email: 'alice.dubois@example.com',
    group: 'LEVEL_2',
    entityId: 'nordia',
  },
  {
    id: 'MRENARD',
    firstName: 'Marc',
    lastName: 'Renard',
    email: 'marc.renard@example.com',
    group: 'LEVEL_2',
    entityId: 'helvia',
  },
  {
    id: 'LFONTAINE',
    firstName: 'Léa',
    lastName: 'Fontaine',
    email: 'lea.fontaine@example.com',
    group: 'LEVEL_2',
    entityId: 'nordia',
  },
  {
    id: 'PMOREAU',
    firstName: 'Paul',
    lastName: 'Moreau',
    email: 'paul.moreau@example.com',
    group: 'LEVEL_1',
    entityId: 'lumina',
  },
  {
    id: 'CGARNIER',
    firstName: 'Chloé',
    lastName: 'Garnier',
    email: 'chloe.garnier@example.com',
    group: 'LEVEL_1',
    entityId: 'astrea',
  },
];

/** Compte ouvert par défaut. */
export const DEFAULT_USER_ID = 'STRAN';

/** Identifiants de connexion, pour le filtre « User » et l'affectation. */
export const USER_IDS: readonly string[] = USERS.map((user) => user.id);
