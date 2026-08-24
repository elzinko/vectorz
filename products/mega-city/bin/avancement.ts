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
    `${data.counts.shipped ?? 0} livrées, ${data.epics.length} épics.`,
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
  const tag = f.status === 'todo' && f.ready ? '✓' : f.status === 'blocked' ? '⛔' : ' ';
  const ep = f.epic ? ` ⤷${f.epic}` : '';
  console.log(`    ${tag} ${f.id}  ${f.status.padEnd(11)} ${f.title.slice(0, 66)}${ep}`);
}

if (data.epics.length > 0) {
  console.log('\nÉpics (enfants actifs) :');
  for (const e of data.epics) {
    console.log(`  ${e.id}  ${e.title.slice(0, 60)} — ${e.children.length} enfant(s) actif(s)`);
  }
}
