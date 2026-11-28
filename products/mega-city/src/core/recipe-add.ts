/**
 * recipe-add — le cœur PUR de `ezk recipes add <id>` (fiche 20261126170000114).
 *
 * On part du contrat `ezk recipes --json` (ce que la découverte sait déjà) et on décide : quel fichier
 * `RECIPE.md` écrire dans le projet, ou pourquoi on n'écrit rien. Aucune I/O : le bord (`bin/ezk-recipes-add.ts`)
 * lit le disque, écrit le fichier prévu et dit ce qu'il a fait.
 */
import { RECIPE_DECLARATION_FILE } from './recipe-contract.js';
import type { RecipesContract } from './recipe-discovery.js';

/** Où le projet range les déclarations ajoutées. La marche de découverte y entre (dossier caché non ignoré). */
export const RECIPE_ADD_DIR = '.vectorz/recipes';

export type RecipeAddPlan =
  | { ok: true; relPath: string; content: string }
  | { ok: false; message: string };

type CatalogueRecipe = RecipesContract['catalogue'][number];

const refuse = (message: string): RecipeAddPlan => ({ ok: false, message });

/** `recipes/lanceur-dev.md` → `lanceur-dev`. */
const slugOf = (dir: string): string => dir.replace(/^recipes\//, '').replace(/\.md$/, '');

/** Une valeur YAML sûre sur une ligne : la forme JSON est un scalaire YAML entre guillemets valide. */
const yamlString = (value: string): string => JSON.stringify(value.replace(/\s+/g, ' ').trim());

function declarationOf(recipe: CatalogueRecipe): string {
  return [
    '---',
    `id: ${yamlString(recipe.id)}`,
    `title: ${yamlString(recipe.title)}`,
    `makes: ${yamlString(recipe.makes)}`,
    `source: ${yamlString(recipe.source)}`,
    `status: ${yamlString(recipe.status)}`,
    '---',
    '',
    `Recette ajoutée à ce projet depuis le catalogue de la méthode : \`${recipe.dir}\`.`,
    "La recette de la méthode fait foi ; cette déclaration dit seulement que le projet l'a adoptée.",
    '',
  ].join('\n');
}

/** Décide de l'ajout de la recette `id` à un projet, d'après le contrat de découverte de ce projet. */
export function planRecipeAdd(id: string, contract: RecipesContract): RecipeAddPlan {
  const recipe = contract.catalogue.find((r) => r.id === id);
  if (!recipe) return refuse(`Recette inconnue « ${id} » : elle n'est pas au catalogue de la méthode.`);
  if (!recipe.complete || recipe.status === 'draft') {
    const manque = recipe.missing.length > 0 ? ` (il manque : ${recipe.missing.join(', ')})` : '';
    return refuse(`La recette « ${recipe.title} » (${id}) est en brouillon${manque} : on n'ajoute que les recettes prêtes.`);
  }
  if (recipe.ici) return refuse(`La recette « ${recipe.title} » (${id}) est déjà ajoutée à ce projet.`);

  const relPath = `${RECIPE_ADD_DIR}/${slugOf(recipe.dir)}/${RECIPE_DECLARATION_FILE}`;
  const dir = relPath.slice(0, -`/${RECIPE_DECLARATION_FILE}`.length);
  if (contract.projet.some((r) => r.dir === dir)) {
    return refuse(`Le dossier ${dir} porte déjà une autre déclaration de recette : rien n'est écrit.`);
  }
  return { ok: true, relPath, content: declarationOf(recipe) };
}
