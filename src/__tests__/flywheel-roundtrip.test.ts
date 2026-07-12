import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join, dirname } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { planCapture } from '../core/capture.js';
import { loadCatalog } from '../loaders/catalog.js';
import type { LearningEntry } from '../domain/model.js';

const DATE = '2026-07-07';

/**
 * Flywheel (ADR-0004, fiche 0037) : le round-trip capture→loadCatalog doit se refermer
 * pour LES 4 KINDS. Le chemin que `planCapture` calcule DOIT être celui que `loadCatalog`
 * relit — sinon un artefact capturé n'entre jamais au catalogue et n'est jamais bindé.
 *
 * On écrit l'artefact au chemin PLANIFIÉ (pas via applyCapture, pour rester hors git) puis
 * on charge le catalogue : c'est exactement la couture à prouver.
 */
describe('flywheel capture→loadCatalog — round-trip des 4 kinds (fiche 0037)', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'flywheel-roundtrip-'));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  /** Matérialise un artefact capturé au chemin que le cœur pur a planifié. */
  function materialize(target: string, kind: LearningEntry['kind']): string {
    const plan = planCapture(target, kind, `# ${kind} ${target}`, DATE);
    const absolute = join(rootDir, plan.artifact.path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, plan.artifact.content);
    return plan.artifact.path;
  }

  it('une SKILL capturée entre au catalogue (skills/<id>/SKILL.md, pas un fichier plat)', () => {
    const path = materialize('ezk-captured', 'skill');
    expect(path).toBe('skills/ezk-captured/SKILL.md'); // forme dossier — ce que lit loadSkills
    expect(loadCatalog(rootDir).skills.has('ezk-captured')).toBe(true);
  });

  it('une RULE à id slashé entre au catalogue (rules/<ns>/<name>.md, listFiles récursif)', () => {
    const path = materialize('clean-code/no-todo', 'rule');
    expect(path).toBe('rules/clean-code/no-todo.md');
    const rule = loadCatalog(rootDir).rules.get('clean-code/no-todo');
    expect(rule?.id).toBe('clean-code/no-todo');
    expect(rule?.kind).toBe('disposition');
  });

  it('une INTERACTION (rule kind:interaction) à id slashé entre au catalogue', () => {
    materialize('handoff/reviewer-before-merge', 'interaction');
    const rule = loadCatalog(rootDir).rules.get('handoff/reviewer-before-merge');
    expect(rule?.id).toBe('handoff/reviewer-before-merge');
    expect(rule?.kind).toBe('interaction');
  });

  it('un AGENT capturé entre au catalogue (agents/<id>.md plat)', () => {
    const path = materialize('ezk-captured-agent', 'agent');
    expect(path).toBe('agents/ezk-captured-agent.md');
    expect(loadCatalog(rootDir).agents.has('ezk-captured-agent')).toBe(true);
  });
});
