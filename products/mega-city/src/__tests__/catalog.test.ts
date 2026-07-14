import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { assertSafeId, loadCatalog } from '../loaders/catalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

describe('loadCatalog (données réelles du repo)', () => {
  it('indexe les rules par id du frontmatter, pas par nom de fichier', () => {
    const catalog = loadCatalog(repoRoot);

    // rules/clean-code/no-dead-code.md porte id: clean-code/no-dead-code
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
    expect(commits?.enforcements).toHaveLength(1);
    const hook = commits?.enforcements?.[0];
    expect(hook?.type).toBe('hook');
    expect(hook?.hook?.stage).toBe('commit-msg');
    // fiche 0011 : le loader résout hooks/commit-msg.sh en CONTENU (plus un chemin).
    expect(hook?.hook?.script).toContain('#!/usr/bin/env bash');
    expect(hook?.hook?.script).not.toBe('hooks/commit-msg.sh');
  });

  it('résout les 3 hooks exécutables migrés (fiche 0006/0011) — plus de référence dans le vide', () => {
    const catalog = loadCatalog(repoRoot);

    const prePush = catalog.rules.get('ci-cd/local-reproduction');
    const prePushHook = prePush?.enforcements?.find((e) => e.type === 'hook');
    expect(prePushHook?.hook?.stage).toBe('pre-push');
    expect(prePushHook?.hook?.script).toContain('#!/usr/bin/env bash');

    const preCommit = catalog.rules.get('typescript-2026/strict-config');
    const preCommitHook = preCommit?.enforcements?.find((e) => e.type === 'hook');
    expect(preCommitHook?.hook?.stage).toBe('pre-commit');
    expect(preCommitHook?.hook?.script).toContain('#!/usr/bin/env bash');
  });

  it('charge les agents (rôle + competences + interactions) indexés par id', () => {
    const catalog = loadCatalog(repoRoot);
    const agent = catalog.agents.get('ezk-reviewer');
    expect(agent?.id).toBe('ezk-reviewer');
    expect(agent?.competences).toEqual(['ezk-ci']);
    expect(agent?.interactions).toEqual(['clean-code/no-dead-code']);
    expect(agent?.role).toContain('Reviewer senior');
  });

  it('lit les réglages d\'exécution model/effort/isolation du frontmatter (fiche 0039)', () => {
    const catalog = loadCatalog(repoRoot);

    // architecte : cerveau coûteux, réflexion poussée
    const architect = catalog.agents.get('ezk-architect');
    expect(architect?.model).toBe('opus');
    expect(architect?.effort).toBe('high');

    // dev (ezk-tdd) : modèle standard + worktree isolé
    const tdd = catalog.agents.get('ezk-tdd');
    expect(tdd?.model).toBe('sonnet');
    expect(tdd?.effort).toBe('medium');
    expect(tdd?.isolation).toBe('worktree');

    // absence tolérée : un agent sans ces champs ne les porte pas (optionnels)
    const steward = catalog.agents.get('ezk-steward');
    expect(steward?.isolation).toBeUndefined();
    expect(steward?.effort).toBe('low');
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

  it('lève si enforcement.hook.script tente un traversal (fiche 0011)', () => {
    // Cible hors racine, dont le contenu ne doit JAMAIS être lu par le loader.
    const secretDir = mkdtempSync(join(tmpdir(), 'lawgiver-secret-'));
    writeFileSync(join(secretDir, 'target.txt'), 'CECI NE DOIT JAMAIS ÊTRE LU');
    try {
      mkdirSync(join(root, 'rules'), { recursive: true });
      const relTraversal = relative(root, join(secretDir, 'target.txt'));
      writeFileSync(
        join(root, 'rules', 'evil.md'),
        [
          '---',
          'id: evil/pwn',
          'kind: disposition',
          'level: MUST',
          'enforcements:',
          '  - type: hook',
          '    hook:',
          '      stage: pre-commit',
          `      script: ${relTraversal}`,
          '---',
          '',
          'règle malveillante',
        ].join('\n'),
      );
      expect(() => loadCatalog(root)).toThrow(/non sûr/);
    } finally {
      rmSync(secretDir, { recursive: true, force: true });
    }
  });

  it('lève si enforcement.hook.script est un symlink commité qui pointe hors dépôt (re-revue)', () => {
    // Git committe nativement des symlinks : une "règle malveillante" peut en embarquer un
    // SANS jamais écrire ".." dans le chemin déclaré — le garde-fou lexical seul ne suffit pas.
    const secretDir = mkdtempSync(join(tmpdir(), 'lawgiver-secret-'));
    const secretFile = join(secretDir, 'target.txt');
    writeFileSync(secretFile, 'CECI NE DOIT JAMAIS ÊTRE LU (via symlink)');
    try {
      mkdirSync(join(root, 'rules', 'evil'), { recursive: true });
      const symlinkPath = join(root, 'rules', 'evil', 'payload.sh');
      symlinkSync(secretFile, symlinkPath);
      writeFileSync(
        join(root, 'rules', 'evil', 'pwn.md'),
        [
          '---',
          'id: evil/pwn',
          'kind: disposition',
          'level: MUST',
          'enforcements:',
          '  - type: hook',
          '    hook:',
          '      stage: pre-commit',
          '      script: rules/evil/payload.sh',
          '---',
          '',
          'règle malveillante (symlink)',
        ].join('\n'),
      );
      expect(() => loadCatalog(root)).toThrow(/non sûr/);
    } finally {
      rmSync(secretDir, { recursive: true, force: true });
    }
  });
});
