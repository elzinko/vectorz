/**
 * supervision-link — branche l'émetteur de supervision sur un projet Claude Code
 * en UNE commande (fiche 0094), à la place du câblage manuel error-prone.
 *
 *   pnpm --dir products/mega-city supervision:link <chemin-du-projet>
 *
 * Écrit/fusionne le `.mcp.json` du projet (préserve tout autre serveur MCP),
 * gitignore `.supervision/` ET `/.mcp.json` (artefact local, ADR-034 — la règle
 * suit chaque projet branché, pas seulement vectorz), et imprime les étapes
 * suivantes. Idempotent :
 * rejouer met à jour les chemins sans rien casser. Ne touche JAMAIS à la config
 * du daemon (le côté LECTURE est un observateur externe — modèle à deux clés,
 * fiche 0082).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureSupervisionIgnored,
  mergeMcpConfig,
  resolveProjectPath,
} from '../src/supervision/link-config.js';
import { EXPECTED_SUPERVISION_TOOLS } from '../src/supervision/probe.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(2);
}

/**
 * Le fichier est-il dans l'index git du projet ? `git ls-files --error-unmatch`
 * sort 0 si suivi, non-zéro sinon — y compris quand la cible n'est pas un dépôt
 * git du tout, ce qui est le bon comportement (rien à détracker).
 */
function isTrackedByGit(root: string, relativePath: string): boolean {
  try {
    execFileSync('git', ['-C', root, 'ls-files', '--error-unmatch', relativePath], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

const arg = process.argv[2];
if (!arg || arg === '-h' || arg === '--help') {
  console.log('usage : pnpm --dir products/mega-city supervision:link <chemin-du-projet>');
  console.log('');
  console.log("Branche l'émetteur de supervision sur un projet (côté Claude Code) :");
  console.log('  · écrit/fusionne son .mcp.json (préserve les autres serveurs MCP)');
  console.log('  · ajoute .supervision/ et /.mcp.json à son .gitignore');
  process.exit(arg ? 0 : 2);
}

// Résolution contre INIT_CWD (dossier d'invocation) : sous `pnpm --dir`, le cwd
// du script est le package, pas là où l'utilisateur a tapé la commande (revue
// Codex PR #51). Un `.` ou `../projet` vise ainsi le bon projet.
const projectRoot = resolveProjectPath(arg, process.env.INIT_CWD, process.cwd());
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

// 0. Refus si le .mcp.json de la cible est SUIVI par git (finding Codex P1, PR #54).
// Un `.gitignore` ne s'applique jamais à un fichier déjà dans l'index : y ajouter
// `/.mcp.json` ne détracke rien. On écrirait donc des chemins absolus de machine
// dans un fichier suivi — commitable, cassé chez les autres — tout en ANNONÇANT
// qu'il est ignoré. Le cas n'est pas exotique : versionner son `.mcp.json` est la
// pratique normale pour partager un serveur MCP d'équipe. Mieux vaut refuser et
// dire quoi faire que rassurer à tort (ADR-034).
const mcpPath = join(projectRoot, '.mcp.json');
if (isTrackedByGit(projectRoot, '.mcp.json')) {
  fail(
    `.mcp.json est SUIVI par git dans ce projet : ${mcpPath}\n` +
      "  La règle d'ignore n'a aucun effet sur un fichier déjà indexé — le branchement\n" +
      '  écrirait des chemins absolus de TA machine dans un fichier versionné.\n' +
      '  Détracke-le, puis relance :\n' +
      `    git -C "${projectRoot}" rm --cached .mcp.json\n` +
      '  (ou versionne-le sciemment, mais alors ne branche pas la supervision ici.)',
  );
}

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
// Les 5 noms viennent de la constante partagée, jamais réécrits à la main :
// ce compte rendu est de la doc EXÉCUTABLE, il ne doit pas pouvoir mentir.
console.log(
  `  · .mcp.json  → serveur « supervision » (${EXPECTED_SUPERVISION_TOOLS.length} outils : ${EXPECTED_SUPERVISION_TOOLS.join(', ')})`,
);
console.log('  · .gitignore → .supervision/ + /.mcp.json (artefact local, ADR-034)');
console.log('');
console.log('Étapes suivantes :');
console.log(`  1. Rouvre Claude Code DANS ce projet :  cd "${projectRoot}" && claude`);
console.log('     puis autorise le serveur « supervision » à la 1re demande.');
console.log('  2. Lance ta méthode :  /ezk-sprint   (ou /supervision-demo pour un essai jouet).');
console.log('  3. Pour la voir dans le Moniteur, côté cop1 (observateur externe) :');
console.log(`     ajoute "${projectRoot}" aux supervision.watch_roots du cop1.config.yaml du`);
console.log('     daemon, lance-le, puis la web UI — voir src/supervision/README.md.');
