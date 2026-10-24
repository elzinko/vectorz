/**
 * sessions-collect — le BORD I/O de la collecte de sessions (extrait de bin/ezk-sessions.ts).
 *
 * Il exécute `git` et `gh` et lit le disque ; le cœur pur (`src/core/sessions-data.ts`,
 * `src/core/process-data.ts`) ne fait que juger (ADR-0001, ADR-0003). Extrait ici pour être
 * PARTAGÉ : le cockpit de sessions ET la vue « process » (fiche 20261002115451315) lisent les
 * mêmes worktrees, branches et PR, sans dupliquer la collecte.
 *
 * Tous les collecteurs sont best-effort : `git`/`gh` absent, hors dépôt ou sans remote
 * dégrade proprement (liste vide, ou `null` pour les PR), jamais une exception qui remonte.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  type CollectedInputs,
  type SessionRow,
  type WorktreeInput,
  buildSessionsData,
  deriveSessionSlug,
} from '../core/sessions-data.js';

/** `git worktree list --porcelain` → une entrée par bloc séparé par une ligne vide. */
export function collectWorktrees(): WorktreeInput[] {
  let out: string;
  try {
    out = execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' });
  } catch {
    return []; // git absent ou hors dépôt — dégradation propre, cohérente avec les autres collecteurs
  }
  const blocks = out.split('\n\n').filter((b) => b.trim());
  return blocks.map((block) => {
    const path = /^worktree (.+)$/m.exec(block)?.[1] ?? '';
    const branchMatch = /^branch refs\/heads\/(.+)$/m.exec(block);
    const detached = /^detached$/m.test(block);
    return { path, branch: branchMatch?.[1] ?? '', detached };
  });
}

/** `git branch --merged main` — les têtes déjà entièrement dans `main`. */
export function collectMergedBranches(): string[] {
  try {
    const out = execFileSync('git', ['branch', '--merged', 'main', '--format=%(refname:short)'], {
      encoding: 'utf8',
    });
    return out.split('\n').map((b) => b.trim()).filter(Boolean);
  } catch {
    return []; // pas de branche `main` locale, ou dépôt sans historique — non bloquant
  }
}

/** Toutes les branches locales (nom court). Signal « en sprint » même sans worktree (vue process). */
export function collectBranches(): string[] {
  try {
    const out = execFileSync('git', ['branch', '--format=%(refname:short)'], { encoding: 'utf8' });
    return out.split('\n').map((b) => b.trim()).filter(Boolean);
  } catch {
    return []; // git absent ou hors dépôt — non bloquant
  }
}

/**
 * Les branches ABSORBÉES par `base` (défaut `main`) : les merger n'y changerait plus rien — le
 * squash est déjà passé, ou c'était une avance rapide. Même algorithme que le classifieur d'ezk-archive
 * (fiche 0076, `classify_ref`) et `is_absorbed` de ship-merge : `git merge-tree --write-tree base b`
 * rend l'arbre de `base`. Sert à ne PAS compter « en cours » une branche de story restée après le
 * merge (fiche 20261013131852984, critère 4).
 *
 * `git < 2.38` (pas de `--write-tree`) ou un merge en conflit → la branche n'est PAS jugée absorbée :
 * dégradé SÛR (on garde « en cours » plutôt que d'effacer à tort un travail réel), cohérent avec les
 * autres collecteurs best-effort.
 */
export function collectAbsorbedBranches(branches: string[], base = 'main', cwd = process.cwd()): string[] {
  // `cwd` INJECTÉ (défaut `process.cwd()`, rétro-compatible) : le test passe son dépôt jetable au
  // lieu de `process.chdir`, qui est GLOBAL au process et courait entre fichiers en suite parallèle
  // (fiche 20261023…, flake de gate). Pur quant à l'ambiance : plus de lecture du cwd ambiant.
  let baseTree: string;
  try {
    baseTree = execFileSync('git', ['rev-parse', `${base}^{tree}`], { encoding: 'utf8', cwd }).trim();
  } catch {
    return []; // pas de `main` local — rien à comparer
  }
  if (!baseTree) return [];
  const absorbed: string[] = [];
  for (const b of branches) {
    if (b === base) continue;
    try {
      const out = execFileSync('git', ['merge-tree', '--write-tree', base, b], { encoding: 'utf8', cwd });
      if (out.split('\n')[0]?.trim() === baseTree) absorbed.push(b);
    } catch {
      // merge-tree sort non-zéro sur un conflit (git ≥ 2.38) : la branche a du travail réel → non absorbée.
    }
  }
  return absorbed;
}

/**
 * `git status --porcelain -z` DANS le worktree — fichiers non commités, chemins relatifs.
 * `-z` = séparateur NUL, chemins littéraux (pas de C-quoting sur espaces/unicode). Un
 * renommage (`R`/`C`) occupe DEUX champs NUL (nouveau puis ancien) : on compte les deux,
 * car les deux chemins sont « touchés » pour la détection de collision.
 */
