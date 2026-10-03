/**
 * Run autonome transparent (fiche 20260906122942607) : le câblage de bout en bout.
 *
 * En clair : les deux commandes rendent leur bloc et leurs codes de sortie, les skills disent quand les
 * lancer, et le gabarit décrit les mêmes états que le code. Aucun appel réseau : `--no-github` et
 * `--no-fetch` coupent GitHub et le fetch.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUN_STATES } from '../core/run-report.js';

const here = dirname(fileURLToPath(import.meta.url));
const mega = resolve(here, '../..');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');
const read = (...p: string[]): string => readFileSync(join(mega, ...p), 'utf8');

const bin = (name: string, args: string[]): { code: number | null; out: string; err: string } => {
  const r = spawnSync(process.execPath, [tsx, join(mega, 'bin', name), ...args], { encoding: 'utf8', cwd: mega });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

describe('run:context — la commande', { timeout: 30_000 }, () => {
  it('rend le bloc, le contrat suit les réglages donnés, et sort en 0', () => {
    const r = bin('run-context.ts', ['--no-fetch', '--mode', 'auto', '--delivery', 'per-epic', '--tokens', 'cap', '--fiche', '0080']);
    expect(r.code).toBe(0);
    expect(r.out.split('\n')[0]).toBe('Contexte de run');
    expect(r.out).toContain('--delivery per-epic');
    expect(r.out).toMatch(/PR du lot ouvertes/);
    expect(r.out).toMatch(/cap — je m'arrête au point sûr/);
    expect(r.out).toContain('fiche visée 0080');
  });

  it('refuse une valeur hors liste (code 2) en disant ce qui est permis', () => {
    const r = bin('run-context.ts', ['--no-fetch', '--mode', 'turbo']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/--mode attend auto, manuel/);
  });
});

describe('run:report — la commande', { timeout: 30_000 }, () => {
  const MERGED = '0080|mergée|#277|verte|GO|faite|-';

  it('rend le bilan sans GitHub, en le disant, et sort en 0', () => {
    const r = bin('run-report.ts', ['--no-github', '--no-fetch', '--fiche', MERGED, '--tokens-used', '1200']);
    expect(r.code).toBe(0);
    expect(r.out.split('\n')[0]).toBe('RUN-REPORT');
    expect(r.out).toMatch(/En clair : 1 fiche traitée : 1 mergée/);
    expect(r.out).toMatch(/pris tel quel/);
    expect(r.out).toMatch(/Jetons : 1 200 consommés/);
    expect(r.out).toMatch(/Ce que ça veut dire pour toi : rien à faire/);
  });

  it('refuse une ligne incomplète (code 2) et nomme le champ vide', () => {
    const r = bin('run-report.ts', ['--no-github', '--no-fetch', '--fiche', '0080|mergée|#277||GO|faite|-']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/champ « gate » vide/);
    expect(r.out).toBe('');
  });

  it('refuse une fiche hors mergée sans raison', () => {
    const r = bin('run-report.ts', ['--no-github', '--no-fetch', '--fiche', '0500|bloquée|-|rouge|-|-|-']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/raison obligatoire/);
  });

  it('sans aucune fiche : usage, code 2', () => {
    expect(bin('run-report.ts', ['--no-github']).code).toBe(2);
  });
});

describe('les skills et le gabarit', () => {
  const build = read('skills', 'ezk-product-build', 'SKILL.md');
  const sprint = read('skills', 'ezk-sprint', 'SKILL.md');
  const template = read('skills', 'ezk-product-build', 'references', 'run-report-template.md');

  it('ezk-product-build ouvre par le contexte de run et clôt par le RUN-REPORT', () => {
    expect(build).toContain('0. **Ouverture — le contexte de run**');
    expect(build).toContain('ezk run context');
    expect(build).toContain('6. **Clôture — le RUN-REPORT.**');
    expect(build).toContain('ezk run report');
    expect(build).toMatch(/plus d'un\s+sprint/);
    expect(build).toContain('references/run-report-template.md');
    expect(build.slice(0, build.indexOf('\n---', 4))).toContain('documentation-guidelines/readable-deliverable-trio');
  });

  it('le contrat de l’ouverture nomme ce que le run merge, ses arrêts et son plafond', () => {
    const open = build.slice(build.indexOf('0. **Ouverture'), build.indexOf('1. **Intake**'));
    expect(open).toMatch(/contrat en trois lignes/);
    expect(open).toMatch(/4\s+STOP/);
    expect(open).toMatch(/plafond de jetons/);
    expect(open).toMatch(/ne bloque jamais/);
  });

  it('ezk-sprint, lancé seul, affiche le contexte ; sous product-build il ne le répète pas', () => {
    expect(sprint).toContain('ezk run context');
    expect(sprint).toMatch(/ne le répète pas/);
  });

  it('le gabarit ouvre par « En clair » et décrit les mêmes états que le code', () => {
    expect(template).toContain('**En clair :**');
    for (const state of RUN_STATES) expect(template, state).toContain(`\`${state}\``);
    for (const word of ['ezk run context', 'ezk run report', 'Ce que ça veut dire pour toi']) expect(template, word).toContain(word);
  });
});
