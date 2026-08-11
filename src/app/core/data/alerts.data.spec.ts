import { ALERTS, OPEN_ALERT_COUNT, PROCESSED_ALERT_COUNT } from './alerts.data';
import { PERSONS, findPerson } from './persons.data';
import { ALERT_TYPOLOGIES, isClosedStatus } from '../models';

describe('jeu de données des alertes', () => {
  const open = ALERTS.filter((alert) => !isClosedStatus(alert.status));
  const processed = ALERTS.filter((alert) => isClosedStatus(alert.status));

  it('reproduit les volumes affichés par les paginateurs des maquettes', () => {
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
      systemId: 'SRC_1VQF9P',
      personType: 'LEGAL',
      alertDate: '24/12/2025',
      typology: 'SANCTION',
      entity: 'CNP Europe Life DAC',
      user: 'STRAN',
      maxRate: 99.5202,
    });
  });

  it("reprend l'alerte 6134 de l'écran de traitement", () => {
    const alert = ALERTS.find((candidate) => candidate.id === 6134);

    expect(alert).toMatchObject({
      factivaId: '13604505',
      personId: 'CT313',
      entity: 'CNP Assicura',
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

  it('décrit les personnes des maquettes de recherche et de profil', () => {
    const trans = PERSONS.filter((person) => person.identity?.surname === 'TRAN');
    expect(trans.map((person) => person.id)).toEqual(['PP123456789', 'PP123456790', 'PP123456791']);

    expect(findPerson('CT313')).toMatchObject({
      ricId: 'AAUW6266',
      systemId: 'CrashTest',
      entity: 'CNP Assicura',
    });
  });

  it('déduit le risque global de la composante la plus sévère', () => {
    const profile = findPerson('PM123456789');
    expect(profile?.risks.map((risk) => risk.level)).toContain('Blacklisté');
  });
});
