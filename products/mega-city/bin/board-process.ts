#!/usr/bin/env tsx
/**
 * board-process — chaque fiche du projet posée sur son étape (fiche 20261102123552183).
 *
 *   ezk board process                  # résumé lisible
 *   ezk board process --json           # le contrat JSON versionné (contracts/board-process/)
 *   ezk --root <projet> board process  # un AUTRE projet : ses fiches, ses branches, ses sessions
 *
 * Le calcul vit dans `src/core/process-data.ts` ; ce script est le bord. Un projet `github: false`
 * n'appelle jamais `gh` : l'étape « en revue » y est dite inconnue.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardProcessData } from '../src/io/board-process.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root } = projectRootOrExit(ownRoot);
const data = boardProcessData(root);

// Pas de `process.exit` après la sortie : il couperait le JSON à 64 Ko dans un tuyau (constat du 2026-11-01).
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(data, null, 1));
} else {
  const active = data.stages.filter((g) => g.stage !== 'livree');
  const total = active.reduce((n, g) => n + g.fiches.length, 0);
  const parts = active.map((g) => `${g.fiches.length} ${g.label.toLowerCase()}`).join(', ');
  console.log(`En clair : ${total} fiches actives : ${parts}.`);
  if (data.reviewIndetermine) {
    console.log(
      data.github
        ? "GitHub n'a pas répondu : l'étape « en revue » est inconnue."
        : "Ce projet a coupé GitHub : l'étape « en revue » est inconnue, aucune PR n'est lue.",
    );
  }
  for (const g of active) {
    if (g.fiches.length === 0) continue;
    console.log(`\n${g.label}`);
    for (const f of g.fiches) {
      const signal = [f.pr, f.branch, f.session ? `session ${f.session.path}` : null].filter(Boolean).join(' · ');
      console.log(`  ${f.priority} ${f.id} ${f.title}${signal ? ` — ${signal}` : ''}`);
    }
  }
}
