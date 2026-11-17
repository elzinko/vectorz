/**
 * graph-check — le bord qui assemble le contrat de `ezk graph check --json` (fiche 20261117114544666,
 * ADR-0089). `bin/ezk-graph.ts` et le générateur d'exemples passent tous deux par ici.
 */
import { join, resolve } from 'node:path';
import { type GraphCheck, buildGraphCheck } from '../core/graph-check.js';
import { graphEdges } from '../core/graph.js';
import { checkPathRefs } from '../core/structural-refs.js';
import { type Catalog, catalogSources, loadCatalog } from '../loaders/catalog.js';
import { scanPathRefs } from '../loaders/path-refs.js';
import { loadRecipes, recipeFileNames, recipeIdOf } from '../loaders/recipes.js';

/** Les recettes vivent à la racine du dépôt, deux niveaux au-dessus de `products/mega-city` (ADR-0090). */
const recipesDirOf = (megaCityRoot: string): string => join(resolve(megaCityRoot, '..', '..'), 'recipes');

/** Le graphe réel de la méthode, lu depuis sa racine (`products/mega-city`). */
export function graphCheckData(megaCityRoot: string): GraphCheck {
  const catalog = { ...loadCatalog(megaCityRoot), recipes: loadRecipes(recipesDirOf(megaCityRoot)) };
  const pathRefs = checkPathRefs(scanPathRefs(megaCityRoot), graphEdges(catalog));
  const sources = catalogSources(megaCityRoot);
  // Une recette se désigne depuis la racine du dépôt (`recipes/<nom>.md`), pas depuis `products/mega-city`.
  for (const name of recipeFileNames(recipesDirOf(megaCityRoot)))
    sources.set(`recipe:${recipeIdOf(name)}`, `recipes/${name}`);
  return buildGraphCheck(catalog, pathRefs, sources);
}

/**
 * L'exemple rangé : un petit graphe écrit ici, pas le vrai. L'exemple ne doit pas changer à chaque
 * brique ajoutée à la méthode. Il montre une compétence qui applique une règle et cite une commande,
 * la commande qui lance un outil, une commande orpheline, et deux recettes : l'une en compose une
 * autre et une règle, une troisième n'a aucun lien.
 */
export function graphCheckExample(): GraphCheck {
  const catalog: Catalog = {
    rules: new Map([
      [
        'clean-code/no-dead-code',
        { id: 'clean-code/no-dead-code', kind: 'disposition', level: 'MUST', content: '' },
      ],
    ]),
    agents: new Map(),
    skills: new Map([
      ['ezk-sprint', { id: 'ezk-sprint', content: '', applies: ['clean-code/no-dead-code'] }],
    ]),
    bundles: new Map(),
    profiles: new Map(),
    tools: new Map([
      [
        'bin/forge-integrate.ts',
        { id: 'bin/forge-integrate.ts', usedBy: [], commands: ['ezk forge integrate'] },
      ],
    ]),
    cliCommands: new Map([
      [
        'ezk forge integrate',
        { id: 'ezk forge integrate', script: 'bin/forge-integrate.ts', usedBy: ['ezk-sprint'] },
      ],
      ['ezk help', { id: 'ezk help', script: 'bin/ezk-help.ts', usedBy: [] }],
    ]),
    recipes: new Map([
      ['brancher-domaine', { id: 'brancher-domaine', composes: ['clean-code/no-dead-code', 'dns'] }],
      ['dns', { id: 'dns', composes: [] }],
      ['seule', { id: 'seule', composes: [] }],
    ]),
  };
  const sources = new Map([
    ['rule:clean-code/no-dead-code', 'rules/clean-code/no-dead-code.md'],
    ['skill:ezk-sprint', 'skills/ezk-sprint/SKILL.md'],
    ['tool:bin/forge-integrate.ts', 'bin/forge-integrate.ts'],
    ['command:ezk forge integrate', 'ezk-manifest.yml'],
    ['command:ezk help', 'ezk-manifest.yml'],
    ['recipe:brancher-domaine', 'recipes/brancher-domaine.md'],
    ['recipe:dns', 'recipes/dns.md'],
    ['recipe:seule', 'recipes/seule.md'],
  ]);
  return buildGraphCheck(catalog, { undeclared: [], unsupported: [] }, sources);
}
