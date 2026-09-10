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
 * proposition nomme le geste d'application (fusion `merged` / rattachement épic) sans
 * l'exécuter — **jamais `ship`** (ship = livrer une fiche et la déplacer dans `done/`,
 * pas regrouper des fiches actives ; Codex #223 P1).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type AggregateCluster, aggregateByScript, selectScope } from '../src/backlog/aggregate.js';
import { loadFiches } from '../src/loaders/fiches.js';

type Mode = 'script' | 'llm' | 'both';
type Focus = 'merge' | 'split' | 'epics' | 'dedup' | 'reprioritize';

const MODES: readonly Mode[] = ['script', 'llm', 'both'];
const FOCUSES: readonly Focus[] = ['merge', 'split', 'epics', 'dedup', 'reprioritize'];

function die(msg: string): never {
  console.error(`erreur: ${msg}`);
  process.exit(1);
}

function parseArgs(argv: string[]): { scope: string; focus: Focus | null; mode: Mode } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scope = get('--scope') ?? 'all';
  // Enums fermées → rejet explicite d'une valeur hors-liste (jamais de repli silencieux : le
  // mode choisit si le jugement LLM est attendu ; une valeur devinée tromperait — Codex #223 P2).
  const rawFocus = get('--focus');
  if (rawFocus !== undefined && !FOCUSES.includes(rawFocus as Focus)) {
    die(`--focus « ${rawFocus} » invalide (attendu : ${FOCUSES.join(' | ')}).`);
  }
  const rawMode = get('--mode') ?? 'script';
  if (!MODES.includes(rawMode as Mode)) {
    die(`--mode « ${rawMode} » invalide (attendu : ${MODES.join(' | ')}).`);
  }
  return { scope, focus: (rawFocus as Focus | undefined) ?? null, mode: rawMode as Mode };
}

/**
 * Focus couverts par un cluster : `label`/`title-prefix` = candidat FUSION, lisible aussi
 * sous `dedup` (ce SONT les doublons) ; `epic` = rattachement. Sans ce `dedup`, `--focus dedup`
 * filtrerait tous les clusters et n'afficherait que les singletons — l'inverse de son nom.
 */
function clusterFocuses(cluster: AggregateCluster): Focus[] {
  return cluster.reason === 'epic' ? ['epics'] : ['merge', 'dedup'];
}

/** Nomme le geste d'application SANS l'exécuter — jamais `ship` (Codex #223 P1). */
function printCluster(n: number, cluster: AggregateCluster): void {
  const geste =
    cluster.reason === 'epic'
      ? `rattacher à l'épic « ${cluster.key} » (éditer le champ epic: des fiches)`
      : 'fusion candidate → statut `merged` (gated sur la fiche 20260823121712652 — pas de `ship`)';
  console.log(
    `  ${n}. [${cluster.reason}] "${cluster.key}" — ${cluster.ficheIds.join(', ')} → ${geste}`,
  );
}

function main(): void {
  const { scope, focus, mode } = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const allFiches = loadFiches(repoRoot);

  // Scope inconnu ≠ « rien à proposer » : une faute (`--scope P9`, produit mal orthographié)
  // tomberait sinon dans un filtre produit vide et afficherait un message trompeur (ezk-reviewer P2).
  const knownProducts = [...new Set(allFiches.map((f) => f.product))].sort();
  const scopeOk =
    scope === 'all' ||
    /^P[0-3]$/.test(scope) ||
    scope.startsWith('epic:') ||
    knownProducts.includes(scope);
  if (!scopeOk) {
    die(
      `--scope « ${scope} » non reconnu (attendu : all | P0..P3 | epic:<id> | ` +
        `un produit connu : ${knownProducts.join(', ')}).`,
    );
  }
  const fiches = selectScope(allFiches, scope);

  console.log(
    `En clair : passe de rationalisation sur le stock "${scope}". ` +
      'Elle propose des regroupements ; rien n\'est modifié ici — le PO tranche, un geste séparé applique.',
  );

  if (mode === 'llm') {
    console.log(
      '\nMode llm : clustering déterministe SAUTÉ. Le jugement (fusions par intention, ' +
        'faux positifs/négatifs, splits) revient au playbook — non implémenté par ce cœur.',
    );
    return;
  }

  const report = aggregateByScript(fiches);
  console.log(
    `\nCouverture : ${report.coverage.tagged}/${report.coverage.total} fiches taguées, ` +
      `${report.coverage.clustered} regroupées.`,
  );

  if (focus === 'split' || focus === 'reprioritize') {
    // Ni les splits ni les re-priorisations ne sortent d'un clustering mécanique : jugement LLM.
    console.log(
      `\nNote : --focus ${focus} n'est pas produit par le moteur script ` +
        '(jugement LLM par intention — hors périmètre de ce cœur).',
    );
  } else {
    const clusters = focus
      ? report.clusters.filter((c) => clusterFocuses(c).includes(focus))
      : report.clusters;
    const showSingletons = !focus; // un singleton n'est candidat à aucun regroupement
    const hasProposals = clusters.length > 0 || (showSingletons && report.singletons.length > 0);
    if (!hasProposals) {
      console.log('\nAucune proposition — stock trop petit ou déjà homogène pour ce focus.');
    } else {
      console.log('\nPropositions :');
      let n = 1;
      for (const cluster of clusters) printCluster(n++, cluster);
      if (showSingletons) {
        for (const id of report.singletons) {
          console.log(`  ${n++}. [singleton] ${id} — rien à regrouper (aucun geste)`);
        }
      }
    }
  }

  if (mode === 'both') {
    console.log(
      '\nMode both : passe llm non exécutée par ce cœur (moteur script seul implémenté ici) — ' +
        'le jugement par intention reste à faire via le playbook.',
    );
  }
}

main();
