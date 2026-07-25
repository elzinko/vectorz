/**
 * supervision-link — branche l'émetteur de supervision sur un projet Claude Code
 * en UNE commande (fiche 0094), à la place du câblage manuel error-prone.
 *
 *   pnpm --dir products/mega-city supervision:link <chemin-du-projet>
 *
 * Écrit/fusionne le `.mcp.json` du projet (préserve tout autre serveur MCP),
 * gitignore `.supervision/`, et imprime les étapes suivantes. Idempotent :
 * rejouer met à jour les chemins sans rien casser. Ne touche JAMAIS à la config
 * du daemon (le côté LECTURE est un observateur externe — modèle à deux clés,
 * fiche 0082).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureSupervisionIgnored, mergeMcpConfig } from '../src/supervision/link-config.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

const arg = process.argv[2];
if (!arg || arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city supervision:link <chemin-du-projet>');
  console.log('');
  console.log("Branche l'émetteur de supervision sur un projet (côté Claude Code) :");
  console.log('  · écrit/fusionne son .mcp.json (préserve les autres serveurs MCP)');
  console.log('  · ajoute .supervision/ à son .gitignore');
  process.exit(arg ? 0 : 2);
}

const projectRoot = resolve(arg);
if (!existsSync(projectRoot)) fail(`projet introuvable : ${projectRoot}`);

const megaCityDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = join(megaCityDir, 'bin', 'supervision-mcp.ts');
if (!existsSync(serverEntry)) fail(`serveur MCP introuvable : ${serverEntry}`);

// pnpm en chemin ABSOLU (une app GUI démarre avec un PATH minimal). `which`
// échoue ⇒ repli sur "pnpm" nu (fonctionne quand le PATH le contient, ex. Claude
// Code lancé depuis un terminal).
let pnpm = 'pnpm';
try {
  pnpm = execFileSync('which', ['pnpm'], { encoding: 'utf8' }).trim() || 'pnpm';
} catch {
  /* repli "pnpm" nu */
}

const paths = { pnpm, megaCityDir, serverEntry, projectRoot };

// 1. .mcp.json — fusion non-destructive
const mcpPath = join(projectRoot, '.mcp.json');
let existing: unknown = {};
if (existsSync(mcpPath)) {
  try {
    existing = JSON.parse(readFileSync(mcpPath, 'utf8'));
  } catch {
    fail(`.mcp.json existant illisible (JSON invalide) : ${mcpPath}\n  corrige-le ou déplace-le, puis relance.`);
  }
}
const alreadyLinked =
  existsSync(mcpPath) &&
  typeof existing === 'object' &&
  existing !== null &&
  'mcpServers' in (existing as Record<string, unknown>) &&
  Boolean((((existing as Record<string, unknown>).mcpServers as Record<string, unknown>) ?? {}).supervision);
writeFileSync(mcpPath, `${JSON.stringify(mergeMcpConfig(existing, paths), null, 2)}\n`);

// 2. .gitignore — .supervision/
const gitignorePath = join(projectRoot, '.gitignore');
const gitignore = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
writeFileSync(gitignorePath, ensureSupervisionIgnored(gitignore));

// 3. compte rendu + étapes suivantes
console.log(`✓ ${projectRoot} ${alreadyLinked ? 'ré-branché (chemins mis à jour)' : 'branché'}.`);
console.log('  · .mcp.json  → serveur « supervision » (5 outils : run_start, gate_reached,');
console.log('                 gate_resumed, escalate, run_finished)');
console.log('  · .gitignore → .supervision/');
console.log('');
console.log('Étapes suivantes :');
console.log(`  1. Rouvre Claude Code DANS ce projet :  cd "${projectRoot}" && claude`);
console.log('     puis autorise le serveur « supervision » à la 1re demande.');
console.log('  2. Lance ta méthode :  /ezk-sprint   (ou /supervision-demo pour un essai jouet).');
console.log('  3. Pour la voir dans le Moniteur, côté cop1 (observateur externe) :');
console.log(`     ajoute "${projectRoot}" aux supervision.watch_roots du cop1.config.yaml du`);
console.log('     daemon, lance-le, puis la web UI — voir src/supervision/README.md.');
