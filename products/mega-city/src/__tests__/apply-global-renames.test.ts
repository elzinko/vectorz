import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
/**
 * Retrait GARDÉ des anciens noms au re-bind (fiche 20260813131737962, volet binder,
 * livré 2026-08-23 — le débloqueur de tout renommage, lot 3 du plan « trois étages »).
 *
 * Le scénario cible : bind → rename du catalogue → re-bind AVEC le registre renames
 * ⇒ l'ANCIEN nom est retiré ; les entrées ÉTRANGÈRES (perso utilisateur) et les skills
 * simplement OMIS du profil sont préservés. Racine FACTICE — jamais le vrai ~/.claude.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WritePlan } from '../domain/plan.js';
import { applyGlobalPlan } from '../io/apply.js';

let root: string; // ~/.claude factice
let catalogRoot: string; // catalogue factice (source des skills)

const planWith = (skillId: string): WritePlan => ({
  files: [{ path: `skills/${skillId}/SKILL.md`, content: `---\nname: ${skillId}\n---\ncorps` }],
  hooks: [],
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'lawgiver-renames-root-'));
  catalogRoot = mkdtempSync(join(tmpdir(), 'lawgiver-renames-cat-'));
  // Le catalogue APRÈS rename : skills/nouveau/ existe (proxy d'appartenance du retrait).
  mkdirSync(join(catalogRoot, 'skills', 'nouveau'), { recursive: true });
  writeFileSync(join(catalogRoot, 'skills', 'nouveau', 'SKILL.md'), '---\nname: nouveau\n---\n');
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(catalogRoot, { recursive: true, force: true });
});

describe('applyGlobalPlan — retrait gardé des anciens noms (renames.yml)', () => {
  const RENAME = { ancien: 'ancien', nouveau: 'nouveau', kind: 'skill' as const };

  it('bind → rename → re-bind : le dossier de l’ANCIEN nom est retiré (copy)', () => {
    applyGlobalPlan(planWith('ancien'), root); // le monde d'avant le rename
    expect(existsSync(join(root, 'skills', 'ancien', 'SKILL.md'))).toBe(true);
    const report = applyGlobalPlan(planWith('nouveau'), root, {
      catalogRoot,
      renames: [RENAME],
    });
    expect(existsSync(join(root, 'skills', 'ancien'))).toBe(false); // nettoyé
    expect(existsSync(join(root, 'skills', 'nouveau', 'SKILL.md'))).toBe(true);
    expect(report.retires).toEqual(['skills/ancien']);
    expect(report.residus).toEqual([]);
  });

  it('un symlink de l’ancien nom (mode link) est retiré', () => {
    mkdirSync(join(root, 'skills'), { recursive: true });
    symlinkSync(join(catalogRoot, 'skills', 'nouveau'), join(root, 'skills', 'ancien'));
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'ancien'))).toBe(false);
    expect(report.retires).toEqual(['skills/ancien']);
  });

  it('un dossier utilisateur HOMONYME (contenu étranger) est PRÉSERVÉ et signalé', () => {
    mkdirSync(join(root, 'skills', 'ancien'), { recursive: true });
    writeFileSync(join(root, 'skills', 'ancien', 'SKILL.md'), 'perso');
    writeFileSync(join(root, 'skills', 'ancien', 'mes-notes.txt'), 'à moi'); // étranger
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'ancien', 'mes-notes.txt'))).toBe(true); // intact
    expect(report.residus).toEqual(['skills/ancien']);
    expect(report.retires).toEqual([]);
  });

  it('un agent-FICHIER réel de l’ancien nom n’est JAMAIS retiré ; un symlink l’est', () => {
    mkdirSync(join(root, 'agents'), { recursive: true });
    writeFileSync(join(root, 'agents', 'vieux.md'), 'perso'); // vrai fichier
    symlinkSync(join(catalogRoot, 'skills', 'nouveau', 'SKILL.md'), join(root, 'agents', 'lien.md'));
    const report = applyGlobalPlan(planWith('nouveau'), root, {
      catalogRoot,
      renames: [
        { ancien: 'vieux', nouveau: 'neuf', kind: 'agent' },
        { ancien: 'lien', nouveau: 'neuf', kind: 'agent' },
      ],
    });
    expect(existsSync(join(root, 'agents', 'vieux.md'))).toBe(true); // préservé
    expect(existsSync(join(root, 'agents', 'lien.md'))).toBe(false); // symlink retiré
    expect(report.residus).toEqual(['agents/vieux.md']);
    expect(report.retires).toEqual(['agents/lien.md']);
  });

  it('JAMAIS de purge hors-registre : un skill omis du profil reste en place', () => {
    applyGlobalPlan(planWith('omis-expres'), root); // installé par un bind précédent (ex. global)
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'omis-expres', 'SKILL.md'))).toBe(true); // intact
    expect(report.retires).toEqual([]); // 'ancien' n'existait pas → rien
  });

  it('sans catalogRoot, un dossier réel de l’ancien nom est refusé prudemment (résidu)', () => {
    applyGlobalPlan(planWith('ancien'), root);
    const report = applyGlobalPlan(planWith('nouveau'), root, { renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'ancien'))).toBe(true); // pas de preuve → pas de retrait
    expect(report.residus).toEqual(['skills/ancien']);
  });
});