export function collectUncommitted(worktreePath: string): string[] {
  let out: string;
  try {
    out = execFileSync('git', ['-C', worktreePath, 'status', '--porcelain', '-z'], {
      encoding: 'utf8',
    });
  } catch {
    return []; // worktree disparu du disque (registre git périmé) — non bloquant
  }
  const parts = out.split('\0');
  const files: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i];
    if (!entry) continue;
    const status = entry.slice(0, 2);
    const path = entry.slice(3); // "XY " puis le chemin
    if (path) files.push(path);
    if (status[0] === 'R' || status[0] === 'C') {
      // le champ suivant est le chemin d'origine du renommage/copie
      const orig = parts[++i];
      if (orig) files.push(orig);
    }
  }
  return files;
}

/** mtime du `.jsonl` le plus récent sous `~/.claude/projects/<slug>` ; absent si aucun trouvé. */
export function collectLastSessionMtime(worktreePath: string): number | undefined {
  const dir = join(homedir(), '.claude', 'projects', deriveSessionSlug(worktreePath));
  if (!existsSync(dir)) return undefined;
  const jsonlFiles = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  if (jsonlFiles.length === 0) return undefined;
  return Math.max(...jsonlFiles.map((f) => statSync(join(dir, f)).mtimeMs));
}

/**
 * État PR par branche, en UNE seule passe `gh pr list` best-effort (pas un appel par ligne).
 * Vit dans la collecte (pas dans le rendu) → même donnée pour la CLI et le futur onglet map
 * (« une seule source de vérité », fiche). `{}` si `gh` absent/échoue → « — » à l'affichage.
 */
export function collectPrStates(): Record<string, string> {
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--state', 'all', '--json', 'number,headRefName,state', '--limit', '100'],
      { encoding: 'utf8' },
    );
    const prs = JSON.parse(out) as { number: number; headRefName: string; state: string }[];
    const byBranch: Record<string, string> = {};
    for (const pr of prs) {
      // garder la 1re rencontrée par branche (gh liste les plus récentes d'abord)
      if (!byBranch[pr.headRefName]) byBranch[pr.headRefName] = `#${pr.number} ${pr.state}`;
    }
    return byBranch;
  } catch {
    return {};
  }
}

/**
 * PR OUVERTES par branche, pour la vue process. NULLABLE DE PREMIÈRE CLASSE : `null` quand
 * `gh`/remote manque (on ne sait RIEN des PR → « en revue » indéterminable). Une map (même vide)
 * = `gh` a répondu : zéro PR ouverte est alors un FAIT, pas une ignorance (fiche 20261002115451315).
 */
export function collectOpenPrByBranch(): Record<string, string> | null {
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--state', 'open', '--json', 'number,headRefName', '--limit', '200'],
      { encoding: 'utf8' },
    );
    const prs = JSON.parse(out) as { number: number; headRefName: string }[];
    const byBranch: Record<string, string> = {};
    for (const pr of prs) {
      if (!byBranch[pr.headRefName]) byBranch[pr.headRefName] = `#${pr.number}`;
    }
    return byBranch;
  } catch {
    return null; // gh absent, dépôt sans remote, pas authentifié — l'étape « en revue » est inconnue
  }
}

/** La collecte complète attendue par `buildSessionsData` (le cockpit de sessions). */
export function collect(): CollectedInputs {
  const worktrees = collectWorktrees();
  const mergedBranches = collectMergedBranches();
  const prStateByBranch = collectPrStates();
  const uncommittedByPath: Record<string, string[]> = {};
  const lastSessionMtimeByPath: Record<string, number | undefined> = {};
  for (const wt of worktrees) {
    uncommittedByPath[wt.path] = collectUncommitted(wt.path);
    lastSessionMtimeByPath[wt.path] = collectLastSessionMtime(wt.path);
  }
  return { worktrees, mergedBranches, uncommittedByPath, lastSessionMtimeByPath, prStateByBranch };
}

/** Les entrées I/O dont la vue process a besoin, en plus des fiches (lues côté `derived-views`). */
export interface ProcessIo {
  sessions: SessionRow[];
  branches: string[];
  /** Les branches absorbées par `main` : écartées de « en cours » (fiche 20261013131852984). */
  absorbedBranches: string[];
  openPrByBranch: Record<string, string> | null;
}

/** Collecte tout ce que la vue process tire du git/gh local (les fiches viennent du projet désigné). */
export function collectProcessIo(): ProcessIo {
  const branches = collectBranches();
  return {
    sessions: buildSessionsData(collect()).rows,
    branches,
    absorbedBranches: collectAbsorbedBranches(branches),
    openPrByBranch: collectOpenPrByBranch(),
  };
}
