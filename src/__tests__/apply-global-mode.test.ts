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
});
