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
  type FicheLivree,
} from '../core/fiche-detail.js';
import { sprintOfFiches } from '../core/sprint-report-summary.js';
import { type Fiche, loadFiches } from '../loaders/fiches.js';
import { collectInProgressIds } from './sessions-collect.js';
import { SPRINTS_DIR, sprintReports } from './sprint-reports.js';

const detailOf = (root: string, fiche: Fiche, inProgressIds: ReadonlySet<string>) =>
  buildFicheDetail(fiche, readFileSync(join(root, fiche.file), 'utf8'), inProgressIds.has(fiche.id));

/** Le détail d'UNE fiche (dans `features/` ou `done/`), ou `undefined` si l'id n'existe pas. */
export function backlogShowFiche(root: string, id: string): BacklogShowFiche | undefined {
  const fiche = loadFiches(root).find((f) => f.id === id);
  if (fiche === undefined) return undefined;
  return { schema_version: BACKLOG_SCHEMA_VERSION, ...detailOf(root, fiche, collectInProgressIds(root)) };
}

/**
 * Le détail de toutes les fiches de `features/`, hors `done/`, triées par id, en un appel ; plus le
 * résumé des fiches livrées, pour que mission control les montre (fiche 20261103191932064), avec leur
 * objectif, leurs labels et le sprint qui les a livrées (fiche 20261114131612572).
 */
export function backlogShowListe(root: string): BacklogShowListe {
  const inProgressIds = collectInProgressIds(root);
  const fiches = loadFiches(root);
  const sprints = sprintOfFiches(SPRINTS_DIR, sprintReports(root));
  return {
    schema_version: BACKLOG_SCHEMA_VERSION,
    fiches: fiches.filter((f) => !f.done).map((f) => detailOf(root, f, inProgressIds)),
    livrees: fiches
      .filter((f) => f.done && f.status === 'shipped')
      .map(
        ({ id, title, priority, version, pr, milestone, labels }): FicheLivree => ({
          id,
          title,
          priority,
          version,
          pr,
          milestone,
          labels,
          sprint: sprints.get(id) ?? null,
        }),
      ),
  };
}
