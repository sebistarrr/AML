/**
 * Personnes screenées — physiques et morales.
 *
 * La structure suit champ pour champ le design de référence : les libellés
 * affichés sont portés par les écrans, mais l'ordre et le découpage des blocs
 * (identification, état civil, coordonnées postales, contrat, liens) sont
 * fixés ici pour rester cohérents d'un écran à l'autre.
 */

import type { AlertTypology, PersonType, RiskLevel } from './reference.model';

/** Valeur non renseignée par le référentiel : affichée « - » partout. */
export const NOT_PROVIDED = '-';

export interface PostalAddress {
  /** Primary address line - recipient name */
  readonly recipientName: string | null;
  /** Second address line - building complement */
  readonly buildingComplement: string | null;
  /** Third address line - external location complement */
  readonly locationComplement: string | null;
  /** Address line 4 - street number, extension and road type */
  readonly street: string | null;
  /** Fifth line of the postal address - additional complement */
  readonly additionalComplement: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly countryCode: string | null;
}

export interface Contract {
  readonly number: string | null;
  readonly role: string | null;
}

export interface PersonLink {
  readonly linkType: string;
  readonly personId: string;
  readonly personEntity: string;
  readonly linkedPersonId: string;
  readonly linkedPersonEntity: string;
}

/** État civil d'une personne physique. */
export interface NaturalPersonIdentity {
  readonly surname: string | null;
  readonly alternateName: string | null;
  readonly usualGivenName: string | null;
  readonly givenNames: string | null;
  readonly gender: string | null;
  readonly birthDate: string | null;
  readonly birthPlaceCode: string | null;
  readonly birthCountry: string | null;
}

/** Signalétique d'une personne morale. */
export interface LegalEntityIdentity {
  readonly companyName: string | null;
  readonly legalStatus: string | null;
  readonly reference: string | null;
  readonly incorporationCountry: string | null;
  readonly activityDomain: string | null;
  readonly creationDate: string | null;
  readonly companyIdentifier: string | null;
}

/** Composante de risque du profil client, une par typologie de screening. */
export interface RiskComponent {
  readonly code: AlertTypology;
  readonly level: RiskLevel;
  /** Date du dernier contrôle, au format JJ/MM/AAAA. */
  readonly lastCheckDate: string;
}

export interface Person {
  readonly id: string;
  readonly type: PersonType;
  readonly partnerId: string;
  readonly ricId: string | null;
  readonly systemId: string;
  readonly entity: string;
  readonly subEntity: string;
  /** Horodatage de la dernière mise à jour, au format JJ/MM/AAAA à HH:MM. */
  readonly updatedAt: string;

  readonly identity: NaturalPersonIdentity | null;
  readonly company: LegalEntityIdentity | null;

  readonly email: string | null;
  readonly phone: string | null;
  readonly iban: string | null;
  readonly address: PostalAddress;
  readonly contract: Contract;
  readonly links: readonly PersonLink[];

  /** Profil de risque : une composante par typologie présente sur la personne. */
  readonly risks: readonly RiskComponent[];
}

/* -----------------------------------------------------------------------------
   Calculs dérivés
   -------------------------------------------------------------------------- */

/** Nom affiché : raison sociale pour une personne morale, état civil sinon. */
export function personDisplayName(person: Person): string {
  if (person.type === 'LEGAL') return person.company?.companyName ?? person.id;
  const identity = person.identity;
  if (!identity) return person.id;
  const parts = [identity.surname, identity.usualGivenName].filter(Boolean);
  return parts.length ? parts.join(' ') : person.id;
}
