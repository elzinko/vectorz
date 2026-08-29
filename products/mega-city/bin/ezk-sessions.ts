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

/**
 * `git status --porcelain -z` DANS le worktree — fichiers non commités, chemins relatifs.
 * `-z` = séparateur NUL, chemins littéraux (pas de C-quoting sur espaces/unicode). Un
 * renommage (`R`/`C`) occupe DEUX champs NUL (nouveau puis ancien) : on compte les deux,
 * car les deux chemins sont « touchés » pour la détection de collision.
 */
function collectUncommitted(worktreePath: string): string[] {
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
function collectLastSessionMtime(worktreePath: string): number | undefined {
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
function collectPrStates(): Record<string, string> {
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

function collect(): CollectedInputs {
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

function renderTable(data: ReturnType<typeof buildSessionsData>): void {
  console.log('En clair : état des worktrees — dossier, branche, session, PR, supprimable.\n');
  const header = ['dossier', 'branche', 'sujet', 'session', 'PR', 'supprimable'];
  console.log(header.join(' · '));
  for (const row of data.rows) {
    const shortPath = row.path.split('/').slice(-2).join('/');
    const supprimable = row.deletable ? `oui (${row.deletableReason})` : `non (${row.deletableReason})`;
    console.log(
      [shortPath, row.branch || '(détaché)', row.subject, row.sessionActivity, row.pr, supprimable].join(
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
