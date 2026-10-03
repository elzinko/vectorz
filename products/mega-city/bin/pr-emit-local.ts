/**
 * pr-emit-local — écrit le CORPS DE PR d'une feature dans un fichier LOCAL (mode `github: false`,
 * fiche 20260916225506856). C'est « ce qu'une PR contiendrait », rendu depuis la fiche (ADR-0029),
 * sans ouvrir de PR GitHub. Frontière I/O (ADR-0003) ; le rendu pur vit dans `src/pr-body/render.ts`.
 *
 * Usage :
 *   pnpm --dir products/mega-city pr:emit-local --fiche features/<id>_<slug>.md \
 *     [--out-root features/pr-local] [--validation "Gate locale=✅,Revue=✅"]
 *
 * Le projet est celui que désigne `ezk` (`--root`, ou le dépôt du dossier courant), sinon `INIT_CWD`
 * (répertoire d'invocation de `pnpm --dir …`) : jamais le monorepo de la méthode. La fiche et
 * `--out-root` se lisent depuis la racine du projet, comme les fiches de `ezk backlog ship`.
 * Les liens relatifs de la fiche sont recalés pour le dossier du document, et la provenance est un
 * lien que `ship` recale quand il range la fiche (fiche 20261003200945204).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, posix, relative, resolve, sep } from 'node:path';
import { recalLinks } from '../src/backlog/ship-fiche.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { renderPrBody, type ValidationRow } from '../src/pr-body/render.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

function parseArgs(argv: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) fail(`option --${key} attend une valeur`);
    values[key] = value;
    i++;
  }
  return values;
}

/** "Gate locale=✅,Revue=⏳" → [{modalite,statut}, …]. Absent → défaut du cœur (gates locales). */
function parseValidation(spec: string | undefined): ValidationRow[] | undefined {
  if (!spec) return undefined;
  return spec.split(',').map((pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) fail(`--validation : « ${pair} » attendu au format « Modalité=Statut »`);
    return { modalite: pair.slice(0, idx).trim(), statut: pair.slice(idx + 1).trim() };
  });
}

// Sans projet désigné : le dossier où l'on a tapé la commande (pnpm change de dossier avant le script).
const project = projectRootOrExit(process.env.INIT_CWD ?? process.cwd());
const values = parseArgs(project.rest);
const ficheArg = values.fiche;
if (!ficheArg) fail('option --fiche est requise (chemin de la fiche, ex. features/<id>_<slug>.md)');

/** Un chemin du projet, relatif à sa racine, en séparateurs `/` (comme les liens markdown). */
const inProject = (abs: string): string => relative(project.root, abs).split(sep).join(posix.sep);

const fichePathAbs = resolve(project.root, ficheArg);
// Provenance dans le corps = chemin relatif à la racine du projet (check-pr-body.sh veut `features/…md`).
const fichePathRel = inProject(fichePathAbs);

let ficheText: string;
try {
  ficheText = readFileSync(fichePathAbs, 'utf8');
} catch {
  fail(`fiche introuvable : ${fichePathAbs}`);
}

const outRoot = resolve(project.root, values['out-root'] ?? join('features', 'pr-local'));
const outPath = resolve(outRoot, basename(fichePathRel));
const outPathRel = inProject(outPath);

// Le document vit un dossier plus bas que la fiche : ses liens relatifs suivent (images de preuve…).
const rebased = recalLinks(ficheText, fichePathRel, outPathRel, new Map(), (p) => existsSync(join(project.root, p)));
const body = renderPrBody({
  ficheText: rebased.text,
  fichePath: fichePathRel,
  ficheHref: posix.relative(posix.dirname(outPathRel), fichePathRel),
  validation: parseValidation(values.validation),
});

mkdirSync(outRoot, { recursive: true });
writeFileSync(outPath, body, 'utf8');
console.log(`✓ corps de PR local écrit : ${outPath}`);
