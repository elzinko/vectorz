/**
 * Le bord git de la coupe (fiche 20261114131612759, volet a) : la date de chaque étiquette, et les
 * fichiers ajoutés à `features/done/` depuis une étiquette. Testé sur un VRAI dépôt jetable, puis
 * recoupé sur le vrai dépôt avec la commande git de la fiche.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { derniereEtiquette } from '../../core/coupe.js';
import { addedSince, tagDates } from '../git-coupe.js';

// De vrais `git` par sous-processus : sous la charge de la gate, le délai par défaut ne suffit pas.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let dir: string;

beforeAll(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-coupe-')));
  const write = (file: string): void => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), `---\nid: x\n---\n`);
  };
  const git = (date: string, ...args: string[]): void => {
    execFileSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...args], {
      stdio: 'ignore',
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    });
  };
  git('2026-10-01T10:00:00+02:00', 'init', '-q', '-b', 'main');
  write('features/done/0001-avant.md');
  write('features/0002-a-livrer.md');
  git('2026-10-01T10:00:00+02:00', 'add', '-A');
  git('2026-10-01T10:00:00+02:00', 'commit', '-qm', 'avant');
  git('2026-10-01T10:00:00+02:00', 'tag', 'v0.1.0');
  git('2026-10-01T10:00:00+02:00', 'tag', 'freeze/v0.2.0');
  // Après l'étiquette : une fiche déplacée vers done/, une créée directement dans done/, un fichier hors done/.
  renameSync(join(dir, 'features/0002-a-livrer.md'), join(dir, 'features/done/0002-a-livrer.md'));
  write('features/done/20990101000000003_neuve.md');
  write('features/0004-active.md');
  git('2026-10-02T09:30:00+02:00', 'add', '-A');
  git('2026-10-02T09:30:00+02:00', 'commit', '-qm', 'apres');
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('tagDates', () => {
  it('rend la date de chaque étiquette, lue par git for-each-ref', () => {
    const dates = tagDates(dir);
    expect(dates.get('v0.1.0')).toBe('2026-10-01T10:00:00+02:00');
    expect([...dates.keys()].sort()).toEqual(['freeze/v0.2.0', 'v0.1.0']);
  });

  it('hors dépôt git : aucune étiquette, sans planter', () => {
    const vide = mkdtempSync(join(tmpdir(), 'ezk-coupe-nogit-'));
    try {
      expect(tagDates(vide).size).toBe(0);
    } finally {
      rmSync(vide, { recursive: true, force: true });
    }
  });
});

describe('addedSince', () => {
  it('rend les fichiers ajoutés à features/done/ depuis l’étiquette, un déplacement compris', () => {
    expect(addedSince(dir, 'v0.1.0').sort()).toEqual([
      'features/done/0002-a-livrer.md',
      'features/done/20990101000000003_neuve.md',
    ]);
  });

  it('une étiquette inconnue de git : aucun fichier, sans planter', () => {
    expect(addedSince(dir, 'v9.9.9')).toEqual([]);
  });
});

describe('sur le vrai dépôt', () => {
  const repoRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..'));

  it('le nombre de fichiers ajoutés vaut celui de la commande git de la fiche', () => {
    const etiquette = derniereEtiquette(tagDates(repoRoot).keys()) ?? '';
    expect(etiquette, 'le dépôt porte une étiquette de version').not.toBe('');
    const out = execFileSync(
      'git',
      ['-C', repoRoot, 'log', '--no-renames', '--diff-filter=A', '--name-only', '--pretty=format:', `${etiquette}..HEAD`, '--', 'features/done'],
      { encoding: 'utf8' },
    );
    const attendu = out.split('\n').filter((l) => l.endsWith('.md')).length;
    expect(addedSince(repoRoot, etiquette)).toHaveLength(attendu);
  });
});
