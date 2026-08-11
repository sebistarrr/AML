/**
 * Jeu de données des alertes.
 *
 * Il combine deux sources :
 *
 * 1. les alertes reprises **à l'identique** des maquettes de référence
 *    (`mockup-test`) — corbeilles « Alert Basket », « My alerts » et
 *    « Processed alerts », écran de traitement, profils de risque PP et PM ;
 * 2. un générateur déterministe qui complète les volumes affichés par les
 *    paginateurs des maquettes : 706 alertes ouvertes et 92 alertes traitées.
 *
 * Le générateur est semé : à build identique, données identiques. Aucune
 * alerte générée n'est affectée à l'utilisateur par défaut, afin que la
 * corbeille « My alerts » reste celle des maquettes.
 */

import type {
  Alert,
  AlertStatus,
  AlertTypology,
  Circuit,
  Decision,
  PersonType,
  ReconciliationRow,
  UserGroup,
} from '../models';
import { DEFAULT_USER_ID, ENTITIES, USERS, entityOf, type EntityId } from './reference.data';

/* -----------------------------------------------------------------------------
   Volumes cibles, lus sur les paginateurs des maquettes
   -------------------------------------------------------------------------- */

export const OPEN_ALERT_COUNT = 706;
export const PROCESSED_ALERT_COUNT = 92;

/* -----------------------------------------------------------------------------
   Description compacte d'une alerte, développée par `toAlert`
   -------------------------------------------------------------------------- */

interface AlertSeed {
  readonly id: number;
  readonly reference?: string;
  readonly status: AlertStatus;
  readonly typology?: AlertTypology;
  readonly personId: string;
  readonly personType: PersonType;
  /** Filiale d'où provient l'alerte : elle porte l'entité, la sous-entité et
      l'identifiant système, qu'aucune graine ne redéfinit. */
  readonly entityId: EntityId;
  readonly alertDate: string;
  readonly time?: string;
  readonly maxRate: number;
  readonly userGroup?: UserGroup | null;
  readonly user?: string | null;
  readonly factivaId?: string | null;
  readonly detail?: string;
  readonly circuit?: Circuit;
  readonly decision?: Decision | null;
  readonly processedAt?: string | null;
  readonly justification?: string | null;
  readonly reconciliation?: readonly ReconciliationRow[];
}

const EMPTY_PERSON_ROW: ReconciliationRow = {
  source: 'PERSON',
  rate: null,
  surname: null,
  alternateName: null,
  usualGivenName: null,
  givenNames: null,
  gender: null,
  birthDate: null,
  birthYear: null,
  birthPlaceCode: null,
  birthCountry: null,
  addressCountryCode: null,
  citizenshipCountry: null,
};

function alertYear(date: string): string {
  return date.slice(6, 10);
}

function toAlert(seed: AlertSeed): Alert {
  const typology = seed.typology ?? 'SANCTION';
  const factivaId = seed.factivaId === undefined ? null : seed.factivaId;
  return {
    id: seed.id,
    reference:
      seed.reference ?? `ALERTE-${alertYear(seed.alertDate)}-${String(seed.id).padStart(3, '0')}`,
    status: seed.status,
    typology,
    personId: seed.personId,
    personType: seed.personType,
    systemId: entityOf(seed.entityId).systemId,
    entity: entityOf(seed.entityId).name,
    subEntity: entityOf(seed.entityId).subEntity,
    alertDate: seed.alertDate,
    alertDateTime: `${seed.alertDate} ${seed.time ?? '09:12'}`,
    maxRate: seed.maxRate,
    factivaId,
    detail: seed.detail ?? factivaId ?? '-',
    circuit: seed.circuit ?? 'Batch',
    userGroup: seed.userGroup === undefined ? 'LEVEL_2' : seed.userGroup,
    user: seed.user === undefined ? null : seed.user,
    /* Sans rapprochement explicite, il est dérivé de l'identifiant de la
       personne : deux alertes de la même personne partagent alors la même
       ligne de référence, comme le ferait le moteur de similarité. */
    reconciliation:
      seed.reconciliation ??
      generatedReconciliation(seededRandom(hashCode(seed.personId)), seed.personType, seed.maxRate),
    decision: seed.decision ?? null,
    processedAt: seed.processedAt ?? null,
    justification: seed.justification ?? null,
  };
}

/* -----------------------------------------------------------------------------
   1. Corbeille « Alert Basket » — dix premières lignes de la maquette
   -------------------------------------------------------------------------- */

