/**
 * Le sha de livraison vient de la ligne INTEGRATED du squash local (fiche 20261117150620910) :
 * lire HEAD après coup donnerait le commit d'une autre session qui aurait committé entre-temps.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skill = readFileSync(join(megaCity, 'skills', 'ezk-sprint', 'SKILL.md'), 'utf8');
const shipMerge = readFileSync(join(megaCity, 'skills', 'ezk-pr', 'scripts', 'ship-merge.sh'), 'utf8');

describe('ezk-sprint — le sha de livraison vient de la ligne INTEGRATED', () => {
  it('l’étape d’intégration dit de lire INTEGRATED, pas HEAD après coup', () => {
    const step = skill.split('\n').find((l) => l.startsWith('10. **Intégration')) ?? '';
    expect(step).toContain('INTEGRATED: <sha> <branche>');
    expect(step).toContain('jamais `git rev-parse HEAD` après coup');
  });

  it('le squash local imprime cette ligne', () => {
    expect(shipMerge).toContain('echo "INTEGRATED: $integrated $branch"');
  });
});
