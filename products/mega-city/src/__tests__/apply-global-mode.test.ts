import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  lstatSync,
  realpathSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { applyGlobalPlan } from '../io/apply.js';
import type { WritePlan } from '../domain/plan.js';

/**
 * Fiche 0018 — mode `link` vs `copy` du cap global.
 * Racine (`~/.claude` factice) ET catalogue (repo mega-city factice) en temp dir.
 * Jamais le vrai ~/.claude, jamais le vrai repo. Aucun LLM, aucune commande git.
 */
describe('applyGlobalPlan — mode link vs copy (fiche 0018)', () => {
  let root: string; // ~/.claude factice
  let catalogRoot: string; // repo mega-city factice (source des skills)

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lawgiver-mode-root-'));
    catalogRoot = mkdtempSync(join(tmpdir(), 'lawgiver-mode-catalog-'));
    // Le catalogue contient la source réelle du skill.
    const src = join(catalogRoot, 'skills/ezk-commits');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'SKILL.md'), '# ezk-commits (source catalogue)\n');
    // … et celle d'un agent (fichier simple).
    mkdirSync(join(catalogRoot, 'agents'), { recursive: true });
    writeFileSync(join(catalogRoot, 'agents/ezk-architect.md'), '# ezk-architect (source catalogue)\n');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(catalogRoot, { recursive: true, force: true });
  });

  const planWith = (...skillIds: string[]): WritePlan => ({
    files: skillIds.map((id) => ({
      path: `skills/${id}/SKILL.md`,
      content: `# ${id} (contenu figé du plan)\n`,
    })),
    hooks: [],
  });

  const planWithAgents = (...agentIds: string[]): WritePlan => ({
    files: agentIds.map((id) => ({
      path: `agents/${id}.md`,
      content: `# ${id} (contenu figé du plan)\n`,
    })),
    hooks: [],
  });

  it('mode copy (défaut) : écrit un fichier figé, PAS un symlink', () => {
    applyGlobalPlan(planWith('ezk-commits'), root);
    const skillDir = join(root, 'skills/ezk-commits');
    expect(lstatSync(skillDir).isSymbolicLink()).toBe(false);
    expect(lstatSync(join(skillDir, 'SKILL.md')).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(skillDir, 'SKILL.md'), 'utf8')).toContain('contenu figé du plan');
  });

  it('mode link : crée un symlink du skill-dir vers la source du catalogue', () => {
    applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot });
    const skillDir = join(root, 'skills/ezk-commits');
    expect(lstatSync(skillDir).isSymbolicLink()).toBe(true);
    // la cible du lien pointe vers la source du catalogue
    expect(realpathSync(skillDir)).toBe(realpathSync(join(catalogRoot, 'skills/ezk-commits')));
    // et à travers le lien, on lit le contenu SOURCE (live-update), pas le contenu du plan
    expect(readFileSync(join(skillDir, 'SKILL.md'), 'utf8')).toContain('source catalogue');
  });

  it('mode link : idempotent — re-appliquer ne lève pas et garde le symlink', () => {
    applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot });
    expect(() =>
      applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot }),
    ).not.toThrow();
    const skillDir = join(root, 'skills/ezk-commits');
    expect(lstatSync(skillDir).isSymbolicLink()).toBe(true);
    expect(realpathSync(skillDir)).toBe(realpathSync(join(catalogRoot, 'skills/ezk-commits')));
  });

  it('mode link : non-destructif — refuse un vrai dossier utilisateur étranger', () => {
    const collide = join(root, 'skills/ezk-commits');
    mkdirSync(collide, { recursive: true });
    writeFileSync(join(collide, 'notes-perso.txt'), 'NE PAS TOUCHER');

    expect(() =>
      applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot }),
    ).toThrow(/non-destructif|refus/i);

    // Rien n'a été touché : toujours un vrai dossier, fichier intact.
    expect(lstatSync(collide).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(collide, 'notes-perso.txt'), 'utf8')).toBe('NE PAS TOUCHER');
  });

  it('mode link : remplace notre propre symlink préexistant (idempotent après re-lien)', () => {
    applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot });
    // re-bind link : notre symlink est remplacé sans erreur.
    expect(() =>
      applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot }),
    ).not.toThrow();
    expect(lstatSync(join(root, 'skills/ezk-commits')).isSymbolicLink()).toBe(true);
  });

  it('bascule copy → link : remplace notre skill-dir géré par un symlink', () => {
    applyGlobalPlan(planWith('ezk-commits'), root); // copy d'abord (dir géré)
    expect(lstatSync(join(root, 'skills/ezk-commits')).isSymbolicLink()).toBe(false);
    applyGlobalPlan(planWith('ezk-commits'), root, { mode: 'link', catalogRoot });
    expect(lstatSync(join(root, 'skills/ezk-commits')).isSymbolicLink()).toBe(true);
  });

  // ── Assets de dossier (ADR-0027) ──────────────────────────────────────────
  it('mode link : les assets viennent à travers le lien du dossier (un seul symlink)', () => {
    // Source catalogue : SKILL.md + un asset réel.
    writeFileSync(join(catalogRoot, 'skills/ezk-commits/note.md'), 'asset source\n');
    const plan: WritePlan = {
      files: [
        { path: 'skills/ezk-commits/SKILL.md', content: '# figé\n' },
        { path: 'skills/ezk-commits/note.md', content: '# figé note\n' },
      ],
      hooks: [],
    };
    applyGlobalPlan(plan, root, { mode: 'link', catalogRoot });
    const skillDir = join(root, 'skills/ezk-commits');
    expect(lstatSync(skillDir).isSymbolicLink()).toBe(true);
    // À travers le lien on lit le contenu SOURCE (live-update), pas celui du plan.
    expect(readFileSync(join(skillDir, 'note.md'), 'utf8')).toBe('asset source\n');
  });

  it('bascule link → copy : un asset trié AVANT SKILL.md n’écrit pas à travers le lien (source protégée)', () => {
    // 'approaches/x.md' < 'SKILL.md' en localeCompare → l'asset serait traité en premier ;
    // sans le retrait préalable du symlink, writeRaw écrirait dans la SOURCE du catalogue.
    mkdirSync(join(catalogRoot, 'skills/ezk-commits/approaches'), { recursive: true });
    const source = join(catalogRoot, 'skills/ezk-commits/approaches/x.md');
    writeFileSync(source, 'SOURCE INTACTE\n');
    const plan: WritePlan = {
      files: [
        { path: 'skills/ezk-commits/approaches/x.md', content: 'CONTENU FIGÉ\n' },
        { path: 'skills/ezk-commits/SKILL.md', content: '# figé\n' },
      ].sort((a, b) => a.path.localeCompare(b.path)),
      hooks: [],
    };
    applyGlobalPlan(plan, root, { mode: 'link', catalogRoot }); // lien d'abord
    applyGlobalPlan(plan, root); // bascule copy
    // La source du catalogue n'a PAS été écrite à travers l'ancien lien.
    expect(readFileSync(source, 'utf8')).toBe('SOURCE INTACTE\n');
    // La cible copie porte bien le contenu figé, en dossier réel (plus un lien).
    const target = join(root, 'skills/ezk-commits');
    expect(lstatSync(target).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(target, 'approaches/x.md'), 'utf8')).toBe('CONTENU FIGÉ\n');
  });

  // — Agents (fiche 0025) : le mode link doit AUSSI symlinker les agents, pas seulement
  //   les skills, pour que ~/.claude/agents/ pointe vers mega-city au switchover.
  it('mode link : crée un symlink de l’agent-fichier vers la source du catalogue', () => {
    applyGlobalPlan(planWithAgents('ezk-architect'), root, { mode: 'link', catalogRoot });
    const agentFile = join(root, 'agents/ezk-architect.md');
    expect(lstatSync(agentFile).isSymbolicLink()).toBe(true);
    expect(realpathSync(agentFile)).toBe(realpathSync(join(catalogRoot, 'agents/ezk-architect.md')));
    // et à travers le lien, on lit le contenu SOURCE (live-update), pas celui du plan
    expect(readFileSync(agentFile, 'utf8')).toContain('source catalogue');
  });

  it('mode copy (défaut) : écrit l’agent en fichier figé, PAS un symlink', () => {
    applyGlobalPlan(planWithAgents('ezk-architect'), root);
    const agentFile = join(root, 'agents/ezk-architect.md');
    expect(lstatSync(agentFile).isSymbolicLink()).toBe(false);
    expect(readFileSync(agentFile, 'utf8')).toContain('contenu figé du plan');
  });

  it('mode link : idempotent — re-appliquer les agents ne lève pas et garde le symlink', () => {
    applyGlobalPlan(planWithAgents('ezk-architect'), root, { mode: 'link', catalogRoot });
    expect(() =>
      applyGlobalPlan(planWithAgents('ezk-architect'), root, { mode: 'link', catalogRoot }),
    ).not.toThrow();
    expect(lstatSync(join(root, 'agents/ezk-architect.md')).isSymbolicLink()).toBe(true);
  });

  it('mode link : bascule un ancien symlink d’agent (claude-skills → mega-city)', () => {
    // Simule l'état pré-switchover : ~/.claude/agents/<id>.md pointe vers un AUTRE repo.
    const foreign = mkdtempSync(join(tmpdir(), 'lawgiver-foreign-'));
    mkdirSync(join(foreign, 'agents'), { recursive: true });
    writeFileSync(join(foreign, 'agents/ezk-architect.md'), '# ancienne source (claude-skills)\n');
    mkdirSync(join(root, 'agents'), { recursive: true });
    symlinkSync(join(foreign, 'agents/ezk-architect.md'), join(root, 'agents/ezk-architect.md'));

    applyGlobalPlan(planWithAgents('ezk-architect'), root, { mode: 'link', catalogRoot });

    const agentFile = join(root, 'agents/ezk-architect.md');
    expect(lstatSync(agentFile).isSymbolicLink()).toBe(true);
    // repointé vers le catalogue mega-city, plus vers l'ancien repo.
    expect(realpathSync(agentFile)).toBe(realpathSync(join(catalogRoot, 'agents/ezk-architect.md')));
    rmSync(foreign, { recursive: true, force: true });
  });

  it('mode link : non-destructif — refuse un vrai fichier agent utilisateur', () => {
    mkdirSync(join(root, 'agents'), { recursive: true });
    const collide = join(root, 'agents/ezk-architect.md');
    writeFileSync(collide, 'NE PAS TOUCHER');

    expect(() =>
      applyGlobalPlan(planWithAgents('ezk-architect'), root, { mode: 'link', catalogRoot }),
    ).toThrow(/non-destructif|refus/i);

    // Rien n'a été touché : toujours un vrai fichier, contenu intact.
    expect(lstatSync(collide).isSymbolicLink()).toBe(false);
    expect(readFileSync(collide, 'utf8')).toBe('NE PAS TOUCHER');
  });
});
