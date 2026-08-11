import { Injectable, computed, signal } from '@angular/core';

import {
  PERMISSIONS_BY_GROUP,
  USER_GROUP_META,
  accountLabel,
  initials,
  type Permission,
  type User,
} from '../models';
import { DEFAULT_USER_ID, USERS } from '../data/reference.data';

const STORAGE_USER = 'etc.user';

/**
 * Session de l'utilisateur.
 *
 * Les permissions calculées ici pilotent l'affichage : elles masquent ce que
 * l'utilisateur ne peut pas faire, afin de réduire le bruit et les erreurs de
 * manipulation. Elles ne protègent rien. Le backend reste seul responsable du
 * contrôle d'habilitation ; toute action doit être revalidée côté serveur.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<User>(this.restoreUser());

  readonly currentUser = this._currentUser.asReadonly();

  /** Forme affichée dans le bandeau : « TRAN Sébastien ». */
  readonly accountLabel = computed(() => accountLabel(this._currentUser()));
  readonly initials = computed(() => initials(this._currentUser()));
  readonly groupMeta = computed(() => USER_GROUP_META[this._currentUser().group]);
  readonly level = computed<1 | 2>(() => this.groupMeta().level);

  readonly permissions = computed<ReadonlySet<Permission>>(
    () => new Set(PERMISSIONS_BY_GROUP[this._currentUser().group]),
  );

  /** Tous les comptes, exposés pour la bascule de rôle du menu profil. */
  readonly allUsers = USERS;

  has(permission: Permission): boolean {
    return this.permissions().has(permission);
  }

  /**
   * Bascule de compte. Dans un déploiement réel, l'identité proviendrait du
   * fournisseur d'identité du groupe ; ici elle permet de parcourir la
   * démonstration sous chaque niveau d'habilitation.
   */
  signInAs(userId: string): void {
    const user = USERS.find((candidate) => candidate.id === userId);
    if (!user) return;
    this._currentUser.set(user);
    this.persist(user.id);
  }

  private restoreUser(): User {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_USER);
    } catch {
      /* Stockage indisponible (navigation privée) : session en mémoire. */
    }
    return USERS.find((user) => user.id === stored) ?? USERS.find((u) => u.id === DEFAULT_USER_ID)!;
  }

  private persist(value: string): void {
    try {
      localStorage.setItem(STORAGE_USER, value);
    } catch {
      /* Stockage indisponible : la session reste en mémoire. */
    }
  }
}
