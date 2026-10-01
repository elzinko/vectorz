#!/usr/bin/env tsx
/**
 * backlog-aggregate — bord I/O de `ezk-backlog aggregate` (fiche 20260812104022240, ADR-0051 ;
 * moteur llm : fiche 20260910231201744). **LECTURE SEULE — n'écrit jamais aucune fiche.**
 *
 *   pnpm --dir products/mega-city backlog:aggregate [--scope <all|<produit>|Pn>]
 *     [--focus <merge|split|dedup|reprioritize>] [--mode <script|llm|both>]
 *     [--proposals <fichier.json>] [--root <dossier>]
 *
 * `aggregate` PROPOSE seulement (ADR-0001 : le script range, le PO tranche). L'APPLICATION est un geste
 * séparé, `backlog:apply` : chaque proposition nomme son geste sans l'exécuter — jamais `ship` (ship =
 * livrer une fiche et la déplacer dans `done/`, pas regrouper des fiches actives ; Codex #223 P1).
 *
 * Trois moteurs :
 *   script (défaut)  clustering mécanique et déterministe (`src/backlog/aggregate.ts`) ;
 *   llm              le jugement par le sens est celui de l'AGENT, jamais du code. Sans `--proposals` : le
 *                    dossier à juger et le format de la réponse. Avec : ses propositions, VALIDÉES (id
 *                    inventé refusé, rejets listés), puis rendues (`src/backlog/aggregate-llm.ts`) ;
 *   both             script, puis llm, puis le croisement des deux.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type AggregateCluster,
  type AggregateReport,
  aggregateByScript,
  selectScope,
} from '../src/backlog/aggregate.js';
import {
  type NumberedProposal,
  ProposalsFileError,
  applyCommand,
  crossCheck,
  parseProposals,
  renderDossier,
  validateProposals,
} from '../src/backlog/aggregate-llm.js';
import { type Fiche, loadFiches } from '../src/loaders/fiches.js';

type Mode = 'script' | 'llm' | 'both';
type Focus = 'merge' | 'split' | 'dedup' | 'reprioritize';

const MODES: readonly Mode[] = ['script', 'llm', 'both'];
const FOCUSES: readonly Focus[] = ['merge', 'split', 'dedup', 'reprioritize'];

function die(msg: string): never {
  console.error(`erreur: ${msg}`);
  process.exit(1);
}

interface Args {
  scope: string;
  focus: Focus | null;
  mode: Mode;
  proposals: string | undefined;
  root: string;
}

function parseArgs(argv: string[]): Args {
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
  const proposals = get('--proposals');
  if (argv.includes('--proposals') && proposals === undefined) die('--proposals attend un fichier JSON.');
  if (proposals !== undefined && rawMode === 'script') {
    die('--proposals demande --mode llm ou both : le moteur script ne lit pas de propositions.');
  }
  const root = resolve(get('--root') ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
  return { scope, focus: (rawFocus as Focus | undefined) ?? null, mode: rawMode as Mode, proposals, root };
}

/**
 * Focus couverts par un cluster : `label`/`title-prefix` = candidat FUSION, lisible aussi
 * sous `dedup` (ce SONT les doublons). Sans ce `dedup`, `--focus dedup` filtrerait tous les
 * clusters et n'afficherait que les singletons — l'inverse de son nom.
 */
function clusterFocuses(_cluster: AggregateCluster): Focus[] {
  return ['merge', 'dedup'];
}

/** Nomme le geste d'application SANS l'exécuter — jamais `ship` (Codex #223 P1). */
function printCluster(n: number, cluster: AggregateCluster): void {
  const geste =
    'fusion candidate → si tu la retiens, choisis la résultante puis `backlog:apply merge --into <résultante> <les autres>`';
  console.log(
    `  ${n}. [${cluster.reason}] "${cluster.key}" — ${cluster.ficheIds.join(', ')} → ${geste}`,
  );
}

function printScriptReport(report: AggregateReport, focus: Focus | null): void {
  console.log(
    `\nCouverture : ${report.coverage.tagged}/${report.coverage.total} fiches taguées, ` +
      `${report.coverage.clustered} regroupées.`,
  );
  if (focus === 'split' || focus === 'reprioritize') {
    // Ni les splits ni les re-priorisations ne sortent d'un clustering mécanique : jugement du moteur llm.
    console.log(
      `\nNote : --focus ${focus} n'est pas produit par le moteur script ` +
        '(jugement par le sens : lance --mode llm).',
    );
    return;
  }
  const clusters = focus
    ? report.clusters.filter((c) => clusterFocuses(c).includes(focus))
    : report.clusters;
  const showSingletons = !focus; // un singleton n'est candidat à aucun regroupement
  const hasProposals = clusters.length > 0 || (showSingletons && report.singletons.length > 0);
  if (!hasProposals) {
    console.log('\nAucune proposition — stock trop petit ou déjà homogène pour ce focus.');
    return;
  }
  console.log('\nPropositions :');
  let n = 1;
  for (const cluster of clusters) printCluster(n++, cluster);
  if (showSingletons) {
    for (const id of report.singletons) {
      console.log(`  ${n++}. [singleton] ${id} — rien à regrouper (aucun geste)`);
    }
  }
}

