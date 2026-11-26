/**
 * Les croisements de l'écran Process (fiche 20261126170000108) : qui appelle qui, agents par étape,
 * commandes partagées, niveaux. Tout vient du contrat `ezk process show --json` ; rien n'est écrit à la main.
 */
import { describe, expect, it } from 'vitest';
import { agentMatrix, callLinks, commandTable, tierLabel } from './processCrossings.js';
import { processShowExample } from './testing/processShowExample.js';

const contract = processShowExample();

describe('callLinks — une compétence en appelle d’autres', () => {
  it('une ligne par compétence, ses cibles venues des liens publiés', () => {
    const rows = callLinks(contract);
    expect(rows.map((r) => r.skill.id)).toEqual(contract.skills.map((s) => s.id));
    const backlog = rows.find((r) => r.skill.id === 'ezk-backlog');
    expect(backlog?.targets.map((t) => t.skill.id)).toEqual(['ezk-sprint']);
    expect(backlog?.targets[0]?.libelle).toBe('Le lot de fiches prêtes part en sprint.');
  });

  it('une compétence sans lien sortant a une liste vide, pas une cible inventée', () => {
    expect(callLinks(contract).find((r) => r.skill.id === 'ezk-archive')?.targets).toEqual([]);
  });

  it('un lien vers une compétence inconnue est écarté', () => {
    const odd = { ...contract, liens: [{ de: 'ezk-backlog', vers: 'fantome', libelle: 'x' }] };
    expect(callLinks(odd).find((r) => r.skill.id === 'ezk-backlog')?.targets).toEqual([]);
  });
});

describe('agentMatrix — un agent joue dans plusieurs étapes', () => {
  it('range chaque agent par compétence avec ses étapes, et son total', () => {
    const rows = agentMatrix(contract, []);
    const reviewer = rows.find((r) => r.agent === 'ezk-reviewer');
    expect(reviewer?.total).toBe(1);
    expect(reviewer?.bySkill['ezk-sprint']?.map((e) => `${e.num} · ${e.titre}`)).toEqual(['7 · Revue adverse']);
    const qa = rows.find((r) => r.agent === 'ezk-qa');
    expect(qa?.total).toBe(3);
    expect(qa?.bySkill['ezk-retro']?.map((e) => e.titre)).toEqual(['Round-robin']);
  });

  it('le plus occupé d’abord ; un agent connu d’ailleurs mais sans étape arrive à 0', () => {
    const rows = agentMatrix(contract, ['ezk-chef', 'ezk-qa']);
    expect(rows[0]?.total).toBeGreaterThanOrEqual(rows[1]?.total ?? 0);
    expect(rows.at(-1)).toMatchObject({ agent: 'ezk-chef', total: 0 });
    expect(rows.filter((r) => r.agent === 'ezk-qa')).toHaveLength(1);
  });
});

describe('commandTable — une commande sert à plusieurs compétences', () => {
  it('liste les commandes de chaque compétence, une fois chacune', () => {
    const sprint = commandTable(contract).find((r) => r.skill.id === 'ezk-sprint');
    expect(sprint?.commands.map((c) => c.command)).toEqual(['/ezk-sprint', '/ezk-ci']);
  });

  it('dit « aussi » pour une commande lancée par une autre compétence', () => {
    const rows = commandTable(contract);
    const add = (id: string) => rows.find((r) => r.skill.id === id)?.commands.find((c) => c.command === '/ezk-backlog add');
    expect(add('ezk-backlog')?.alsoIn.map((s) => s.id)).toEqual(['ezk-retro']);
    expect(add('ezk-retro')?.alsoIn.map((s) => s.id)).toEqual(['ezk-backlog']);
  });
});

describe('tierLabel', () => {
  it('traduit les trois niveaux, et laisse une valeur inconnue telle quelle', () => {
    expect(tierLabel('high')).toBe('performant');
    expect(tierLabel('middle')).toBe('standard');
    expect(tierLabel('low')).toBe('économe');
    expect(tierLabel('enorme')).toBe('enorme');
  });
});
