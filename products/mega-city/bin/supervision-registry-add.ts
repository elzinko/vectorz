/**
 * supervision-registry-add — ajoute un projet au registre siège (fiche 0063).
 *
 *   pnpm --dir products/mega-city supervision:registry-add <id> <chemin> [method]
 *
 * Écrit `supervision.registry.yaml` (découvert par walk-up depuis cwd / chemin).
 * Ne touche PAS à `.mcp.json` (c'est `supervision:link`).
 *
 * Le registre est suivi par git : chaque checkout (dossier principal, worktree) a sa copie. La
 * commande écrit celle du checkout trouvé, imprime le fichier écrit et, depuis un worktree, prévient
 * que le cockpit du dossier principal ne verra le projet qu'après le merge (ADR-0062, arbitrage PO
 * du 2026-10-04 : écrire la copie du dossier principal la laisserait modifiée hors de toute branche).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
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

/** Vrai si `dir` est dans un worktree lié (son dossier git n'est pas le dossier git commun). */
function inLinkedWorktree(dir: string): boolean {
  const ask = (flag: string): string | null => {
    try {
      return execFileSync('git', ['-C', dir, 'rev-parse', '--path-format=absolute', flag], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return null;
    }
  };
  const gitDir = ask('--git-dir');
  const commonDir = ask('--git-common-dir');
  return gitDir !== null && commonDir !== null && gitDir !== commonDir;
}

const pathLabel = pathLabelForRegistry(located.dir, projectRoot);
try {
  appendRegistryProject(located.dir, { id: id || basename(projectRoot), path: pathLabel, method });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

console.log(`✓ registre : projet « ${id} » ajouté (${pathLabel}, method=${method})`);
console.log(`  fichier écrit : ${join(located.dir, 'supervision.registry.yaml')}`);
if (inLinkedWorktree(located.dir)) {
  console.log(
    "  ⚠ c'est la copie d'un worktree : committe-la et merge-la, sinon le cockpit et le daemon cop1 lancés depuis le dossier principal ne verront pas ce projet.",
  );
} else {
  console.log('  → redémarre le daemon cop1 pour activer la surveillance (watchers).');
}