function printProposal(p: NumberedProposal, titleOf: (id: string) => string): void {
  const line = (label: string, ids: string[]): void => {
    ids.forEach((id, i) => {
      console.log(`        ${(i === 0 ? label : '').padEnd(11)} ${id}  ${titleOf(id)}`);
    });
  };
  console.log(`  n°${p.index} · ${p.kind === 'merge' ? 'fusion' : 'découpage'} · ${p.why}`);
  if (p.kind === 'merge') {
    line('résultante', [p.into]);
    line('sources', p.sources);
  } else {
    line('source', [p.source]);
    line('enfants', p.into);
  }
  console.log(`        ${'geste'.padEnd(11)} ${applyCommand(p)}`);
}

/** Lit, VALIDE et rend les propositions de l'agent. Un fichier illisible est une erreur franche. */
function printLlmReport(
  allFiches: Fiche[],
  path: string,
  clusters: AggregateCluster[],
  crossed: boolean,
): void {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    die(`fichier de propositions introuvable : ${path}`);
  }
  let items: unknown[];
  try {
    items = parseProposals(raw);
  } catch (error) {
    if (error instanceof ProposalsFileError) die(error.message);
    throw error;
  }
  const { accepted, rejected } = validateProposals(allFiches, items);
  const titles = new Map(allFiches.map((f) => [f.id, f.title] as const));
  console.log(
    `\nMoteur llm : ${accepted.length} proposition(s) validée(s), ${rejected.length} rejetée(s), sur ${items.length}.`,
  );
  if (accepted.length > 0) {
    console.log("\nPropositions (le PO tranche ; chaque geste est à lancer par toi, rien n'est exécuté ici) :");
    for (const p of accepted) printProposal(p, (id) => titles.get(id) ?? '');
  }
  if (rejected.length > 0) {
    console.log('\nRejetées (jamais appliquées) :');
    for (const r of rejected) console.log(`  n°${r.index} : ${r.reason}`);
  }
  if (accepted.length === 0 && rejected.length > 0) {
    // Tout rejeter n'est pas un succès : un appelant scripté doit le distinguer de « tout validé ».
    console.log('\nAucune proposition valide : corrige le fichier et relance.');
    process.exitCode = 1;
  }
  if (!crossed) return;

  const cross = crossCheck(clusters, accepted);
  console.log('\nCroisement script ↔ llm :');
  const describeCluster = (c: AggregateCluster): string =>
    `cluster [${c.reason}] "${c.key}" (${c.ficheIds.length} fiches)`;
  for (const { cluster, proposals } of cross.confirmed) {
    console.log(`  confirmé par le llm : ${describeCluster(cluster)} → proposition(s) n°${proposals.join(', n°')}`);
  }
  for (const cluster of cross.notRetained) {
    console.log(`  non retenu par le llm : ${describeCluster(cluster)} — faux positif possible`);
  }
  for (const index of cross.senseOnly) {
    console.log(`  trouvée par le sens seulement : proposition n°${index} (aucun cluster ne la couvre)`);
  }
  if (cross.confirmed.length + cross.notRetained.length + cross.senseOnly.length === 0) {
    console.log('  rien à croiser (aucun cluster, aucune proposition).');
  }
}

function main(): void {
  const { scope, focus, mode, proposals, root } = parseArgs(process.argv.slice(2));
  const allFiches = loadFiches(root);

  // Scope inconnu ≠ « rien à proposer » : une faute (`--scope P9`, produit mal orthographié)
  // tomberait sinon dans un filtre produit vide et afficherait un message trompeur (ezk-reviewer P2).
  const knownProducts = [...new Set(allFiches.map((f) => f.product))].sort();
  const scopeOk = scope === 'all' || /^P[0-3]$/.test(scope) || knownProducts.includes(scope);
  if (!scopeOk) {
    die(
      `--scope « ${scope} » non reconnu (attendu : all | P0..P3 | ` +
        `un produit connu : ${knownProducts.join(', ')}).`,
    );
  }
  const fiches = selectScope(allFiches, scope);

  // Moteur llm seul, sans réponse de l'agent : le dossier à juger (il s'ouvre par « En clair »).
  if (mode === 'llm' && proposals === undefined) {
    console.log(renderDossier(fiches, scope).join('\n'));
    return;
  }

  console.log(
    `En clair : passe de rationalisation sur le stock "${scope}" (moteur ${mode}). ` +
      "Elle propose des regroupements ; rien n'est modifié ici — le PO tranche, `backlog:apply` applique.",
  );

  const report = mode === 'llm' ? undefined : aggregateByScript(fiches);
  if (report) printScriptReport(report, focus);

  if (mode === 'script') return;
  if (proposals === undefined) {
    console.log(
      "\nMoteur llm : aucune proposition fournie. Voici le dossier à juger ; l'agent écrit sa réponse, puis relance avec --proposals.\n",
    );
    console.log(renderDossier(fiches, scope).slice(2).join('\n'));
    return;
  }
  printLlmReport(allFiches, proposals, report?.clusters ?? [], mode === 'both');
}

main();