const BASKET_SEEDS: readonly AlertSeed[] = [
  {
    id: 1,
    status: 'IN_PROCESS_L2',
    personId: 'SP_422421',
    personType: 'LEGAL',
    entityId: 'nordia',
    alertDate: '24/12/2025',
    maxRate: 99.5202,
    user: 'STRAN',
    factivaId: '2417803',
  },
  {
    id: 2,
    status: 'ESCALATED_L2',
    personId: 'SP_422421',
    personType: 'LEGAL',
    entityId: 'nordia',
    alertDate: '24/12/2025',
    maxRate: 99.5202,
    user: 'ADUBOIS',
    factivaId: '2417804',
  },
  {
    id: 5,
    status: 'IN_PROCESS_L2',
    personId: 'SP_422424',
    personType: 'LEGAL',
    entityId: 'nordia',
    alertDate: '24/12/2025',
    maxRate: 99.5205,
    user: 'MRENARD',
    factivaId: '2417811',
  },
  {
    id: 51,
    status: 'ESCALATED_L2',
    personId: 'SP_982507',
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '22/01/2026',
    maxRate: 11.6624,
    user: 'MRENARD',
    factivaId: '3105442',
  },
  {
    id: 52,
    status: 'IN_PROCESS_L2',
    personId: 'SP_631349',
    personType: 'NATURAL',
    entityId: 'astrea',
    alertDate: '22/01/2026',
    maxRate: 89.7748,
    user: 'MRENARD',
    factivaId: '3105518',
  },
  {
    id: 56,
    status: 'IN_PROCESS_L2',
    personId: 'SP_661743',
    personType: 'NATURAL',
    entityId: 'astrea',
    alertDate: '22/01/2026',
    maxRate: 49.4563,
    user: 'MRENARD',
    factivaId: '3105603',
  },
  {
    id: 60,
    status: 'IN_PROCESS_L2',
    personId: 'SP_420232',
    personType: 'NATURAL',
    entityId: 'helvia',
    alertDate: '22/01/2026',
    maxRate: 75.2112,
    user: 'MRENARD',
    factivaId: '3105744',
  },
  {
    id: 61,
    status: 'ESCALATED_L2',
    personId: 'SP_420232',
    personType: 'NATURAL',
    entityId: 'helvia',
    alertDate: '22/01/2026',
    maxRate: 93.155,
    user: 'MRENARD',
    factivaId: '3105745',
  },
  {
    id: 63,
    status: 'IN_PROCESS_L2',
    personId: 'SP_518146',
    personType: 'NATURAL',
    entityId: 'helvia',
    alertDate: '22/01/2026',
    maxRate: 91.8744,
    user: 'MRENARD',
    factivaId: '3105812',
  },
  {
    id: 65,
    status: 'ESCALATED_L2',
    personId: 'SP_911634',
    personType: 'NATURAL',
    entityId: 'nordia',
    alertDate: '22/01/2026',
    maxRate: 99.7427,
    user: 'MRENARD',
    factivaId: '3105889',
  },
];

/* -----------------------------------------------------------------------------
   2. Corbeille « My alerts » — les cinq lignes propres au compte STRAN
   -------------------------------------------------------------------------- */

const MY_ALERTS_SEEDS: readonly AlertSeed[] = [
  {
    id: 500,
    status: 'ESCALATED_L2',
    personId: 'SP_959392',
    personType: 'NATURAL',
    entityId: 'astrea',
    alertDate: '22/01/2026',
    maxRate: 98.54,
    user: 'STRAN',
    factivaId: '3108820',
  },
  {
    id: 1128,
    status: 'ESCALATED_L2',
    personId: 'SP_774249',
    personType: 'LEGAL',
    entityId: 'nordia',
    alertDate: '22/01/2026',
    maxRate: 73.5194,
    user: 'STRAN',
    factivaId: '3112409',
  },
  {
    id: 1617,
    status: 'ESCALATED_L2',
    personId: 'STR_PP_0076',
    personType: 'NATURAL',
    entityId: 'verema',
    alertDate: '17/03/2026',
    maxRate: 90,
    user: 'STRAN',
    factivaId: '4470071',
  },
  {
    id: 1830,
    status: 'ESCALATED_L2',
    personId: 'STR_AA_0001',
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '17/03/2026',
    maxRate: 99.9999,
    user: 'STRAN',
    factivaId: '4470288',
  },
  {
    id: 2604,
    status: 'ESCALATED_L2',
    personId: 'STR_UBO_0003',
    personType: 'LEGAL',
    entityId: 'lumina',
    alertDate: '30/03/2026',
    maxRate: 99.9999,
    user: 'STRAN',
    factivaId: '4620033',
  },
];

