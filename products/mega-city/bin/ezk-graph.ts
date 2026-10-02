#!/usr/bin/env tsx
/**
 * ezk-graph — compile le graphe de la méthode et VALIDE ses liens.
 *
 *   pnpm --dir products/mega-city graph:check          # rapport humain, exit 1 si un lien casse
 *   pnpm --dir products/mega-city graph:check --json    # le graphe + le rapport en JSON (webapp/CI)
 *
 * Le cœur (src/core/graph.ts) compile et valide, PUR et déterministe ; ce script est le
 * bord I/O — il charge le catalogue depuis le disque, imprime, et pose l'exit-code. Deux
 * choses font échouer (exit 1) :
 *   - un lien cassé (une cible qui n'existe pas) = un concept qui pointe dans le vide ;
 *   - un lien markdown PAR CHEMIN vers un skill / agent / règle dont la relation n'est pas
 *     déclarée par id (fiche 357, ADR-0040 : « un chemin n'est pas une identité »).
 * Les relations sans champ d'id (règle → règle) sont listées en information, sans bloquer.
 *
 * POURQUOI : la carte et les checkers doivent lire UN graphe sourcé par construction, pas
 * le re-deviner depuis trente fichiers (synthèse PR #162). Ce validateur prouve qu'il tient.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Edge, graphEdges, validateGraph } from '../src/core/graph.js';
import { type PathRef, checkPathRefs } from '../src/core/structural-refs.js';
import { loadCatalog } from '../src/loaders/catalog.js';
import { scanPathRefs } from '../src/loaders/path-refs.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const asJson = process.argv.slice(2).includes('--json');

const catalog = loadCatalog(repoRoot);
const report = validateGraph(catalog);
const pathRefs = checkPathRefs(scanPathRefs(repoRoot), graphEdges(catalog));
const ok = report.broken.length === 0 && pathRefs.undeclared.length === 0;

if (asJson) {
  console.log(JSON.stringify({ ...report, edges: graphEdges(catalog), pathRefs }, null, 2));
  process.exit(ok ? 0 : 1);
}

const { nodeCount: n, edgeCount, broken, orphans } = report;
const arrow = (e: Edge): string => `${e.from} --(${e.link})--> ${e.to}`;
const where = (r: PathRef): string => `${r.file}:${r.line}`;

// En clair d'abord (règle human-facing-lisibility) : le verdict en une ligne.
if (ok) {
  console.log(
    `En clair : le graphe de la méthode compile. ${edgeCount} liens, aucun cassé, aucun lien par chemin sans id. ✅`,
  );
} else {
  const problems = [
    broken.length > 0 ? `${broken.length} lien(s) cassé(s) sur ${edgeCount}` : '',
    pathRefs.undeclared.length > 0
      ? `${pathRefs.undeclared.length} lien(s) par chemin à déclarer par id`
      : '',
  ].filter(Boolean);
  console.log(`En clair : ⚠️ ${problems.join(' et ')}.`);
}
console.log(
  `\nNœuds   : rules ${n.rule} · agents ${n.agent} · skills ${n.skill} · bundles ${n.bundle} · profiles ${n.profile} · outils ${n.tool}`,
);
console.log(`Liens   : ${edgeCount}`);

if (broken.length > 0) {
  console.log(`\nLiens cassés (${broken.length}) — la cible n'existe dans aucun catalogue :`);
  for (const e of broken) console.log(`  ✗ ${arrow(e)}   [${e.fromKind} → ${e.toKind}]`);
}

if (pathRefs.undeclared.length > 0) {
  console.log(
    `\nLiens par chemin vers un skill / agent / règle, non déclarés par id (${pathRefs.undeclared.length}) :`,
  );
  for (const r of pathRefs.undeclared) {
    console.log(
      `  ✗ ${where(r)} → ${r.to.kind} ${r.to.id}   déclare-le dans le frontmatter : ${r.declareWith.join(' | ')}`,
    );
  }
}

if (pathRefs.unsupported.length > 0) {
  // Info : aucun champ d'id n'existe encore pour cette relation (reliquat de la fiche 357).
  console.log(
    `\nLiens par chemin sans champ d'id possible (${pathRefs.unsupported.length}, info — relation à nommer) :`,
  );
  for (const r of pathRefs.unsupported) {
    console.log(`  · ${where(r)} : ${r.from.kind} ${r.from.id} → ${r.to.kind} ${r.to.id}`);
  }
}

const catalogOrphans = orphans.filter((o) => o.kind !== 'tool');
if (catalogOrphans.length > 0) {
  // Info, pas erreur : un profil racine, ou une règle pas encore bundlée, est orphelin sans faute.
  const shown = catalogOrphans.map((o) => `${o.kind}:${o.id}`).join(', ');
  console.log(`\nOrphelins (${catalogOrphans.length}, info — rien ne les cite) : ${shown}`);
}

// Un outil est justifié par un skill qui le cite, une commande `ezk …` ou une raison « internal »
// du manifeste (ADR-0058). Sans rien de cela, personne ne le lance : on le dit, jamais en silence.
const toolOrphans = orphans.filter((o) => o.kind === 'tool');
if (toolOrphans.length > 0) {
  console.log(
    `\nOutils orphelins (${toolOrphans.length}, info — aucun skill ne les cite, aucune commande ezk ne les lance, aucune raison « internal ») :`,
  );
  for (const o of toolOrphans) console.log(`  · ${o.id}`);
}

process.exit(ok ? 0 : 1);
