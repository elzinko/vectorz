import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
/**
 * Retrait GARDÉ des anciens noms au re-bind (fiche 20260813131737962, volet binder ;
 * DURCI le 2026-08-24 après revue adverse). Invariant de sûreté : on ne fait JAMAIS de
 * `rm -rf` sur une entrée RÉELLE — seulement sur NOS symlinks (mode `--link`). Un
 * dossier utilisateur homonyme du nom qu'on vient de libérer NE DOIT JAMAIS être détruit,
 * même s'il ne contient qu'un `SKILL.md` (le trou de la V1). Racine FACTICE — jamais le
 * vrai ~/.claude.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WritePlan } from '../domain/plan.js';
import { applyGlobalPlan } from '../io/apply.js';

let root: string; // ~/.claude factice
let catalogRoot: string; // catalogue factice (source des skills, mode link)

const planWith = (skillId: string): WritePlan => ({
  files: [{ path: `skills/${skillId}/SKILL.md`, content: `---\nname: ${skillId}\n---\ncorps` }],
  hooks: [],
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'lawgiver-renames-root-'));
  catalogRoot = mkdtempSync(join(tmpdir(), 'lawgiver-renames-cat-'));
  mkdirSync(join(catalogRoot, 'skills', 'nouveau'), { recursive: true });
  writeFileSync(join(catalogRoot, 'skills', 'nouveau', 'SKILL.md'), '---\nname: nouveau\n---\n');
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(catalogRoot, { recursive: true, force: true });
});

describe('applyGlobalPlan — retrait gardé des anciens noms (renames.yml)', () => {
  const RENAME = { ancien: 'ancien', nouveau: 'nouveau', kind: 'skill' as const };

  it('mode link : le SYMLINK de l’ancien nom est retiré (le cas réel de l’utilisateur)', () => {
    mkdirSync(join(root, 'skills'), { recursive: true });
    symlinkSync(join(catalogRoot, 'skills', 'nouveau'), join(root, 'skills', 'ancien'));
    const report = applyGlobalPlan(planWith('nouveau'), root, {
      mode: 'link',
      catalogRoot,
      renames: [RENAME],
    });
    expect(existsSync(join(root, 'skills', 'ancien'))).toBe(false); // symlink nettoyé
    expect(report.retires).toEqual(['skills/ancien']);
    expect(report.residus).toEqual([]);
  });

  it('SÛRETÉ — un dossier RÉEL de l’ancien nom n’est JAMAIS supprimé (mode copy)', () => {
    applyGlobalPlan(planWith('ancien'), root); // le monde d'avant le rename (copie réelle)
    expect(existsSync(join(root, 'skills', 'ancien', 'SKILL.md'))).toBe(true);
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'ancien'))).toBe(true); // PRÉSERVÉ, pas rm -rf
    expect(report.residus).toEqual(['skills/ancien']); // signalé pour retrait manuel
    expect(report.retires).toEqual([]);
  });

  it('SÛRETÉ (le trou de la V1) — un homonyme utilisateur ne contenant QUE SKILL.md survit', () => {
    // L'utilisateur a créé SON propre skill au nom que la méthode vient de libérer.
    mkdirSync(join(root, 'skills', 'ancien'), { recursive: true });
    writeFileSync(join(root, 'skills', 'ancien', 'SKILL.md'), '# mon skill à moi');
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'ancien', 'SKILL.md'))).toBe(true); // INTACT
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
    applyGlobalPlan(planWith('omis-expres'), root);
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(existsSync(join(root, 'skills', 'omis-expres', 'SKILL.md'))).toBe(true); // intact
    expect(report.retires).toEqual([]); // 'ancien' absent → rien
    expect(report.residus).toEqual([]);
  });

  it('ancien nom absent → ni retiré ni résidu', () => {
    const report = applyGlobalPlan(planWith('nouveau'), root, { catalogRoot, renames: [RENAME] });
    expect(report.retires).toEqual([]);
    expect(report.residus).toEqual([]);
  });
});
