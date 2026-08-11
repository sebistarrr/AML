/**
 * Référentiel des personnes screenées.
 *
 * Les personnes des maquettes — CT313 (écran de traitement), PP123456789 et
 * PM123456789 (profils de risque), ainsi que les résultats de l'écran de
 * recherche — sont décrites champ pour champ. Les personnes portées par les
 * alertes générées sont dérivées de la ligne de référence de leur
 * rapprochement, ce qui garantit qu'une personne et ses alertes racontent la
 * même histoire.
 */

import type { Person, PersonLink, PostalAddress, RiskComponent, RiskLevel } from '../models';
import { ALERTS, PROFILE_LEGAL_PERSON_ID, PROFILE_NATURAL_PERSON_ID } from './alerts.data';

const EMPTY_ADDRESS: PostalAddress = {
  recipientName: null,
  buildingComplement: null,
  locationComplement: null,
  street: null,
  additionalComplement: null,
  postalCode: null,
  city: null,
  countryCode: null,
};

/** Coordonnées postales communes aux deux profils de risque de référence. */
const PROFILE_ADDRESS: PostalAddress = {
  recipientName: 'Adam Silva',
  buildingComplement: null,
  locationComplement: 'Immeuble Alpha',
  street: '31 rue de la République',
  additionalComplement: null,
  postalCode: '89905',
  city: 'Rennes',
  countryCode: 'FRA',
};

const PROFILE_LINKS: readonly PersonLink[] = [
  {
    linkType: 'Ultimate beneficial owner',
    personId: 'PM123456789',
    personEntity: 'CNP Italia',
    linkedPersonId: 'PP123456789',
    linkedPersonEntity: 'CNP Italia',
  },
  {
    linkType: 'Legal representative',
    personId: 'PM987654321',
    personEntity: 'CNP Italia',
    linkedPersonId: 'PP987654321',
    linkedPersonEntity: 'CNP Italia',
  },
];

/* -----------------------------------------------------------------------------
   Personnes reprises des maquettes
   -------------------------------------------------------------------------- */

/** Personne de l'écran de traitement : le référentiel ne porte que le nom d'usage. */
const CT313: Person = {
  id: 'CT313',
  type: 'NATURAL',
  partnerId: 'CT313',
  ricId: 'AAUW6266',
  systemId: 'CrashTest',
  entity: 'CNP Assicura',
  subEntity: 'CNP Assicura',
  updatedAt: '30/04/2026 à 17:56',
  identity: {
    surname: null,
    alternateName: null,
    usualGivenName: 'ZULETA DE MERCHAN',
    givenNames: null,
    gender: null,
    birthDate: null,
    birthPlaceCode: null,
    birthCountry: null,
  },
  company: null,
  email: null,
  phone: null,
  iban: null,
  address: EMPTY_ADDRESS,
  contract: { number: null, role: null },
  links: [],
  risks: [
    { code: 'SANCTION', level: 'Alerte en cours', lastCheckDate: '30/04/2026' },
    { code: 'PEP', level: 'Sans risque', lastCheckDate: '30/04/2026' },
    { code: 'RCA', level: 'Sans risque', lastCheckDate: '30/04/2026' },
    { code: 'HRTC', level: 'Données incomplètes', lastCheckDate: '30/04/2026' },
  ],
};

/** Personne physique du profil de risque de référence. */
const PROFILE_NATURAL: Person = {
  id: PROFILE_NATURAL_PERSON_ID,
  type: 'NATURAL',
  partnerId: PROFILE_NATURAL_PERSON_ID,
  ricId: 'AAUW6266',
  systemId: 'MART3',
  entity: 'CNP Italia',
  subEntity: 'CNP Italia',
  updatedAt: '05/07/2026 à 14:22',
  identity: {
    surname: 'TRAN',
    alternateName: 'Sébastien',
    usualGivenName: 'Alessandro',
    givenNames: 'Sébastien',
    gender: 'MALE',
    birthDate: '13/01/1959',
    birthPlaceCode: '35238',
    birthCountry: 'GBR',
  },
  company: null,
  email: 'adam.silva@example.com',
  phone: '+33721826165',
  iban: 'FR3142497172324603466156668',
  address: PROFILE_ADDRESS,
  contract: { number: '123456789', role: 'ADHERANT' },
  links: PROFILE_LINKS,
  risks: [
    { code: 'SANCTION', level: 'Alerte en cours', lastCheckDate: '03/07/2026' },
    { code: 'PEP', level: 'Vigilance renforcée', lastCheckDate: '01/07/2026' },
    { code: 'RCA', level: 'Sans risque', lastCheckDate: '05/07/2026' },
    { code: 'HRTC', level: 'Données incomplètes', lastCheckDate: '29/06/2026' },
  ],
};

