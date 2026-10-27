/**
 * `ezk backlog park` — la garde « tenter avant de parker » de bout en bout (fiche 20261018234206166).
 * Le VRAI bin sur un dossier jetable : il REFUSE de parker une fiche non tentée (idée à groomer / prête),
 * et parke de plein droit une fiche bloquée ou attestée tentée (`--after-groom`).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..');
const bin = join(megaCity, 'bin', 'backlog-park.ts');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');

const fm = (id: string, extra: string): string =>
  `---\nid: "${id}"\ntitle: "Fiche ${id}"\ntype: feature\npriority: P2\nproduct: mega-city\nversion: v0.1.0\n${extra}\n---\n\ncorps\n`;

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

const statusOf = (file: string): string =>
  (readFileSync(join(root, file), 'utf8').match(/^status:[ \t]*(\S*)/m) ?? [])[1] ?? '';
const milestoneOf = (file: string): string =>
  (readFileSync(join(root, file), 'utf8').match(/^milestone:[ \t]*(\S*)/m) ?? [])[1] ?? '';

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'backlog-park-'));
  put('features/0001_a.md', fm('0001', 'status: idea\nmilestone:\nblocked:')); // idée en périmètre
  put('features/0002_b.md', fm('0002', 'status: idea\nmilestone:\nblocked: panel')); // bloquée
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('backlog:park — « tenter avant de parker »', () => {
  it('REFUSE (code ≠ 0) de parker une idée en périmètre sans --after-groom, sans rien écrire', () => {
    const r = run('0001', '--reason', 'oversized');
    expect(r.code).not.toBe(0);
    expect(r.out).toContain('park refusé');
    expect(statusOf('features/0001_a.md')).toBe('idea'); // intacte
    expect(milestoneOf('features/0001_a.md')).toBe(''); // pas parkée
  });

  it('PARKE la même fiche avec --after-groom (tentative attestée)', () => {
    const r = run('0001', '--reason', 'oversized', '--after-groom', 'sha-essai-123');
    expect(r.code).toBe(0);
    expect(milestoneOf('features/0001_a.md')).toBe('parked');
  });

  it('PARKE de plein droit une fiche déjà bloquée (arbitrage humain)', () => {
    const r = run('0002', '--reason', 'review');
    expect(r.code).toBe(0);
    expect(milestoneOf('features/0002_b.md')).toBe('parked');
  });
});
