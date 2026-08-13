import { ALERTS, OPEN_ALERT_COUNT, PROCESSED_ALERT_COUNT } from './alerts.data';
import { PERSONS, findPerson } from './persons.data';
import { DEFAULT_USER_ID, ENTITIES, USER_IDS } from './reference.data';
import { ALERT_TYPOLOGIES, isClosedStatus, sortableDate } from '../models';

describe('jeu de données des alertes', () => {
  const open = ALERTS.filter((alert) => !isClosedStatus(alert.status));
  const processed = ALERTS.filter((alert) => isClosedStatus(alert.status));

  it('reproduit les volumes affichés par les paginateurs', () => {
    expect(open.length).toBe(OPEN_ALERT_COUNT);
    expect(processed.length).toBe(PROCESSED_ALERT_COUNT);
  });

  it("n'expose que les quatre typologies de screening", () => {
    const typologies = new Set(ALERTS.map((alert) => alert.typology));
    for (const typology of typologies) {
      expect(ALERT_TYPOLOGIES).toContain(typology);
    }
  });

  it('attribue un identifiant unique à chaque alerte', () => {
    expect(new Set(ALERTS.map((alert) => alert.id)).size).toBe(ALERTS.length);
  });

  it('rattache chaque alerte à une personne du référentiel', () => {
    for (const alert of ALERTS) {
      expect(findPerson(alert.personId)).toBeDefined();
    }
  });

  it('reprend les dix premières lignes de la corbeille « Alert Basket »', () => {
    const first = open
      .slice()
      .sort((left, right) => left.id - right.id)
      .slice(0, 3);

    expect(first.map((alert) => alert.id)).toEqual([1, 2, 5]);
    expect(first[0]).toMatchObject({
      status: 'IN_PROCESS_L2',
      personId: 'SP_422421',
      systemId: 'SYS_NORDIA',
      personType: 'LEGAL',
      alertDate: '24/12/2025',
      typology: 'SANCTION',
      entity: 'Nordia Life',
      user: 'STRAN',
      maxRate: 99.5202,
    });
  });

  it("reprend l'alerte 6134 de l'écran de traitement", () => {
    const alert = ALERTS.find((candidate) => candidate.id === 6134);

    expect(alert).toMatchObject({
      factivaId: '13604505',
      personId: 'CT313',
      entity: 'Lumina Vita',
      maxRate: 99.0698,
      alertDateTime: '30/04/2026 17:56',
      status: 'IN_PROCESS_L2',
      user: 'STRAN',
    });
    expect(alert?.reconciliation).toHaveLength(3);
    expect(alert?.reconciliation[0]).toMatchObject({
      source: 'PERSON',
      usualGivenName: 'ZULETA DE MERCHAN',
    });
    expect(alert?.reconciliation[1]).toMatchObject({
      source: 'FACTIVA',
      surname: 'SAFAROV',
      usualGivenName: 'TALAT',
      birthDate: '22/03/1980',
      addressCountryCode: 'SGP',
      citizenshipCountry: 'AZE',
    });
  });

  it('décrit les personnes des écrans de recherche et de profil', () => {
    const trans = PERSONS.filter((person) => person.identity?.surname === 'TRAN');
    expect(trans.map((person) => person.id)).toEqual(['PP123456789', 'PP123456790', 'PP123456791']);

    expect(findPerson('CT313')).toMatchObject({
      ricId: 'AAUW6266',
      systemId: 'SYS_LUMINA',
      entity: 'Lumina Vita',
    });
  });

  it('tient le référentiel à cinq filiales, un identifiant système chacune', () => {
    expect(ENTITIES.length).toBeLessThanOrEqual(5);

    const systemsByEntity = new Map<string, Set<string>>();
    for (const alert of ALERTS) {
      const systems = systemsByEntity.get(alert.entity) ?? new Set<string>();
      systems.add(alert.systemId);
      systemsByEntity.set(alert.entity, systems);
    }

    expect([...systemsByEntity.keys()].sort()).toEqual(
      ENTITIES.map((entity) => entity.name).sort(),
    );
    for (const [entity, systems] of systemsByEntity) {
      expect({ entity, systems: systems.size }).toEqual({ entity, systems: 1 });
    }

    for (const person of PERSONS) {
      const entity = ENTITIES.find((candidate) => candidate.name === person.entity);
      expect(entity).toBeDefined();
      expect(person.systemId).toBe(entity?.systemId);
      expect(person.subEntity).toBe(entity?.subEntity);
    }
  });

  it("n'affecte les alertes générées qu'à des comptes du référentiel", () => {
    const assigned = new Set(ALERTS.map((alert) => alert.user).filter((user) => user !== null));
    for (const user of assigned) {
      expect(USER_IDS).toContain(user);
    }
    expect(assigned).toContain(DEFAULT_USER_ID);
  });

  it('déduit le risque global de la composante la plus sévère', () => {
    const profile = findPerson('PM123456789');
    expect(profile?.risks.map((risk) => risk.level)).toContain('Blacklisté');
  });

  /* L'écran de traitement choisit ses colonnes sur le type de la personne :
     un rapprochement qui porterait les mauvais champs afficherait un tableau
     entièrement vide sans qu'aucune erreur ne soit levée. */
  it('rapproche les sociétés sur la raison sociale, jamais sur un état civil', () => {
    const legal = ALERTS.filter((alert) => alert.personType === 'LEGAL');
    expect(legal.length).toBeGreaterThan(0);

    for (const alert of legal) {
      for (const row of alert.reconciliation) {
        expect(row.companyName).not.toBeNull();
        expect(row.incorporationCountry).not.toBeNull();
        expect(row.surname).toBeNull();
        expect(row.birthDate).toBeNull();
      }
    }
  });

  it('rapproche les personnes physiques sur leur état civil', () => {
    const natural = ALERTS.filter((alert) => alert.personType === 'NATURAL');
    expect(natural.length).toBeGreaterThan(0);

    for (const alert of natural) {
      for (const row of alert.reconciliation) {
        expect(row.companyName).toBeNull();
        expect(row.incorporationCountry).toBeNull();
      }
    }
  });

  /* L'exposition politique et le lien familial ou d'affaires se rattachent à
     un individu : une société ne peut porter ni PEP ni RCA. */
  it('ne déclenche PEP et RCA que sur des personnes physiques', () => {
    const misplaced = ALERTS.filter(
      (alert) =>
        alert.personType === 'LEGAL' && (alert.typology === 'PEP' || alert.typology === 'RCA'),
    );
    expect(misplaced).toEqual([]);

    const legalTypologies = new Set(
      ALERTS.filter((alert) => alert.personType === 'LEGAL').map((alert) => alert.typology),
    );
    expect([...legalTypologies].sort()).toEqual(['HRTC', 'SANCTION']);
  });

  it('renseigne les fonctions publiques sur les seules alertes PEP', () => {
    for (const alert of ALERTS) {
      if (alert.typology === 'PEP') {
        expect(alert.pepFunctions.length).toBeGreaterThan(0);
        for (const entry of alert.pepFunctions) {
          expect(entry.category).not.toBe('');
          expect(entry.label).not.toBe('');
          /* Une fonction sans date de fin est en cours ; sinon elle se termine
             après avoir commencé, jamais l'inverse. */
          if (entry.endDate) {
            expect(sortableDate(entry.endDate) > sortableDate(entry.startDate)).toBe(true);
          }
        }
      } else {
        expect(alert.pepFunctions).toEqual([]);
      }
    }
  });

  it('renseigne les liens vers les personnes exposées sur les seules alertes RCA', () => {
    for (const alert of ALERTS) {
      if (alert.typology === 'RCA') {
        expect(alert.pepRelations.length).toBeGreaterThan(0);
        for (const relation of alert.pepRelations) {
          expect(relation.pepFactivaId).toMatch(/^\d+$/);
          expect(relation.relationship).not.toBe('');
        }
      } else {
        expect(alert.pepRelations).toEqual([]);
      }
    }
  });

  /* L'alerte 1 est celle sur laquelle le rendu de l'écran est comparé au
     design de référence : ses valeurs sont figées, pas générées. */
  it("fige le rapprochement de l'alerte 1 sur le design de référence", () => {
    const alert = ALERTS.find((candidate) => candidate.id === 1);
    expect(alert?.reconciliation.map((row) => [row.companyName, row.incorporationCountry])).toEqual(
      [
        ['ENT_9W6O6WKE', 'ESP'],
        ['ENT_F5RQRSFP', 'PRT'],
      ],
    );
  });
});
