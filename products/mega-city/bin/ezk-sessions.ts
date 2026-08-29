#!/usr/bin/env tsx
/**
 * ezk-sessions — cockpit de pilotage des sessions (fiche 20260825141012293, ADR-0042).
 *
 *   pnpm --dir products/mega-city ezk:sessions state
 *
 * Le cœur pur (src/core/sessions-data.ts) croise worktrees × sessions × branches ; ce
 * script est le bord I/O : `git worktree list`, `git branch --merged`, `git status` par
 * worktree, mtime des `.jsonl` de session sous `~/.claude/projects/<slug>`. Le tableau
 * produit ne coûte AUCUN appel IA (ADR-0001) — seul l'encart recommandations est un avis,
 * ici déterministe (pas d'appel LLM dans ce POC).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  type CollectedInputs,
  type WorktreeInput,
  buildSessionsData,
  deriveSessionSlug,
} from '../src/core/sessions-data.js';

/** `git worktree list --porcelain` → une entrée par bloc séparé par une ligne vide. */
function collectWorktrees(): WorktreeInput[] {
  const out = execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' });
  const blocks = out.split('\n\n').filter((b) => b.trim());
  return blocks.map((block) => {
    const path = /^worktree (.+)$/m.exec(block)?.[1] ?? '';
    const branchMatch = /^branch refs\/heads\/(.+)$/m.exec(block);
    const detached = /^detached$/m.test(block);
    return { path, branch: branchMatch?.[1] ?? '', detached };
  });
}

/** `git branch --merged main` — les têtes déjà entièrement dans `main`. */
function collectMergedBranches(): string[] {
  try {
    const out = execFileSync('git', ['branch', '--merged', 'main', '--format=%(refname:short)'], {
      encoding: 'utf8',
    });
    return out.split('\n').map((b) => b.trim()).filter(Boolean);
  } catch {
    return []; // pas de branche `main` locale, ou dépôt sans historique — non bloquant
  }
}

/** `git status --porcelain` DANS le worktree — fichiers non commités, chemins relatifs. */
function collectUncommitted(worktreePath: string): string[] {
  try {
    const out = execFileSync('git', ['-C', worktreePath, 'status', '--porcelain'], {
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => l.slice(3).trim());
  } catch {
    return []; // worktree disparu du disque (registre git périmé) — non bloquant
  }
}

/** mtime du `.jsonl` le plus récent sous `~/.claude/projects/<slug>` ; absent si aucun trouvé. */
function collectLastSessionMtime(worktreePath: string): number | undefined {
  const dir = join(homedir(), '.claude', 'projects', deriveSessionSlug(worktreePath));
  if (!existsSync(dir)) return undefined;
  const jsonlFiles = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  if (jsonlFiles.length === 0) return undefined;
  return Math.max(...jsonlFiles.map((f) => statSync(join(dir, f)).mtimeMs));
}

/** `gh pr list --head <branch>` best-effort : « — » si `gh` absent/échoue, sans erreur. */
function ghPrState(branch: string): string {
  if (!branch) return '—';
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--head', branch, '--json', 'number,state', '--limit', '1'],
      { encoding: 'utf8' },
    );
    const prs = JSON.parse(out) as { number: number; state: string }[];
    if (prs.length === 0) return '—';
    return `#${prs[0].number} ${prs[0].state}`;
  } catch {
    return '—';
  }
}

function collect(): CollectedInputs {
  const worktrees = collectWorktrees();
  const mergedBranches = collectMergedBranches();
  const uncommittedByPath: Record<string, string[]> = {};
  const lastSessionMtimeByPath: Record<string, number | undefined> = {};
  for (const wt of worktrees) {
    uncommittedByPath[wt.path] = collectUncommitted(wt.path);
    lastSessionMtimeByPath[wt.path] = collectLastSessionMtime(wt.path);
  }
  return { worktrees, mergedBranches, uncommittedByPath, lastSessionMtimeByPath };
}

function renderTable(data: ReturnType<typeof buildSessionsData>): void {
  console.log('En clair : état des worktrees — dossier, branche, session, PR, supprimable.\n');
  const header = ['dossier', 'branche', 'sujet', 'session', 'PR', 'supprimable'];
  console.log(header.join(' · '));
  for (const row of data.rows) {
    const shortPath = row.path.split('/').slice(-2).join('/');
    const pr = ghPrState(row.branch);
    const supprimable = row.deletable ? `oui (${row.deletableReason})` : `non (${row.deletableReason})`;
    console.log(
      [shortPath, row.branch || '(détaché)', row.subject, row.sessionActivity, pr, supprimable].join(
        ' · ',
      ),
    );
  }
}

function renderRecommendations(data: ReturnType<typeof buildSessionsData>): void {
  console.log('\nRecommandations');
  const deletable = data.rows.filter((r) => r.deletable);
  if (deletable.length === 0) {
    console.log('  Rien à nettoyer.');
  } else {
    console.log('  À nettoyer :');
    for (const row of deletable) {
      console.log(`    - ${row.path} (${row.deletableReason})`);
    }
  }

  const collisions = data.rows.filter((r) => r.collisionsWith.length > 0);
  if (collisions.length > 0) {
    console.log('\n  ⚠ Collisions :');
    for (const row of collisions) {
      for (const c of row.collisionsWith) {
        const files = c.files
          .slice()
          .sort((a, b) => Number(b.hot) - Number(a.hot))
          .map((f) => (f.hot ? `${f.file} [chaud]` : f.file))
          .join(', ');
        console.log(`    - ${row.path} ↔ ${c.path} : ${files}`);
      }
    }
  }
}

function main(): void {
  const cmd = process.argv[2];
  if (cmd !== 'state') {
    console.error('Usage : ezk-sessions state');
    process.exit(1);
  }
  const data = buildSessionsData(collect());
  renderTable(data);
  renderRecommendations(data);
  // POC: titre/archivée via ccd_session_mgmt = suite
}

main();