/* -----------------------------------------------------------------------------
   3. Écran de traitement — l'alerte 6134, reprise champ pour champ
   -------------------------------------------------------------------------- */

const FACTIVA_SAFAROV: Omit<ReconciliationRow, 'addressCountryCode'> = {
  source: 'FACTIVA',
  rate: 99.0698,
  surname: 'SAFAROV',
  alternateName: null,
  usualGivenName: 'TALAT',
  givenNames: null,
  gender: 'MALE',
  birthDate: '22/03/1980',
  birthYear: '1980',
  birthPlaceCode: null,
  birthCountry: null,
  citizenshipCountry: 'AZE',
};

const PROCESSING_SEED: AlertSeed = {
  id: 6134,
  status: 'IN_PROCESS_L2',
  typology: 'SANCTION',
  personId: 'CT313',
  personType: 'NATURAL',
  entityId: 'lumina',
  alertDate: '30/04/2026',
  time: '17:56',
  maxRate: 99.0698,
  user: 'STRAN',
  userGroup: 'LEVEL_2',
  factivaId: '13604505',
  circuit: 'Temps réel',
  reconciliation: [
    { ...EMPTY_PERSON_ROW, usualGivenName: 'ZULETA DE MERCHAN' },
    { ...FACTIVA_SAFAROV, addressCountryCode: 'SGP' },
    { ...FACTIVA_SAFAROV, addressCountryCode: 'ARE' },
  ],
};

/* -----------------------------------------------------------------------------
   4. Corbeille « Processed alerts » — dix premières lignes de la maquette
   -------------------------------------------------------------------------- */

function processedSeed(
  id: number,
  personId: string,
  status: 'CLEARED_L2' | 'BLACKLISTED',
  user: string,
  maxRate: number,
): AlertSeed {
  return {
    id,
    status,
    personId,
    personType: 'LEGAL',
    entityId: 'nordia',
    alertDate: '24/12/2025',
    maxRate,
    user,
    factivaId: `24178${String(id).padStart(2, '0')}`,
    decision: status === 'BLACKLISTED' ? 'BLACKLISTED' : 'CLEARED_L2',
    processedAt: '29/12/2025',
    justification:
      status === 'BLACKLISTED'
        ? "Correspondance confirmée avec la fiche listée : raison sociale, pays d'immatriculation et identifiant société concordants."
        : "Divergence sur le pays d'immatriculation et l'identifiant société : le rapprochement est écarté.",
  };
}

const PROCESSED_SEEDS: readonly AlertSeed[] = [
  processedSeed(6, 'SP_422425', 'CLEARED_L2', 'STRAN', 99.5206),
  processedSeed(8, 'SP_422427', 'CLEARED_L2', 'LFONTAINE', 99.5208),
  processedSeed(9, 'SP_422428', 'CLEARED_L2', 'LFONTAINE', 99.5209),
  processedSeed(10, 'SP_422429', 'CLEARED_L2', 'LFONTAINE', 99.521),
  processedSeed(12, 'SP_422431', 'CLEARED_L2', 'LFONTAINE', 99.5212),
  processedSeed(13, 'SP_422432', 'BLACKLISTED', 'MRENARD', 99.5213),
  processedSeed(14, 'SP_422433', 'BLACKLISTED', 'MRENARD', 99.5214),
  processedSeed(17, 'SP_422436', 'BLACKLISTED', 'MRENARD', 99.5217),
  processedSeed(18, 'SP_422437', 'CLEARED_L2', 'MRENARD', 99.5218),
  processedSeed(20, 'SP_422439', 'CLEARED_L2', 'MRENARD', 99.522),
];

/* -----------------------------------------------------------------------------
   5. Profils de risque — alertes des personnes PP123456789 et PM123456789
   -------------------------------------------------------------------------- */

/** Identifiant de la personne physique du profil de risque de référence. */
export const PROFILE_NATURAL_PERSON_ID = 'PP123456789';
/** Identifiant de la personne morale du profil de risque de référence. */
export const PROFILE_LEGAL_PERSON_ID = 'PM123456789';

