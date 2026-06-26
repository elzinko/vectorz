import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';
import { planCapture } from '../core/capture.js';

const DATE = '2026-06-26';

describe('planCapture (pur, sans disque ni git) — ADR-0004', () => {
  it('kind=rule → rules/<id>.md avec frontmatter kind: disposition', () => {
    const plan = planCapture('clean-code/no-todo', 'rule', '# corps', DATE);
    expect(plan.artifact.path).toBe('rules/clean-code/no-todo.md');
    expect(matter(plan.artifact.content).data.kind).toBe('disposition');
  });

  it('kind=interaction → rules/<id>.md avec frontmatter kind: interaction (ADR-0002)', () => {
    const plan = planCapture('handoff/qa-to-dev', 'interaction', '# corps', DATE);
    expect(plan.artifact.path).toBe('rules/handoff/qa-to-dev.md');
    expect(matter(plan.artifact.content).data.kind).toBe('interaction');
  });

  it('kind=skill → skills/<id>.md (pas de frontmatter kind)', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    expect(plan.artifact.path).toBe('skills/ezk-bisect.md');
  });

  it('kind=agent → agents/<id>.md', () => {
    const plan = planCapture('ezk-archivist', 'agent', '# rôle', DATE);
    expect(plan.artifact.path).toBe('agents/ezk-archivist.md');
  });

  it("propage l'id en frontmatter et le markdown rédigé en corps", () => {
    const plan = planCapture('clean-code/no-todo', 'rule', 'pas de TODO masqué', DATE);
    const parsed = matter(plan.artifact.content);
    expect(parsed.data.id).toBe('clean-code/no-todo');
    expect(parsed.content).toContain('pas de TODO masqué');
  });

  it('journalLine au format | date | cible | type | résumé | commit |', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    const cells = plan.journalLine.split('|').map((c) => c.trim());
    // ['', date, cible, type, résumé, commit, '']
    expect(cells[1]).toBe(DATE);
    expect(cells[2]).toBe('ezk-bisect');
    expect(cells[3]).toBe('skill');
    expect(cells[5]).toBe(''); // colonne commit vide au POC (ADR-0004 §4)
  });

  it('commitMessage est conventional : chore(capture): <kind> <id>', () => {
    const plan = planCapture('ezk-bisect', 'skill', '# playbook', DATE);
    expect(plan.commitMessage).toBe('chore(capture): skill ezk-bisect');
  });

  it('rejette un id qui tente un traversal de chemin (assertSafeId)', () => {
    expect(() => planCapture('../escape', 'rule', '# x', DATE)).toThrow(/non sûr/i);
  });

  it('déterministe : mêmes args → plan identique (aucun Date.now/aléatoire)', () => {
    const a = planCapture('clean-code/no-todo', 'rule', '# corps', DATE);
    const b = planCapture('clean-code/no-todo', 'rule', '# corps', DATE);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
