/**
 * `ezk backlog groom-milestone` de bout en bout (fiche 20261015122120198) : le VRAI bin sur un dossier
 * jetable. Ce que le cœur pur ne prouve pas : la lecture par le loader, la sélection scopée à une
 * milestone, et le round-trip instantané → `--report`. Lecture seule : rien n'est écrit.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..');
const bin = join(megaCity, 'bin', 'backlog-groom-milestone.ts');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');

const fm = (id: string, extra: string): string =>
  `---\nid: "${id}"\ntitle: "Fiche ${id}"\ntype: feature\npriority: P2\nproduct: mega-city\n${extra}\n---\n\ncorps\n`;

let root = '';

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
  root = mkdtempSync(join(tmpdir(), 'groom-milestone-'));
  put('features/0001_a.md', fm('0001', 'milestone: preparation\nstatus: idea'));
  put('features/0002_b.md', fm('0002', 'milestone: preparation\nstatus: ready'));
  put('features/0003_c.md', fm('0003', 'milestone: preparation\nstatus: idea\nblocked: panel'));
  put('features/0004_d.md', fm('0004', 'milestone: board\nstatus: idea')); // AUTRE milestone
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('backlog:groom-milestone — le bin', () => {
  it('la sélection ne voit que la milestone demandée, classe, et imprime l’instantané', () => {
    const r = run('preparation');
    expect(r.code).toBe(0);
    expect(r.out).toContain('1 à groomer');
    expect(r.out).toContain('0001'); // idée → à groomer
    expect(r.out).toContain('0003'); // bloquée → arbitrage humain
    expect(r.out).toContain('panel');
    expect(r.out).not.toContain('0004'); // autre milestone, jamais touchée
    expect(r.out).toContain('0001:idea'); // l’instantané machine
  });

  it('--report rend le delta par rapport à l’instantané (idée→ready = prête)', () => {
    // on simule une passe : 0001 a été groomée et promue ready
    put('features/0001_a.md', fm('0001', 'milestone: preparation\nstatus: ready'));
    const r = run('preparation', '--report', '--since', '0001:idea;0002:ready;0003:idea');
    expect(r.code).toBe(0);
    expect(r.out).toContain('1 prête(s)');
    expect(r.out).toContain('0001');
    expect(r.out).toContain('0003 — panel'); // restée idée, raison nommée
  });
});
