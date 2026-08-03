/**
 * supervision-registry-add — ajoute un projet au registre siège (fiche 0063).
 *
 *   pnpm --dir products/mega-city supervision:registry-add <id> <chemin> [method]
 *
 * Écrit `supervision.registry.yaml` (découvert par walk-up depuis cwd / chemin).
 * Ne touche PAS à `.mcp.json` (c'est `supervision:link`).
 */
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  appendRegistryProject,
  locateRegistry,
  pathLabelForRegistry,
} from '../src/supervision/registry.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length < 2 || args.length > 3) {
  fail('Usage: supervision:registry-add <id> <chemin-du-projet> [method]');
}

const id = args[0]!;
const projectRoot = resolve(args[1]!);
const method = args[2] ?? 'mega-city';

if (!existsSync(projectRoot)) {
  fail(`chemin introuvable : ${projectRoot}`);
}

const located = locateRegistry([projectRoot, process.cwd()]);
if (located === null) {
  fail(
    `aucun ${'supervision.registry.yaml'} trouvé (walk-up depuis ${projectRoot} / cwd) — crée le registre au siège d'abord`,
  );
}

const pathLabel = pathLabelForRegistry(located.dir, projectRoot);
try {
  appendRegistryProject(located.dir, { id: id || basename(projectRoot), path: pathLabel, method });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

console.log(
  `✓ registre : projet « ${id} » ajouté (${pathLabel}, method=${method}) dans ${located.dir}`,
);
console.log('  → redémarre le daemon cop1 pour activer la surveillance (watchers).');
