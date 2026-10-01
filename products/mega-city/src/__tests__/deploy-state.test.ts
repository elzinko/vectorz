/**
 * `lawgiver status` / `ezk law status` (fiche 20260903134906920) : ce qui est déployé sur un
 * poste, par rapport à ce que le profil promet. Lecture seule, prouvée sur dossier jetable —
 * jamais dans le vrai ~/.claude.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type PathFact,
  classify,
  expectedItems,
  inspect,
  renderStatus,
  summarize,
} from '../core/deploy-state.js';
import type { WritePlan } from '../domain/plan.js';
import { probePath } from '../io/deploy-probe.js';

describe('classify — l’état d’un chemin du poste', () => {
  it('range chaque forme dans son mot', () => {
    expect(classify({ kind: 'absent' })).toBe('absent');
    expect(classify({ kind: 'dir' })).toBe('copie');
    expect(classify({ kind: 'file' })).toBe('copie');
    expect(classify({ kind: 'symlink', target: '/x', alive: true })).toBe('lien');
    expect(classify({ kind: 'symlink', target: '/x', alive: false })).toBe('lien-mort');
  });
});

describe('expectedItems — ce que bind-global déposerait, lu dans le plan lui-même', () => {
  const plan: WritePlan = {
    hooks: [],
    files: [
      { path: 'skills/ezk-b/SKILL.md', content: '' },
      { path: 'skills/ezk-b/scripts/x.sh', content: '' },
      { path: 'agents/ezk-z.md', content: '' },
      { path: 'skills/ezk-a/SKILL.md', content: '' },
      { path: 'agents/ezk-c.md', content: '' },
    ],
  };

  it('un élément par skill (dossier) et par agent (fichier), skills puis agents, triés par id', () => {
    expect(expectedItems(plan).map((i) => `${i.kind}:${i.id}:${i.path}`)).toEqual([
      'skill:ezk-a:skills/ezk-a',
      'skill:ezk-b:skills/ezk-b',
      'agent:ezk-c:agents/ezk-c.md',
      'agent:ezk-z:agents/ezk-z.md',
    ]);
  });
});

describe('inspect, summarize, renderStatus', () => {
  const facts: Record<string, PathFact> = {
    'skills/ezk-a': { kind: 'symlink', target: '/catalogue/skills/ezk-a', alive: true },
    'skills/ezk-b': { kind: 'dir' },
    'agents/ezk-c.md': { kind: 'absent' },
    'agents/ezk-d.md': { kind: 'symlink', target: '/disparu', alive: false },
  };
  const items = [
    { kind: 'skill' as const, id: 'ezk-a', path: 'skills/ezk-a' },
    { kind: 'skill' as const, id: 'ezk-b', path: 'skills/ezk-b' },
    { kind: 'agent' as const, id: 'ezk-c', path: 'agents/ezk-c.md' },
    { kind: 'agent' as const, id: 'ezk-d', path: 'agents/ezk-d.md' },
  ];
  const entries = inspect(items, (rel) => facts[rel] ?? { kind: 'absent' });

  it('garde la cible d’un lien, vivant ou mort', () => {
    expect(entries.map((e) => [e.id, e.state, e.target])).toEqual([
      ['ezk-a', 'lien', '/catalogue/skills/ezk-a'],
      ['ezk-b', 'copie', undefined],
      ['ezk-c', 'absent', undefined],
      ['ezk-d', 'lien-mort', '/disparu'],
    ]);
  });

  it('compte chaque état', () => {
    expect(summarize(entries)).toEqual({ total: 4, lien: 1, copie: 1, absent: 1, 'lien-mort': 1 });
  });

  it('rend une ligne par élément, le bilan, et le mot « lien mort » en clair', () => {
    const text = renderStatus('global', '/poste/.claude', entries);
    expect(text).toContain("Déploiement du profil 'global' dans /poste/.claude");
    expect(text).toMatch(/lien mort\s+ezk-d/);
    expect(text).toMatch(/absent\s+ezk-c/);
    expect(text).toContain('Bilan : 1 en lien, 1 en copie, 1 absent, 1 lien mort (sur 4 éléments du profil).');
    expect(text.split('\n').filter((l) => /^\s{4}\S/.test(l))).toHaveLength(4);
  });
});

describe('probePath — sur un dossier jetable', () => {
  let root: string;
  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'deploy-state-')));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('distingue lien vivant, lien mort, copie (dossier ou fichier) et absent', () => {
    mkdirSync(join(root, 'catalogue', 'ezk-a'), { recursive: true });
    mkdirSync(join(root, 'skills', 'ezk-b'), { recursive: true });
    mkdirSync(join(root, 'agents'), { recursive: true });
    symlinkSync(join(root, 'catalogue', 'ezk-a'), join(root, 'skills', 'ezk-a'));
    symlinkSync(join(root, 'disparu'), join(root, 'skills', 'ezk-mort'));
    writeFileSync(join(root, 'agents', 'ezk-c.md'), '# agent');

    expect(probePath(root, 'skills/ezk-a')).toEqual({
      kind: 'symlink',
      target: join(root, 'catalogue', 'ezk-a'),
      alive: true,
    });
    expect(probePath(root, 'skills/ezk-mort')).toMatchObject({ kind: 'symlink', alive: false });
    expect(probePath(root, 'skills/ezk-b')).toEqual({ kind: 'dir' });
    expect(probePath(root, 'agents/ezk-c.md')).toEqual({ kind: 'file' });
    expect(probePath(root, 'skills/ezk-rien')).toEqual({ kind: 'absent' });
  });
});

describe('lawgiver status — la commande, sur une cible jetable', () => {
  const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  let target: string;
  beforeEach(() => {
    target = realpathSync(mkdtempSync(join(tmpdir(), 'law-status-')));
  });
  afterEach(() => {
    rmSync(target, { recursive: true, force: true });
  });

  const status = (profile: string) =>
    spawnSync(process.execPath, [tsx, join(megaCity, 'bin', 'lawgiver.ts'), 'status', profile, '--target', target], {
      encoding: 'utf8',
    });

  it('sur un dossier vide, tout le profil est « absent » et rien n’est écrit', { timeout: 60_000 }, () => {
    const r = status('global');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/absent\s+ezk-sprint/);
    expect(r.stdout).toMatch(/absent\s+ezk-reviewer/);
    expect(r.stdout).toMatch(/Bilan : 0 en lien, 0 en copie, \d+ absents, 0 lien mort/);
    const after = spawnSync('ls', ['-A', target], { encoding: 'utf8' });
    expect(after.stdout).toBe('');
  });

  it('voit un lien posé à la main, et un lien mort', { timeout: 60_000 }, () => {
    mkdirSync(join(target, 'skills'), { recursive: true });
    symlinkSync(join(megaCity, 'skills', 'ezk-sprint'), join(target, 'skills', 'ezk-sprint'));
    symlinkSync(join(target, 'disparu'), join(target, 'skills', 'ezk-ci'));
    const r = status('global');
    expect(r.stdout).toMatch(/lien\s+ezk-sprint/);
    expect(r.stdout).toMatch(/lien mort\s+ezk-ci/);
    expect(r.stdout).toMatch(/Bilan : 1 en lien, 0 en copie, \d+ absents, 1 lien mort/);
  });

  it('refuse un profil inconnu avec un message clair', { timeout: 60_000 }, () => {
    const r = status('profil-qui-nexiste-pas');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Profil inconnu/);
  });
});
