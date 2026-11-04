/**
 * ezkRecipesSource — les recettes d'un projet (fiche 20261104090518109, ADR-086) : `ezk recipes --json`,
 * vérifié pour la vue « Recettes ». La méthode publie le catalogue et ce que le projet déclare ; la page
 * ne devine rien. Les recettes bougent rarement : relues au plus toutes les cinq minutes, et servies tout
 * de suite depuis la dernière réponse.
 */
import { EzkContractError } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions, type SourceReading } from './ezkSource.js';

const SUPPORTED_SCHEMA_VERSION = 1;
const COMMANDE = 'ezk recipes --json';
const RECIPES_TTL_MS = 5 * 60_000;

/** Une recette telle que la méthode la publie. */
export interface RecipeView {
  id: string;
  title: string;
  makes: string;
  status: string;
  /** Où vit l'implémentation de référence. */
  source: string;
  /** Où la recette est rangée : `recipes/<fichier>.md`, ou le dossier du projet qui l'implémente. */
  dir: string;
  complete: boolean;
  missing: string[];
}

export interface RecipesViewData {
  catalogue: RecipeView[];
  projet: RecipeView[];
}

export type RecipesSnapshot = SourceReading<{ recipes: RecipesViewData }>;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function fail(what: string): never {
  throw new EzkContractError(`${COMMANDE} : ${what}`);
}

function readRecipe(v: unknown): RecipeView {
  if (!isRecord(v)) fail('recette mal formée');
  const text = (k: string): string => {
    const value = v[k];
    return typeof value === 'string' ? value : fail(`champ ${k} absent`);
  };
  const { complete, missing } = v;
  if (typeof complete !== 'boolean') fail('champ complete absent');
  if (!Array.isArray(missing) || !missing.every((m) => typeof m === 'string')) fail('champ missing mal formé');
  return {
    id: text('id'),
    title: text('title'),
    makes: text('makes'),
    status: text('status'),
    source: text('source'),
    dir: text('dir'),
    complete,
    missing: [...missing],
  };
}

/** Le JSON publié, vérifié ; un format inconnu est refusé net, jamais deviné. */
export function translateRecipes(json: unknown): RecipesViewData {
  if (!isRecord(json)) fail('réponse mal formée');
  if (json.schema_version !== SUPPORTED_SCHEMA_VERSION)
    fail(`schema_version ${String(json.schema_version)} inconnu (attendu ${SUPPORTED_SCHEMA_VERSION})`);
  if (!Array.isArray(json.catalogue) || !Array.isArray(json.projet)) fail('catalogue ou projet absent');
  return { catalogue: json.catalogue.map(readRecipe), projet: json.projet.map(readRecipe) };
}

export class EzkRecipesSource extends EzkSource<{ recipes: RecipesViewData }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: RECIPES_TTL_MS, ...options }, async (root, run) => ({
      recipes: translateRecipes(JSON.parse(await run(['--root', root, 'recipes', '--json']))),
    }));
  }
}
