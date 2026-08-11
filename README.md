# AML PROJECT

Prototype fonctionnel de la plateforme de traitement des alertes de screening
LCB-FT (lutte contre le blanchiment de capitaux et le financement du
terrorisme) des entités européennes du groupe.

Le dispositif ne produit que **quatre typologies d'alerte** :

| Code       | Libellé affiché                | Objet                                                      |
| ---------- | ------------------------------ | ---------------------------------------------------------- |
| `SANCTION` | Asset Freeze                   | Correspondance avec une liste de sanctions internationales |
| `PEP`      | Politically Exposed Person     | Personne politiquement exposée                             |
| `RCA`      | Relatives and Close Associates | Proche ou associé d'une personne listée                    |
| `HRTC`     | High Risk Third Country        | Rattachement à un pays tiers à haut risque                 |

Les écrans, les libellés et les données affichées reprennent les maquettes de
référence du dossier [`mockup-test/`](mockup-test) — corbeilles d'alertes,
écran de traitement, recherche de personne et profils de risque.

## Démarrer

Prérequis : Node.js 20.19+, 22.12+ ou 24+.

```bash
npm install
npm start          # http://localhost:4200
```

```bash
npm run build      # build de production
npm test           # tests unitaires (Vitest)
```

## Déploiement

Chaque poussée sur `main` publie l'application sur GitHub Pages
(`.github/workflows/deploy.yml`).

Le site étant servi depuis un sous-chemin (`/<dépôt>/`), le workflow passe
`--base-href` au build : sans cela, les scripts et les feuilles de style
seraient demandés à la racine du domaine. GitHub Pages ne servant que des
fichiers statiques, une URL profonde comme `/alert-basket` n'existe pas sur
disque ; `index.html` est donc dupliqué en `404.html` pour que le routeur
Angular reprenne la main. L'accès direct à une telle URL répond avec un statut
404 — c'est le fonctionnement attendu de cette plateforme, et l'application
s'affiche normalement.

## Pile technique

- **Angular 21** — composants standalone, Signals, `computed()`, `effect()`
- **Détection de changement sans Zone.js** (`provideZonelessChangeDetection`)
- **Lazy loading** par fonctionnalité, liaison des paramètres de route aux `input()`
- **SCSS** avec un système de jetons de conception repris des maquettes — un
  seul thème, celui des maquettes
- **Aucune dépendance d'affichage externe** — polices Inter et Material Symbols
  embarquées dans le bundle, aucune requête vers un tiers

## Architecture

```
src/app/
├── core/                  Domaine, état et services transverses
│   ├── models/            Référentiel métier, personnes, alertes, droits
│   ├── data/              Jeu de données de démonstration
│   ├── auth/              Session, groupes d'habilitation, permissions
│   ├── interceptors/      Corrélation des requêtes
│   ├── services/          Thème, notifications
│   └── state/             AlertStore — source de vérité des alertes
├── layout/
│   ├── app-shell/         Coquille et zone de contenu
│   └── header/            Bandeau, compte, langue, onglets
├── shared/                Briques partagées
│   ├── ui/overlay/        Modale, panneau latéral, notifications
│   ├── pipes/             Formats d'affichage
│   └── util/              Piège à focus
└── features/
    ├── alerts/
    │   ├── basket/        My alerts · Alert Basket · Processed alerts
    │   └── processing/    Poste de traitement (3 onglets)
    └── persons/
        ├── search/        Recherche de personne
        └── profile/       Profil de risque client
```

## Écrans

| Onglet           | Route               | Contenu                                      |
| ---------------- | ------------------- | -------------------------------------------- |
| My alerts        | `/my-alerts`        | Alertes ouvertes affectées au compte courant |
| Alert Basket     | `/alert-basket`     | Toutes les alertes ouvertes de l'entité      |
| Processed alerts | `/processed-alerts` | Registre des alertes clôturées               |
| Search person    | `/search-person`    | Recherche personne physique ou morale        |
| —                | `/alerts/:alertId`  | Traitement : personne, alerte, historique    |
| —                | `/person/:personId` | Profil de risque et alertes de la personne   |

## Workflow métier

