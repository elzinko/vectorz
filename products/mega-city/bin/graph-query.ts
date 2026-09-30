#!/usr/bin/env tsx
/**
 * graph-query — un CONSOMMATEUR qui LIT l'instance compilée, ne recompile jamais
 * (ADR-0040 D5 : « le préflight par commande LIT l'objet déjà compilé »).
 *
 *   pnpm --dir products/mega-city graph:compile          # d'abord, régénère l'artefact
 *   pnpm --dir products/mega-city graph:query est-verifie-par clean-code/no-dead-code
 *   pnpm --dir products/mega-city graph:query applique documentation-guidelines/human-facing-lisibility --inverse
 *   → répond « qui vérifie / applique cette règle ? » sans grep (critère de vérification, fiche 357).
 *
 * On peut demander un VERBE (compose · convoque · applique · est-verifie-par : le sens) ou un
 * LIEN (le nom historique du champ : composes, roles, applies…). Sens direct par défaut ;
 * `--inverse` pour remonter (« qui applique cette règle ? »).
 *
 * Un nœud est {kind, id}, pas un id : le catalogue a un agent ET un skill `ezk-archive`.
 * Quand un id est partagé, écris `kind:id` (graph:query compose skill:ezk-archive). Un LIEN
 * suffit souvent à trancher (`composes` part d'un skill) ; un VERBE, non : l'id ambigu est
 * REFUSÉ avec les choix possibles, jamais répondu en mélangeant deux nœuds.
 *
 * Artefact absent ⇒ message clair (régénère-le), pas un plantage silencieux. Relation ou id
 * inconnus ⇒ erreur nommée : une faute de frappe ne doit pas ressembler à « aucune arête ».
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type CompiledGraph,
  isRelation,
  queryGraph,
  resolveNode,
} from '../src/core/compiled-graph.js';
import { EDGE_SOURCES, LINK_VERBS } from '../src/core/graph.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..');
const artifactPath = join(repoRoot, '.ezk', 'graph.compiled.json');

const args = process.argv.slice(2);
const inverse = args.includes('--inverse');
const [relation, ref] = args.filter((a) => !a.startsWith('--'));

if (!relation || !ref) {
  console.log(
    'Usage : pnpm --dir products/mega-city graph:query <verbe|lien> <id | kind:id> [--inverse]',
  );
  console.log('Exemple : graph:query est-verifie-par clean-code/no-dead-code');
  console.log(
    'Exemple : graph:query applique documentation-guidelines/human-facing-lisibility --inverse',
  );
  console.log('Exemple : graph:query compose skill:ezk-archive   (id partagé par un agent et un skill)');
  process.exit(1);
}

if (!isRelation(relation)) {
  console.log(`En clair : « ${relation} » n'est ni un verbe ni un lien connu.`);
  console.log(`Verbes : ${LINK_VERBS.join(', ')}`);
  console.log(`Liens  : ${EDGE_SOURCES.map((s) => s.link).join(', ')}`);
  process.exit(1);
}

if (!existsSync(artifactPath)) {
  console.log(`En clair : pas d'artefact compilé à ${artifactPath}.`);
  console.log('Lance d’abord : pnpm --dir products/mega-city graph:compile');
  process.exit(1);
}

let compiled: CompiledGraph;
try {
  compiled = JSON.parse(readFileSync(artifactPath, 'utf8')) as CompiledGraph;
} catch {
  console.log(`En clair : artefact compilé illisible (JSON invalide) à ${artifactPath}.`);
  console.log('Régénère-le : pnpm --dir products/mega-city graph:compile');
  process.exit(1);
}
if (!Array.isArray(compiled?.edges) || !Array.isArray(compiled?.nodes)) {
  console.log(`En clair : artefact compilé de forme inattendue (pas d’arêtes) à ${artifactPath}.`);
  console.log('Régénère-le : pnpm --dir products/mega-city graph:compile');
  process.exit(1);
}

const resolved = resolveNode(compiled, relation, ref, inverse);

if (resolved.status === 'unknown') {
  console.log(`En clair : « ${ref} » n'existe pas dans le graphe compilé (faute de frappe ?).`);
  process.exit(1);
}
if (resolved.status === 'ambiguous') {
  console.log(
    `En clair : « ${ref} » existe en plusieurs exemplaires (${resolved.kinds.join(', ')}) et « ${relation} » ne dit pas lequel interroger.`,
  );
  console.log(`Précise le kind devant l'id : ${resolved.kinds.map((k) => `${k}:${ref}`).join(' · ')}`);
  process.exit(1);
}

const { node } = resolved;
const name = `${node.kind}:${node.id}`;
const found = queryGraph(compiled, relation, node, inverse);

if (found.length === 0) {
  console.log(
    `En clair : aucune arête « ${relation} » ${inverse ? 'vers' : 'depuis'} ${name} dans le graphe compilé.`,
  );
} else if (inverse) {
  console.log(`En clair : ${found.join(', ')} --(${relation})--> ${name}`);
} else {
  console.log(`En clair : ${name} --(${relation})--> ${found.join(', ')}`);
}
