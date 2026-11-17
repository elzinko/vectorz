/**
 * `ezk-backlog version` de bout en bout (fiche 20260824204751403) : le VRAI bin, lancé sur un dépôt
 * git jetable. Ce que le cœur pur ne peut pas prouver : les codes de sortie, la lecture des fiches par
 * le loader, et surtout le contrat d'écriture — `close` n'écrit rien (il propose l'étiquette ; la coupe
 * vit dans `version tag`, testé à part).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ce fichier lance de vrais sous-processus (tsx, git) via spawnSync/execFileSync, BLOQUANTS.
// Sous charge, un appel grimpe jusqu'à ~30 s et dépasse le délai vitest par défaut (5 s) : la
// suite complète rougit par intermittence (fiche 20261001133500727). On élargit le délai POUR
// CE FICHIER seul — le reste de la suite garde 5 s, donc un test unitaire bloqué échoue toujours
// vite. Calibré sur le pire cas mesuré sous charge (~31 s) avec une marge ~2× ; un vrai blocage
// reste borné à 60 s avec un message clair.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

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
  put('features/done/20260101000000001_a.md', fm('20260101000000001', 'status: shipped\nversion: v0.2.0'));
  put('features/done/20260101000000002_b.md', fm('20260101000000002', 'status: shipped\nversion: v0.2.0'));
  put('features/20260101000000003_c.md', fm('20260101000000003', 'status: ready\nversion: v0.3.0'));
  put(
    'features/20260101000000004_d.md',
    fm('20260101000000004', 'status: idea\nmilestone: parked\nversion: v0.4.0'),
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
    expect(r.out).toMatch(/v0\.2\.0\s+2\s+2\s+0\s+0\s+0\s+0\s+à clore/);
    expect(r.out).toMatch(/v0\.3\.0\s+1\s+0\s+1\s+1\s+0\s+0\s+active \(tirage\)/);
    expect(git('status', '--porcelain')).toBe('');
    expect(git('tag', '-l')).toBe('');
  });

  it('reconnaît une étiquette semver à 3 chiffres (v0.2.0) : la version est « livrée », close refuse', () => {
    git('tag', 'v0.2.0'); // la version EST son tag de release (semver strict)
    expect(run().out).toMatch(/v0\.2\.0\s+2\s+2\s+0\s+0\s+0\s+0\s+livrée \(v0\.2\.0\)/);
    const r = run('close', 'v0.2.0');
    expect(r.code).toBe(1);
    expect(r.out).toContain("déjà livrée : l'étiquette v0.2.0 existe");
  });

  it('check : une fiche parkée rangée dans une version fait échouer (code 1) et nomme la fiche', () => {
    const r = run('check');
    expect(r.code).toBe(1);
    expect(r.out).toContain('[parkee] v0.4.0 · 20260101000000004');
    expect(run('check', 'v0.3.0').code).toBe(0); // v0.3.0 tient debout
    expect(run('check', 'v9.9.0').code).toBe(1); // une version que personne ne porte n'est pas « saine »
  });

  it('close : refuse tant qu’il reste des fiches, sans écrire ni étiqueter', () => {
    const r = run('close', 'v0.3.0');
    expect(r.code).toBe(1);
    expect(r.out).toContain('20260101000000003');
    expect(git('tag', '-l')).toBe('');
  });

  it('close sur une version complète : PROPOSE l’étiquette semver (vX.Y.Z), nomme `version tag` et n’exécute rien', () => {
    const r = run('close', 'v0.2.0');
    expect(r.code).toBe(0);
    expect(r.out).toContain('backlog version tag v0.2.0');
    expect(r.out).toContain('git tag -a v0.2.0');
    expect(r.out).toContain('git push origin v0.2.0');
    expect(git('tag', '-l')).toBe('');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('close refuse (code 1) quand features/ porte des changements non commités : l’état validé n’est pas celui de HEAD', () => {
    appendFileSync(join(root, 'features/20260101000000003_c.md'), 'ajout non commité\n');
    const r = run('close', 'v0.2.0');
    expect(r.code).toBe(1);
    expect(r.out).toContain('non commités');
    expect(git('tag', '-l')).toBe('');
  });

  it('l’étiquette vise HEAD, le commit dont les fiches ont été lues — et la proposition avertit si origin/main est ailleurs', () => {
    const seed = git('rev-parse', 'HEAD').trim();
    put('README.md', 'un autre commit\n');
    git('add', 'README.md');
    git('commit', '--quiet', '-m', 'chore: avance');
    const head = git('rev-parse', 'HEAD').trim();
    git('update-ref', 'refs/remotes/origin/main', seed); // origin/main est en retard sur HEAD

    const proposal = run('close', 'v0.2.0');
    expect(proposal.code).toBe(0);
    expect(proposal.out).toContain(`git tag -a v0.2.0 -m "Version v0.2.0" ${head}`);
    expect(proposal.out).toContain("n'est pas la pointe de origin/main");
    expect(git('tag', '-l')).toBe(''); // la proposition n'écrit rien
  });

  it('refuse les usages invalides (code 2) sans rien faire', () => {
    expect(run('close').code).toBe(2); // close sans version
    expect(run('close', 'v0.2.0', '--tag').code).toBe(2); // l'ancienne coupe par close n'existe plus
    expect(run('close', 'v0.2.0', '--release-ok', 'x').code).toBe(2); // la soupape va avec `tag` seul
    expect(run('check', 'v0.3').code).toBe(2); // format
    expect(run('nimporte').code).toBe(2); // sous-commande inconnue
    expect(run('--max', '0').code).toBe(2);
  });
});

// Checkpoint de version (fiche 20261015125606808, ADR-0080) : entrée « lançable ? », sortie « scellable ? ».
describe('backlog:version ready — gate d’entrée', () => {
  it('toutes les fiches prêtes → LANÇABLE (code 0)', () => {
    const r = run('ready', 'v0.3.0'); // le lot v0.3.0 n'a que la fiche 0003 ready
    expect(r.code).toBe(0);
    expect(r.out).toContain('LANÇABLE');
  });

  it('une idée dans le lot → PAS lançable (code 1), la fiche est nommée « à groomer »', () => {
    put('features/20260101000000009_i.md', fm('20260101000000009', 'status: idea\nversion: v0.3.0'));
    git('add', '.');
    git('commit', '--quiet', '-m', 'idée dans v0.3.0');
    const r = run('ready', 'v0.3.0');
    expect(r.code).toBe(1);
    expect(r.out).toContain('à groomer');
    expect(r.out).toContain('20260101000000009');
  });
});

describe('backlog:version close — surface la décision, fiche par fiche (sortie)', () => {
  it('refuse en nommant la raison typée ET la décision attendue de chaque fiche non livrée', () => {
    put(
      'features/20260101000000008_e.md',
      fm('20260101000000008', 'status: ready\nversion: v0.3.0\nblocked: design'),
    );
    git('add', '.');
    git('commit', '--quiet', '-m', 'bloquée dans v0.3.0');
    const r = run('close', 'v0.3.0');
    expect(r.code).toBe(1);
    expect(r.out).toContain('Décision attendue');
    expect(r.out).toContain('design');
    expect(r.out).toContain('20260101000000008');
  });
});

describe('backlog:version — gel (freeze / unfreeze / diff, fiche 20261014200651962)', () => {
  it('freeze pose freeze/vX.Y.Z, list affiche « figée », unfreeze le retire', () => {
    const f = run('freeze', 'v0.3.0');
    expect(f.code).toBe(0);
    expect(f.out).toContain('figée');
    expect(git('tag', '-l', 'freeze/v0.3.0').trim()).toBe('freeze/v0.3.0');
    expect(run().out).toMatch(/v0\.3\.0.*· figée/);
    const u = run('unfreeze', 'v0.3.0');
    expect(u.code).toBe(0);
    expect(git('tag', '-l', 'freeze/v0.3.0').trim()).toBe('');
  });

  it('diff lit la base figée par le loader et voit un ajout entré après le gel', () => {
    expect(run('freeze', 'v0.3.0').code).toBe(0);
    expect(run('diff', 'v0.3.0').out).toContain("n'a pas bougé"); // base = 1 fiche, aucun ajout
    put('features/20260101000000005_e.md', fm('20260101000000005', 'status: ready\nversion: v0.3.0'));
    git('add', '.');
    git('commit', '--quiet', '-m', 'feat: ajout post-gel');
    const after = run('diff', 'v0.3.0');
    expect(after.code).toBe(0);
    expect(after.out).toContain('1 ajout');
    expect(after.out).toContain('20260101000000005');
  });

  it('freeze refuse une version déjà figée ; diff/unfreeze refusent une version non figée', () => {
    expect(run('diff', 'v0.3.0').code).toBe(1);
    expect(run('unfreeze', 'v0.3.0').code).toBe(1);
    expect(run('freeze', 'v0.3.0').code).toBe(0);
    expect(run('freeze', 'v0.3.0').code).toBe(1); // déjà figée
  });
});
