#!/usr/bin/env tsx
/**
 * graph-compile — émet l'INSTANCE compilée du graphe de la méthode sur disque.
 *
 *   pnpm --dir products/mega-city graph:compile
 *
 * Le cœur (`src/core/compiled-graph.ts`) compile et valide, PUR et déterministe ; ce
 * script est le bord I/O — il charge le catalogue, écrit l'artefact, pose l'exit-code.
 *
 * ARTEFACT DE BUILD, non-versionné (ADR-0040 D5) : écrit dans `.ezk/graph.compiled.json`
 * à la racine du repo (gitignoré), régénéré à la demande. Un id référencé inexistant
 * fait ÉCHOUER cette commande (`compileGraph` lève) — rien n'est écrit, exit 1.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileGraph } from '../src/core/compiled-graph.js';
import { loadCatalog } from '../src/loaders/catalog.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const artifactPath = join(repoRoot, '.ezk', 'graph.compiled.json');

const catalog = loadCatalog(megaCity);

try {
  const compiled = compileGraph(catalog);
  const artifactDir = dirname(artifactPath);
  if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify(compiled, null, 2)}\n`);
  console.log(
    `En clair : graphe compilé — ${compiled.nodes.length} nœuds, ${compiled.edges.length} liens. ✅`,
  );
  console.log(`Artefact écrit (non-versionné) : ${artifactPath}`);
} catch (err) {
  console.log('En clair : ⚠️ compilation refusée — au moins un lien pointe vers un id inconnu.\n');
  console.log(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