/** Personne morale du profil de risque de référence. */
const PROFILE_LEGAL: Person = {
  id: PROFILE_LEGAL_PERSON_ID,
  type: 'LEGAL',
  partnerId: PROFILE_LEGAL_PERSON_ID,
  ricId: 'AAUW6266',
  systemId: 'MART3',
  entity: 'CNP Italia',
  subEntity: 'CNP Italia',
  updatedAt: '05/07/2026 à 14:22',
  identity: null,
  company: {
    companyName: 'TRAN HOLDING SAS',
    legalStatus: 'SAS',
    reference: 'REFD04PW',
    incorporationCountry: 'ESP',
    activityDomain: 'Immobilier',
    creationDate: '15/12/2025',
    companyIdentifier: 'COMPALPLL5',
  },
  email: 'adam.silva@example.com',
  phone: '+33721826165',
  iban: 'FR3142497172324603466156668',
  address: PROFILE_ADDRESS,
  contract: { number: '123456789', role: 'ADHERANT' },
  links: PROFILE_LINKS,
  risks: [
    { code: 'SANCTION', level: 'Blacklisté', lastCheckDate: '03/07/2026' },
    { code: 'HRTC', level: 'Données incomplètes', lastCheckDate: '29/06/2026' },
  ],
};

/** Deux autres personnes physiques retournées par l'écran de recherche. */
const SEARCH_NATURALS: readonly Person[] = [
  {
    ...PROFILE_NATURAL,
    id: 'PP123456790',
    partnerId: 'PP123456790',
    entity: 'CNP Assurances',
    subEntity: 'CNP France',
    identity: {
      surname: 'TRAN',
      alternateName: 'Alexandre',
      usualGivenName: 'Alexandre',
      givenNames: 'Alexandre Paul',
      gender: 'MALE',
      birthDate: '22/06/1972',
      birthPlaceCode: '75056',
      birthCountry: 'FRA',
    },
    risks: [
      { code: 'SANCTION', level: 'Sans risque', lastCheckDate: '02/07/2026' },
      { code: 'PEP', level: 'Sans risque', lastCheckDate: '02/07/2026' },
      { code: 'RCA', level: 'Alerte en cours', lastCheckDate: '04/07/2026' },
      { code: 'HRTC', level: 'Sans risque', lastCheckDate: '02/07/2026' },
    ],
  },
  {
    ...PROFILE_NATURAL,
    id: 'PP123456791',
    partnerId: 'PP123456791',
    systemId: 'MART4',
    entity: 'CNP Iberia',
    subEntity: 'CNP España',
    identity: {
      surname: 'TRAN',
      alternateName: 'Marie',
      usualGivenName: 'Marie',
      givenNames: 'Marie Claire',
      gender: 'FEMALE',
      birthDate: '04/11/1985',
      birthPlaceCode: '13055',
      birthCountry: 'FRA',
    },
    risks: [
      { code: 'SANCTION', level: 'Sans risque', lastCheckDate: '01/07/2026' },
      { code: 'PEP', level: 'Données incomplètes', lastCheckDate: '01/07/2026' },
      { code: 'RCA', level: 'Sans risque', lastCheckDate: '01/07/2026' },
      { code: 'HRTC', level: 'Sans risque', lastCheckDate: '01/07/2026' },
    ],
  },
];

/** Deux autres personnes morales retournées par l'écran de recherche. */
const SEARCH_LEGALS: readonly Person[] = [
  {
    ...PROFILE_LEGAL,
    id: 'PM123456790',
    partnerId: 'PM123456790',
    entity: 'CNP ABP',
    subEntity: 'CNP ABP',
    company: {
      companyName: 'TRAN SERVICES',
      legalStatus: 'SARL',
      reference: 'REFK72PL',
      incorporationCountry: 'FRA',
      activityDomain: 'Services financiers',
      creationDate: '08/04/2021',
      companyIdentifier: 'COMPTRN782',
    },
    risks: [
      { code: 'SANCTION', level: 'Sans risque', lastCheckDate: '03/07/2026' },
      { code: 'HRTC', level: 'Sans risque', lastCheckDate: '03/07/2026' },
    ],
  },
  {
    ...PROFILE_LEGAL,
    id: 'PM123456791',
    partnerId: 'PM123456791',
    systemId: 'MART4',
    entity: 'CNP Assicura',
    subEntity: 'CNP Assicura',
    company: {
      companyName: 'TRAN INVESTMENTS',
      legalStatus: 'SA',
      reference: 'REFM19QX',
      incorporationCountry: 'ITA',
      activityDomain: "Gestion d'actifs",
      creationDate: '21/09/2018',
      companyIdentifier: 'COMPTRN934',
    },
    risks: [
      { code: 'SANCTION', level: 'Alerte en cours', lastCheckDate: '30/06/2026' },
      { code: 'HRTC', level: 'Données incomplètes', lastCheckDate: '30/06/2026' },
    ],
  },
];

