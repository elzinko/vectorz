import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { githubCapabilities } from '../project-config.js';

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
});
