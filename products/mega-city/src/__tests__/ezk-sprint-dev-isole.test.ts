/**
 * Contrat du développeur délégué isolé (fiche 20261117114426425).
 *
 * L'outil place souvent `ezk-dev` dans son propre dossier de travail, parti d'une vieille version de
 * main. ezk-sprint doit le prévoir dans le brief et décrire le rapatriement par patch : une consigne
 * de SKILL.md qu'aucun test ne garde disparaît sans bruit.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skill = readFileSync(join(megaCity, 'skills', 'ezk-sprint', 'SKILL.md'), 'utf8');
const section = skill.slice(skill.indexOf('### Le développeur délégué travaille dans son dossier isolé'));

describe('ezk-sprint — le développeur délégué isolé', () => {
  it('a sa section, et l’étape TDD y renvoie', () => {
    expect(skill).toContain('### Le développeur délégué travaille dans son dossier isolé');
    const tdd = skill.split('\n').find((l) => l.startsWith('4. **TDD POC**')) ?? '';
    expect(tdd).toContain('dossier isolé');
  });

  it('le brief place le développeur sur le commit de la story, sans commit de sa part', () => {
    expect(section).toContain('git checkout --detach <sha>');
    expect(section).toContain('pnpm install --frozen-lockfile');
    expect(section).toContain('Ne committe pas');
    expect(section).not.toMatch(/travaille uniquement dans le dossier de la session/i);
  });

  it('décrit le rapatriement par patch, en une étape avec ses commandes', () => {
    expect(section).toContain('diff --cached --binary <sha>');
    expect(section).toContain('git apply --check');
    expect(section).toContain('git worktree remove --force');
  });
});