const HANDCRAFTED: readonly Person[] = [
  CT313,
  PROFILE_NATURAL,
  PROFILE_LEGAL,
  ...SEARCH_NATURALS,
  ...SEARCH_LEGALS,
];

/* -----------------------------------------------------------------------------
   Personnes dérivées des alertes générées
   -------------------------------------------------------------------------- */

const CITIES = ['Rennes', 'Milano', 'Madrid', 'Luxembourg', 'Dublin', 'Lisboa', 'Roma', 'Paris'];
const ACTIVITIES = ['Immobilier', 'Services financiers', "Gestion d'actifs", 'Transport', 'Négoce'];
const LEGAL_STATUSES = ['SAS', 'SARL', 'SA', 'SPA', 'SRL'];

/** Empreinte entière stable d'une chaîne — même fonction que le jeu d'alertes. */
function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return hash >>> 0;
}

/**
 * Niveau de risque d'une composante, déduit des alertes portées par la
 * personne : une alerte ouverte vaut « Alerte en cours », une inscription au
 * gel vaut « Blacklisté », une vigilance renforcée l'emporte sur une clôture.
 */
function riskLevelFor(personId: string, code: RiskComponent['code']): RiskLevel | null {
  const alerts = ALERTS.filter((alert) => alert.personId === personId && alert.typology === code);
  if (!alerts.length) return null;
  if (alerts.some((alert) => alert.status === 'BLACKLISTED')) return 'Blacklisté';
  if (alerts.some((alert) => alert.status === 'ENFORCED_SCRUTINY')) return 'Vigilance renforcée';
  if (alerts.some((alert) => !alert.decision)) return 'Alerte en cours';
  return 'Sans risque';
}

function derivePerson(personId: string): Person {
  const alerts = ALERTS.filter((alert) => alert.personId === personId);
  const reference = alerts[0]!;
  const identityRow = reference.reconciliation.find((row) => row.source === 'PERSON');
  const hash = hashCode(personId);
  const isLegal = reference.personType === 'LEGAL';
  const lastCheck = alerts[alerts.length - 1]!.alertDate;

  const risks = (['SANCTION', 'PEP', 'RCA', 'HRTC'] as const)
    .map((code) => ({ code, level: riskLevelFor(personId, code), lastCheckDate: lastCheck }))
    .filter((risk): risk is RiskComponent => risk.level !== null);

  return {
    id: personId,
    type: reference.personType,
    partnerId: personId,
    ricId: `RIC${String(hash % 1_000_000).padStart(6, '0')}`,
    systemId: reference.systemId,
    entity: reference.entity,
    subEntity: reference.subEntity,
    updatedAt: `${reference.alertDate} à ${reference.alertDateTime.slice(-5)}`,
    identity: isLegal
      ? null
      : {
          surname: identityRow?.surname ?? null,
          alternateName: null,
          usualGivenName: identityRow?.usualGivenName ?? null,
          givenNames: identityRow?.givenNames ?? null,
          gender: identityRow?.gender ?? null,
          birthDate: identityRow?.birthDate ?? null,
          birthPlaceCode: null,
          birthCountry: identityRow?.birthCountry ?? null,
        },
    company: isLegal
      ? {
          companyName: identityRow?.usualGivenName ?? personId,
          legalStatus: LEGAL_STATUSES[hash % LEGAL_STATUSES.length]!,
          reference: `REF${String(hash % 100_000).padStart(5, '0')}`,
          incorporationCountry: identityRow?.citizenshipCountry ?? 'FRA',
          activityDomain: ACTIVITIES[hash % ACTIVITIES.length]!,
          creationDate: '15/12/2025',
          companyIdentifier: `COMP${String(hash % 10_000).padStart(4, '0')}`,
        }
      : null,
    email: null,
    phone: null,
    iban: null,
    address: {
      ...EMPTY_ADDRESS,
      city: CITIES[hash % CITIES.length]!,
      countryCode: identityRow?.addressCountryCode ?? null,
    },
    contract: { number: String(100_000_000 + (hash % 899_999_999)), role: 'ADHERANT' },
    links: [],
    risks,
  };
}

const HANDCRAFTED_IDS = new Set(HANDCRAFTED.map((person) => person.id));

const DERIVED: readonly Person[] = [...new Set(ALERTS.map((alert) => alert.personId))]
  .filter((personId) => !HANDCRAFTED_IDS.has(personId))
  .map(derivePerson);

/** Toutes les personnes du référentiel de démonstration. */
export const PERSONS: readonly Person[] = [...HANDCRAFTED, ...DERIVED];

const PERSON_INDEX = new Map(PERSONS.map((person) => [person.id, person]));

export function findPerson(personId: string): Person | undefined {
  return PERSON_INDEX.get(personId);
}
