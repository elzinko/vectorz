/**
 * review-verdict — pose le pouce de revue d'une fiche par la ligne de commande (fiche 20261102123552181).
 *
 *   ezk review verdict <id> up|down|none [--root <projet>]
 *
 * Écrit `features/reviews/verdicts/<id>.json`, le MÊME fichier que la page web de la méthode
 * (ADR-0057), avec les mêmes contrôles : un id de fiche, une fiche qui existe, une valeur permise.
 * `none` retire le pouce. N'écrit rien d'autre et ne committe jamais. Mission control le pose en
 * lançant cette commande : seules les commandes `ezk` écrivent dans un projet (ADR-086).
 *
 * Codes de sortie : 0 posé, 1 refusé (rien n'est écrit), 2 usage.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkVerdictValues, verdictFile } from '../src/core/verdicts.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { localDay, writeVerdict } from '../src/io/verdicts.js';
import { loadFiches } from '../src/loaders/fiches.js';

const here = dirname(fileURLToPath(import.meta.url));
const methodRoot = resolve(here, '..', '..', '..');
const USAGE = 'usage : ezk review verdict <id-de-fiche> up|down|none [--root <projet>]';

/** Les arguments positionnels, sans `--root <projet>` (lu par projectRootOrExit). */
function positionals(argv: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === '--root') i++;
    else if (!arg.startsWith('--')) out.push(arg);
  }
  return out;
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.some((a) => a === '--help' || a === '-h')) {
    console.log(USAGE);
    return;
  }
  const [id, value] = positionals(argv);
  if (id === undefined || value === undefined) {
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }
  const { root } = projectRootOrExit(methodRoot);
  const check = checkVerdictValues(id, value, (candidate) =>
    loadFiches(root).some((f) => f.id === candidate),
  );
  if (!check.ok) {
    console.error(`refusé : ${check.error}`);
    process.exitCode = 1;
    return;
  }
  const { verdict } = check.request;
  writeVerdict(root, check.request.id, verdict, localDay());
  console.log(
    verdict === 'none'
      ? `Pouce retiré : ${check.request.id}`
      : `Pouce posé : ${check.request.id} → ${verdict} (${verdictFile(check.request.id)})`,
  );
}

main();
