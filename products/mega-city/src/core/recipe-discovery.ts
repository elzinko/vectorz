/**
 * recipe-discovery — le RENDU de `ezk recipes` : ce qu'une session voit, depuis un projet hôte,
 * quand elle demande « quelles recettes puis-je utiliser ici ? ». Fiche 20261023120000001.
 *
 * Deux sources, le MÊME contrat (fiche 002, `recipe-contract.ts`) :
 *   - les recettes de la MÉTHODE (`recipes/*.md` de l'install ezk) — globales, dispo partout ;
 *   - les recettes DÉCLARÉES dans le projet (dossiers portant un `RECIPE.md`).
 *
 * On liste tout ce qui a un `id` (parité avec le livre `regen-recipes.sh` — un brouillon RESTE
 * découvrable, jamais caché en silence) et on marque `[brouillon]` ce dont la déclaration est
 * incomplète (validité = contrat strict de 002). Le champ `makes` nomme ce que la recette fabrique
 * (ex. `ezk-secret`) : c'est LUI qui ferme le trou de découverte du cas muti.
 *
 * PUR : aucune I/O. Le bord (`bin/ezk-recipes.ts`) lit les fichiers et passe des entrées déjà lues.
 */
import { type CatalogEntry, type ScanEntry, scanDeclaredRecipes, scanIndexedRecipes } from './recipe-contract.js';

export interface DiscoveredRecipe extends CatalogEntry {
  /** La déclaration est complète (les cinq champs, fiche 002) ? Sinon c'est un brouillon indexé. */
  complete: boolean;
}

/**
 * Les recettes d'un ensemble d'entrées : tout ce qui a un `id` (découvrabilité, règle du livre),
 * chacune marquée complète ou brouillon (validité, contrat strict de 002). Trié par id.
 */
export function discover(entries: ScanEntry[]): DiscoveredRecipe[] {
  const complete = new Set(scanDeclaredRecipes(entries).map((r) => r.id));
  return scanIndexedRecipes(entries).map((r) => ({ ...r, complete: complete.has(r.id) }));
}

/** Une valeur sur UNE ligne : un `makes` ou un titre multiligne ne doit pas casser la liste. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export interface DiscoveryInput {
  /** Le projet hôte visé (chemin), pour l'en-tête. */
  projectLabel: string;
  /** Recettes de la méthode, déjà découvertes (via `discover` sur `recipes/*.md`). */
  methodRecipes: DiscoveredRecipe[];
  /** Recettes déclarées dans le projet, déjà découvertes (dossiers à `RECIPE.md`). */
  projectRecipes: DiscoveredRecipe[];
}

/** Le rapport lisible, « En clair » d'abord (règle human-facing-lisibility), puis les deux listes. */
export function renderDiscovery(input: DiscoveryInput): string {
  const { projectLabel, methodRecipes, projectRecipes } = input;
  const flag = (r: DiscoveredRecipe): string => (r.complete ? '' : ' [incomplète]');
  const lines: string[] = [];

  lines.push(`# Recettes découvrables depuis ${projectLabel}`, '');
  lines.push(
    `En clair : ${methodRecipes.length} recette(s) de la méthode, ` +
      `${projectRecipes.length} déclarée(s) dans ce projet. Le champ « fabrique » dit ce que chaque ` +
      'recette produit — pas besoin de le deviner ; [incomplète] = il manque des champs.',
    '',
  );

  lines.push('## Recettes de la méthode (globales)');
  if (methodRecipes.length === 0) {
    lines.push('- aucune.');
  } else {
    for (const r of methodRecipes) {
      lines.push(`- ${oneLine(r.title) || '(sans titre)'} (${r.id})${flag(r)}`);
      if (r.makes.trim() !== '') lines.push(`  fabrique : ${oneLine(r.makes)}`);
    }
  }
  lines.push('');

  lines.push('## Recettes déclarées dans ce projet');
  if (projectRecipes.length === 0) {
    lines.push('- aucune — un dossier se déclare recette en portant un fichier RECIPE.md.');
  } else {
    for (const r of projectRecipes) {
      lines.push(`- ${r.dir} — ${oneLine(r.title) || '(sans titre)'} (${r.id})${flag(r)}`);
    }
  }

  return lines.join('\n');
}
