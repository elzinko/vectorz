#!/usr/bin/env tsx
/**
 * ezk-graph — compile le graphe de la méthode et VALIDE ses liens.
 *
 *   pnpm --dir products/mega-city graph:check          # rapport humain, exit 1 si un lien casse
 *   pnpm --dir products/mega-city graph:check --json    # le graphe + le rapport en JSON (webapp/CI)
 *
 * Le cœur (src/core/graph.ts) compile et valide, PUR et déterministe ; ce script est le
 * bord I/O — il charge le catalogue depuis le disque, imprime, et pose l'exit-code. Un lien
 * cassé (une cible qui n'existe pas) = un concept qui pointe dans le vide : exit 1.
 *
 * POURQUOI : la carte et les checkers doivent lire UN graphe sourcé par construction, pas
 * le re-deviner depuis trente fichiers (synthèse PR #162). Ce validateur prouve qu'il tient.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Edge, graphEdges, validateGraph } from '../src/core/graph.js';
import { loadCatalog } from '../src/loaders/catalog.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const asJson = process.argv.slice(2).includes('--json');

const catalog = loadCatalog(repoRoot);
const report = validateGraph(catalog);

if (asJson) {
  console.log(JSON.stringify({ ...report, edges: graphEdges(catalog) }, null, 2));
  process.exit(report.broken.length === 0 ? 0 : 1);
}

const { nodeCount: n, edgeCount, broken, orphans } = report;
const arrow = (e: Edge): string => `${e.from} --(${e.link})--> ${e.to}`;

// En clair d'abord (règle human-facing-lisibility) : le verdict en une ligne.
if (broken.length === 0) {
  console.log(`En clair : le graphe de la méthode compile. ${edgeCount} liens, aucun cassé. ✅`);
} else {
  console.log(
    `En clair : ⚠️ ${broken.length} lien(s) cassé(s) sur ${edgeCount} — des concepts pointent dans le vide.`,
  );
}
console.log(
  `\nNœuds   : rules ${n.rule} · agents ${n.agent} · skills ${n.skill} · bundles ${n.bundle} · profiles ${n.profile}`,
);
console.log(`Liens   : ${edgeCount}`);

if (broken.length > 0) {
  console.log(`\nLiens cassés (${broken.length}) — la cible n'existe dans aucun catalogue :`);
  for (const e of broken) console.log(`  ✗ ${arrow(e)}   [${e.fromKind} → ${e.toKind}]`);
}

if (orphans.length > 0) {
  // Info, pas erreur : un profil racine, ou une règle pas encore bundlée, est orphelin sans faute.
  const shown = orphans.map((o) => `${o.kind}:${o.id}`).join(', ');
  console.log(`\nOrphelins (${orphans.length}, info — rien ne les cite) : ${shown}`);
}

process.exit(broken.length === 0 ? 0 : 1);
