/**
 * backlog-show — le bord qui assemble le détail des fiches d'un projet (fiche 20261031160441267).
 *
 * Lit les fiches par le lecteur de la méthode, leur texte, et les branches de travail ouvertes ; le
 * découpage est fait par le cœur pur (`core/fiche-detail.ts`). `bin/backlog-show.ts` et le générateur
 * d'exemples (`io/contract-files.ts`) passent tous deux par ici.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BACKLOG_SCHEMA_VERSION,
  type BacklogShowFiche,
  type BacklogShowListe,
  buildFicheDetail,
} from '../core/fiche-detail.js';
import { type Fiche, loadFiches } from '../loaders/fiches.js';
import { collectInProgressIds } from './sessions-collect.js';

const detailOf = (root: string, fiche: Fiche, inProgressIds: ReadonlySet<string>) =>
  buildFicheDetail(fiche, readFileSync(join(root, fiche.file), 'utf8'), inProgressIds.has(fiche.id));

/** Le détail d'UNE fiche (dans `features/` ou `done/`), ou `undefined` si l'id n'existe pas. */
export function backlogShowFiche(root: string, id: string): BacklogShowFiche | undefined {
  const fiche = loadFiches(root).find((f) => f.id === id);
  if (fiche === undefined) return undefined;
  return { schema_version: BACKLOG_SCHEMA_VERSION, ...detailOf(root, fiche, collectInProgressIds(root)) };
}

/** Le détail de toutes les fiches de `features/`, hors `done/`, triées par id, en un appel. */
export function backlogShowListe(root: string): BacklogShowListe {
  const inProgressIds = collectInProgressIds(root);
  return {
    schema_version: BACKLOG_SCHEMA_VERSION,
    fiches: loadFiches(root)
      .filter((f) => !f.done)
      .map((f) => detailOf(root, f, inProgressIds)),
  };
}
