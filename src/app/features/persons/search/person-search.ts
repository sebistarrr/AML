import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PERSONS } from '../../../core/data/persons.data';
import { PERSON_TYPE_META, type Person, type PersonType } from '../../../core/models';
import { DashPipe } from '../../../shared/pipes/format.pipes';

/** Critères saisis, avant lancement de la recherche. */
interface Criteria {
  personId: string;
  surname: string;
  givenName: string;
  birthDate: string;
  companyName: string;
  companyId: string;
}

function emptyCriteria(): Criteria {
  return {
    personId: '',
    surname: '',
    givenName: '',
    birthDate: '',
    companyName: '',
    companyId: '',
  };
}

const NATURAL_COLUMNS = [
  'Person identifier',
  'System identifier',
  'Surname',
  'Alternate name',
  'Usual given name',
  'List of given names',
  'Gender',
  'Date of birth',
  'Place code of birth',
  'Country of birth',
  'Entity',
  'Sub-entity',
] as const;

const LEGAL_COLUMNS = [
  'Person identifier',
  'System identifier',
  'Company name',
  'Legal status',
  'Reference',
  'Country of incorporation',
  'Activity domain',
  'Date of creation',
  'Company identifier',
] as const;

/**
 * Recherche d'une personne.
 *
 * Le type de personne commande les critères comme les colonnes de résultat :
 * chercher une société par sa date de naissance n'a pas de sens, et afficher
 * une colonne vide pour la moitié des résultats non plus. La recherche ne part
 * qu'avec au moins un critère renseigné.
 */
@Component({
  selector: 'app-person-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashPipe],
  templateUrl: './person-search.html',
  styleUrl: './person-search.scss',
})
export class PersonSearchComponent {
  private readonly router = inject(Router);

  protected readonly personTypeMeta = PERSON_TYPE_META;
  protected readonly naturalColumns = NATURAL_COLUMNS;
  protected readonly legalColumns = LEGAL_COLUMNS;

  protected readonly type = signal<PersonType>('NATURAL');
  protected readonly criteria = signal<Criteria>(emptyCriteria());
  protected readonly searched = signal(false);
  protected readonly results = signal<readonly Person[]>([]);

  /** Critères effectivement utilisés par le type de personne courant. */
  private readonly activeValues = computed<readonly string[]>(() => {
    const criteria = this.criteria();
    return this.type() === 'NATURAL'
      ? [criteria.personId, criteria.surname, criteria.givenName, criteria.birthDate]
      : [criteria.personId, criteria.companyName, criteria.companyId];
  });

  protected readonly canSearch = computed(() =>
    this.activeValues().some((value) => value.trim().length > 0),
  );

  protected readonly canClear = computed(() =>
    Object.values(this.criteria()).some((value) => value.trim().length > 0),
  );

  protected readonly columns = computed(() =>
    this.type() === 'NATURAL' ? NATURAL_COLUMNS : LEGAL_COLUMNS,
  );

  protected readonly statusLabel = computed(() =>
    this.searched() ? 'Search completed' : 'Ready to search',
  );

  protected readonly emptyTitle = computed(() =>
    this.searched() ? 'No results' : 'Find a person or a legal entity',
  );

  protected readonly emptyBody = computed(() =>
    this.searched()
      ? 'No person matches the entered search criteria.'
      : 'Select a type, enter one or more criteria, then start the search.',
  );

  protected readonly rangeLabel = computed(() => {
    const total = this.results().length;
    return total ? `1–${total} of ${total}` : '0 of 0';
  });

  /* --- Interactions -------------------------------------------------------- */

  protected selectType(type: PersonType): void {
    if (this.type() === type) return;
    this.type.set(type);
    this.criteria.set(emptyCriteria());
    this.reset();
  }

  protected patch<K extends keyof Criteria>(key: K, value: Criteria[K]): void {
    this.criteria.update((criteria) => ({ ...criteria, [key]: value }));
  }

  /** Saisie guidée de la date : les séparateurs sont posés automatiquement. */
  protected onBirthDateInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    this.patch('birthDate', parts.join('/'));
  }

  protected clear(): void {
    this.criteria.set(emptyCriteria());
    this.reset();
  }

  protected search(): void {
    if (!this.canSearch()) return;

    const criteria = this.criteria();
    const type = this.type();

    this.results.set(
      PERSONS.filter((person) => {
        if (person.type !== type) return false;
        if (!matches(person.id, criteria.personId)) return false;

        if (type === 'NATURAL') {
          const identity = person.identity;
          if (!matches(identity?.surname, criteria.surname)) return false;
          if (
            criteria.givenName.trim() &&
            !matches(identity?.usualGivenName, criteria.givenName) &&
            !matches(identity?.givenNames, criteria.givenName) &&
            !matches(identity?.alternateName, criteria.givenName)
          ) {
            return false;
          }
          if (criteria.birthDate.trim() && identity?.birthDate !== criteria.birthDate.trim()) {
            return false;
          }
          return true;
        }

        if (!matches(person.company?.companyName, criteria.companyName)) return false;
        if (!matches(person.company?.companyIdentifier, criteria.companyId)) return false;
        return true;
      }),
    );

    this.searched.set(true);
  }

  protected openProfile(person: Person): void {
    void this.router.navigate(['/person', person.id]);
  }

  private reset(): void {
    this.searched.set(false);
    this.results.set([]);
  }
}

/** Correspondance insensible à la casse ; un critère vide n'exclut rien. */
function matches(value: string | null | undefined, criterion: string): boolean {
  const needle = criterion.trim().toLowerCase();
  if (!needle) return true;
  return (value ?? '').toLowerCase().includes(needle);
}
