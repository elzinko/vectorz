/**
 * `session-identity.ts` — l'identité de la SESSION (le « qui » du journal), fiche
 * 20261015133600314 (émetteur T2, ADR-079 §D6/D10).
 *
 * Une session = un LLM sur un worktree. Elle couvre plusieurs runs, mais le runtime
 * est sans mémoire (un redémarrage MCP = nouvelle instance) et le journal est par-run :
 * la session n'a pas de domicile naturel. On lui en donne un : un petit fichier
 * `<root>/.supervision/session.json` qui FIGE son `session_id` une fois pour toutes
 * (il survit à un redémarrage du process) et retient le libellé lisible (sa branche).
 *
 * Pur file-system, comme `project-root.ts` : AUCUN spawn de `git` (indisponible dans
 * l'environnement spawné par Claude Desktop). La branche se lit dans `<gitdir>/HEAD`.
 */
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface SessionIdentity {
  /** Identifiant stable de la session, figé dans `session.json` (le « qui »). */
  sessionId: string;
  /** Libellé lisible de la session : sa branche git (ou, en HEAD détachée, le nom du worktree). */
  branch: string;
}

const SESSION_FILE_SEGMENTS = ['.supervision', 'session.json'] as const;

/**
 * Lit la branche courante dans `<gitdir>/HEAD`, en pur file-system.
 * - `.git` DOSSIER (arbre principal) → `<root>/.git/HEAD`.
 * - `.git` FICHIER `gitdir: <path>` (worktree lié) → `<gitdir>/HEAD`.
 * - HEAD détachée (pas de `ref:`) → repli sur le nom du dossier (worktree).
 * Tout échec de lecture dégrade sur le nom du dossier — jamais d'exception.
 */
export function resolveBranchFromGitHead(root: string): string {
  const fallback = path.basename(root);
  try {
    const gitEntry = path.join(root, '.git');
    const stat = fs.statSync(gitEntry);
    let gitDir: string;
    if (stat.isDirectory()) {
      gitDir = gitEntry;
    } else {
      const content = fs.readFileSync(gitEntry, 'utf8');
      const match = /^gitdir:\s*(.+)$/m.exec(content);
      if (!match) return fallback;
      gitDir = path.resolve(root, match[1].trim());
    }
    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    const ref = /^ref:\s*refs\/heads\/(.+)$/m.exec(head);
    return ref ? ref[1].trim() : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Résout l'identité de session pour `root` : `session_id` STABLE (figé dans
 * `session.json`, relu s'il existe) + `branch` (rafraîchie depuis HEAD à chaque appel,
 * car c'est un libellé). Crée `session.json` au premier appel. Un `session.json`
 * illisible ou sans `session_id` est (ré)écrit — best-effort, jamais fatal.
 */
export function resolveSessionIdentity(root: string): SessionIdentity {
  const branch = resolveBranchFromGitHead(root);
  const sessionFile = path.join(root, ...SESSION_FILE_SEGMENTS);

  try {
    const parsed = JSON.parse(fs.readFileSync(sessionFile, 'utf8')) as Record<string, unknown>;
    const existing = parsed.session_id;
    if (typeof existing === 'string' && existing.length > 0) {
      return { sessionId: existing, branch };
    }
  } catch {
    // absent ou illisible → on (re)crée ci-dessous
  }

  const sessionId = randomUUID();
  fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
  fs.writeFileSync(sessionFile, `${JSON.stringify({ session_id: sessionId, branch }, null, 2)}\n`, 'utf8');
  return { sessionId, branch };
}
