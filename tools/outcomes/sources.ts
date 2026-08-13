/**
 * Fiche 0044 — port `RepoSource` + adaptateurs.
 *
 * PROVISOIRE tant qu'ADR-030 n'est pas ratifié : toutes les définitions
 * opérationnelles ci-dessous (« PR d'agent », classification de commit) sont
 * des seuils/heuristiques PO provisoires, pas des invariants gelés.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface CommitClassification {
  authorType: 'agent' | 'human';
  isMergeCommit: boolean;
  isRebase: boolean;
  isFormatting: boolean;
}

export interface PrCommit extends CommitClassification {
  sha: string;
  message: string;
  timestamp: string;
}

export interface MergedPr {
  number: number;
  branch: string;
  mergedAt: string;
  files: string[];
  ficheId?: string;
  commits: PrCommit[];
}

export interface DoneFiche {
  id: string;
  path: string;
  created: string;
  mergedAt?: string;
}

export interface SupervisionRun {
  id: string;
  conforms: boolean;
}

/** Port : source de données pour le mesureur (lecture seule). */
export interface RepoSource {
  countMergedAgentPrs(): number;
  listMergedAgentPrs(limit: number): MergedPr[];
  listDoneFiches(): DoneFiche[];
  listSupervisionRuns(): SupervisionRun[];
}

/**
 * PROVISOIRE (seuil PO) — « PR d'agent » = branche matchant ce motif.
 * Dans ce repo tout est produit par agents ; la convention de nommage de
 * branche (`claude/…`, `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`)
 * sert de proxy faute de mieux. À ajuster/justifier par ADR-030.
 */
export const AGENT_BRANCH_PATTERN = /^(claude|feat|fix|docs|chore|refactor)\//;

/**
 * PROVISOIRE — classification d'un message de commit, fonction PURE.
 * `authorType` s'appuie sur le trailer `Co-authored-by: Claude …` (convention
 * effective de ce repo, cf. instructions de commit) faute de signal git
 * fiable : tous les commits locaux partagent la même identité git (0176).
 */
export function classifyCommitMessage(message: string): CommitClassification {
  const firstLine = message.split('\n')[0] ?? '';
  const isMergeCommit = /^Merge (pull request|branch)/i.test(firstLine);
  const isRebase = /\brebase\b/i.test(message) || /^(fixup|squash)!/i.test(firstLine);
  const isFormatting =
    /^style(\(.+\))?:/i.test(firstLine) ||
    /^chore\(format\)/i.test(firstLine) ||
    /\bformat(ting)?\b/i.test(firstLine);
  const authorType: 'agent' | 'human' = /co-authored-by:\s*claude/i.test(message)
    ? 'agent'
    : 'human';
  return { authorType, isMergeCommit, isRebase, isFormatting };
}

/** Stub en mémoire, ZÉRO I/O — c'est celui qu'utilisent les tests. */
export class StubSource implements RepoSource {
  constructor(
    private readonly prs: MergedPr[] = [],
    private readonly fiches: DoneFiche[] = [],
    private readonly runs: SupervisionRun[] = [],
  ) {}

  countMergedAgentPrs(): number {
    return this.prs.length;
  }

  listMergedAgentPrs(limit: number): MergedPr[] {
    return this.prs.slice(0, limit);
  }

  listDoneFiches(): DoneFiche[] {
    return this.fiches;
  }

  listSupervisionRuns(): SupervisionRun[] {
    return this.runs;
  }
}

/**
 * Adaptateur réel : appelle `gh` et `git` via `execFileSync` (jamais un
 * shell string concaténé — anti-injection). Non couvert par les tests
 * unitaires (dépendance réseau/process) ; utilisé pour la preuve terrain.
 */
export class GhGitSource implements RepoSource {
  constructor(private readonly repoRoot: string) {}

  private gh(args: string[]): string {
    return execFileSync('gh', args, { cwd: this.repoRoot, encoding: 'utf8' });
  }

  private fetchMergedPrs(limit: number): MergedPr[] {
    const raw = this.gh([
      'pr',
      'list',
      '--state',
      'merged',
      '--limit',
      String(limit),
      '--json',
      'number,headRefName,mergedAt',
    ]);
    const list = JSON.parse(raw) as { number: number; headRefName: string; mergedAt: string }[];
    const agentPrs = list.filter((pr) => AGENT_BRANCH_PATTERN.test(pr.headRefName));

    return agentPrs.map((pr) => {
      const detailRaw = this.gh(['pr', 'view', String(pr.number), '--json', 'files,commits']);
      const detail = JSON.parse(detailRaw) as {
        files: { path: string }[];
        commits: { oid: string; messageHeadline: string; messageBody?: string }[];
      };
      const commits: PrCommit[] = detail.commits.map((c) => {
        const message = c.messageBody
          ? `${c.messageHeadline}\n${c.messageBody}`
          : c.messageHeadline;
        return { sha: c.oid, message, timestamp: pr.mergedAt, ...classifyCommitMessage(message) };
      });
      return {
        number: pr.number,
        branch: pr.headRefName,
        mergedAt: pr.mergedAt,
        files: detail.files.map((f) => f.path),
        commits,
      };
    });
  }

  countMergedAgentPrs(): number {
    return this.fetchMergedPrs(1000).length;
  }

  listMergedAgentPrs(limit: number): MergedPr[] {
    return this.fetchMergedPrs(limit);
  }

  listDoneFiches(): DoneFiche[] {
    const doneDir = join(this.repoRoot, 'features', 'done');
    if (!existsSync(doneDir)) return [];
    return readdirSync(doneDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const content = readFileSync(join(doneDir, f), 'utf8');
        const id = /^id:\s*(\S+)/m.exec(content)?.[1] ?? f;
        const created = /^created:\s*(\S+)/m.exec(content)?.[1] ?? '';
        return { id, path: join('features', 'done', f), created };
      });
  }

  listSupervisionRuns(): SupervisionRun[] {
    const runsDir = join(this.repoRoot, '.supervision', 'runs');
    if (!existsSync(runsDir)) return [];
    return readdirSync(runsDir).map((id) => ({ id, conforms: true }));
  }
}
