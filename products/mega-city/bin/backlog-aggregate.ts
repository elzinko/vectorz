#!/usr/bin/env tsx
/**
 * backlog-aggregate — bord I/O de `ezk-backlog aggregate` (fiche 20260812104022240,
 * ADR-0051). Le cœur PUR (`src/backlog/aggregate.ts`) fait le clustering ; ICI = lecture
 * disque + affichage. **LECTURE SEULE — n'écrit jamais aucune fiche.**
 *
 *   pnpm --dir products/mega-city backlog:aggregate [--scope <all|<produit>|Pn|epic:<id>>]
 *     [--focus <merge|split|epics|dedup|reprioritize>] [--mode <script|llm|both>]
 *
 * `aggregate` PROPOSE seulement (ADR-0001 : le script range, le PO tranche) : chaque
 * proposition nomme le geste d'application (`ship`, futur `merge`/`split`) sans l'exécuter.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type AggregateCluster, aggregateByScript, selectScope } from '../src/backlog/aggregate.js';
import { loadFiches } from '../src/loaders/fiches.js';

type Mode = 'script' | 'llm' | 'both';
type Focus = 'merge' | 'split' | 'epics' | 'dedup' | 'reprioritize';

function parseArgs(argv: string[]): { scope: string; focus: Focus | null; mode: Mode } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scope = get('--scope') ?? 'all';
  const focus = (get('--focus') as Focus | undefined) ?? null;
  const mode = (get('--mode') as Mode | undefined) ?? 'script';
  return { scope, focus, mode };
}

/** Un cluster `label`/`title-prefix` se lit comme un candidat FUSION ; `epic` comme un rattachement. */
function clusterFocuses(cluster: AggregateCluster): Focus[] {
  return cluster.reason === 'epic' ? ['epics'] : ['merge'];
}

function printCluster(n: number, cluster: AggregateCluster): void {
  const geste = cluster.reason === 'epic' ? 'ship (rattachement épic)' : 'ship (fusion — merge à venir)';
  console.log(
    `  ${n}. [${cluster.reason}] "${cluster.key}" — ${cluster.ficheIds.join(', ')} → ${geste}`,
  );
}

function main(): void {
  const { scope, focus, mode } = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const fiches = selectScope(loadFiches(repoRoot), scope);

  console.log(
    `En clair : passe de rationalisation sur le stock "${scope}". ` +
      'Elle propose des regroupements ; rien n\'est modifié ici — le PO tranche, un geste séparé applique.',
  );

  if (mode === 'llm') {
    console.log(
      '\nMode llm : clustering déterministe SAUTÉ. Le jugement (fusions par intention, ' +
        'faux positifs/négatifs, splits) revient au playbook `review`/`aggregate --mode llm` — non implémenté par ce cœur.',
    );
    return;
  }

  const report = aggregateByScript(fiches);
  console.log(
    `\nCouverture : ${report.coverage.tagged}/${report.coverage.total} fiches taguées, ` +
      `${report.coverage.clustered} regroupées.`,
  );

  const clusters = focus ? report.clusters.filter((c) => clusterFocuses(c).includes(focus)) : report.clusters;

  if (clusters.length === 0 && report.singletons.length === 0) {
    console.log('\nAucune proposition — stock trop petit ou déjà homogène.');
  } else {
    console.log('\nPropositions :');
    let n = 1;
    for (const cluster of clusters) printCluster(n++, cluster);
    if (!focus || focus === 'dedup') {
      for (const id of report.singletons) {
        console.log(`  ${n++}. [singleton] ${id} — rien à regrouper (aucun geste)`);
      }
    }
  }

  if (focus && focus !== 'merge' && focus !== 'epics' && focus !== 'dedup') {
    console.log(
      `\nNote : --focus ${focus} n'est pas produit par le moteur script (hors périmètre de ce cœur).`,
    );
  }

  if (mode === 'both') {
    console.log(
      '\nMode both : passe llm non exécutée par ce cœur (moteur script seul implémenté ici) — ' +
        'le jugement par intention reste à faire via le playbook.',
    );
  }
}

main();
