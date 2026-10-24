/**
 * `GitGhRepoSource.listMergedPrs` — garde github:false (fiche 20261013143324505, AC « github:false →
 * aucun gh »). On injecte le lanceur `gh` pour PROUVER qu'il n'est pas appelé quand la config coupe
 * GitHub, et qu'il l'est (et parse) quand elle l'autorise.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GitGhRepoSource } from '../repoSource.js';

function repoWith(configYaml?: string): string {
  const root = mkdtempSync(join(tmpdir(), 'reposrc-'));
  if (configYaml !== undefined) {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'config.yml'), configYaml, 'utf8');
  }
  return root;
}

describe('GitGhRepoSource.listMergedPrs — garde github:false', () => {
  it('github: false → ne lance JAMAIS gh et renvoie []', () => {
    let called = false;
    const src = new GitGhRepoSource((_root, _args) => {
      called = true;
      return '[]';
    });
    expect(src.listMergedPrs(repoWith('github: false\n'))).toEqual([]);
    expect(called).toBe(false); // la garde court-circuite avant tout appel réseau
  });

  it('config allumée (défaut) → interroge gh et classe les commits', () => {
    const prList = JSON.stringify([{ number: 7, headRefName: 'feat/x', mergedAt: '2026-10-01T00:00:00Z' }]);
    const prView = JSON.stringify({ commits: [{ messageHeadline: 'feat: x', messageBody: 'Co-Authored-By: Claude' }] });
    const src = new GitGhRepoSource((_root, args) => (args.includes('view') ? prView : prList));
    const out = src.listMergedPrs(repoWith()); // pas de .vectorz → capacités par défaut = ON
    expect(out).toHaveLength(1);
    expect(out[0]?.mergedAt).toBe('2026-10-01T00:00:00Z');
    expect(out[0]?.commits[0]?.authorType).toBe('agent');
  });
});
