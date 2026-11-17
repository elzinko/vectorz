/**
 * recipes — lit les recettes de la méthode : chaque `recipes/*.md` de la racine du dépôt, hors
 * l'index (`RECIPES.md`) et le gabarit (`RECIPE_TEMPLATE.md`). Fiche 20261117140305053, ADR-0090.
 * Même filtre que `ezk recipes` (`bin/ezk-recipes.ts`). Les dossiers de `recipes/` ne sont pas des recettes.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Recipe, type RecipeFile, deriveRecipes } from '../core/recipe-graph.js';

const NOT_RECIPES = new Set(['RECIPES.md', 'RECIPE_TEMPLATE.md']);

/** Les noms de fichier des recettes d'un dossier `recipes/`, triés. Dossier absent → rien. */
export function recipeFileNames(recipesDir: string): string[] {
  if (!existsSync(recipesDir)) return [];
  return readdirSync(recipesDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !NOT_RECIPES.has(e.name))
    .map((e) => e.name)
    .sort();
}

export const recipeIdOf = (fileName: string): string => fileName.replace(/\.md$/, '');

/** Les recettes du dossier `recipes/` donné. */
export function loadRecipes(recipesDir: string): Map<string, Recipe> {
  const files: RecipeFile[] = recipeFileNames(recipesDir).map((name) => ({
    id: recipeIdOf(name),
    text: readFileSync(join(recipesDir, name), 'utf8'),
  }));
  return new Map(deriveRecipes(files).map((r) => [r.id, r]));
}
