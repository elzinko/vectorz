import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { MergedPrRecord, PrCommitRecord, RepoSource, ShippedFicheRecord } from '../ports/RepoSource.js';

const AGENT_BRANCH_PATTERN = /^(claude|feat|fix|docs|chore|refactor)\//;

/** Copie de `tools/outcomes/sources.ts#classifyCommitMessage` (même heuristique PO provisoire). */
function classifyCommitMessage(message: string): PrCommitRecord {
  const firstLine = message.split('\n')[0] ?? '';
  const isMergeCommit = /^Merge (pull request|branch)/i.test(firstLine);
  const isRebase = /\brebase\b/i.test(message) || /^(fixup|squash)!/i.test(firstLine);
  const isFormatting =
    /^(style|format)(\(.+\))?:/i.test(firstLine) ||
    /^chore\(format\)/i.test(firstLine) ||
    /\b(run|apply|auto)[ -]?format(ting)?\b/i.test(firstLine) ||
    /\b(biome|prettier)\b/i.test(firstLine);
  const authorType: 'agent' | 'unknown' = /co-authored-by:\s*claude/i.test(message) ? 'agent' : 'unknown';
  return { authorType, isMergeCommit, isRebase, isFormatting };
}

/**
 * Adaptateur réel : git (fiches `features/done/`) + `gh` (PR mergées). Même
 * approche que `tools/outcomes/sources.ts#GhGitSource` — NON couvert par les
 * tests unitaires (dépendance process/réseau), utilisé côté CLI seulement.
 */
export class GitGhRepoSource implements RepoSource {
  private git(repoRoot: string, args: string[]): string {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  }

  /** Date d'ajout à `features/done/` (proxy du ship) — cf. GhGitSource#ficheMergedAt. */
  private ficheMergedAt(repoRoot: string, relPath: string): string | undefined {
    const added = this.git(repoRoot, ['log', '--diff-filter=A', '--format=%cI', '--', relPath])
      .split('\n')
      .filter(Boolean);
    const shipDate = added.at(-1) ?? this.git(repoRoot, ['log', '-1', '--format=%cI', '--', relPath]);
    return shipDate || undefined;
  }

  listShippedFiches(repoRoot: string): ShippedFicheRecord[] {
    const doneDir = join(repoRoot, 'features', 'done');
    if (!existsSync(doneDir)) return [];
    return readdirSync(doneDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const relPath = join('features', 'done', f);
        const content = readFileSync(join(doneDir, f), 'utf8');
        const id = /^id:\s*"?(\S+?)"?\s*$/m.exec(content)?.[1] ?? f;
        return { id, mergedAt: this.ficheMergedAt(repoRoot, relPath) };
      });
  }

  listMergedPrs(repoRoot: string): MergedPrRecord[] {
    let raw: string;
    try {
      raw = execFileSync(
        'gh',
        ['pr', 'list', '--state', 'merged', '--limit', '200', '--json', 'number,headRefName,mergedAt'],
        { cwd: repoRoot, encoding: 'utf8' },
      );
    } catch {
      return [];
    }
    const list = JSON.parse(raw) as { number: number; headRefName: string; mergedAt: string }[];
    const agentPrs = list.filter((pr) => AGENT_BRANCH_PATTERN.test(pr.headRefName));
    return agentPrs.map((pr) => {
      let detail: { commits: { messageHeadline: string; messageBody?: string }[] } = { commits: [] };
      try {
        const detailRaw = execFileSync('gh', ['pr', 'view', String(pr.number), '--json', 'commits'], {
          cwd: repoRoot,
          encoding: 'utf8',
        });
        detail = JSON.parse(detailRaw);
      } catch {
        // PR détaillée indisponible (permissions, réseau) → commits vides, PR quand même comptée.
      }
      const commits = detail.commits.map((c) =>
        classifyCommitMessage(c.messageBody ? `${c.messageHeadline}\n${c.messageBody}` : c.messageHeadline),
      );
      return { mergedAt: pr.mergedAt, commits };
    });
  }
}
