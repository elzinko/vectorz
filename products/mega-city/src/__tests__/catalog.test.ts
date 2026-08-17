import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
    expect(agent?.role).toMatch(/reviewer senior/i); // insensible à la casse : l'agent réécrit dit « reviewer senior en posture adverse »
  });

  it("lit les réglages d'exécution model/effort/isolation du frontmatter (fiche 0039)", () => {
    const catalog = loadCatalog(repoRoot);

    // jugement / PO : pin Opus 4.8 + spare sonnet (0181 — jamais alias opus → Opus 5)
    for (const id of ['ezk-architect', 'ezk-reviewer', 'ezk-pm', 'ezk-archive'] as const) {
      const agent = catalog.agents.get(id);
      expect(agent?.model, id).toBe('claude-opus-4-8');
      expect(agent?.model_spare, id).toBe('sonnet');
    }
    expect(catalog.agents.get('ezk-architect')?.effort).toBe('high');
    expect(catalog.agents.get('ezk-archive')?.effort).toBe('medium');

    // mécanique : sonnet (dérogation motivée 0181)
    const tdd = catalog.agents.get('ezk-tdd');
    expect(tdd?.model).toBe('sonnet');
    expect(tdd?.effort).toBe('medium');
    expect(tdd?.isolation).toBe('worktree');
    expect(catalog.agents.get('ezk-qa')?.model).toBe('sonnet');

    const steward = catalog.agents.get('ezk-steward');
    expect(steward?.isolation).toBeUndefined();
    expect(steward?.effort).toBe('low');
    expect(steward?.model_spare).toBeUndefined();
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

  it('charge les assets réels du dossier (ezk-article → approaches/, ADR-0027)', () => {
    const catalog = loadCatalog(repoRoot);
    const article = catalog.skills.get('ezk-article');
    expect(article?.assets?.map((a) => a.path)).toContain(
      'approaches/vectorz-grand-public-vulgarise.md',
    );
    // un script réel versionné 100755 (ezk-backlog/scripts/mint-id.sh) porte le bit +x
    const backlog = catalog.skills.get('ezk-backlog');
    const script = backlog?.assets?.find((a) => a.path === 'scripts/mint-id.sh');
    expect(script?.executable).toBe(true);
  });
});

describe('loadCatalog — assets de dossier de skill (ADR-0027)', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lawgiver-assets-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function writeSkill(name: string): string {
    const dir = join(root, 'skills', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${name}\n---\n\ncorps\n`);
    return dir;
  }

  it('collecte les fichiers auxiliaires (récursif), triés, hors SKILL.md, VERBATIM', () => {
    const dir = writeSkill('ezk-article');
    mkdirSync(join(dir, 'approaches'), { recursive: true });
    writeFileSync(join(dir, 'approaches', 'vectorz.md'), '# vectorz\n');
    writeFileSync(join(dir, 'NOTES.md'), 'notes sans newline finale'); // doit rester verbatim
    const skill = loadCatalog(root).skills.get('ezk-article');
    expect(skill?.assets?.map((a) => a.path)).toEqual(['NOTES.md', 'approaches/vectorz.md']);
    expect(skill?.assets?.find((a) => a.path === 'NOTES.md')?.content).toBe('notes sans newline finale');
    expect(skill?.assets?.some((a) => a.path === 'SKILL.md')).toBe(false);
  });

  it("porte le bit d'exécution des scripts (executable: true), absent sinon", () => {
    const dir = writeSkill('ezk-scripts');
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    const script = join(dir, 'scripts', 'run.sh');
    writeFileSync(script, '#!/bin/sh\necho hi\n');
    chmodSync(script, 0o755);
    writeFileSync(join(dir, 'scripts', 'lib.txt'), 'data');
    const skill = loadCatalog(root).skills.get('ezk-scripts');
    expect(skill?.assets?.find((a) => a.path === 'scripts/run.sh')?.executable).toBe(true);
    expect(skill?.assets?.find((a) => a.path === 'scripts/lib.txt')).not.toHaveProperty('executable');
  });

  it('ignore dotfiles et symlinks (déterminisme + anti-exfiltration, même garde que resolveHookScript)', () => {
    const dir = writeSkill('ezk-safe');
    writeFileSync(join(dir, '.DS_Store'), 'junk');
    mkdirSync(join(dir, '.hidden'), { recursive: true });
    writeFileSync(join(dir, '.hidden', 'x.md'), 'hidden');
    const secretDir = mkdtempSync(join(tmpdir(), 'lawgiver-secret-'));
    const secret = join(secretDir, 'secret.md');
    writeFileSync(secret, 'CECI NE DOIT JAMAIS ÊTRE EMBARQUÉ');
    try {
      symlinkSync(secret, join(dir, 'leak.md')); // lien commité vers hors-dépôt
      const skill = loadCatalog(root).skills.get('ezk-safe');
      expect(skill?.assets ?? []).toEqual([]); // dotfiles + symlink écartés
    } finally {
      rmSync(secretDir, { recursive: true, force: true });
    }
  });

  it("n'ajoute pas le champ assets quand le dossier n'a que SKILL.md (rétro-compat)", () => {
    writeSkill('plain');
    const skill = loadCatalog(root).skills.get('plain');
    expect(skill).toEqual({ id: 'plain', content: 'corps' });
    expect(skill).not.toHaveProperty('assets');
  });
});

describe('loadCatalog — frontmatter composes/composes-external (ADR-0025, fiche 0149)', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lawgiver-composes-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function writeSkill(dir: string, frontmatter: string): void {
    mkdirSync(join(root, 'skills', dir), { recursive: true });
    writeFileSync(join(root, 'skills', dir, 'SKILL.md'), `---\n${frontmatter}\n---\n\ncorps\n`);
  }

  it('parse composes: et composes-external: (kebab → camelCase)', () => {
    writeSkill(
      'orchestrator',
      [
        'name: orchestrator',
        'composes:',
        '  - a',
        '  - b',
        'composes-external:',
        '  - skill-creator',
      ].join('\n'),
    );
    const catalog = loadCatalog(root);
    const skill = catalog.skills.get('orchestrator');
    expect(skill?.composes).toEqual(['a', 'b']);
    expect(skill?.composesExternal).toEqual(['skill-creator']);
  });

  it("n'ajoute pas les champs quand composes/composes-external sont absents (rétro-compat)", () => {
    writeSkill('plain', 'name: plain');
    const catalog = loadCatalog(root);
    const skill = catalog.skills.get('plain');
    expect(skill).toEqual({ id: 'plain', content: 'corps' });
    expect(skill).not.toHaveProperty('composes');
    expect(skill).not.toHaveProperty('composesExternal');
  });

  it("ignore composes si ce n'est pas un tableau de strings", () => {
    writeSkill('malformed', ['name: malformed', 'composes: notAnArray'].join('\n'));
    const catalog = loadCatalog(root);
    expect(catalog.skills.get('malformed')?.composes).toBeUndefined();
  });

  it('rejette un id composé non sûr (assertSafeId, défense frontière)', () => {
    writeSkill('evil', ['name: evil', 'composes:', '  - ../../etc/passwd'].join('\n'));
    expect(() => loadCatalog(root)).toThrow(/non sûr/);
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
