/**
 * recipe-contract — le CONTRAT « ce répertoire EST une recette ». Spike fiche 20261023120000002.
 *
 * Un répertoire (d'un projet hôte comme de la méthode) se déclare recette RÉUTILISABLE en portant
 * un fichier de déclaration `RECIPE.md` à front-matter recette. On NE crée PAS de format neuf : les
 * champs requis sont ceux que `recipe-frontmatter.ts` ÉMET et que `regen-recipes.sh` LIT déjà —
 * `id`, `title`, `makes`, `source`, `status`.
 *
 * La déclaration (`RECIPE.md`) est DISTINCTE du skill (`SKILL.md`) : un même dossier peut porter
 * les deux ; le contrat ne regarde que `RECIPE.md`. Pilote d'origine (hors de ce dépôt, non touché) :
 * `muti:apps/desktop/validation/RECIPE.md`.
 *
 * PUR : aucune I/O (ADR-0003). Le bord — lister les dossiers, lire les fichiers — vit à l'extérieur :
 * le scan reçoit des entrées DÉJÀ lues (le dossier + le texte de son `RECIPE.md`, ou `null`). Le
 * marcheur de dossiers sur disque et la commande terminal `ezk recipes` relèvent de la fiche sœur
 * 20261023120000001 (découverte depuis un projet hôte).
 */
import { parse as parseYaml } from 'yaml';

/** Le nom du fichier de déclaration : « ce dossier EST une recette ». Singulier — ≠ `RECIPES.md`, le livre. */
export const RECIPE_DECLARATION_FILE = 'RECIPE.md';

/** Les champs que le contrat exige : ceux qu'émet `recipe-frontmatter.ts` et que lit `regen-recipes.sh`. */
export const RECIPE_REQUIRED_FIELDS = ['id', 'title', 'makes', 'source', 'status'] as const;
type RequiredField = (typeof RECIPE_REQUIRED_FIELDS)[number];

export interface DeclaredRecipe {
  id: string;
  title: string;
  makes: string;
  source: string;
  status: string;
}

export type RecipeContractResult =
  | { declared: true; recipe: DeclaredRecipe }
  | { declared: false; missing: RequiredField[] };

/** Le bloc front-matter `---\n…\n---` en tête du texte (tolère BOM et espaces avant), ou `null`. */
function frontMatterBlock(text: string): string | null {
  const m = /^﻿?\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/.exec(text);
  return m ? m[1] : null;
}

/** La valeur d'un champ en texte ras : chaîne nettoyée, nombre rendu en chaîne, sinon chaîne vide. */
function fieldValue(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  // Chaîne SEULE, à dessein : un `id` numérique non quoté perdrait en précision (> MAX_SAFE_INTEGER)
  // et divergerait de `regen-recipes.sh` qui lit l'id en texte brut. L'émetteur quote toujours l'id
  // (recipe-frontmatter.ts : « chaîne, jamais un nombre ») — un id nu est donc non conforme, pas faussé.
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Le contrat : le texte d'un `RECIPE.md` déclare-t-il une recette ?
 * `declared: true` + la recette quand les cinq champs requis sont présents et non vides ;
 * sinon `declared: false` + la liste des champs manquants (pour un message actionnable).
 */
export function declaredRecipe(recipeMdText: string): RecipeContractResult {
  const block = frontMatterBlock(recipeMdText);
  // Un front-matter YAML mal formé ÉCARTE le dossier (declared:false) ; il ne doit JAMAIS faire
  // planter le scan, qui parcourt tous les dossiers d'un projet (un RECIPE.md cassé est courant).
  let parsed: unknown = null;
  if (block !== null) {
    try {
      parsed = parseYaml(block);
    } catch {
      parsed = null;
    }
  }
  const data: Record<string, unknown> =
    parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};

  const missing = RECIPE_REQUIRED_FIELDS.filter((f) => fieldValue(data, f) === '');
  if (missing.length > 0) return { declared: false, missing };

  return {
    declared: true,
    recipe: {
      id: fieldValue(data, 'id'),
      title: fieldValue(data, 'title'),
      makes: fieldValue(data, 'makes'),
      source: fieldValue(data, 'source'),
      status: fieldValue(data, 'status'),
    },
  };
}

/** Une entrée de scan : un dossier et le texte de son `RECIPE.md` (`null` = pas de déclaration). */
export interface ScanEntry {
  dir: string;
  recipeMd: string | null;
}

export interface CatalogEntry extends DeclaredRecipe {
  dir: string;
}

/**
 * Le scan : parmi des dossiers DÉJÀ lus, lesquels sont des recettes déclarées ?
 * Pur — l'appelant a fait l'I/O (marché avec le bord). Résultat trié par `id`, déterministe, comme
 * `regen-recipes.sh`. Un dossier sans `RECIPE.md` (`recipeMd: null`), ou dont le `RECIPE.md` ne
 * satisfait pas le contrat, n'apparaît PAS au catalogue.
 */
export function scanDeclaredRecipes(entries: ScanEntry[]): CatalogEntry[] {
  const catalog: CatalogEntry[] = [];
  for (const { dir, recipeMd } of entries) {
    if (recipeMd === null) continue;
    const res = declaredRecipe(recipeMd);
    if (res.declared) catalog.push({ dir, ...res.recipe });
  }
  return catalog.sort((a, b) => a.id.localeCompare(b.id));
}
