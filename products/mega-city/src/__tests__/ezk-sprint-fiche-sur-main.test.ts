/**
 * La fiche et sa livraison passent dans main aux bons moments (fiche 20261117155420514) : au sprint 11
 * du 17 novembre, une fiche créée sur la branche de session a fait diverger la session de main, et la
 * livraison de la fiche n'est pas arrivée dans main avec le compte rendu.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skill = readFileSync(join(megaCity, 'skills', 'ezk-sprint', 'SKILL.md'), 'utf8');
const lines = skill.split('\n');
const stepZero = lines.findIndex((l) => l.startsWith('0. **Intake'));
const stepOne = lines.findIndex((l, i) => i > stepZero && /^1\. \*\*/.test(l));
const stepTen = lines.find((l) => l.startsWith('10. **Intégration')) ?? '';

describe('ezk-sprint — la fiche et sa livraison passent dans main', () => {
  it('l’étape 0 met dans main une fiche créée pendant la session, avant de couper la branche', () => {
    expect(stepOne).toBeGreaterThan(stepZero);
    const where = lines.slice(stepZero, stepOne).join('\n');
    expect(where).toContain("**Une fiche créée ou groomée pendant la session passe d'abord dans `main`**");
  });

  it('le skill n’a pas d’apostrophe courbe dans ses phrases (fiche 20261117162025203)', () => {
    expect(skill).not.toContain('\u2019');
  });

  it('l’étape 10 met dans main le commit de livraison avant `close`, en mode local', () => {
    expect(stepTen).toContain('**En mode local, le commit de livraison passe dans `main` avant `close`**');
  });
});
