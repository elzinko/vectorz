import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { githubCapabilities, scrumPaths } from '../project-config.js';

const ON = { pr: true, ci: true, codexReview: true };

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ezk-cfg-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeConfig(yaml: string): void {
  mkdirSync(join(root, '.vectorz'), { recursive: true });
  writeFileSync(join(root, '.vectorz', 'config.yml'), yaml, 'utf8');
}

describe('githubCapabilities — lecture de .vectorz/config.yml (fiche 20260916225506856)', () => {
  it('pas de fichier → tout ON (comportement inchangé)', () => {
    expect(githubCapabilities(root)).toEqual(ON);
  });

  it('`github: false` → tout OFF', () => {
    writeConfig('github: false\n');
    expect(githubCapabilities(root)).toEqual({ pr: false, ci: false, codexReview: false });
  });

  it('granulaire : github présent, seule la revue Codex coupée', () => {
    writeConfig('github:\n  codex-review: false\n');
    expect(githubCapabilities(root)).toEqual({ pr: true, ci: true, codexReview: false });
  });

  it('config sans clé `github` → tout ON', () => {
    writeConfig('autre: valeur\n');
    expect(githubCapabilities(root)).toEqual(ON);
  });

  it('fichier vide → tout ON (parse null, pas de crash)', () => {
    writeConfig('');
    expect(githubCapabilities(root)).toEqual(ON);
  });

  it('YAML malformé → erreur explicite (fail-fast), jamais une coupure silencieuse', () => {
    writeConfig('github: "guillemet non fermé\n');
    expect(() => githubCapabilities(root)).toThrow(/malform/i);
  });

  it('extension .yaml acceptée aussi', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'config.yaml'), 'github: false\n', 'utf8');
    expect(githubCapabilities(root)).toEqual({ pr: false, ci: false, codexReview: false });
  });
});

describe('scrumPaths — lecture de .vectorz/config.yml (fiche 20261001192624192)', () => {
  it('pas de fichier → disposition LEGACY (docs/…)', () => {
    expect(scrumPaths(root).journal).toBe('docs/journal');
  });

  it('`scrum: true` → disposition groupée (scrum/…)', () => {
    writeConfig('scrum: true\n');
    expect(scrumPaths(root).journal).toBe('scrum/journal');
    expect(scrumPaths(root).retroCaptures).toBe('scrum/retro/captures');
  });

  it('objet : clé donnée remplacée, autres restées LEGACY', () => {
    writeConfig('scrum:\n  journal: scrum/journal\n');
    expect(scrumPaths(root).journal).toBe('scrum/journal');
    expect(scrumPaths(root).sprints).toBe('docs/sessions');
  });

  it('YAML malformé → erreur explicite (jamais une coupure silencieuse)', () => {
    writeConfig('scrum: "guillemet non fermé\n');
    expect(() => scrumPaths(root)).toThrow(/malform/i);
  });
});
