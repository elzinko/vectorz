/**
 * La loi du cap global sur le disque (fiche 20260903134909124, ADR-0056) : `applyGlobalPlan`
 * écrit `rules/iamthelaw.md`, dans les deux modes, et NE TOUCHE JAMAIS un fichier du même nom
 * qui n'est pas à lawgiver. Racine FACTICE (dossier jetable) — jamais le vrai ~/.claude.
 */
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { globalLawContent } from '../caps/law-content.js';
import { GLOBAL_LAW_PATH } from '../domain/law-file.js';
import type { Rule } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { applyGlobalPlan } from '../io/apply.js';

const rule: Rule = {
  id: 'clean-code/no-dead-code',
  kind: 'disposition',
  level: 'MUST',
  content: 'Pas de code mort.',
};

// `withAgent: false` : rejouer un bind en COPIE sur un agent déjà copié est refusé par la garde
// existante (fiche 20260813095351680, hors de ce lot) ; l'idempotence se prouve sans agent.
const planWith = (law: string, withAgent = true): WritePlan => ({
  hooks: [],
  files: [
    ...(withAgent ? [{ path: 'agents/ezk-a.md', content: '# agent a\n' }] : []),
    { path: GLOBAL_LAW_PATH, content: law },
    { path: 'skills/ezk-s/SKILL.md', content: '# skill s\n' },
  ],
});

describe('applyGlobalPlan — la loi', () => {
  let root: string;
  let catalogRoot: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'law-apply-'));
    catalogRoot = mkdtempSync(join(tmpdir(), 'law-catalog-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(catalogRoot, { recursive: true, force: true });
  });

  const law = globalLawContent([rule]);

  it('écrit rules/iamthelaw.md en mode copie, avec le reste du plan', () => {
    applyGlobalPlan(planWith(law), root, { mode: 'copy' });
    expect(readFileSync(join(root, GLOBAL_LAW_PATH), 'utf8')).toBe(law);
    expect(readFileSync(join(root, 'agents/ezk-a.md'), 'utf8')).toBe('# agent a\n');
  });

  it('en mode lien, la loi est un VRAI fichier (une loi compilée n’est pas dans le catalogue)', () => {
    applyGlobalPlan(planWith(law), root, { mode: 'link', catalogRoot });
    const stat = lstatSync(join(root, GLOBAL_LAW_PATH));
    expect(stat.isSymbolicLink()).toBe(false);
    expect(stat.isFile()).toBe(true);
    expect(readFileSync(join(root, GLOBAL_LAW_PATH), 'utf8')).toBe(law);
    expect(lstatSync(join(root, 'skills/ezk-s')).isSymbolicLink()).toBe(true);
  });

  it('est idempotent, et remplace une ancienne version à lui', () => {
    applyGlobalPlan(planWith(globalLawContent([]), false), root, { mode: 'copy' });
    applyGlobalPlan(planWith(law, false), root, { mode: 'copy' });
    applyGlobalPlan(planWith(law, false), root, { mode: 'copy' });
    expect(readFileSync(join(root, GLOBAL_LAW_PATH), 'utf8')).toBe(law);
  });

  it('REFUSE d’écraser un fichier du même nom qui n’est pas à lawgiver, et n’écrit RIEN d’autre', () => {
    mkdirSync(join(root, 'rules'), { recursive: true });
    writeFileSync(join(root, GLOBAL_LAW_PATH), '# Mes règles perso\n');
    expect(() => applyGlobalPlan(planWith(law), root, { mode: 'copy' })).toThrow(/refus non-destructif/);
    expect(readFileSync(join(root, GLOBAL_LAW_PATH), 'utf8')).toBe('# Mes règles perso\n');
    // la garde passe AVANT toute écriture : ni agent ni skill n'ont été posés
    expect(readdirSync(root).sort()).toEqual(['rules']);
  });

  it('REFUSE d’écrire à travers un lien (le contenu irait dans le fichier visé)', () => {
    const cible = join(catalogRoot, 'perso.md');
    writeFileSync(cible, '# perso\n');
    mkdirSync(join(root, 'rules'), { recursive: true });
    symlinkSync(cible, join(root, GLOBAL_LAW_PATH));
    expect(() => applyGlobalPlan(planWith(law), root, { mode: 'copy' })).toThrow(/refus non-destructif/);
    expect(readFileSync(cible, 'utf8')).toBe('# perso\n');
  });
});