const NATURAL_PROFILE_SEEDS: readonly AlertSeed[] = [
  {
    id: 1001,
    reference: 'ALERTE-2026-001',
    status: 'IN_PROCESS_L1',
    typology: 'SANCTION',
    circuit: 'Temps réel',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '05/07/2026',
    maxRate: 96.4102,
    userGroup: 'LEVEL_1',
    user: 'PMOREAU',
    factivaId: 'FACTIVA231',
  },
  {
    id: 1002,
    reference: 'ALERTE-2026-002',
    status: 'ENFORCED_SCRUTINY',
    typology: 'PEP',
    circuit: 'Temps réel',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '01/07/2026',
    maxRate: 91.2277,
    userGroup: 'LEVEL_2',
    user: 'STRAN',
    factivaId: 'FACTIVA478',
    decision: 'ENFORCED_SCRUTINY',
    processedAt: '03/07/2026',
  },
  {
    id: 1003,
    reference: 'ALERTE-2026-003',
    status: 'CLEARED_L1',
    typology: 'RCA',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '29/06/2026',
    maxRate: 64.8319,
    userGroup: 'LEVEL_1',
    user: 'CGARNIER',
    factivaId: 'FACTIVA123',
    decision: 'CLEARED_L1',
    processedAt: '30/06/2026',
  },
  {
    id: 1004,
    reference: 'ALERTE-2026-004',
    status: 'CLEARED_L2',
    typology: 'HRTC',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '14/06/2026',
    maxRate: 100,
    userGroup: 'LEVEL_2',
    user: 'STRAN',
    factivaId: null,
    detail: 'FRANCE',
    decision: 'CLEARED_L2',
    processedAt: '16/06/2026',
  },
  {
    id: 1005,
    reference: 'ALERTE-2026-005',
    status: 'CLEARED_L1',
    typology: 'SANCTION',
    circuit: 'Temps réel',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '23/05/2026',
    maxRate: 58.1147,
    userGroup: 'LEVEL_1',
    user: 'PMOREAU',
    factivaId: 'FACTIVA471',
    decision: 'CLEARED_L1',
    processedAt: '24/05/2026',
  },
  {
    id: 1006,
    reference: 'ALERTE-2026-006',
    status: 'CLEARED_L1',
    typology: 'PEP',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '09/05/2026',
    maxRate: 61.7705,
    userGroup: 'LEVEL_1',
    user: 'PMOREAU',
    factivaId: 'FACTIVA498',
    decision: 'CLEARED_L1',
    processedAt: '12/05/2026',
  },
  {
    id: 1007,
    reference: 'ALERTE-2026-007',
    status: 'CLEARED_L1',
    typology: 'RCA',
    personId: PROFILE_NATURAL_PERSON_ID,
    personType: 'NATURAL',
    entityId: 'lumina',
    alertDate: '18/04/2026',
    maxRate: 55.4092,
    userGroup: 'LEVEL_1',
    user: 'CGARNIER',
    factivaId: 'FACTIVA470',
    decision: 'CLEARED_L1',
    processedAt: '20/04/2026',
  },
];

const LEGAL_PROFILE_SEEDS: readonly AlertSeed[] = [
  {
    id: 1101,
    reference: 'ALERTE-2026-001',
    status: 'BLACKLISTED',
    typology: 'SANCTION',
    circuit: 'Temps réel',
    personId: PROFILE_LEGAL_PERSON_ID,
    personType: 'LEGAL',
    entityId: 'lumina',
    alertDate: '05/07/2026',
    maxRate: 99.8814,
    userGroup: 'LEVEL_2',
    user: 'STRAN',
    factivaId: 'FACTIVA231',
    decision: 'BLACKLISTED',
    processedAt: '06/07/2026',
  },
  {
    id: 1102,
    reference: 'ALERTE-2026-004',
    status: 'CLEARED_L2',
    typology: 'HRTC',
    personId: PROFILE_LEGAL_PERSON_ID,
    personType: 'LEGAL',
    entityId: 'lumina',
    alertDate: '14/06/2026',
    maxRate: 100,
    userGroup: 'LEVEL_2',
    user: 'STRAN',
    factivaId: null,
    detail: 'ESP',
    decision: 'CLEARED_L2',
    processedAt: '16/06/2026',
  },
  {
    id: 1103,
    reference: 'ALERTE-2026-005',
    status: 'CLEARED_L1',
    typology: 'SANCTION',
    circuit: 'Temps réel',
    personId: PROFILE_LEGAL_PERSON_ID,
    personType: 'LEGAL',
    entityId: 'lumina',
    alertDate: '23/05/2026',
    maxRate: 57.2201,
    userGroup: 'LEVEL_1',
    user: 'PMOREAU',
    factivaId: 'FACTIVA471',
    decision: 'CLEARED_L1',
    processedAt: '24/05/2026',
  },
];

