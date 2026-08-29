/**
 * sessions-data — le cockpit de sessions, collecteur PUR (ADR-0042, fiche 20260825141012293).
 *
 * Croise trois sources de vérité (worktrees git, sessions Claude Code, branches) pour
 * répondre à deux questions : qu'est-ce qui est SUPPRIMABLE sans danger, et quelles
 * sessions risquent de se PERCUTER (même fichier non commité). Zéro appel IA ici — le
 * script range, l'IA ne fait que juger (bin/README.md, ADR-0001).
 *
 * Cette couche ne fait AUCUNE I/O (pas de `git`, pas de lecture disque) : le bord I/O
 * (bin/ezk-sessions.ts) collecte et injecte les données via `CollectedInputs`. Testable
 * sans vrai git ni vrai système de fichiers.
 */

/** Préfixes de branche reconnus comme "type sprint" (fiche, décision 3 du 2026-08-28). */
const SPRINT_PREFIXES = ['feat', 'fix', 'chore', 'refactor', 'docs', 'test'];

const DEFAULT_ACTIVE_THRESHOLD_MINUTES = 30;

export interface WorktreeInput {
  /** Chemin absolu du dossier de travail. */
  path: string;
  /** Branche courante (vide si détaché). */
  branch: string;
  /** HEAD détaché (pas de branche). */
  detached?: boolean;
}

export interface CollectedInputs {
  worktrees: WorktreeInput[];
  /** Branches déjà fusionnées dans `main` (`git branch --merged main`). */
  mergedBranches: string[];
  /** Fichiers non commités par worktree (`git status --porcelain`), chemins relatifs. */
  uncommittedByPath: Record<string, string[]>;
  /** mtime (epoch ms) du `.jsonl` de session le plus récent, par worktree — absent si aucun trouvé. */
  lastSessionMtimeByPath: Record<string, number | undefined>;
  /** Horodatage de référence pour juger l'activité (défaut : `Date.now()`). */
  now?: number;
  /** Seuil « actif » en minutes (défaut : 30). */
  activeThresholdMinutes?: number;
}

export interface CollisionFile {
  file: string;
  /** Fichier « chaud » — index backlog, PLAN.md, une fiche en cours (surveillance prioritaire). */
  hot: boolean;
}

export interface Collision {
  path: string;
  files: CollisionFile[];
}

export interface SessionRow {
  path: string;
  branch: string;
  /** Dérivé du préfixe de branche ; "non précisé" si aucun préfixe reconnu. */
  subject: string;
  sessionActivity: 'active' | 'dormant';
  merged: boolean;
  uncommitted: string[];
  deletable: boolean;
  deletableReason: string;
  collisionsWith: Collision[];
}

export interface SessionsData {
  rows: SessionRow[];
}

/** `~/.claude/projects/<slug>` : le chemin absolu du worktree, `/` → `-`. */
export function deriveSessionSlug(worktreePath: string): string {
  return worktreePath.replace(/\//g, '-');
}

/** Fichiers chauds (décisions 2026-08-28 + ADR-0042) : index backlog, PLAN.md, une fiche en cours. */
function isHotFile(file: string): boolean {
  return file.startsWith('features/') && file.endsWith('.md');
}

function deriveSubject(branch: string): string {
  const prefix = branch.split('/')[0];
  return SPRINT_PREFIXES.includes(prefix) ? prefix : 'non précisé';
}

function deriveActivity(
  mtime: number | undefined,
  now: number,
  thresholdMinutes: number,
): 'active' | 'dormant' {
  if (mtime === undefined) return 'dormant';
  const ageMinutes = (now - mtime) / 60_000;
  return ageMinutes < thresholdMinutes ? 'active' : 'dormant';
}

function deriveDeletable(
  activity: 'active' | 'dormant',
  uncommitted: string[],
  merged: boolean,
  detached: boolean,
): { deletable: boolean; deletableReason: string } {
  if (activity === 'active') {
    return { deletable: false, deletableReason: 'session active — garder' };
  }
  if (uncommitted.length > 0) {
    return { deletable: false, deletableReason: 'travail non sauvé — garder' };
  }
  if (merged) {
    return { deletable: true, deletableReason: 'dormant, propre, branche déjà fusionnée dans main' };
  }
  if (detached) {
    return { deletable: true, deletableReason: 'dormant, propre, HEAD détaché' };
  }
  return { deletable: false, deletableReason: 'dormant mais branche non fusionnée — garder' };
}

/** Intersection déterministe de deux listes de fichiers (préserve l'ordre de `a`). */
function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((file) => setB.has(file));
}

export function buildSessionsData(input: CollectedInputs): SessionsData {
  const now = input.now ?? Date.now();
  const thresholdMinutes = input.activeThresholdMinutes ?? DEFAULT_ACTIVE_THRESHOLD_MINUTES;
  const mergedSet = new Set(input.mergedBranches);

  const rows: SessionRow[] = input.worktrees.map((wt) => {
    const uncommitted = input.uncommittedByPath[wt.path] ?? [];
    const activity = deriveActivity(input.lastSessionMtimeByPath[wt.path], now, thresholdMinutes);
    const merged = Boolean(wt.detached) || mergedSet.has(wt.branch);
    const { deletable, deletableReason } = deriveDeletable(
      activity,
      uncommitted,
      merged,
      Boolean(wt.detached),
    );
    return {
      path: wt.path,
      branch: wt.branch,
      subject: deriveSubject(wt.branch),
      sessionActivity: activity,
      merged,
      uncommitted,
      deletable,
      deletableReason,
      collisionsWith: [], // rempli ci-dessous
    };
  });

  // Collisions : intersection des fichiers non commités, toute paire (i, j), i ≠ j en index —
  // deux entrées de MÊME path (deux sessions dans le même répertoire) comptent aussi (ADR-0042).
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows.length; j++) {
      if (i === j) continue;
      const other = rows[j];
      const shared = intersect(rows[i].uncommitted, other.uncommitted);
      if (shared.length === 0) continue;
      rows[i].collisionsWith.push({
        path: other.path,
        files: shared.map((file) => ({ file, hot: isHotFile(file) })),
      });
    }
  }

  return { rows };
}
