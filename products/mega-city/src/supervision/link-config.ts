/**
 * Génération NON-DESTRUCTIVE du branchement de l'émetteur de supervision dans un
 * projet Claude Code (fiche 0094). Logique pure, sans I/O — testée seule ; la
 * coquille I/O est `bin/supervision-link.ts`.
 *
 * Le bloc produit est exactement l'invocation prouvée du câblage manuel
 * (`src/supervision/README.md`) : `pnpm --dir <mega-city> exec tsx
 * <supervision-mcp.ts>`, `SUPERVISION_PROJECT_ROOT` fixé à l'init — jamais un
 * paramètre d'outil (invariant anti-falsification, fiche 0050).
 */
import { isAbsolute, resolve } from 'node:path';

/**
 * Résout le chemin du projet passé en argument (revue Codex PR #51). Piège : la
 * commande documentée est `pnpm --dir products/mega-city …`, or `--dir` fait que
 * le `cwd` du script EST `products/mega-city`, pas le dossier où l'utilisateur a
 * tapé la commande. Un chemin relatif (`.`, `../projet`) serait donc résolu au
 * mauvais endroit — et brancherait le mauvais projet. On résout contre
 * `INIT_CWD` (posé par pnpm/npm = dossier d'invocation) quand il est présent,
 * sinon contre le `cwd` courant. Un chemin absolu passe tel quel.
 */
export function resolveProjectPath(
  arg: string,
  initCwd: string | undefined,
  cwd: string,
): string {
  if (isAbsolute(arg)) return arg;
  const base = initCwd && initCwd.length > 0 ? initCwd : cwd;
  return resolve(base, arg);
}

export interface SupervisionServerConfig {
  command: string;
  args: string[];
  env: { SUPERVISION_PROJECT_ROOT: string };
}

export interface LinkPaths {
  /** Chemin ABSOLU de pnpm (résolu par l'appelant — robuste au PATH minimal d'une app GUI). */
  pnpm: string;
  /** Dossier mega-city (`pnpm --dir` y résout `tsx`, non hoisté à la racine du monorepo). */
  megaCityDir: string;
  /** Entrée du serveur MCP émetteur (`bin/supervision-mcp.ts`). */
  serverEntry: string;
  /** Racine du projet supervisé → `SUPERVISION_PROJECT_ROOT`. */
  projectRoot: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Le bloc `supervision` du `.mcp.json` — l'invocation prouvée, telle quelle. */
export function buildSupervisionServer(paths: LinkPaths): SupervisionServerConfig {
  return {
    command: paths.pnpm,
    args: ['--dir', paths.megaCityDir, 'exec', 'tsx', paths.serverEntry],
    env: { SUPERVISION_PROJECT_ROOT: paths.projectRoot },
  };
}

/**
 * Fusionne l'entrée `supervision` dans un `.mcp.json` existant, SANS toucher aux
 * autres serveurs MCP ni aux autres clés de premier niveau. Un `.mcp.json`
 * malformé (null, tableau, non-objet) est traité comme vide. Idempotent :
 * rejouer produit un objet structurellement identique.
 */
export function mergeMcpConfig(existing: unknown, paths: LinkPaths): Record<string, unknown> {
  const base = isPlainObject(existing) ? { ...existing } : {};
  const servers = isPlainObject(base.mcpServers) ? { ...base.mcpServers } : {};
  servers.supervision = buildSupervisionServer(paths);
  return { ...base, mcpServers: servers };
}

/** Ajoute `.supervision/` au contenu d'un `.gitignore` s'il n'y figure pas déjà. */
export function ensureSupervisionIgnored(gitignore: string): string {
  return appendIfAbsent(appendIfAbsent(gitignore, SUPERVISION_IGNORE), MCP_JSON_IGNORE);
}

/** Le journal : jamais versionné (règle DP6). */
const SUPERVISION_IGNORE = {
  entry: '.supervision/',
  aliases: ['.supervision', '.supervision/'],
  comment: null,
};

/**
 * Le fichier de branchement : artefact d'INSTALLATION local (ADR-034). Ignoré
 * dans CHAQUE projet branché, pas seulement dans vectorz — `supervision:link`
 * accepte un chemin arbitraire, et un `.mcp.json` généré pour un cobaye est
 * tout aussi machine-spécifique : commité, il casserait sur tout autre poste
 * (finding Codex P1 sur la PR #54). Ancré : la décision ne porte que sur le
 * fichier de branchement du projet, pas sur tout `.mcp.json` en profondeur.
 */
const MCP_JSON_IGNORE = {
  entry: '/.mcp.json',
  aliases: ['/.mcp.json', '.mcp.json'],
  comment: '# Branchement de supervision : artefact local, régénéré par supervision:link (ADR-034)',
};

function appendIfAbsent(
  gitignore: string,
  rule: { entry: string; aliases: string[]; comment: string | null },
): string {
  const alreadyIgnored = gitignore
    .split('\n')
    .some((line) => rule.aliases.includes(line.trim()));
  if (alreadyIgnored) return gitignore;
  const needsNewline = gitignore.length > 0 && !gitignore.endsWith('\n');
  const comment = rule.comment === null ? '' : `${rule.comment}\n`;
  return `${gitignore}${needsNewline ? '\n' : ''}${comment}${rule.entry}\n`;
}
