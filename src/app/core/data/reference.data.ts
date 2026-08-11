/**
 * Référentiel des entités du groupe et des comptes utilisateurs.
 *
 * Les entités, sous-entités et identifiants de connexion reprennent ceux des
 * maquettes de référence : ce sont eux qui alimentent les colonnes
 * « Entity », « Sub-entity », « User group » et « User » des corbeilles.
 */

import type { Entity, User } from '../models';

export const ENTITIES: readonly Entity[] = [
  {
    id: 'europe-life',
    name: 'CNP Europe Life DAC',
    country: 'Irlande',
    subEntities: ['CNP Europe Life DAC'],
  },
  { id: 'italia', name: 'CNP Italia', country: 'Italie', subEntities: ['CNP Italia'] },
  { id: 'abp', name: 'CNP ABP', country: 'France', subEntities: ['CNP ABP'] },
  {
    id: 'luxembourg',
    name: 'CNP Luxembourg',
    country: 'Luxembourg',
    subEntities: ['CNP Luxembourg'],
  },
  {
    id: 'iberia',
    name: 'CNP Iberia',
    country: 'Espagne',
    subEntities: ['CNP Iberia', 'CNP España'],
  },
  { id: 'assicura', name: 'CNP Assicura', country: 'Italie', subEntities: ['CNP Assicura'] },
  {
    id: 'assurances',
    name: 'CNP Assurances',
    country: 'France',
    subEntities: ['CNP France'],
  },
];

/** Noms d'entité, dans l'ordre du filtre « Entity » du panneau de recherche. */
export const ENTITY_NAMES: readonly string[] = ENTITIES.map((entity) => entity.name);

/** Sous-entités, dédoublonnées, pour le filtre « Sub-entity ». */
export const SUB_ENTITY_NAMES: readonly string[] = [
  ...new Set(ENTITIES.flatMap((entity) => entity.subEntities)),
];

export const USERS: readonly User[] = [
  {
    id: 'STRAN',
    firstName: 'Sébastien',
    lastName: 'Tran',
    email: 'sebastien.tran@cnp.fr',
    group: 'LEVEL_2',
    entityId: 'assicura',
  },
  {
    id: 'BFOURCAD',
    firstName: 'Bruno',
    lastName: 'Fourcade',
    email: 'bruno.fourcade@cnp.fr',
    group: 'LEVEL_2',
    entityId: 'europe-life',
  },
  {
    id: 'FMAHDJAN',
    firstName: 'Farid',
    lastName: 'Mahdjan',
    email: 'farid.mahdjan@cnp.fr',
    group: 'LEVEL_2',
    entityId: 'luxembourg',
  },
  {
    id: 'OHEJJAJ1',
    firstName: 'Omar',
    lastName: 'Hejjaj',
    email: 'omar.hejjaj@cnp.fr',
    group: 'LEVEL_2',
    entityId: 'europe-life',
  },
  {
    id: 'FVALET',
    firstName: 'Fanny',
    lastName: 'Valet',
    email: 'fanny.valet@cnp.fr',
    group: 'LEVEL_1',
    entityId: 'italia',
  },
  {
    id: 'MCARRERE',
    firstName: 'Manon',
    lastName: 'Carrère',
    email: 'manon.carrere@cnp.fr',
    group: 'LEVEL_1',
    entityId: 'abp',
  },
];

/** Compte ouvert par défaut : celui du bandeau des maquettes. */
export const DEFAULT_USER_ID = 'STRAN';

/** Identifiants de connexion, pour le filtre « User » et l'affectation. */
export const USER_IDS: readonly string[] = USERS.map((user) => user.id);
