import type { Routes } from '@angular/router';

import { AppShellComponent } from './layout/app-shell/app-shell';

/**
 * Arborescence de l'application.
 *
 * Les quatre onglets du bandeau sont les quatre points d'entrée ; les écrans
 * de traitement et de profil de risque s'ouvrent depuis les tableaux. Chaque
 * écran est chargé à la demande.
 */
export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'alert-basket' },

      {
        path: 'my-alerts',
        title: 'My alerts — AML PROJECT',
        loadComponent: () =>
          import('./features/alerts/basket/basket').then((m) => m.BasketComponent),
        data: { scope: 'mine' },
      },
      {
        path: 'alert-basket',
        title: 'Alert Basket — AML PROJECT',
        loadComponent: () =>
          import('./features/alerts/basket/basket').then((m) => m.BasketComponent),
        data: { scope: 'open' },
      },
      {
        path: 'processed-alerts',
        title: 'Processed alerts — AML PROJECT',
        loadComponent: () =>
          import('./features/alerts/basket/basket').then((m) => m.BasketComponent),
        data: { scope: 'processed' },
      },
      {
        path: 'search-person',
        title: 'Search person — AML PROJECT',
        loadComponent: () =>
          import('./features/persons/search/person-search').then((m) => m.PersonSearchComponent),
      },

      {
        path: 'alerts/:alertId',
        title: 'Alert processing — AML PROJECT',
        loadComponent: () =>
          import('./features/alerts/processing/processing').then((m) => m.ProcessingComponent),
      },
      {
        path: 'person/:personId',
        title: 'Profil de risque — AML PROJECT',
        loadComponent: () =>
          import('./features/persons/profile/person-profile').then((m) => m.PersonProfileComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
