#!/usr/bin/env tsx
/**
 * avancement — le board d'avancement en TEXTE (fiche 20260823124042842, lot 0, brick 0).
 *
 *   pnpm --dir products/mega-city avancement          # résumé lisible
 *   pnpm --dir products/mega-city avancement --json    # données pour la future vue web
 *
 * Le cœur (src/core/avancement-data.ts) compile depuis les fiches ; ce script est le
 * bord I/O. La vue interactive (`diagrams/avancement/`, servie par ezk-map) est la
 * brique suivante — ce texte prouve déjà la donnée, sans HTML.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUTS, buildAvancementData } from '../src/core/avancement-data.js';
import { loadFiches } from '../src/loaders/fiches.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const data = buildAvancementData(loadFiches(repoRoot));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(data, null, 1));
  process.exit(0);
}

// En clair d'abord (règle human-facing-lisibility).
const actives = data.actives.length;
console.log(
  `En clair : ${actives} fiches actives, dont ${data.tirables} tirable(s) (todo + ready). ` +
    `${data.counts.shipped ?? 0} livrées, ${data.milestones.length} milestone(s).`,
);
console.log(
  `\nPar statut : ${STATUTS.filter((s) => data.counts[s]).map((s) => `${s} ${data.counts[s]}`).join(' · ')}`,
);

console.log('\nActives par priorité (les tirables marquées ✓) :');
let prio = '';
for (const f of data.actives) {
  if (f.priority !== prio) {
    prio = f.priority;
    console.log(`\n  ${prio || '(sans prio)'}`);
  }
  const tag = f.status === 'ready' ? '✓' : f.status === 'blocked' ? '⛔' : ' ';
  const ms = f.milestone ? ` ⤷${f.milestone}` : '';
  console.log(`    ${tag} ${f.id}  ${f.status.padEnd(11)} ${f.title.slice(0, 66)}${ms}`);
}

if (data.milestones.length > 0) {
  console.log('\nMilestones (avancement cumulé) :');
  for (const m of data.milestones) {
    console.log(
      `  ${m.milestone.padEnd(16)} [${m.status}] — ${m.total} fiche(s), ${m.shipped} livrée(s)`,
    );
  }
}
