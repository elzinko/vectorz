/**
 * Une sortie JSON de plus de 64 Ko arrive entière à travers un tuyau (fiche 20261031160441267).
 *
 * En clair : `console.log` suivi de `process.exit` coupait la sortie à 65 536 octets quand elle part
 * dans un tuyau (pipe), ce que fait mission control. Constaté le 2026-11-01 : `ezk backlog show --json`
 * sur muti sortait un JSON illisible. Ce test lance les deux commandes du contrat sur un faux projet
 * de 300 fiches, et lit leur sortie par un tuyau, comme un consommateur.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');
const FICHES = 300;
const PIPE_BUFFER = 65_536;

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'json-output-large-'));
  mkdirSync(join(root, 'features'), { recursive: true });
  const contexte = 'Un contexte assez long pour grossir la sortie. '.repeat(10);
  for (let i = 0; i < FICHES; i++) {
    const id = `2099020100${String(i).padStart(7, '0')}`;
    writeFileSync(
      join(root, 'features', `${id}_fiche-${i}.md`),
      `---\nid: "${id}"\ntitle: Une fiche de test numéro ${i} avec un titre assez long\npriority: P2\nstatus: idea\nlabels: [test, sortie]\n---\n\n## En clair\n\nFiche ${i}.\n\n## Contexte / Problème\n\n${contexte}\n`,
    );
  }
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

/** La sortie d'une commande, lue par un tuyau, comme le ferait mission control. */
function pipedJson(script: string, args: string[]): { size: number; data: Record<string, unknown> } {
  const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', script), ...args, '--root', root], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  expect(r.status, r.stderr).toBe(0);
  return { size: Buffer.byteLength(r.stdout), data: JSON.parse(r.stdout) };
}

describe('une sortie JSON de plus de 64 Ko arrive entière', () => {
  it('ezk backlog show --json : les 300 fiches, JSON complet', () => {
    const { size, data } = pipedJson('backlog-show.ts', ['--json']);
    expect(size).toBeGreaterThan(PIPE_BUFFER);
    expect((data.fiches as unknown[]).length).toBe(FICHES);
  });

  it('ezk board show --json : les 300 fiches actives, JSON complet', () => {
    const { size, data } = pipedJson('avancement.ts', ['--json']);
    expect(size).toBeGreaterThan(PIPE_BUFFER);
    expect((data.actives as unknown[]).length).toBe(FICHES);
  });
});
