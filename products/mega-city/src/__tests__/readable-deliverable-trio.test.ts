/**
 * Pattern « livrable lisible » : gabarit + extracteur + rendu (fiche 20260825182327490).
 *
 * En clair : la règle recense les livrables destinés à l'humain qui suivent le pattern, avec
 * leurs trois pièces. Ce test vérifie que chaque pièce existe, que chaque gabarit ouvre par
 * « En clair » (le gabarit ne remplace pas la règle de clarté : il l'embarque), et que le skill
 * pris pour exemple, `ezk-archive`, déclare la règle et lie son gabarit au lieu de le recopier.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const mega = resolve(here, '../..'); // products/mega-city
const RULE_ID = 'documentation-guidelines/readable-deliverable-trio';
const RULE_FILE = join(mega, 'rules', 'documentation-guidelines', 'readable-deliverable-trio.md');

interface Instance {
  livrable: string;
  gabarit: string;
  extracteur: string;
  rendu: string;
}

/** Premier chemin entre accents graves d'une cellule. */
const firstPath = (cell: string): string | undefined => /`([^`]+)`/.exec(cell)?.[1];

/** Lignes de la table « Instances connues » d'une règle. */
function parseInstances(rule: string): Instance[] {
  const section = rule.split(/^### /m).find((s) => s.startsWith('Instances connues')) ?? '';
  return section
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length === 4 && !/^-+$/.test(c[0] ?? '') && c[0] !== 'Livrable')
    .map(([livrable = '', gabarit = '', extracteur = '', rendu = '']) => ({
      livrable,
      gabarit,
      extracteur,
      rendu,
    }));
}

/** Problèmes d'une instance : pièce sans chemin, chemin introuvable, gabarit sans « En clair ». */
function instanceProblems(inst: Instance, root: string): string[] {
  const problems: string[] = [];
  const pieces = [
    ['gabarit', inst.gabarit],
    ['extracteur', inst.extracteur],
    ['rendu', inst.rendu],
  ] as const;
  for (const [piece, cell] of pieces) {
    const path = firstPath(cell);
    if (!path) problems.push(`${inst.livrable} : ${piece} sans chemin`);
    else if (!existsSync(join(root, path))) problems.push(`${inst.livrable} : ${piece} introuvable (${path})`);
  }
  const template = firstPath(inst.gabarit);
  if (template && existsSync(join(root, template))) {
    if (!/En clair/.test(readFileSync(join(root, template), 'utf8'))) {
      problems.push(`${inst.livrable} : le gabarit n'ouvre pas par « En clair »`);
    }
  }
  return problems;
}

describe('table des instances — outil de vérification', () => {
  const fixture = (templateBody: string, withExtractor: boolean): { root: string; inst: Instance } => {
    const root = mkdtempSync(join(tmpdir(), 'trio-'));
    mkdirSync(join(root, 'skills'), { recursive: true });
    writeFileSync(join(root, 'skills', 'tpl.md'), templateBody);
    writeFileSync(join(root, 'skills', 'render.md'), 'rendu');
    if (withExtractor) writeFileSync(join(root, 'skills', 'extract.sh'), '#!/bin/sh');
    const inst = {
      livrable: 'démo',
      gabarit: '`skills/tpl.md`',
      extracteur: '`skills/extract.sh`',
      rendu: '`skills/render.md`',
    };
    return { root, inst };
  };

  it('accepte une instance complète dont le gabarit ouvre par « En clair »', () => {
    const { root, inst } = fixture('**En clair :** ...', true);
    expect(instanceProblems(inst, root)).toEqual([]);
  });

  it('nomme l’extracteur introuvable et le gabarit sans « En clair » (sabotage)', () => {
    const { root, inst } = fixture('rien d’utile', false);
    expect(instanceProblems(inst, root)).toEqual([
      'démo : extracteur introuvable (skills/extract.sh)',
      'démo : le gabarit n\'ouvre pas par « En clair »',
    ]);
  });
});

describe('règle documentation-guidelines/readable-deliverable-trio', () => {
  const rule = readFileSync(RULE_FILE, 'utf8');

  it('porte le bon id, en SHOULD, et cite la règle de clarté qu’elle ne remplace pas', () => {
    expect(rule).toMatch(new RegExp(`^id: ${RULE_ID}$`, 'm'));
    expect(rule).toMatch(/^level: SHOULD$/m);
    expect(rule).toContain('human-facing-lisibility');
  });

  it('est rangée dans le bundle base (sinon aucun profil ne la déploie)', () => {
    expect(readFileSync(join(mega, 'bundles', 'base.yml'), 'utf8')).toContain(`- ${RULE_ID}`);
  });

  it('recense au moins le handoff d’ezk-archive et le corps de PR, trois pièces chacun', () => {
    const instances = parseInstances(rule);
    expect(instances.length).toBeGreaterThanOrEqual(2);
    expect(instances.map((i) => firstPath(i.gabarit))).toContain(
      'skills/ezk-archive/references/handoff-template.md',
    );
  });

  it('ne recense que des instances dont les pièces existent et dont le gabarit ouvre par « En clair »', () => {
    const problems = parseInstances(rule).flatMap((i) => instanceProblems(i, mega));
    expect(problems).toEqual([]);
  });
});

describe('ezk-archive, premier livrable relu à la lumière du pattern', () => {
  const md = readFileSync(join(mega, 'skills', 'ezk-archive', 'SKILL.md'), 'utf8');

  it('déclare la règle dans applies:', () => {
    const applies = /^applies:\s*\[([^\]]*)\]/m.exec(md)?.[1] ?? '';
    expect(applies.split(',').map((s) => s.trim())).toContain(RULE_ID);
  });

  it('lie son gabarit au lieu de le recopier', () => {
    expect(md).toContain('references/handoff-template.md');
  });
});
