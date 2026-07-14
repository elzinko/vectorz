import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { bind } from '../core/bind.js';
import { applyGlobalPlan } from '../io/apply.js';
import type { WritePlan } from '../domain/plan.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// Racine FACTICE (temp dir) — JAMAIS le vrai ~/.claude.
describe('bind(mobile, …, claude-code-global) — plan global pur', () => {
  it('réutilise expand : produit skills/<id>/SKILL.md et agents/<id>.md', () => {
    const plan = bind('mobile', '/fake/.claude', 'claude-code-global', repoRoot);
    const paths = plan.files.map((f) => f.path);
    expect(paths).toContain('agents/ezk-reviewer.md');
    // aucune écriture de loi / hook côté global
    expect(paths.some((p) => p === 'CLAUDE.md' || p.startsWith('.iamthelaw/'))).toBe(false);
    expect(plan.hooks).toEqual([]);
  });

  it('est déterministe : deux binds → plan identique', () => {
    const a = bind('mobile', '/fake/.claude', 'claude-code-global', repoRoot);
    const b = bind('mobile', '/fake/.claude', 'claude-code-global', repoRoot);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('applyGlobalPlan (coquille I/O NON-DESTRUCTIVE, racine factice)', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lawgiver-global-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const planWith = (...skillIds: string[]): WritePlan => ({
    files: skillIds.map((id) => ({
      path: `skills/${id}/SKILL.md`,
      content: `# ${id}\n`,
    })),
    hooks: [],
  });

  it('écrit ses propres skills/agents dans la racine', () => {
    applyGlobalPlan(planWith('ezk-commits'), root);
    expect(existsSync(join(root, 'skills/ezk-commits/SKILL.md'))).toBe(true);
  });

  it('PRÉSERVE un skill utilisateur étranger préexistant (refus, jamais écrasé)', () => {
    // L'utilisateur a déjà un skill maison non géré par lawgiver (pas de marqueur).
    const userSkill = join(root, 'skills/mon-skill-perso');
    mkdirSync(userSkill, { recursive: true });
    writeFileSync(join(userSkill, 'SKILL.md'), 'CONTENU UTILISATEUR PRECIEUX');
    // Mais aussi un fichier étranger dans le dossier d'un skill qu'on voudrait gérer.
    const collide = join(root, 'skills/ezk-commits');
    mkdirSync(collide, { recursive: true });
    writeFileSync(join(collide, 'notes-perso.txt'), 'NE PAS TOUCHER');

    expect(() => applyGlobalPlan(planWith('ezk-commits'), root)).toThrow(/non-destructif|refus/i);

    // Le fichier étranger est intact ; le skill perso aussi.
    expect(readFileSync(join(collide, 'notes-perso.txt'), 'utf8')).toBe('NE PAS TOUCHER');
    expect(readFileSync(join(userSkill, 'SKILL.md'), 'utf8')).toBe('CONTENU UTILISATEUR PRECIEUX');
  });

  it('remplace idempotemment une entrée DÉJÀ gérée (skill-dir avec SKILL.md seul)', () => {
    applyGlobalPlan(planWith('ezk-commits'), root);
    const dest = join(root, 'skills/ezk-commits/SKILL.md');
    const first = readFileSync(dest, 'utf8');
    // Deuxième bind : même contenu, pas d'erreur, même état.
    applyGlobalPlan(planWith('ezk-commits'), root);
    expect(readFileSync(dest, 'utf8')).toBe(first);
  });
});
