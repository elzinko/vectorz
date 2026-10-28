#!/usr/bin/env tsx
/**
 * Garde-fou de dérive des recettes (fiche 20261028130229418) — le bord I/O.
 *
 * Étend la gate mécanique d'`ezk-chef check` : pour chaque recette déclarée — le livre
 * `recipes/*.md` ET les `RECIPE.md` d'un projet — vérifie que sa racine `source:` résout vers un
 * fichier réel SOUS la racine injectée. Une `source:` locale qui pointe dans le vide est une recette
 * qui MENT : elle casse la découverte en silence.
 *
 * Reproductible, donc étroit : on ne juge que les sources LOCALES (relatives, sous la racine). Une
 * source absolue ou « maison » (`~/…`) pointe un autre dépôt — machine-dépendante, elle n'est jamais
 * vérifiée (seulement comptée). « Existe » = présence de fichier sous la racine injectée, JAMAIS via
 * le `PATH`. LECTURE SEULE : n'écrit rien. Sort 1 si une dérive est trouvée (comme check-links.sh).
 *
 * Bord mince (ADR-0003) : lit les fichiers et classe les chemins ; délègue le verdict et le rendu au
 * cœur pur `recipe-source-drift.ts`, et la lecture du front-matter à `scanIndexedRecipes` (fiche 002).
 */
import { type Dirent, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  type ScanEntry,
  RECIPE_DECLARATION_FILE,
  scanIndexedRecipes,
} from '../src/core/recipe-contract.js';
import {
  type CheckedSource,
  classifySource,
  renderSourceDrift,
  sourceDrift,
} from '../src/core/recipe-source-drift.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const base = process.env.INIT_CWD ?? process.cwd();
const root = projectRootOrExit(base).root;

/** Dossiers de gros volume ou de plomberie : jamais marchés (perf + pas de recette dedans). Aligné
 * sur `ezk recipes` (fiche 001). */
const SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.claude',
  '.venv', 'venv', 'target', 'vendor', '.cache', 'tmp', '.gradle', '.idea', '.svn',
]);
const MAX_DEPTH = 24;

/** Le livre `<root>/recipes/*.md`, hors index (`RECIPES.md`) et gabarit. */
function bookEntries(): ScanEntry[] {
  const dir = join(root, 'recipes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() && e.name.endsWith('.md') && e.name !== 'RECIPES.md' && e.name !== 'RECIPE_TEMPLATE.md',
    )
    .map((e) => ({ dir: `recipes/${e.name}`, recipeMd: readFileSync(join(dir, e.name), 'utf8') }));
}

/** Marche BORNÉE (lecture seule) : les dossiers portant un `RECIPE.md`. Les liens ne sont pas suivis. */
function projectEntries(): ScanEntry[] {
  const entries: ScanEntry[] = [];
  const walk = (abs: string, depth: number): void => {
    if (depth > MAX_DEPTH) return;
    let dirents: Dirent[];
    try {
      dirents = readdirSync(abs, { withFileTypes: true });
    } catch {
      return; // un dossier illisible n'arrête pas le contrôle
    }
    if (dirents.some((d) => d.isFile() && d.name === RECIPE_DECLARATION_FILE)) {
      entries.push({
        dir: relative(root, abs) || '.',
        recipeMd: readFileSync(join(abs, RECIPE_DECLARATION_FILE), 'utf8'),
      });
    }
    for (const d of dirents) if (d.isDirectory() && !SKIP.has(d.name)) walk(join(abs, d.name), depth + 1);
  };
  walk(root, 0);
  return entries;
}

const all = [...scanIndexedRecipes(bookEntries()), ...scanIndexedRecipes(projectEntries())];

// Le tri local/externe/brouillon est pur (`classifySource`, cœur) ; seul l'existence du chemin
// local touche le disque, ici, au bord.
const locals: CheckedSource[] = [];
let externalCount = 0;
let draftCount = 0;
for (const r of all) {
  const c = classifySource(r.source, root);
  if (c.kind === 'draft') draftCount += 1;
  else if (c.kind === 'external') externalCount += 1;
  else locals.push({ id: r.id, title: r.title, source: r.source.trim(), origin: r.dir, exists: existsSync(c.abs) });
}

const findings = sourceDrift(locals);
console.log(
  renderSourceDrift({ rootLabel: root, findings, checkedCount: locals.length, externalCount, draftCount }),
);
process.exit(findings.length > 0 ? 1 : 0);
