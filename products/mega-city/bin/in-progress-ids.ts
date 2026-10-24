#!/usr/bin/env tsx
/**
 * in-progress-ids — imprime les ids de fiche « EN COURS », un par ligne, DÉDUITS des branches de
 * travail ouvertes `feat/<id>-…` (ADR-0077 : le statut `in-progress` est calculé, jamais écrit).
 *
 * C'est le MÊME signal que la vue web process, `ezk dor health` et le board ; ce bin l'expose aux
 * surfaces BASH (portfolio.sh), qui ne peuvent pas appeler le cœur TS. Le projet visé est le `cwd`
 * (l'appelant fait `cd` à la racine). git absent / hors dépôt → sortie vide (dégradé SÛR : « rien en cours »).
 */
import { collectInProgressIds } from '../src/io/sessions-collect.js';

// Le projet visé est le `cwd` (l'appelant fait `cd` à la racine).
for (const id of collectInProgressIds()) {
  console.log(id);
}
