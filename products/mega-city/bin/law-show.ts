#!/usr/bin/env tsx
/**
 * law-show — la loi de la méthode, règle par règle, et sa PORTÉE réelle (fiche 20261101215342537).
 *
 *   pnpm --dir products/mega-city exec tsx bin/law-show.ts            # résumé lisible
 *   pnpm --dir products/mega-city exec tsx bin/law-show.ts --json     # le contrat JSON versionné (ADR-086)
 *   ... --target <dossier>     # un autre dossier que ~/.claude (essais, comme `lawgiver --target`)
 *   ... --root <projet>        # la loi d'un AUTRE projet (ou EZK_ROOT) : son .iamthelaw/ENTRY.md
 *
 * LECTURE SEULE. Le catalogue se relit à chaque appel (jamais `.ezk/graph.compiled.json`, périmé dès
 * qu'une règle bouge). Le cœur est `src/core/law-show.ts`. Pas de `process.exit` après la sortie : il
 * couperait le JSON à 64 Ko dans un tuyau (constat du 2026-11-01) ; on pose `process.exitCode`.
 */
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderLawText } from '../src/core/law-show.js';
import { lawShowData } from '../src/io/law-show.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ownRoot = resolve(megaCity, '..', '..');
const { root: projectRoot, rest } = projectRootOrExit(ownRoot);

/** `--target <dossier>` si on le donne ; le vrai `~/.claude` seulement quand l'option est ABSENTE. */
function targetOf(args: string[]): string {
  const at = args.indexOf('--target');
  if (at === -1) return join(homedir(), '.claude');
  const value = args[at + 1];
  if (value === undefined || value.startsWith('--')) {
    console.error('law show : « --target » attend un dossier (sans lui, la cible serait le vrai ~/.claude).');
    process.exitCode = 2;
    return '';
  }
  return value;
}

const target = targetOf(rest);
if (process.exitCode !== 2) {
  const law = lawShowData(megaCity, { target, projectRoot });
  console.log(rest.includes('--json') ? JSON.stringify(law, null, 1) : renderLawText(law));
}
