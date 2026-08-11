import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  /* Un élément personnalisé est en ligne par défaut : il s'élargirait alors à
     son contenu — un tableau de douze colonnes — au lieu de se limiter à la
     fenêtre, et la page entière défilerait horizontalement au lieu du seul
     tableau. */
  styles: ':host { display: block; }',
})
export class App {}