```
ALERTE GÉNÉRÉE → TO_CLEAR_L1 → IN_PROCESS_L1
                                     │
                    ┌────────────────┴────────────────┐
              CLEARED_L1                        ESCALATED_L2
                                                      │
                                               IN_PROCESS_L2
                                                      │
                                    ┌─────────────────┴─────────────────┐
                              CLEARED_L2                          BLACKLISTED
```

Le statut `ENFORCED_SCRUTINY` marque une personne placée sous vigilance
renforcée à la suite d'une revue de son profil de risque.

Toute décision exige une justification écrite d'au plus 1000 caractères, et
n'est proposée qu'au niveau d'habilitation qui en a la charge.

## Matrice des droits

| Action                                                        | Level 1 | Level 2 |
| ------------------------------------------------------------- | :-----: | :-----: |
| Consulter une alerte, une personne, un rapprochement          |    ●    |    ●    |
| Commenter, s'affecter une alerte                              |    ●    |    ●    |
| Affecter à un autre analyste                                  |         |    ●    |
| Clôturer au niveau 1 (`Cleared alert - No Risk - Level 1`)    |    ●    |         |
| Escalader au niveau 2                                         |    ●    |         |
| Clôturer au niveau 2 (`Cleared alert - No Risk - Level 2`)    |         |    ●    |
| Inscrire sous mesure de gel (`Blacklisted - Under Sanctions`) |         |    ●    |
| Exporter les données                                          |         |    ●    |

> Les permissions du frontend pilotent uniquement l'affichage : elles masquent
> les actions non autorisées pour réduire le bruit et les erreurs de
> manipulation. **Elles ne constituent pas une couche de sécurité.** Dans un
> déploiement réel, chaque action doit être revalidée côté serveur, seul juge
> de l'habilitation effective.

## Traçabilité

Toutes les mutations passent par `AlertStore`, et chacune écrit son propre
événement d'historique : il n'existe aucun chemin permettant de modifier une
alerte sans laisser de trace. Le journal est traité comme un registre en
écriture seule — aucun écran n'expose de modification ou de suppression
d'entrée. L'onglet « Alert history » restitue date, action, auteur, groupe,
valeur avant, valeur après et commentaire.

## Données de démonstration

Le jeu de données combine les alertes et les personnes reprises **champ pour
champ** des maquettes — les dix premières lignes de chaque corbeille, l'alerte
6134 de l'écran de traitement, les profils `PP123456789` et `PM123456789`, les
résultats de recherche — et un générateur déterministe qui complète les volumes
affichés par les paginateurs des maquettes : **706 alertes ouvertes** et
**92 alertes traitées**.

Le générateur est semé : à build identique, données identiques. Aucune alerte
générée n'est affectée au compte par défaut, afin que la corbeille
« My alerts » reste celle des maquettes.

### Référentiel des filiales

Filiales, sous-entités, identifiants système et comptes sont **fictifs**. Deux
règles tiennent ce référentiel, et deux tests les vérifient :

| Filiale           | Sous-entité       | Identifiant système | Pays       |
| ----------------- | ----------------- | ------------------- | ---------- |
| Nordia Life       | Nordia Life DAC   | `SYS_NORDIA`        | Irlande    |
| Astrea Assurances | Astrea France     | `SYS_ASTREA`        | France     |
| Verema Seguros    | Verema España     | `SYS_VEREMA`        | Espagne    |
| Lumina Vita       | Lumina Italia     | `SYS_LUMINA`        | Italie     |
| Helvia Insurance  | Helvia Luxembourg | `SYS_HELVIA`        | Luxembourg |

**Cinq filiales au plus**, et **un identifiant système par filiale**. Cette
seconde règle est structurelle : le système est porté par la filiale, jamais
par la personne ou par l'alerte, qui le lisent au référentiel. Aucun jeu de
données ne peut donc en introduire un second par inadvertance.

La bascule de compte (menu profil du bandeau) permet de parcourir l'application
sous chaque niveau d'habilitation. L'utilisateur par défaut est `STRAN`
(TRAN Sébastien), analyste de niveau 2.

## Portée du prototype

Il s'agit d'un prototype d'interface : les données sont simulées côté client et
persistées en mémoire pour la durée de la session. Aucun appel réseau réel
n'est effectué, aucune donnée n'est conservée après rechargement, hormis le
compte sélectionné.
