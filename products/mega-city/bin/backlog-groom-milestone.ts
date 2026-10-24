#!/usr/bin/env tsx
/**
 * backlog-groom-milestone — bord I/O de la passe de grooming d'UNE milestone (fiche 20261015122120198).
 *
 *   pnpm --dir products/mega-city backlog:groom-milestone <nom>
 *   pnpm --dir products/mega-city backlog:groom-milestone <nom> --report --since "<id:status;…>"
 *
 * Deux temps, LECTURE SEULE (rien n'est écrit, aucun git) :
 *   1. sans `--report` : imprime la SÉLECTION (à groomer / arbitrage humain / déjà prête) et un
 *      INSTANTANÉ machine des statuts de départ, à repasser au second appel ;
 *   2. avec `--report --since "<instantané>"` : imprime le DELTA (prêtes / toujours idée / découpées /
 *      exclues) entre l'instantané et l'état courant.
 *
 * Entre les deux, le LLM (skill `ezk-backlog`) groome chaque fiche `~`. Le gate `ready` seul promeut :
 * ce bord ne force jamais `ready` (il ne fait que lire). Codes : 0 fait · 2 usage.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type FicheSnapshot,
  groomPassDelta,
  renderGroomDelta,
  renderGroomSelection,
  selectMilestone,
} from '../src/backlog/groom-pass.js';
import { loadFiches } from '../src/loaders/fiches.js';

function usage(message?: string): never {
  if (message) console.error(`erreur: ${message}`);
  console.error(
    'usage : backlog:groom-milestone <nom> [--report --since "<id:status;…>"] [--root <dossier>]',
  );
  process.exit(2);
}

function parseArgs(argv: string[]): { root: string; milestone: string; report: boolean; since: string } {
  let root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  let report = false;
  let since = '';
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--report') report = true;
    else if (arg === '--since') since = argv[++i] ?? usage('--since attend un instantané « id:status;… »');
    else if (arg === '--root') root = resolve(argv[++i] ?? usage('--root attend un dossier'));
    else if (arg.startsWith('--')) usage(`option inconnue : ${arg}`);
    else positional.push(arg);
  }
  const milestone = positional.shift();
  if (milestone === undefined) usage('un nom de milestone est requis (exemple : groom-milestone preparation)');
  if (positional.length > 0) usage(`argument en trop : ${positional.join(' ')}`);
  return { root, milestone, report, since };
}

/** Lit l'instantané `id:status;id:status;…` (le texte imprimé par le 1er appel). */
function parseSnapshot(raw: string): FicheSnapshot[] {
  return raw
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => pair !== '' && !pair.startsWith('#'))
    .map((pair) => {
      const [id, status] = pair.split(':');
      return { id: id ?? '', status: status ?? '' };
    })
    .filter((snap) => snap.id !== '');
}

function main(): void {
  const { root, milestone, report, since } = parseArgs(process.argv.slice(2).filter((a) => a !== '--'));
  const fiches = loadFiches(root);

  if (report) {
    const delta = groomPassDelta(parseSnapshot(since), fiches, milestone);
    console.log(renderGroomDelta(milestone, delta).join('\n'));
    return;
  }

  const candidates = selectMilestone(fiches, milestone);
  console.log(renderGroomSelection(milestone, candidates).join('\n'));
  const snapshot = candidates.map((c) => `${c.id}:${c.status}`).join(';');
  console.log(`\n# instantané (repasse-le à « --report --since ») :\n${snapshot}`);
}

main();
