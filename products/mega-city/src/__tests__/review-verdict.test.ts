/**
 * `ezk review verdict <id> up|down|none` — le pouce de revue par la ligne de commande
 * (fiche 20261102123552181). La page web de la méthode sera retirée (amendement de l'ADR-086 du
 * 2026-11-02) : la commande doit écrire le MÊME fichier qu'elle, refuser sans rien écrire, et ne
 * toucher à rien d'autre.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verdictFile } from '../core/verdicts.js';
import { handleVerdictRequest } from '../io/verdict-endpoint.js';
import { localDay } from '../io/verdicts.js';

vi.setConfig({ testTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');
const ID = '20260826072532622';
const FICHE = `---\nid: "${ID}"\ntitle: "Une fiche"\ntype: feature\npriority: P2\nstatus: idea\n---\n\n# Une fiche\n`;

let repo: string;

function makeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'review-verdict-'));
  mkdirSync(join(root, 'features'), { recursive: true });
  writeFileSync(join(root, 'features', `${ID}_une-fiche.md`), FICHE);
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', root, '-c', 'user.email=t@x', '-c', 'user.name=t', ...args], { stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  return root;
}

/** Tous les fichiers du faux dépôt hors `.git`, relatifs à sa racine. */
function tree(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.name !== '.git')
    .flatMap((e) => (e.isDirectory() ? tree(join(dir, e.name), root) : [relative(root, join(dir, e.name))]))
    .sort();
}

function verdict(...args: string[]) {
  return spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'review-verdict.ts'), ...args, '--root', repo], {
    encoding: 'utf8',
  });
}

const commits = (root: string): string =>
  execFileSync('git', ['-C', root, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim();

beforeEach(() => {
  repo = makeRepo();
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('ezk review verdict — écrit le pouce', () => {
  it('écrit features/reviews/verdicts/<id>.json, octet pour octet comme la page web', () => {
    const r = verdict(ID, 'up');
    expect(r.status, r.stderr).toBe(0);
    // La page, sur un dépôt jumeau, le même jour.
    const twin = makeRepo();
    try {
      const res = handleVerdictRequest(
        {
          method: 'POST',
          headers: { host: '127.0.0.1:4173', 'content-type': 'application/json' },
          body: JSON.stringify({ id: ID, verdict: 'up' }),
        },
        { repoRoot: twin, today: () => localDay() },
      );
      expect(res.status).toBe(200);
      expect(readFileSync(join(repo, verdictFile(ID)), 'utf8')).toBe(
        readFileSync(join(twin, verdictFile(ID)), 'utf8'),
      );
    } finally {
      rmSync(twin, { recursive: true, force: true });
    }
  });

  it('remplace un pouce, et `none` le retire, comme la page', () => {
    expect(verdict(ID, 'up').status).toBe(0);
    expect(verdict(ID, 'down').status).toBe(0);
    expect(JSON.parse(readFileSync(join(repo, verdictFile(ID)), 'utf8')).verdict).toBe('down');
    expect(verdict(ID, 'none').status).toBe(0);
    expect(tree(repo)).not.toContain(verdictFile(ID));
  });
});

describe('ezk review verdict — refuse sans rien écrire', () => {
  it('une fiche inconnue est refusée, code d’erreur, aucun fichier', () => {
    const before = tree(repo);
    const r = verdict('20990101000000099', 'up');
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/inconnue/);
    expect(tree(repo)).toEqual(before);
  });

  it('une valeur autre que up, down ou none est refusée, aucun fichier', () => {
    const before = tree(repo);
    const r = verdict(ID, 'bof');
    expect(r.status).toBe(1);
    expect(tree(repo)).toEqual(before);
  });

  it('un id qui n’est pas un id de fiche est refusé : jamais un chemin saisi', () => {
    const before = tree(repo);
    expect(verdict('../../etc', 'up').status).toBe(1);
    expect(tree(repo)).toEqual(before);
  });

  it('sans id ni valeur, la commande dit son usage (code 2)', () => {
    const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'review-verdict.ts'), '--root', repo], {
      encoding: 'utf8',
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/usage/);
  });
});

describe('ezk review verdict — rien d’autre n’est écrit', () => {
  it('seul le fichier du pouce apparaît : la fiche ne bouge pas, aucun commit', () => {
    const before = tree(repo);
    const fiche = readFileSync(join(repo, 'features', `${ID}_une-fiche.md`), 'utf8');
    const count = commits(repo);
    expect(verdict(ID, 'up').status).toBe(0);
    expect(tree(repo)).toEqual([...before, verdictFile(ID)].sort());
    expect(readFileSync(join(repo, 'features', `${ID}_une-fiche.md`), 'utf8')).toBe(fiche);
    expect(commits(repo)).toBe(count);
  });
});
