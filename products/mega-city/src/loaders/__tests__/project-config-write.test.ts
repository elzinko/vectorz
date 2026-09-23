import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { githubCapabilities, writeGithubConfig } from '../project-config.js';

const ON = { pr: true, ci: true, codexReview: true };
const OFF = { pr: false, ci: false, codexReview: false };

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ezk-cfg-write-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const configPath = (): string => join(root, '.vectorz', 'config.yml');
const readConfig = (): string => readFileSync(configPath(), 'utf8');
function seed(yaml: string): void {
  mkdirSync(join(root, '.vectorz'), { recursive: true });
  writeFileSync(configPath(), yaml, 'utf8');
}

describe('writeGithubConfig — pilotage de la config .vectorz/ (fiche 20260920111652514)', () => {
  it('`github off` écrit `github: false` et crée le fichier (+ .vectorz/) s’il manque', () => {
    expect(existsSync(configPath())).toBe(false);
    writeGithubConfig(root, { kind: 'all', enabled: false });
    expect(existsSync(configPath())).toBe(true);
    expect(readConfig()).toContain('github: false');
    expect(githubCapabilities(root)).toEqual(OFF);
  });

  it('`github on` rétablit le défaut « tout ON » (coupure retirée)', () => {
    writeGithubConfig(root, { kind: 'all', enabled: false });
    writeGithubConfig(root, { kind: 'all', enabled: true });
    expect(readConfig()).not.toContain('github');
    expect(githubCapabilities(root)).toEqual(ON);
  });

  it('granulaire : `github pr off` produit `github: { pr: false }`', () => {
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: false });
    expect(githubCapabilities(root)).toEqual({ pr: false, ci: true, codexReview: true });
    // structure objet, pas le scalaire `false`
    expect(readConfig()).toMatch(/github:\s*\n\s+pr: false/);
  });

  it('granulaire : `codex-review off` coupe seulement la revue Codex', () => {
    writeGithubConfig(root, { kind: 'cap', cap: 'codex-review', enabled: false });
    expect(githubCapabilities(root)).toEqual({ pr: true, ci: true, codexReview: false });
  });

  it('rallumer une capacité (`pr on` après `pr off`) revient au défaut ON', () => {
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: false });
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: true });
    expect(githubCapabilities(root)).toEqual(ON);
    expect(readConfig()).not.toContain('github');
  });

  it('style BLOC conservé après une config vidée (off → on → pr off), pas de flow `{…}`', () => {
    writeGithubConfig(root, { kind: 'all', enabled: false });
    writeGithubConfig(root, { kind: 'all', enabled: true }); // vide la config
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: false });
    expect(readConfig()).toMatch(/github:\s*\n\s+pr: false/);
    expect(readConfig()).not.toContain('{ github');
    expect(githubCapabilities(root)).toEqual({ pr: false, ci: true, codexReview: true });
  });

  it('écriture NON DESTRUCTIVE : les autres clés du YAML sont préservées', () => {
    seed('autre: valeur\nliste:\n  - a\n  - b\n');
    writeGithubConfig(root, { kind: 'all', enabled: false });
    const out = readConfig();
    expect(out).toContain('autre: valeur');
    expect(out).toContain('- a');
    expect(out).toContain('github: false');
  });

  it('YAML malformé → erreur claire (chemin), fichier NON écrasé', () => {
    seed('github: "guillemet non fermé\n');
    const before = readConfig();
    expect(() => writeGithubConfig(root, { kind: 'all', enabled: false })).toThrow(/malform/i);
    expect(readConfig()).toBe(before); // intact
  });

  it('extension .yaml existante : écrit dans ce fichier, pas un nouveau .yml', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'config.yaml'), 'autre: x\n', 'utf8');
    writeGithubConfig(root, { kind: 'all', enabled: false });
    expect(existsSync(join(root, '.vectorz', 'config.yml'))).toBe(false);
    expect(readFileSync(join(root, '.vectorz', 'config.yaml'), 'utf8')).toContain('github: false');
  });

  it('`codex-review on` retire aussi l’alias camel `codexReview` (pas de « on » qui ment)', () => {
    seed('github:\n  codexReview: false\n'); // graphie alias, écrite à la main
    expect(githubCapabilities(root)).toEqual({ pr: true, ci: true, codexReview: false });
    writeGithubConfig(root, { kind: 'cap', cap: 'codex-review', enabled: true });
    expect(githubCapabilities(root)).toEqual(ON); // vraiment rallumé
    expect(readConfig()).not.toContain('codexReview');
  });

  it('deux coupures granulaires coexistent (`pr off` puis `ci off`)', () => {
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: false });
    writeGithubConfig(root, { kind: 'cap', cap: 'ci', enabled: false });
    expect(githubCapabilities(root)).toEqual({ pr: false, ci: false, codexReview: true });
  });

  it('rallumer une capacité depuis `github: false` laisse les autres coupées', () => {
    writeGithubConfig(root, { kind: 'all', enabled: false });
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: true });
    expect(githubCapabilities(root)).toEqual({ pr: true, ci: false, codexReview: false });
  });

  it('préserve un commentaire d’en-tête du fichier existant', () => {
    seed('# ma config de projet\ngithub:\n  ci: false\n');
    writeGithubConfig(root, { kind: 'cap', cap: 'pr', enabled: false });
    const out = readConfig();
    expect(out).toContain('# ma config de projet');
    expect(githubCapabilities(root)).toEqual({ pr: false, ci: false, codexReview: true });
  });
});
