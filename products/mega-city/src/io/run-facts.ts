/**
 * run-facts — la coquille I/O du contexte de run et du RUN-REPORT (fiche 20260906122942607).
 *
 * Elle lit git et GitHub, et ne décide rien : les cœurs purs `core/run-context.ts` et
 * `core/run-report.ts` rendent le bloc. Aucune de ces lectures n'écrit dans le dépôt, hormis
 * `git fetch` (il met à jour les refs distantes) qui est exigé par la règle
 * development/run-freshness-origin-main : on compare à origin/main APRÈS un fetch, jamais au main local.
 *
 * Rien ne jette : un git absent, un remote injoignable, un `gh` non connecté deviennent des
 * faits « inconnus » que les cœurs savent dire.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { RunFacts } from '../core/run-context.js';
import { type HeadFacts, parsePrFacts, type PrFacts } from '../core/run-report.js';

function run(cmd: string, args: string[], cwd: string): string | null {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000 }).trim();
  } catch {
    return null;
  }
}

const count = (cwd: string, range: string): number => {
  const out = run('git', ['rev-list', '--count', range], cwd);
  const n = out === null ? Number.NaN : Number.parseInt(out, 10);
  return Number.isNaN(n) ? 0 : n;
};

export interface GitOptions {
  /** `git fetch origin <base>` avant de comparer (défaut : oui). */
  fetch?: boolean;
  /** La branche de base distante (défaut : main). */
  base?: string;
}

/** `git fetch` puis l'état d'origin/<base> : `none` sans remote, `unreachable` si le fetch échoue. */
function remoteState(cwd: string, o: GitOptions): { remote: RunFacts['remote']; ref: string } {
  const base = o.base ?? 'main';
  const ref = `origin/${base}`;
  const remotes = (run('git', ['remote'], cwd) ?? '').split('\n');
  if (!remotes.includes('origin')) return { remote: 'none', ref };
  if (o.fetch !== false && run('git', ['fetch', '--quiet', 'origin', base], cwd) === null) {
    return { remote: 'unreachable', ref };
  }
  return { remote: run('git', ['rev-parse', '--verify', '--quiet', ref], cwd) ? 'ok' : 'unreachable', ref };
}

/** Les faits du contexte de run : la base, l'arbre, le worktree. */
export function collectRunFacts(cwd: string, o: GitOptions = {}): RunFacts {
  const { remote, ref } = remoteState(cwd, o);
  const common = run('git', ['rev-parse', '--git-common-dir'], cwd);
  const gitDir = run('git', ['rev-parse', '--git-dir'], cwd);
  const secondary = common !== null && gitDir !== null && resolve(cwd, common) !== resolve(cwd, gitDir);
  const top = run('git', ['rev-parse', '--show-toplevel'], cwd) ?? cwd;
  const branch = run('git', ['symbolic-ref', '--short', '-q', 'HEAD'], cwd);
  const base: Pick<RunFacts, 'originMain'> =
    remote === 'ok'
      ? {
          originMain: {
            sha: run('git', ['rev-parse', '--short', ref], cwd) ?? '?',
            subject: run('git', ['log', '-1', '--format=%s', ref], cwd) ?? '',
          },
        }
      : {};
  return {
    remote,
    baseRef: ref,
    ...base,
    behind: remote === 'ok' ? count(cwd, `HEAD..${ref}`) : 0,
    ahead: remote === 'ok' ? count(cwd, `${ref}..HEAD`) : 0,
    clean: (run('git', ['status', '--porcelain'], cwd) ?? 'x') === '',
    fastForwardable: remote === 'ok' && run('git', ['merge-base', '--is-ancestor', 'HEAD', ref], cwd) !== null,
    worktree: { kind: secondary ? 'secondary' : 'primary', path: top, branch: branch ?? undefined },
  };
}

/** HEAD contre origin/<base> pour le RUN-REPORT. */
export function collectHeadFacts(cwd: string, o: GitOptions = {}): HeadFacts {
  const { remote, ref } = remoteState(cwd, o);
  const ok = remote === 'ok';
  return {
    head: run('git', ['rev-parse', '--short', 'HEAD'], cwd) ?? '?',
    branch: run('git', ['symbolic-ref', '--short', '-q', 'HEAD'], cwd),
    originMain: ok ? (run('git', ['rev-parse', '--short', ref], cwd) ?? null) : null,
    baseRef: ref,
    behind: ok ? count(cwd, `HEAD..${ref}`) : 0,
    ahead: ok ? count(cwd, `${ref}..HEAD`) : 0,
  };
}

/** Ce que GitHub dit d'une PR (`#123`), ou `null` si `gh` ne répond pas. */
export function fetchPrFacts(cwd: string, pr: string): PrFacts | null {
  const number = pr.replace(/^#/, '');
  const out = run('gh', ['pr', 'view', number, '--json', 'state,statusCheckRollup,reviews,comments'], cwd);
  if (out === null) return null;
  try {
    return parsePrFacts(JSON.parse(out));
  } catch {
    return null;
  }
}
