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
  statSync,
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

  // ── Assets de dossier (ADR-0027) ──────────────────────────────────────────
  const planWithAssets = (
    id: string,
    assets: Array<{ path: string; content: string; mode?: number }>,
  ): WritePlan => ({
    files: [
      { path: `skills/${id}/SKILL.md`, content: `# ${id}\n` },
      ...assets.map((a) => ({
        path: `skills/${id}/${a.path}`,
        content: a.content,
        ...(a.mode ? { mode: a.mode } : {}),
      })),
    ],
    hooks: [],
  });

  it('copy : matérialise les assets du skill ET reste idempotent au 2ᵉ bind', () => {
    const plan = planWithAssets('ezk-article', [{ path: 'approaches/x.md', content: '# x\n' }]);
    applyGlobalPlan(plan, root);
    const asset = join(root, 'skills/ezk-article/approaches/x.md');
    expect(readFileSync(asset, 'utf8')).toBe('# x\n');
    // 2ᵉ application : sans la garde élargie, `approaches` passerait pour « non géré » → throw.
    expect(() => applyGlobalPlan(plan, root)).not.toThrow();
    expect(readFileSync(asset, 'utf8')).toBe('# x\n');
  });

  it('copy : un asset exécutable atterrit avec le bit +x (mode 0o755)', () => {
    applyGlobalPlan(
      planWithAssets('s', [{ path: 'scripts/run.sh', content: '#!/bin/sh\n', mode: 0o755 }]),
      root,
    );
    expect(statSync(join(root, 'skills/s/scripts/run.sh')).mode & 0o111).not.toBe(0);
  });

  it('copy : un fichier retiré DANS un dossier encore géré est nettoyé (remplacement atomique)', () => {
    applyGlobalPlan(
      planWithAssets('s', [
        { path: 'approaches/a.md', content: 'a' },
        { path: 'approaches/b.md', content: 'b' },
      ]),
      root,
    );
    expect(existsSync(join(root, 'skills/s/approaches/b.md'))).toBe(true);
    // b.md quitte le plan mais `approaches/` reste géré → le dossier est reconstruit sans b.md.
    applyGlobalPlan(planWithAssets('s', [{ path: 'approaches/a.md', content: 'a' }]), root);
    expect(existsSync(join(root, 'skills/s/approaches/b.md'))).toBe(false);
    expect(existsSync(join(root, 'skills/s/approaches/a.md'))).toBe(true);
  });

  it('copy : REFUSE (non-destructif) si un dossier d’assets géré n’est plus au plan — retrait manuel', () => {
    applyGlobalPlan(planWithAssets('s', [{ path: 'approaches/a.md', content: 'a' }]), root);
    // Le plan ne porte plus d'asset : `approaches/` préexistant est indistinguable d'un fichier
    // utilisateur → on refuse plutôt que de le supprimer (garantie non-destructive préservée).
    expect(() => applyGlobalPlan(planWithAssets('s', []), root)).toThrow(/non-destructif|refus/i);
    expect(existsSync(join(root, 'skills/s/approaches/a.md'))).toBe(true);
  });

  it('copy : refuse un fichier ÉTRANGER dans un skill-dir même quand le plan porte des assets', () => {
    const dir = join(root, 'skills/s');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), '# s\n');
    writeFileSync(join(dir, 'notes-perso.txt'), 'NE PAS TOUCHER'); // hors managed → étranger
    expect(() =>
      applyGlobalPlan(planWithAssets('s', [{ path: 'approaches/x.md', content: 'x' }]), root),
    ).toThrow(/non-destructif|refus/i);
    expect(readFileSync(join(dir, 'notes-perso.txt'), 'utf8')).toBe('NE PAS TOUCHER');
  });
});
