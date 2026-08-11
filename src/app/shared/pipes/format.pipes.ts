import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Remplace une valeur absente par un tiret.
 *
 * Un tiret est affiché partout où le référentiel ne renseigne rien :
 * la cellule reste alignée avec les autres et l'analyste distingue une donnée
 * manquante d'une donnée vide.
 */
@Pipe({ name: 'dash' })
export class DashPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }
}

/**
 * Taux de similarité.
 *
 * Les corbeilles l'espacent — « 99.5202 % » — là où le tableau de
 * rapprochement le colle au chiffre : « 99.0698% ». Les deux formes viennent
 * du design, d'où le paramètre.
 */
@Pipe({ name: 'rate' })
export class RatePipe implements PipeTransform {
  transform(value: number | null | undefined, spaced = true): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${Number(value.toFixed(4))}${spaced ? ' ' : ''}%`;
  }
}
