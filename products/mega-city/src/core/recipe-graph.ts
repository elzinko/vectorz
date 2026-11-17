/**
 * recipe-graph — les RECETTES de la méthode et ce qu'elles composent. PUR (ADR-0003).
 *
 * Fiche 20261117140305053, ADR-0090. Une recette est un fichier `recipes/<nom>.md` ; son id est le
 * nom du fichier sans `.md`. Son front-matter peut porter `composes: [...]` : des ids d'autres
 * recettes ou de règles. Aucun I/O ici : lire le dossier = `loaders/recipes.ts`.
 */
import { frontMatterData } from './recipe-contract.js';

/** Une recette, réduite à ce que le graphe en lit. */
export interface Recipe {
  id: string;
  composes: string[];
}

/** Un fichier de recette déjà lu : son id (nom sans `.md`) et son texte. */
export interface RecipeFile {
  id: string;
  text: string;
}

function composesOf(text: string): string[] {
  const value = frontMatterData(text).composes;
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Les recettes d'un ensemble de fichiers, triées par id (sortie stable, F4). */
export function deriveRecipes(files: readonly RecipeFile[]): Recipe[] {
  return files
    .map(({ id, text }) => ({ id, composes: composesOf(text) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
