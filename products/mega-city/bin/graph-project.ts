#!/usr/bin/env tsx
/**
 * graph-project — la VUE DE PROJECTION (fiche 20261008154805639) : pour un projet, chaque
 * agent/skill AVEC les règles qu'il applique, lues de l'instance déjà compilée. Un
 * CONSOMMATEUR de plus (comme graph-query) : il LIT `.ezk/graph.compiled.json`, ne recompile
 * JAMAIS (ADR-0040 D5).
 *
 *   pnpm --dir products/mega-city graph:compile          # d'abord, régénère l'artefact
 *   pnpm --dir products/mega-city graph:project          # tous les agents/skills → leurs règles
 *   pnpm --dir products/mega-city graph:project ezk-dev  # un seul (agent ou skill « ezk-dev »)
 *   pnpm --dir products/mega-city graph:project agent:ezk-reviewer
 *
 * « Avec ses règles » = les arêtes `applique` du nœud (vers une règle, ou vers un bundle). C'est
 * la VERSION MINIMALE : les arêtes directes, sans déplier les bundles en leurs règles — le
 * dépliage est la version riche (après F1/F2). Aujourd'hui, on lit le graphe de la méthode
 * elle-même (le catalogue de vectorz) ; projeter un AUTRE projet bindé (ses règles déployées)
 * reste à faire, c'est la suite.
 *
 * Artefact absent ⇒ message clair (régénère-le), pas un plantage. Filtre inconnu ⇒ erreur
 * nommée : une faute de frappe ne doit pas ressembler à « aucune règle ».
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type CompiledGraph,
  type ConsumerProjection,
  projectConsumers,
} from '../src/core/compiled-graph.js';
import type { NodeKind } from '../src/core/graph.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..');
const artifactPath = join(repoRoot, '.ezk', 'graph.compiled.json');

const [filter] = process.argv.slice(2).filter((a) => !a.startsWith('--'));

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
  console.log(`En clair : artefact compilé de forme inattendue à ${artifactPath}.`);
  console.log('Régénère-le : pnpm --dir products/mega-city graph:compile');
  process.exit(1);
}

let projections = projectConsumers(compiled);

if (filter) {
  const colon = filter.indexOf(':');
  const kind = (colon > 0 ? filter.slice(0, colon) : undefined) as NodeKind | undefined;
  const id = colon > 0 ? filter.slice(colon + 1) : filter;
  projections = projections.filter(
    (p) => p.consumer.id === id && (kind === undefined || p.consumer.kind === kind),
  );
  if (projections.length === 0) {
    console.log(
      `En clair : aucun agent ni skill « ${filter} » dans le graphe compilé (faute de frappe ?).`,
    );
    process.exit(1);
  }
}

function render(p: ConsumerProjection): string {
  const head = `${p.consumer.kind}:${p.consumer.id}`;
  if (p.rules.length === 0 && p.bundles.length === 0) {
    return `${head}\n  (aucune règle appliquée)`;
  }
  const lines: string[] = [head];
  for (const b of p.bundles) lines.push(`  bundle ${b}`);
  for (const r of p.rules) lines.push(`  ${r}`);
  return lines.join('\n');
}

const total = projections.length;
const withRules = projections.filter((p) => p.rules.length > 0 || p.bundles.length > 0).length;
console.log(
  `En clair : ${total} agent(s)/skill(s) projeté(s), ${withRules} avec au moins une règle ou un bundle.`,
);
console.log('');
console.log(projections.map(render).join('\n'));
