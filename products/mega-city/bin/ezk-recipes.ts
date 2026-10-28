#!/usr/bin/env tsx
/**
 * `ezk recipes [--root <projet>]` — la découverte, en LECTURE SEULE, des recettes utilisables depuis
 * un projet hôte (fiche 20261023120000001). Montre :
 *   - les recettes de la MÉTHODE (`recipes/*.md` de l'install ezk) — globales ;
 *   - les recettes DÉCLARÉES dans le projet (dossiers portant un `RECIPE.md`, contrat de la fiche 002).
 *
 * N'écrit RIEN. Bord I/O mince : lit les fichiers, délègue le contrat à `scanDeclaredRecipes`
 * (fiche 002) et le rendu à `renderDiscovery` (cœur pur). Ne touche ni `tools.ts` ni la CLI : un
 * outil comme `ezk-secret` se découvre par le `makes` de sa recette (`secrets-trousseau`), pas par le
 * catalogue d'outils (qui ne liste que les bin/scripts de la méthode).
 */
import { type Dirent, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ScanEntry, RECIPE_DECLARATION_FILE } from '../src/core/recipe-contract.js';
import { discover, renderDiscovery } from '../src/core/recipe-discovery.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const projectRoot = target.root;

/** La racine de la méthode (où vit `recipes/`) : trois niveaux au-dessus de `bin/`. */
const methodRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Les recettes de la méthode : chaque `recipes/*.md`, hors index (`RECIPES.md`) et gabarit. */
function methodRecipeEntries(): ScanEntry[] {
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
function projectRecipeEntries(root: string): ScanEntry[] {
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

const methodRecipes = discover(methodRecipeEntries());
const projectRecipes = discover(projectRecipeEntries(projectRoot));
console.log(renderDiscovery({ projectLabel: projectRoot, methodRecipes, projectRecipes }));
process.exit(0);
