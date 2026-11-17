/**
 * Le nom en clair d'un objectif, lu dans sa déclaration `features/milestones/<slug>.md` (ADR-0088 §7,
 * fiche 20261114131612572). Le dossier des déclarations n'est jamais lu comme des fiches.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadFiches } from '../fiches.js';
import { loadMilestoneNoms } from '../milestones.js';

let root: string;
const write = (file: string, text: string): void => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'milestones-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('loadMilestoneNoms', () => {
  it('lit le nom de chaque objectif déclaré, par la valeur exacte de son champ `milestone`', () => {
    write('features/milestones/board.md', '---\nmilestone: board\nnom: "Le board dit vrai"\ncreated: 2026-11-17\n---\n');
    write('features/milestones/methode.md', '---\nmilestone: methode-debout\nnom: La méthode tient debout\n---\n');
    expect(loadMilestoneNoms(root)).toEqual(
      new Map([
        ['board', 'Le board dit vrai'],
        ['methode-debout', 'La méthode tient debout'],
      ]),
    );
  });

  it('sans dossier de déclarations : aucun nom, pas une erreur', () => {
    mkdirSync(join(root, 'features'));
    expect(loadMilestoneNoms(root).size).toBe(0);
  });

  it('ignore ce qui n’est pas une déclaration : sans champ `milestone`, autre extension, sous-dossier', () => {
    write('features/milestones/sans-champ.md', '---\nnom: Orphelin\n---\n');
    write('features/milestones/notes.txt', 'milestone: board\nnom: Pas un md\n');
    write('features/milestones/archive/vieux.md', '---\nmilestone: vieux\nnom: Vieux\n---\n');
    expect(loadMilestoneNoms(root).size).toBe(0);
  });
});

describe('loadFiches — les déclarations d’objectif ne sont pas des fiches', () => {
  it('un fichier de features/milestones/ n’est jamais chargé, même si son nom ressemble à une fiche', () => {
    write('features/20990101000000001_une-fiche.md', '---\ntitle: Une fiche\nstatus: idea\nmilestone: 2027-cap\n---\n');
    write('features/milestones/2027-cap.md', '---\nmilestone: 2027-cap\nnom: Le cap 2027\nstatus: idea\n---\n');
    expect(loadFiches(root).map((f) => f.file)).toEqual(['features/20990101000000001_une-fiche.md']);
  });
});
