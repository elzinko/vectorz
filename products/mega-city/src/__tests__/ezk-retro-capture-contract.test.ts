/**
 * Contrat du skill `ezk-retro` sur la capture (fiche 0080).
 *
 * En clair : le texte du skill est ce que lit l'agent qui tient la rétro. Ce test vérifie que le
 * skill exige la capture, pointe vers son gabarit et son extracteur, nomme les cibles d'une règle,
 * et que le gabarit existe, ouvre par « En clair » et décrit les mêmes valeurs que l'extracteur.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RETRO_KINDS, RETRO_STATUSES } from '../core/retro-capture.js';

const here = dirname(fileURLToPath(import.meta.url));
const mega = resolve(here, '../..');
const skillDir = join(mega, 'skills', 'ezk-retro');
const skill = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
const templatePath = join(skillDir, 'references', 'capture-template.md');

describe('ezk-retro — la capture est obligatoire', () => {
  it('exige la capture au temps 5, avec son gabarit et sa validation', () => {
    expect(skill).toContain('La capture (obligatoire)');
    expect(skill).toContain('references/capture-template.md');
    expect(skill).toContain('retro captures --check');
    expect(skill).toMatch(/PR de\s+rangement\s+\*\*cite la capture\*\*/);
  });

  it('déclare la règle du trio gabarit + extracteur + rendu', () => {
    const head = skill.slice(0, skill.indexOf('\n---', 4));
    expect(head).toContain('documentation-guidelines/readable-deliverable-trio');
  });

  it('nomme les cibles d’une règle et le lien explicite qui porte la portée', () => {
    for (const word of ['global', 'agent:<nom>', 'skill:<nom>', 'interactions:', 'applies:']) {
      expect(skill, word).toContain(word);
    }
  });

  it('dit quand proposer une feature et ne pré-remplit jamais la case du PO', () => {
    expect(skill).toContain('Quand proposer une `feature`');
    expect(skill).toMatch(/jamais pré-remplie/);
  });
});

describe('le gabarit de capture', () => {
  const template = readFileSync(templatePath, 'utf8');

  it('existe et ouvre par « En clair »', () => {
    expect(existsSync(templatePath)).toBe(true);
    expect(template).toContain('**En clair :**');
  });

  it('décrit les mêmes natures et les mêmes statuts que l’extracteur', () => {
    for (const kind of RETRO_KINDS) expect(template, kind).toContain(`\`${kind}\``);
    for (const status of RETRO_STATUSES) expect(template, status).toContain(status);
  });
});

describe('retro:captures --check — la commande', { timeout: 30_000 }, () => {
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  const model = readFileSync(join(mega, '..', '..', 'docs', 'captures', '2026-07-18-retro-cinq-sprints.md'), 'utf8');
  const check = (path: string): { code: number | null; out: string; err: string } => {
    const r = spawnSync(process.execPath, [tsx, join(mega, 'bin', 'retro-captures.ts'), '--check', path], { encoding: 'utf8', cwd: mega });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };

  it('valide une capture au bon nom et dit combien de décisions elle porte', () => {
    const dir = mkdtempSync(join(tmpdir(), 'retro-'));
    const file = join(dir, '2026-10-01-retro-essai.md');
    writeFileSync(file, model);
    const r = check(file);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^OK .*2026-10-01-retro-essai\.md \(7 décisions\)/);
  });

  it('refuse une capture valide au mauvais nom : elle resterait invisible de la liste', () => {
    const dir = mkdtempSync(join(tmpdir(), 'retro-'));
    const file = join(dir, 'retro.md');
    writeFileSync(file, model);
    const r = check(file);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/nom du fichier — AAAA-MM-JJ-retro-<slug>\.md attendu/);
    expect(r.out).not.toMatch(/^OK/);
  });
});
