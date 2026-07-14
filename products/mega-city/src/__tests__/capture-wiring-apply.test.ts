import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import { planCapture } from '../core/capture.js';
import { applyCapture } from '../io/capture.js';

const DATE = '2026-07-02';

const JOURNAL_FIXTURE = `# Journal d'apprentissages (append-only)

| date | cible | type | résumé | commit |
|------|-------|------|--------|--------|
| 2026-06-25 | (exemple) | — | starter initialisé | — |
`;

const AGENT_FIXTURE = `---
id: ezk-reviewer
competences:
  - ezk-ci
interactions:
  - clean-code/no-dead-code
---

# ezk-reviewer

Reviewer senior.
`;

function initToyRepo(): string {
  const rootDir = mkdtempSync(join(tmpdir(), 'capture-wiring-'));
  execFileSync('git', ['init', '--quiet'], { cwd: rootDir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: rootDir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: rootDir });
  mkdirSync(join(rootDir, 'journal'), { recursive: true });
  writeFileSync(join(rootDir, 'journal', 'learnings.md'), JOURNAL_FIXTURE);
  mkdirSync(join(rootDir, 'agents'), { recursive: true });
  writeFileSync(join(rootDir, 'agents', 'ezk-reviewer.md'), AGENT_FIXTURE);
  execFileSync('git', ['add', '.'], { cwd: rootDir });
  execFileSync('git', ['commit', '--quiet', '-m', 'chore: seed'], { cwd: rootDir });
  return rootDir;
}

function readAgentList(rootDir: string, field: string): string[] {
  const raw = readFileSync(join(rootDir, 'agents', 'ezk-reviewer.md'), 'utf8');
  return matter(raw).data[field] as string[];
}

describe('applyCapture — câblage frontmatter agent (fiche 0013)', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = initToyRepo();
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("interaction --for ezk-reviewer → interactions[] contient le nouvel id (DoD 1)", () => {
    const plan = planCapture('handoff/qa-to-dev', 'interaction', '# corps', DATE, '', 'ezk-reviewer');
    applyCapture(plan, rootDir);

    const interactions = readAgentList(rootDir, 'interactions');
    expect(interactions).toContain('handoff/qa-to-dev');
    // l'existant est préservé
    expect(interactions).toContain('clean-code/no-dead-code');
  });

  it('idempotent : capturer deux fois n\'ajoute PAS l\'id en double (DoD 2)', () => {
    const plan = planCapture('handoff/qa-to-dev', 'interaction', '# corps', DATE, '', 'ezk-reviewer');
    applyCapture(plan, rootDir);
    applyCapture(plan, rootDir);

    const interactions = readAgentList(rootDir, 'interactions');
    const occurrences = interactions.filter((id) => id === 'handoff/qa-to-dev').length;
    expect(occurrences).toBe(1);
  });

  it('kind=skill → append dans competences[] (DoD 3)', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE, '', 'ezk-reviewer');
    applyCapture(plan, rootDir);

    const competences = readAgentList(rootDir, 'competences');
    expect(competences).toContain('ezk-bisect');
    expect(competences).toContain('ezk-ci');
  });

  it("le fichier agent modifié est dans le commit de capture (rien laissé non-stagé)", () => {
    const plan = planCapture('handoff/qa-to-dev', 'interaction', '# corps', DATE, '', 'ezk-reviewer');
    applyCapture(plan, rootDir);

    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
    expect(status).toBe('');

    const files = execFileSync('git', ['show', '--name-only', '--pretty=format:', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
    });
    expect(files).toContain('agents/ezk-reviewer.md');
    expect(files).toContain('rules/handoff/qa-to-dev.md');
    expect(files).toContain('journal/learnings.md');
  });

  it('sans câblage (pas de --for) → le fichier agent est intact', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    applyCapture(plan, rootDir);

    expect(readAgentList(rootDir, 'competences')).toEqual(['ezk-ci']);
  });
});
