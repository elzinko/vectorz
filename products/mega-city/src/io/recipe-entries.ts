/**
 * Les entrées de recettes lues sur disque — bord I/O partagé par `ezk recipes` (lecture) et
 * `ezk recipes add` (écriture) : les deux doivent voir exactement les mêmes recettes.
 */
import { type Dirent, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RECIPE_DECLARATION_FILE, type ScanEntry } from '../core/recipe-contract.js';

/** Les recettes de la méthode : chaque `recipes/*.md`, hors index (`RECIPES.md`) et gabarit. */
export function methodRecipeEntries(methodRoot: string): ScanEntry[] {
  const dir = join(methodRoot, 'recipes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() && e.name.endsWith('.md') && e.name !== 'RECIPES.md' && e.name !== 'RECIPE_TEMPLATE.md',
    )
    .map((e) => ({ dir: `recipes/${e.name}`, recipeMd: readFileSync(join(dir, e.name), 'utf8') }));
}

/** Dossiers de gros volume ou de plomberie : jamais marchés (perf + pas de recette dedans). */
const SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.claude',
  '.venv', 'venv', 'target', 'vendor', '.cache', 'tmp', '.gradle', '.idea', '.svn',
]);
/** Borne de profondeur : un projet pathologiquement profond ne fait pas tourner la marche sans fin. */
const MAX_DEPTH = 24;

/** Marche BORNÉE du projet (lecture seule) : les dossiers portant un `RECIPE.md`. Les liens ne sont
 * pas suivis (readdir ne marque `isDirectory()` que les vrais dossiers), donc pas de boucle. */
export function projectRecipeEntries(root: string): ScanEntry[] {
  const entries: ScanEntry[] = [];
  const walk = (abs: string, depth: number): void => {
    if (depth > MAX_DEPTH) return;
    let dirents: Dirent[];
    try {
      dirents = readdirSync(abs, { withFileTypes: true });
    } catch {
      return; // un dossier illisible n'arrête pas la découverte
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
