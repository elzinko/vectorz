import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { assertSafeId, loadCatalog } from '../loaders/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

describe('loadCatalog (données réelles du repo)', () => {
  it('indexe les rules par id du frontmatter, pas par nom de fichier', () => {
    const catalog = loadCatalog(repoRoot);

    // rules/clean-code.md porte id: clean-code/no-dead-code
    const rule = catalog.rules.get('clean-code/no-dead-code');
    expect(rule).toBeDefined();
    expect(rule?.id).toBe('clean-code/no-dead-code');
    expect(rule?.level).toBe('MUST');
    expect(rule?.content).toContain('Pas de code mort');
    // jamais indexé sous le nom de fichier
    expect(catalog.rules.get('clean-code')).toBeUndefined();
  });

  it('applique kind=disposition par défaut (ADR-0002)', () => {
    const catalog = loadCatalog(repoRoot);
    const rule = catalog.rules.get('conventional-commits/format');
    expect(rule?.kind).toBe('disposition');
  });

  it('charge les enforcements (agent-check et hook) depuis le frontmatter', () => {
    const catalog = loadCatalog(repoRoot);

    const cleanCode = catalog.rules.get('clean-code/no-dead-code');
    expect(cleanCode?.enforcements).toEqual([{ type: 'agent-check', agent: 'ezk-reviewer' }]);

    const commits = catalog.rules.get('conventional-commits/format');
    expect(commits?.enforcements).toEqual([
      { type: 'hook', hook: { stage: 'commit-msg', script: 'hooks/commit-msg.sh' } },
    ]);
  });

  it('charge les agents (rôle + competences + interactions) indexés par id', () => {
    const catalog = loadCatalog(repoRoot);
    const agent = catalog.agents.get('ezk-reviewer');
    expect(agent?.id).toBe('ezk-reviewer');
    expect(agent?.competences).toEqual(['ezk-ci']);
    expect(agent?.interactions).toEqual(['clean-code/no-dead-code']);
    expect(agent?.role).toContain('Reviewer senior');
  });

  it('charge bundles et profiles depuis le YAML', () => {
    const catalog = loadCatalog(repoRoot);
    expect(catalog.bundles.get('base')?.rules).toEqual([
      'clean-code/no-dead-code',
      'conventional-commits/format',
    ]);
    expect(catalog.bundles.get('mobile')?.extends).toEqual(['base']);
    expect(catalog.profiles.get('mobile')?.bundles).toEqual(['mobile']);
    expect(catalog.profiles.get('mobile')?.agents).toEqual(['ezk-reviewer']);
  });

  it('charge les skills depuis les sous-dossiers skills/<name>/SKILL.md (fiche 0004)', () => {
    const catalog = loadCatalog(repoRoot);
    // ezk-commits migré dans mega-city/skills/ezk-commits/ → chargé (id = `name` du frontmatter)
    const skill = catalog.skills.get('ezk-commits');
    expect(skill).toBeDefined();
    expect(skill?.content).toContain('Conventional Commits');
  });
});

describe('assertSafeId (anti-traversal, F1)', () => {
  it('accepte les ids légitimes, y compris avec / interne', () => {
    expect(assertSafeId('ezk-reviewer')).toBe('ezk-reviewer');
    expect(assertSafeId('clean-code/no-dead-code')).toBe('clean-code/no-dead-code');
  });

  it('rejette tout id qui pourrait s’échapper du projet hôte', () => {
    for (const evil of ['../x', 'a/../b', '..', '/abs', 'a\\b', 'a\0b', '']) {
      expect(() => assertSafeId(evil), evil).toThrow(/non sûr/);
    }
  });
});

describe('loadCatalog — frontière qui rejette un id malveillant (F1)', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lawgiver-cat-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('lève si un agent porte un id de traversal', () => {
    mkdirSync(join(root, 'agents'), { recursive: true });
    writeFileSync(
      join(root, 'agents', 'evil.md'),
      '---\nid: ../../../../../../tmp/PWNED\n---\nrôle malveillant\n',
    );
    expect(() => loadCatalog(root)).toThrow(/non sûr/);
  });
});