/* -----------------------------------------------------------------------------
   6. Générateur déterministe — complète les volumes des paginateurs
   -------------------------------------------------------------------------- */

/** Empreinte entière stable d'une chaîne, utilisée comme graine. */
function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return hash >>> 0;
}

/** Générateur congruentiel semé : mêmes données à chaque exécution. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SURNAMES = [
  'ABADIE',
  'BENALI',
  'COSTA',
  'DIALLO',
  'ESPOSITO',
  'FERRARI',
  'GARCIA',
  'HUSSEIN',
  'IVANOV',
  'JANSSEN',
  'KOWALSKI',
  'LOPEZ',
  'MARCHETTI',
  'NOVAK',
  'OKONKWO',
  'PETROV',
  'QUINTANA',
  'ROSSI',
  'SAFAROV',
  'TRAORE',
  'URBANO',
  'VIDAL',
  'WEBER',
  'XIMENES',
] as const;

const GIVEN_NAMES = [
  'ADAM',
  'BIANCA',
  'CARLOS',
  'DALILA',
  'ELENA',
  'FARID',
  'GIULIA',
  'HASSAN',
  'IRINA',
  'JAVIER',
  'KARIM',
  'LUCIA',
  'MARCO',
  'NADIA',
  'OLGA',
  'PABLO',
  'RANIA',
  'SOFIA',
  'TALAT',
  'ULRICH',
  'VERA',
  'WALID',
  'YASMINE',
  'ZORAN',
] as const;

const COMPANY_PREFIXES = ['ENT', 'STE', 'GRP', 'HLD', 'IND'] as const;

const COUNTRIES = [
  'FRA',
  'ITA',
  'ESP',
  'PRT',
  'LUX',
  'IRL',
  'ARE',
  'SGP',
  'AZE',
  'TUR',
  'MAR',
  'BRA',
] as const;

/** Analystes pouvant recevoir une alerte générée — jamais le compte courant,
    pour que la corbeille « My alerts » reste celle des maquettes. */
const ASSIGNABLE_USERS = USERS.filter((user) => user.id !== DEFAULT_USER_ID).map((user) => user.id);

const OPEN_STATUSES: readonly AlertStatus[] = [
  'TO_CLEAR_L1',
  'IN_PROCESS_L1',
  'ESCALATED_L2',
  'IN_PROCESS_L2',
];

const CLOSED_DECISIONS: readonly Decision[] = [
  'CLEARED_L1',
  'CLEARED_L2',
  'ENFORCED_SCRUTINY',
  'BLACKLISTED',
];

const TYPOLOGY_POOL: readonly AlertTypology[] = ['SANCTION', 'PEP', 'RCA', 'HRTC'];

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/** Date au format JJ/MM/AAAA, décalée de `dayOffset` jours après le 04/05/2026. */
function generatedDate(dayOffset: number): string {
  const date = new Date(Date.UTC(2026, 4, 4));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return `${pad(date.getUTCDate(), 2)}/${pad(date.getUTCMonth() + 1, 2)}/${date.getUTCFullYear()}`;
}

/** Ajoute `days` jours à une date JJ/MM/AAAA. */
function addDays(date: string, days: number): string {
  const [day, month, year] = date.split('/').map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1, day! + days));
  return `${pad(shifted.getUTCDate(), 2)}/${pad(shifted.getUTCMonth() + 1, 2)}/${shifted.getUTCFullYear()}`;
}

function generatedReconciliation(
  random: () => number,
  personType: PersonType,
  maxRate: number,
): readonly ReconciliationRow[] {
  if (personType === 'LEGAL') {
    const name = `${pick(random, COMPANY_PREFIXES)}_${pick(random, SURNAMES)}`;
    return [
      { ...EMPTY_PERSON_ROW, usualGivenName: name },
      {
        ...EMPTY_PERSON_ROW,
        source: 'FACTIVA',
        rate: maxRate,
        usualGivenName: name,
        addressCountryCode: pick(random, COUNTRIES),
        citizenshipCountry: pick(random, COUNTRIES),
      },
    ];
  }

  const surname = pick(random, SURNAMES);
  const givenName = pick(random, GIVEN_NAMES);
  const birthYear = 1950 + Math.floor(random() * 50);
  const birthDate = `${pad(1 + Math.floor(random() * 28), 2)}/${pad(1 + Math.floor(random() * 12), 2)}/${birthYear}`;
  const gender = random() > 0.5 ? 'MALE' : 'FEMALE';
  const rows: ReconciliationRow[] = [
    {
      ...EMPTY_PERSON_ROW,
      surname,
      usualGivenName: givenName,
      gender,
      birthDate,
      birthYear: String(birthYear),
    },
  ];

  const matches = 1 + Math.floor(random() * 2);
  for (let index = 0; index < matches; index += 1) {
    rows.push({
      source: 'FACTIVA',
      rate: maxRate,
      surname,
      alternateName: null,
      usualGivenName: givenName,
      givenNames: null,
      gender,
      birthDate,
      birthYear: String(birthYear),
      birthPlaceCode: null,
      birthCountry: null,
      addressCountryCode: pick(random, COUNTRIES),
      citizenshipCountry: pick(random, COUNTRIES),
    });
  }
  return rows;
}

