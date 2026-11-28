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
import { isAbsolute, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import {
  type CatalogEntry,
  type ScanEntry,
  declaredRecipe,
  scanDeclaredRecipes,
  scanIndexedRecipes,
} from './recipe-contract.js';

export interface DiscoveredRecipe extends CatalogEntry {
  /** La déclaration est complète (les cinq champs, fiche 002) ? Sinon c'est un brouillon indexé. */
  complete: boolean;
  /** Les champs requis absents d'un brouillon (tous, si son YAML ne se lit pas) ; vide si complète. */
  missing: string[];
}

/**
 * Les recettes d'un ensemble d'entrées : tout ce qui a un `id` (découvrabilité, règle du livre),
 * chacune marquée complète ou brouillon (validité, contrat strict de 002). Trié par id.
 */
export function discover(entries: ScanEntry[]): DiscoveredRecipe[] {
  const complete = new Set(scanDeclaredRecipes(entries).map((r) => r.id));
  const missingByDir = new Map<string, string[]>();
  for (const { dir, recipeMd } of entries) {
    if (recipeMd === null) continue;
    const check = declaredRecipe(recipeMd);
    missingByDir.set(dir, check.declared ? [] : [...check.missing]);
  }
  return scanIndexedRecipes(entries).map((r) => {
    const isComplete = complete.has(r.id);
    return { ...r, complete: isComplete, missing: isComplete ? [] : (missingByDir.get(r.dir) ?? []) };
  });
}

/** Version du contrat JSON de `ezk recipes --json` (fiche 20261104090518008, ADR-086). */
export const RECIPES_SCHEMA_VERSION = 1;

const RecipeJsonSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  makes: z.string().describe('Ce que la recette fabrique, en une phrase.'),
  status: z.string().describe('Le statut écrit (draft, ready…) ; vide si absent.'),
  source: z.string().describe("Où vit l'implémentation de référence, chemin relatif au dépôt de la recette."),
  dir: z
    .string()
    .describe('Où la recette est rangée : `recipes/<fichier>.md` pour la méthode, le dossier qui porte son `RECIPE.md` pour un projet.'),
  complete: z.boolean().describe('Les cinq champs requis sont présents et le YAML se lit (contrat de la fiche 002).'),
  ici: z
    .boolean()
    .describe(
      "La recette est implémentée dans le projet visé : déclarée par lui, ou sa `source` y mène (fiche 20261104103403956).",
    ),
  missing: z.array(z.string()).describe("Les champs requis absents d'un brouillon ; vide si la recette est complète."),
});

/** `ezk recipes --json` : le catalogue de la méthode et les recettes que le projet déclare. */
export const RecipesContractSchema = z.strictObject({
  schema_version: z.literal(RECIPES_SCHEMA_VERSION),
  catalogue: z.array(RecipeJsonSchema).describe('Les recettes de la méthode (`recipes/*.md`), triées par id.'),
  projet: z
    .array(RecipeJsonSchema)
    .describe('Les recettes déclarées dans le projet visé (dossiers portant un `RECIPE.md`), triées par id.'),
});
export type RecipesContract = z.infer<typeof RecipesContractSchema>;

/**
 * Le chemin absolu d'une `source` : `~/…` depuis le dossier personnel, absolue telle quelle, sinon
 * relative à la racine de la méthode (là où vivent les recettes). Vide → `null`. Lecture lexicale, pur.
 */
export function resolveSource(source: string, methodRoot: string, home: string): string | null {
  const s = source.trim();
  if (s === '') return null;
  if (s === '~' || s.startsWith('~/')) return resolve(join(home, s.slice(1)));
  return isAbsolute(s) ? resolve(s) : resolve(methodRoot, s);
}

/** `path` est-il `root` ou dans `root` ? */
export function isInside(path: string, root: string): boolean {
  const rel = relative(resolve(root), path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

/** Où chercher les implémentations : le projet visé, la racine de la méthode, le dossier personnel. */
export interface ImplementationScope {
  projectRoot: string;
  methodRoot: string;
  home: string;
}

const toJson = (r: DiscoveredRecipe, ici: boolean): RecipesContract['catalogue'][number] => ({
  id: r.id,
  title: r.title,
  makes: r.makes,
  status: r.status,
  source: r.source,
  dir: r.dir,
  complete: r.complete,
  missing: r.missing,
  ici,
});

/** La même découverte que `renderDiscovery`, en données : ce que mission control lit (ADR-086). */
export function recipesContract(
  input: Omit<DiscoveryInput, 'projectLabel'>,
  scope?: ImplementationScope,
): RecipesContract {
  const declaredIds = new Set(input.projectRecipes.map((r) => r.id));
  const here = (r: DiscoveredRecipe): boolean => {
    // Une recette que le projet déclare sous le même id est ajoutée (`ezk recipes add` écrit cette déclaration).
    if (declaredIds.has(r.id)) return true;
    if (!scope) return false;
    const path = resolveSource(r.source, scope.methodRoot, scope.home);
    return path !== null && isInside(path, scope.projectRoot);
  };
  return {
    schema_version: RECIPES_SCHEMA_VERSION,
    catalogue: input.methodRecipes.map((r) => toJson(r, here(r))),
    // Une recette déclarée par le projet est, par construction, implémentée ici.
    projet: input.projectRecipes.map((r) => toJson(r, true)),
  };
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
