/**
 * pr-emit-local — écrit le CORPS DE PR d'une feature dans un fichier LOCAL (mode `github: false`,
 * fiche 20260916225506856). C'est « ce qu'une PR contiendrait », rendu depuis la fiche (ADR-0029),
 * sans ouvrir de PR GitHub. Frontière I/O (ADR-0003) ; le rendu pur vit dans `src/pr-body/render.ts`.
 *
 * Usage :
 *   pnpm --dir products/mega-city pr:emit-local --fiche features/<id>_<slug>.md \
 *     [--out-root features/pr-local] [--validation "Gate locale=✅,Revue=✅"]
 *
 * Le chemin CIBLE et la fiche sont résolus contre `INIT_CWD` (répertoire d'invocation = racine
 * du projet), pas le cwd de `pnpm --dir …` — même correctif que `bin/ezk-config.ts` et
 * `bin/review-emit.ts` (revues Codex, PR #250/#251), sans quoi le fichier atterrirait dans le
 * monorepo au lieu du projet où tourne le sprint.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, isAbsolute, relative, resolve } from 'node:path';
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

const values = parseArgs(process.argv.slice(2));
const ficheArg = values.fiche;
if (!ficheArg) fail('option --fiche est requise (chemin de la fiche, ex. features/<id>_<slug>.md)');

const base = process.env.INIT_CWD ?? process.cwd();
const fichePathAbs = resolve(base, ficheArg);
// Provenance dans le corps = chemin relatif à la racine du projet (check-pr-body.sh veut `features/…md`).
const fichePathRel = isAbsolute(ficheArg) ? relative(base, fichePathAbs) : ficheArg;

let ficheText: string;
try {
  ficheText = readFileSync(fichePathAbs, 'utf8');
} catch {
  fail(`fiche introuvable : ${fichePathAbs}`);
}

const outRoot = resolve(base, values['out-root'] ?? 'features/pr-local');
const outPath = resolve(outRoot, basename(fichePathRel));

const body = renderPrBody({
  ficheText,
  fichePath: fichePathRel,
  validation: parseValidation(values.validation),
});

mkdirSync(outRoot, { recursive: true });
writeFileSync(outPath, body, 'utf8');
console.log(`✓ corps de PR local écrit : ${outPath}`);
