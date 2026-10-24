import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { MergedPrRecord, PrCommitRecord, RepoSource, ShippedFicheRecord } from '../ports/RepoSource.js';
import { githubCapabilities } from '../../loaders/project-config.js';

const AGENT_BRANCH_PATTERN = /^(claude|feat|fix|docs|chore|refactor)\//;

/** Lanceur `gh` injectable : permet de prouver, en test, que la garde github:false ne touche pas au réseau. */
export type GhRunner = (repoRoot: string, args: string[]) => string;
const defaultGhRunner: GhRunner = (repoRoot, args) =>
  execFileSync('gh', args, { cwd: repoRoot, encoding: 'utf8' });

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
  /** `runGh` est injectable pour tester la garde github:false sans toucher au réseau. */
  constructor(private readonly runGh: GhRunner = defaultGhRunner) {}

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
        const status = /^status:\s*"?([^"\s#]+)/m.exec(content)?.[1] ?? '';
        return { id, status, mergedAt: this.ficheMergedAt(repoRoot, relPath) };
      })
      // Vélocité = fiches réellement LIVRÉES. Une fiche `superseded` (clôturée sans
      // livraison) vit aussi dans done/ mais ne compte pas — idem futurs `merged`/`split`.
      .filter((r) => r.status === 'shipped')
      .map((r) => ({ id: r.id, mergedAt: r.mergedAt }));
  }

  listMergedPrs(repoRoot: string, sinceIso?: string): MergedPrRecord[] {
    // Projet GitHub coupé (github:false / pr:false) → aucun appel gh (fiche 20261013143324505, AC github:false).
    if (!githubCapabilities(repoRoot).pr) return [];
    const args = ['pr', 'list', '--state', 'merged', '--limit', '200', '--json', 'number,headRefName,mergedAt'];
    // Borne la requête à la fenêtre du sprint plutôt que tout l'historique (fiche 20261013143324505, AC fenêtre).
    // Grain jour (large côté bas) ; le filtre précis par timestamp reste en aval (summarizePrRetouches).
    if (sinceIso) args.push('--search', `merged:>=${sinceIso.slice(0, 10)}`);
    let raw: string;
    try {
      raw = this.runGh(repoRoot, args);
    } catch {
      return [];
    }
    const list = JSON.parse(raw) as { number: number; headRefName: string; mergedAt: string }[];
    const agentPrs = list.filter((pr) => AGENT_BRANCH_PATTERN.test(pr.headRefName));
    return agentPrs.map((pr) => {
      let detail: { commits: { messageHeadline: string; messageBody?: string }[] } = { commits: [] };
      try {
        const detailRaw = this.runGh(repoRoot, ['pr', 'view', String(pr.number), '--json', 'commits']);
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
