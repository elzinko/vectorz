#!/usr/bin/env tsx
/**
 * `ezk recipes [--root <projet>] [--json]` — la découverte, en LECTURE SEULE, des recettes utilisables depuis
 * un projet hôte (fiche 20261023120000001). Montre :
 *   - les recettes de la MÉTHODE (`recipes/*.md` de l'install ezk) — globales ;
 *   - les recettes DÉCLARÉES dans le projet (dossiers portant un `RECIPE.md`, contrat de la fiche 002).
 *
 * N'écrit RIEN (l'ajout d'une recette au projet, c'est `ezk recipes add`). Bord I/O mince : lit les
 * fichiers (`src/io/recipe-entries.ts`), délègue le contrat à `scanDeclaredRecipes` (fiche 002) et le
 * rendu à `renderDiscovery` (cœur pur). Ne touche ni `tools.ts` ni la CLI : un outil comme `ezk-secret`
 * se découvre par le `makes` de sa recette (`secrets-trousseau`), pas par le catalogue d'outils (qui ne
 * liste que les bin/scripts de la méthode).
 */
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discover, recipesContract, renderDiscovery } from '../src/core/recipe-discovery.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { methodRecipeEntries, projectRecipeEntries } from '../src/io/recipe-entries.js';

// Un mot en trop est presque toujours un verbe mal tapé (« recipes ad » pour « recipes add ») : refus
// net, plutôt qu'une lecture rendue en silence à la place d'un ajout.
// La valeur de `--root` n'est pas un mot en trop.
const args = process.argv.slice(2);
const stray = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--root');
if (stray !== undefined) {
  console.error(
    `✗ argument inattendu : « ${stray} ». « ezk recipes » liste les recettes ; pour en ajouter une : « ezk recipes add <id> ».`,
  );
  process.exit(2);
}

const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const projectRoot = target.root;

/** La racine de la méthode (où vit `recipes/`) : trois niveaux au-dessus de `bin/`. */
const methodRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const methodRecipes = discover(methodRecipeEntries(methodRoot));
const projectRecipes = discover(projectRecipeEntries(projectRoot));
// `--json` : la même découverte en données, pour mission control (fiche 20261104090518008, ADR-086).
if (process.argv.includes('--json')) {
  const scope = { projectRoot, methodRoot, home: homedir() };
  console.log(JSON.stringify(recipesContract({ methodRecipes, projectRecipes }, scope), null, 1));
} else {
  console.log(renderDiscovery({ projectLabel: projectRoot, methodRecipes, projectRecipes }));
}
process.exit(0);
