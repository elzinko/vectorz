#!/usr/bin/env tsx
/**
 * law-show — la loi de la méthode, règle par règle, et sa PORTÉE réelle (fiche 20261101215342537).
 *
 *   pnpm --dir products/mega-city exec tsx bin/law-show.ts            # résumé lisible
 *   pnpm --dir products/mega-city exec tsx bin/law-show.ts --json     # le contrat JSON versionné (ADR-086)
 *   ... --target <dossier>     # un autre dossier que ~/.claude (essais, comme `lawgiver --target`)
 *   ... --root <projet>        # la loi d'un AUTRE projet (ou EZK_ROOT) : son .iamthelaw/ENTRY.md
 *   ... skill:<id> | agent:<id> [--json]   # les règles de CET objet, texte complet de celles que la
 *                                          # loi installée ne porte pas (fiche 20261102103553108)
 *
 * LECTURE SEULE. Le catalogue se relit à chaque appel (jamais `.ezk/graph.compiled.json`, périmé dès
 * qu'une règle bouge). Le cœur est `src/core/law-show.ts`. Pas de `process.exit` après la sortie : il
 * couperait le JSON à 64 Ko dans un tuyau (constat du 2026-11-01) ; on pose `process.exitCode`.
 */
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderLawObjectText, renderLawText } from '../src/core/law-show.js';
import { lawObjectData, lawShowData } from '../src/io/law-show.js';
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

/** L'objet demandé, s'il y en a un parmi les arguments. Un `bundle:` ou un `profile:` est capté aussi,
 * pour être refusé : sans cela, il serait ignoré en silence et la carte entière s'afficherait. */
const objet = rest.find((a) => /^(skill|agent|bundle|profile):/.test(a));

const target = targetOf(rest);
if (process.exitCode !== 2) {
  const where = { target, projectRoot };
  const json = rest.includes('--json');
  if (objet === undefined) {
    const law = lawShowData(megaCity, where);
    console.log(json ? JSON.stringify(law, null, 1) : renderLawText(law));
  } else {
    const view = lawObjectData(megaCity, where, objet);
    if (view === null) {
      console.error(`law show : objet inconnu « ${objet} » (attendu : skill:<id> ou agent:<id> du catalogue).`);
      process.exitCode = 1;
    } else {
      console.log(json ? JSON.stringify(view, null, 1) : renderLawObjectText(view));
    }
  }
}
