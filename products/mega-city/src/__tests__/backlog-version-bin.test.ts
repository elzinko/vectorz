/**
 * `ezk-backlog version` de bout en bout (fiche 20260824204751403) : le VRAI bin, lancé sur un dépôt
 * git jetable. Ce que le cœur pur ne peut pas prouver : les codes de sortie, la lecture des fiches par
 * le loader, et surtout le contrat d'écriture — rien n'est écrit sans `--tag`, et `--tag` ne crée
 * qu'une étiquette LOCALE (aucune poussée, aucune fiche touchée).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..');
const bin = join(megaCity, 'bin', 'backlog-version.ts');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');

const fm = (id: string, extra: string): string =>
  `---\nid: "${id}"\ntitle: "Fiche ${id}"\ntype: feature\npriority: P1\nproduct: mega-city\n${extra}\n---\n\ncorps\n`;

let root = '';

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function put(path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function run(...args: string[]): { code: number; out: string } {
  const r = spawnSync(process.execPath, [tsx, bin, '--root', root, ...args], { encoding: 'utf8' });
  return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'backlog-version-'));
  git('init', '--quiet');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  put('features/done/20260101000000001_a.md', fm('20260101000000001', 'status: shipped\nversion: V0.2'));
  put('features/done/20260101000000002_b.md', fm('20260101000000002', 'status: shipped\nversion: V0.2'));
  put('features/20260101000000003_c.md', fm('20260101000000003', 'status: ready\nversion: V0.3'));
  put(
    'features/20260101000000004_d.md',
    fm('20260101000000004', 'status: idea\nmilestone: parked\nversion: V0.4'),
  );
  git('add', '.');
  git('commit', '--quiet', '-m', 'chore: seed');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('backlog:version — le bin', () => {
  it('list : « En clair », un tableau, l’état de chaque version — sans rien écrire', () => {
    const r = run();
    expect(r.code).toBe(0);
    expect(r.out.startsWith('En clair :')).toBe(true);
    expect(r.out).toMatch(/V0\.2\s+2\s+2\s+0\s+0\s+0\s+0\s+à clore/);
    expect(r.out).toMatch(/V0\.3\s+1\s+0\s+1\s+1\s+0\s+0\s+en cours/);
    expect(git('status', '--porcelain')).toBe('');
    expect(git('tag', '-l')).toBe('');
  });

  it('check : une fiche parkée rangée dans une version fait échouer (code 1) et nomme la fiche', () => {
    const r = run('check');
    expect(r.code).toBe(1);
    expect(r.out).toContain('[parkee] V0.4 · 20260101000000004');
    expect(run('check', 'V0.3').code).toBe(0); // V0.3 tient debout
    expect(run('check', 'V9.9').code).toBe(1); // une version que personne ne porte n'est pas « saine »
  });

  it('close : refuse tant qu’il reste des fiches, sans écrire ni étiqueter', () => {
    const r = run('close', 'V0.3');
    expect(r.code).toBe(1);
    expect(r.out).toContain('20260101000000003');
    expect(git('tag', '-l')).toBe('');
  });

  it('close sur une version complète : PROPOSE l’étiquette et n’exécute rien', () => {
    const r = run('close', 'V0.2');
    expect(r.code).toBe(0);
    expect(r.out).toContain('git tag -a v0.2');
    expect(r.out).toContain('git push origin v0.2');
    expect(git('tag', '-l')).toBe('');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('close --tag : crée l’étiquette LOCALE, jamais de poussée, puis la version est « livrée »', () => {
    const head = git('rev-parse', 'HEAD').trim();
    const r = run('close', 'V0.2', '--tag');
    expect(r.code).toBe(0);
    expect(r.out).toContain('git push origin v0.2'); // proposé à l'humain, pas exécuté
    expect(git('tag', '-l').trim()).toBe('v0.2');
    expect(git('rev-list', '-n', '1', 'v0.2').trim()).toBe(head);
    expect(git('status', '--porcelain')).toBe(''); // aucune fiche touchée
    expect(run().out).toMatch(/V0\.2\s+2\s+2\s+0\s+0\s+0\s+0\s+livrée \(v0\.2\)/);
    const again = run('close', 'V0.2'); // idempotent : on ne reclôt pas
    expect(again.code).toBe(1);
    expect(again.out).toContain('déjà livrée');
  });

  it('close refuse (code 1) quand features/ porte des changements non commités : l’état validé n’est pas celui de HEAD', () => {
    appendFileSync(join(root, 'features/20260101000000003_c.md'), 'ajout non commité\n');
    for (const args of [['close', 'V0.2'], ['close', 'V0.2', '--tag']]) {
      const r = run(...args);
      expect(r.code).toBe(1);
      expect(r.out).toContain('non commités');
      expect(git('tag', '-l')).toBe('');
    }
  });

  it('l’étiquette vise HEAD, le commit dont les fiches ont été lues — et la proposition avertit si origin/main est ailleurs', () => {
    const seed = git('rev-parse', 'HEAD').trim();
    put('README.md', 'un autre commit\n');
    git('add', 'README.md');
    git('commit', '--quiet', '-m', 'chore: avance');
    const head = git('rev-parse', 'HEAD').trim();
    git('update-ref', 'refs/remotes/origin/main', seed); // origin/main est en retard sur HEAD

    const proposal = run('close', 'V0.2');
    expect(proposal.code).toBe(0);
    expect(proposal.out).toContain(`git tag -a v0.2 -m "Version V0.2" ${head}`);
    expect(proposal.out).toContain("n'est pas la pointe de origin/main");

    expect(run('close', 'V0.2', '--tag').code).toBe(0);
    expect(git('rev-list', '-n', '1', 'v0.2').trim()).toBe(head); // jamais origin/main
  });

  it('refuse les usages invalides (code 2) sans rien faire', () => {
    expect(run('close').code).toBe(2); // close sans version
    expect(run('check', 'v0.3').code).toBe(2); // format
    expect(run('nimporte').code).toBe(2); // sous-commande inconnue
    expect(run('--max', '0').code).toBe(2);
  });
});
