import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Remplace une valeur absente par un tiret.
 *
 * Les maquettes affichent « - » partout où le référentiel ne renseigne rien :
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

/** Taux de similarité formaté comme dans les corbeilles : « 99.5202 % ». */
@Pipe({ name: 'rate' })
export class RatePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${Number(value.toFixed(4))} %`;
  }
}
