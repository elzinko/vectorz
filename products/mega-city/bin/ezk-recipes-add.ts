#!/usr/bin/env tsx
/**
 * `ezk recipes add <id> [--root <projet>]` — ajoute une recette du catalogue au projet (fiche 20261126170000114).
 *
 * Écrit, dans le projet, la déclaration de la recette (`.vectorz/recipes/<recette>/RECIPE.md`) : l'endroit
 * que la découverte (`ezk recipes`) lit déjà. Ne committe rien. Dit toujours ce qu'il a écrit, ou pourquoi
 * il n'a rien écrit. Codes : 0 ajoutée · 1 refus (inconnue, brouillon, déjà ajoutée) · 2 usage.
 *
 * Bord I/O mince : la décision est dans `src/core/recipe-add.ts` (pure).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRecipeAdd } from '../src/core/recipe-add.js';
import { discover, recipesContract } from '../src/core/recipe-discovery.js';
import { projectRootOrExit } from '../src/io/project-root.js';
import { methodRecipeEntries, projectRecipeEntries } from '../src/io/recipe-entries.js';

const USAGE = 'usage : ezk recipes add <id> [--root <projet>]';

const { root: projectRoot, rest } = projectRootOrExit(process.env.INIT_CWD ?? process.cwd());
const [id, ...extra] = rest;
if (id === undefined || id.startsWith('-') || extra.length > 0) {
  console.error(`${USAGE}\nIl faut l'id d'UNE recette du catalogue (la liste : « ezk recipes »).`);
  process.exit(2);
}

const methodRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const contract = recipesContract(
  {
    methodRecipes: discover(methodRecipeEntries(methodRoot)),
    projectRecipes: discover(projectRecipeEntries(projectRoot)),
  },
  { projectRoot, methodRoot, home: homedir() },
);

const plan = planRecipeAdd(id, contract);
if (!plan.ok) {
  console.error(`${plan.message}\nRien n'a été écrit.`);
  process.exit(1);
}

const target = join(projectRoot, plan.relPath);
if (existsSync(target)) {
  console.error(`Le fichier ${target} existe déjà : rien n'a été écrit.`);
  process.exit(1);
}
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, plan.content, 'utf8');
console.log(`Recette ${id} ajoutée au projet : ${target}`);
console.log("Rien n'est committé : le fichier est à ajouter et à committer comme les autres.");
