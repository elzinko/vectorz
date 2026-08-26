#!/usr/bin/env tsx
/**
 * graph-query — un CONSOMMATEUR qui LIT l'instance compilée, ne recompile jamais
 * (ADR-0040 D5 : « le préflight par commande LIT l'objet déjà compilé »).
 *
 *   pnpm --dir products/mega-city graph:compile          # d'abord, régénère l'artefact
 *   pnpm --dir products/mega-city graph:query enforces clean-code/no-dead-code
 *   → répond « qui applique cette règle ? » sans grep (critère de vérification, fiche 357).
 *
 * Artefact absent ⇒ message clair (régénère-le), pas un plantage silencieux.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CompiledGraph } from '../src/core/compiled-graph.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..');
const artifactPath = join(repoRoot, '.ezk', 'graph.compiled.json');

const [link, from] = process.argv.slice(2);

if (!link || !from) {
  console.log('Usage : pnpm --dir products/mega-city graph:query <lien> <id-source>');
  console.log('Exemple : graph:query enforces clean-code/no-dead-code');
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
if (!Array.isArray(compiled?.edges)) {
  console.log(`En clair : artefact compilé de forme inattendue (pas d’arêtes) à ${artifactPath}.`);
  console.log('Régénère-le : pnpm --dir products/mega-city graph:compile');
  process.exit(1);
}
const targets = compiled.edges.filter((e) => e.link === link && e.from === from).map((e) => e.to);

if (targets.length === 0) {
  console.log(`En clair : aucune arête « ${link} » depuis ${from} dans le graphe compilé.`);
} else {
  console.log(`En clair : ${from} --(${link})--> ${targets.join(', ')}`);
}
