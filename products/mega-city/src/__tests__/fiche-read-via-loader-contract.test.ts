import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * CONTRAT de la règle `development/fiche-read-via-loader` (fiche 20260922160651394, volet A).
 *
 * En clair : tout code qui LIT le front-matter d'une fiche passe par le loader testé
 * (`src/loaders/fiches.ts`), jamais par un `awk`, `grep`, `sed` ou une regex maison. La règle
 * tolère une dette héritée, mais « figée, jamais un ajout ». Ce test rend cette mesure mécanique :
 *   - un fichier qui parse le front-matter à la main et qui n'est PAS dans `LEGACY` fait échouer la suite ;
 *   - une entrée de `LEGACY` qui ne parse plus (elle a été migrée) fait aussi échouer la suite : la liste
 *     reste exacte, elle ne peut que rétrécir.
 *
 * Détection (heuristique, volontairement simple) : un motif `^champ:` — regex littérale, argument de
 * grep/sed/awk — ou la regex dynamique `^${champ}:` sur un champ connu de fiche. Elle ne voit pas tout,
 * mais elle voit la forme que prennent tous les parseurs maison recensés le 2026-10-01.
 */

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..'); // racine vectorz
const ROOTS = [
  'products/mega-city/bin',
  'products/mega-city/src',
  'products/mega-city/skills',
  'scripts',
  'tools',
];
const SKIP_DIRS = new Set(['node_modules', '__tests__', 'dist', '.git']);
const LOADER = 'products/mega-city/src/loaders/fiches.ts';

/** Les champs du front-matter d'une fiche (y compris `ready`, retiré mais encore lu par une migration). */
const FIELDS = 'id|title|status|priority|milestone|labels|product|pr|created|version|epic|type|blocked|ready';
const PARSE = new RegExp(`\\^(?:${FIELDS}):|\\^\\$\\{[A-Za-z_]+\\}:`);

const isCode = (name: string): boolean =>
  /\.(ts|mjs|js|sh|py)$/.test(name) &&
  !name.endsWith('.d.ts') &&
  !name.endsWith('.test.ts') &&
  !/^test-.*\.sh$/.test(name);

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // racine absente dans ce dépôt
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(path));
    } else if (isCode(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

/** Fichiers qui parsent le front-matter à la main, hors loader. Chemins relatifs à la racine du dépôt. */
function parsersHorsLoader(): string[] {
  return ROOTS.flatMap((root) => walk(join(REPO, root)))
    .map((file) => relative(REPO, file))
    .filter((rel) => rel !== LOADER)
    .filter((rel) => PARSE.test(readFileSync(join(REPO, rel), 'utf8')))
    .sort();
}

/**
 * LA liste legacy, figée (inventaire du 2026-10-01). Chemin → pourquoi il n'est pas encore migré.
 * Elle ne fait que rétrécir : pour migrer un fichier, lis par `loadFiches` / `readField` (TypeScript) ou par
 * `bin/fiche-rows.ts` (bash), puis retire son entrée ici ET de la règle.
 */
const LEGACY: Record<string, string> = {
  // — Lecteurs de fiches à migrer (suite de la fiche 20260922160651394)
  'products/mega-city/bin/regen-backlog.sh':
    'awk ; copie identique dans le skill (test bin ≡ skill) — décision de vendoring à trancher',
  'products/mega-city/skills/ezk-backlog/scripts/regen-backlog.sh':
    'copie vendored, sert hors monorepo : ni tsx ni loader sous la main',
  'products/mega-city/skills/ezk-archive/scripts/check.sh':
    'grep/sed sur status: et pr: ; skill déployable hors monorepo',
  'products/mega-city/skills/ezk-sprint/scripts/check.sh':
    'awk sur status: ; skill déployable hors monorepo',
  'products/mega-city/src/sprint-metrics/adapters/repoSource.ts':
    'regex id/status sur le fichier ENTIER (pas seulement le front-matter) ; adaptateur sans test',
  'tools/outcomes/sources.ts': 'mêmes regex que repoSource.ts',
  'products/mega-city/src/backlog/fiche-validator.ts':
    'sonde de présence des champs retirés, sur frontMatter() du loader ; à remplacer par un hasField du loader',
  // — Migrations jetables qui réécrivent des fiches en place
  'products/mega-city/skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh':
    'migration Skema 003, one-shot ; tourne aussi sur des projets externes',
  'products/mega-city/skills/ezk-backlog/scripts/apply-005-retrait-champ-ready.sh':
    'migration Skema 005, one-shot ; tourne aussi sur des projets externes',
  'scripts/migrate-0064-unique-backlog.py': 'migration 0064, jetable (python)',
  'scripts/fix-0064-codex-fallout.py': 'rattrapage de la migration 0064, jetable (python)',
  // — Ne lisent pas une fiche (même forme de regex, autre objet)
  'products/mega-city/bin/regen-recipes.sh': 'lit le front-matter des RECETTES, pas des fiches',
  'products/mega-city/skills/ezk-diagram/scripts/publish.sh': 'lit le titre du meta.yaml d’un diagramme',
};

describe('règle development/fiche-read-via-loader — la liste legacy est figée', () => {
  const found = parsersHorsLoader();

  it('aucun NOUVEAU parse de front-matter hors loader', () => {
    const nouveaux = found.filter((rel) => !(rel in LEGACY));
    expect(
      nouveaux,
      `Parse maison du front-matter hors loader : ${nouveaux.join(', ')}. ` +
        'Lis par loadFiches / readField (src/loaders/fiches.ts) ou, en bash, par bin/fiche-rows.ts.',
    ).toEqual([]);
  });

  it('la liste legacy est exacte : une entrée migrée doit en sortir', () => {
    const perimees = Object.keys(LEGACY).filter((rel) => !found.includes(rel));
    expect(
      perimees,
      `Plus de parse maison dans : ${perimees.join(', ')}. Retire ces entrées de LEGACY (et de la règle).`,
    ).toEqual([]);
  });
});