function generateAlerts(count: number, closed: boolean, startId: number, seed: number): Alert[] {
  const random = seededRandom(seed);
  const alerts: Alert[] = [];

  for (let index = 0; index < count; index += 1) {
    const id = startId + index * 3 + Math.floor(random() * 3);
    const personType: PersonType = random() > 0.72 ? 'LEGAL' : 'NATURAL';
    const entityId = pick(random, ENTITIES).id;
    const typology = pick(random, TYPOLOGY_POOL);
    const maxRate = Number((10 + random() * 90).toFixed(4));
    const alertDate = generatedDate(Math.floor(index / 6));
    const decision = closed ? pick(random, CLOSED_DECISIONS) : null;
    const status: AlertStatus = closed
      ? decision === 'CLEARED_L1'
        ? 'CLEARED_L1'
        : decision === 'CLEARED_L2'
          ? 'CLEARED_L2'
          : decision === 'ENFORCED_SCRUTINY'
            ? 'ENFORCED_SCRUTINY'
            : 'BLACKLISTED'
      : pick(random, OPEN_STATUSES);
    const user = status === 'TO_CLEAR_L1' ? null : pick(random, ASSIGNABLE_USERS);
    const userGroup: UserGroup | null =
      user === null ? null : status.endsWith('L1') ? 'LEVEL_1' : 'LEVEL_2';
    const factivaId =
      typology === 'HRTC' ? null : String(5_000_000 + Math.floor(random() * 4_000_000));

    alerts.push(
      toAlert({
        id,
        status,
        typology,
        personId: `SP_${300_000 + Math.floor(random() * 699_999)}`,
        personType,
        entityId,
        alertDate,
        time: `${pad(8 + Math.floor(random() * 10), 2)}:${pad(Math.floor(random() * 60), 2)}`,
        maxRate,
        userGroup,
        user,
        factivaId,
        detail: typology === 'HRTC' ? pick(random, COUNTRIES) : (factivaId ?? '-'),
        circuit: random() > 0.6 ? 'Temps réel' : 'Batch',
        decision,
        processedAt: closed ? addDays(alertDate, 1 + Math.floor(random() * 5)) : null,
        justification: closed
          ? "Analyse du rapprochement au regard des éléments d'identification disponibles au dossier."
          : null,
        reconciliation: generatedReconciliation(random, personType, maxRate),
      }),
    );
  }

  return alerts;
}

/* -----------------------------------------------------------------------------
   Assemblage
   -------------------------------------------------------------------------- */

const HANDCRAFTED_OPEN: readonly Alert[] = [
  ...BASKET_SEEDS,
  ...MY_ALERTS_SEEDS,
  PROCESSING_SEED,
  ...NATURAL_PROFILE_SEEDS.filter((seed) => seed.decision === undefined),
].map(toAlert);

const HANDCRAFTED_CLOSED: readonly Alert[] = [
  ...PROCESSED_SEEDS,
  ...NATURAL_PROFILE_SEEDS.filter((seed) => seed.decision !== undefined),
  ...LEGAL_PROFILE_SEEDS,
].map(toAlert);

/** Toutes les alertes de la démonstration, ouvertes puis traitées. */
export const ALERTS: readonly Alert[] = [
  ...HANDCRAFTED_OPEN,
  ...generateAlerts(OPEN_ALERT_COUNT - HANDCRAFTED_OPEN.length, false, 7000, 20260504),
  ...HANDCRAFTED_CLOSED,
  ...generateAlerts(PROCESSED_ALERT_COUNT - HANDCRAFTED_CLOSED.length, true, 20_000, 20251224),
];
