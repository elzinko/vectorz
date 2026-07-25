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
  const alreadyIgnored = gitignore.split('\n').some((line) => {
    const trimmed = line.trim();
    return trimmed === '.supervision' || trimmed === '.supervision/';
  });
  if (alreadyIgnored) return gitignore;
  const needsNewline = gitignore.length > 0 && !gitignore.endsWith('\n');
  return `${gitignore}${needsNewline ? '\n' : ''}.supervision/\n`;
}
