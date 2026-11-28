/** annuaireModel — l'Annuaire ne montre que ce que la méthode publie (fiche 20261128093846629). */
import { describe, expect, it } from 'vitest';
import {
  type HelpData,
  NON_PUBLIE,
  agentRows,
  commandName,
  filterCommands,
  filterRules,
  litSesReglesTexte,
  profileRows,
  ruleCounts,
  skillRows,
  warnings,
} from './annuaireModel.js';
import type { LawData, LawRule } from './lawModel.js';

const rule = (id: string, portee: LawRule['portee'], over: Partial<LawRule> = {}): LawRule => ({
  id,
  titre: id,
  niveau: 'SHOULD',
  categorie: id.split('/')[0] ?? '',
  fichier: `r/${id}.md`,
  bundles: [],
  profils: [],
  appliqueePar: [],
  verifieePar: [],
  portee,
  ...over,
});
const law = (over: Partial<LawData> = {}): LawData => ({
  comptes: { total: 4, partout: 1, projet: 0, demarrage: 1, citee: 0, rangee: 1, orpheline: 1 },
  regles: [
    rule('a/x', 'partout', { bundles: ['base'] }),
    rule('b/y', 'demarrage', { bundles: ['dod'], appliqueePar: ['skill:s1'] }),
    rule('a/z', 'rangee', { bundles: ['dod'] }),
    rule('c/o', 'orpheline'),
  ],
  objets: [
    { id: 'skill:s1', type: 'skill', litSesRegles: true, regles: ['b/y', 'a/x'] },
    { id: 'skill:s2', type: 'skill', litSesRegles: false, regles: [] },
    { id: 'agent:s1', type: 'agent', litSesRegles: true, regles: ['b/y'] },
    { id: 'profile:p1', type: 'profile', litSesRegles: false, regles: ['a/x', 'a/z', 'c/o'] },
  ],
  ...over,
});
const help: HelpData = {
  skills: [
    { id: 's1', description: 'Conduit un sprint.' },
    { id: 's2', description: 'Aide.' },
    { id: 's3', description: 'Hors loi.' },
  ],
  agents: [{ id: 's1', description: 'Développe.' }],
  commandes: [
    { domaine: 'law', verbe: 'show', enClair: 'Montre la loi.', script: 'bin/law.ts', ecritLeProjet: false, deprecie: null },
    { domaine: 'pr', verbe: null, enClair: 'Ancien nom.', script: 'bin/pr.ts', ecritLeProjet: true, deprecie: 'demo show' },
  ],
};

describe('skillRows / agentRows', () => {
  it('croise la description de l’aide avec les règles de la loi ; sans la loi, non publié', () => {
    const rows = skillRows(help, law());
    expect(rows[0]).toMatchObject({ id: 's1', aussiAgent: true, litSesRegles: true, nbRegles: 2 });
    expect(rows[1]).toMatchObject({ aussiAgent: false, litSesRegles: false, nbRegles: 0 });
    expect(rows[2]).toMatchObject({ litSesRegles: null, nbRegles: null });
    expect(skillRows(help, null).every((r) => r.litSesRegles === null)).toBe(true);
    expect(agentRows(help, law())[0]).toMatchObject({ aussiSkill: true, litSesRegles: true, nbRegles: 1 });
  });

  it('dit « oui · N règles », « non » ou « non publié »', () => {
    expect(litSesReglesTexte(true, 5)).toBe('oui · 5 règles');
    expect(litSesReglesTexte(true, 1)).toBe('oui · 1 règle');
    expect(litSesReglesTexte(false, 0)).toBe('non');
    expect(litSesReglesTexte(null, null)).toBe(NON_PUBLIE);
  });
});

describe('règles', () => {
  it('les comptes viennent de la méthode : appliquées, nulle part, citées', () => {
    expect(ruleCounts(law())).toEqual({ total: 4, appliquees: 2, nullePart: 2, citees: 0 });
  });

  it('filtre par effet, paquet, catégorie et recherche', () => {
    const regles = law().regles;
    const none = { effet: null, paquet: '', categorie: '', query: '' } as const;
    expect(filterRules(regles, none)).toHaveLength(4);
    expect(filterRules(regles, { ...none, effet: 'sans-effet' }).map((r) => r.id)).toEqual(['a/z']);
    expect(filterRules(regles, { ...none, effet: 'orpheline' }).map((r) => r.id)).toEqual(['c/o']);
    expect(filterRules(regles, { ...none, paquet: 'dod' }).map((r) => r.id)).toEqual(['b/y', 'a/z']);
    expect(filterRules(regles, { ...none, categorie: 'a' }).map((r) => r.id)).toEqual(['a/x', 'a/z']);
    expect(filterRules(regles, { ...none, query: 'C/O' }).map((r) => r.id)).toEqual(['c/o']);
  });
});

describe('profils', () => {
  it('un profil publié donne son nom et son nombre de règles', () => {
    expect(profileRows(law())).toEqual([{ nom: 'p1', nbRegles: 3 }]);
  });
});

describe('commandes', () => {
  it('nomme « domaine verbe », ou le domaine seul', () => {
    const [show, pr] = help.commandes;
    expect(commandName(show as never)).toBe('law show');
    expect(commandName(pr as never)).toBe('pr');
  });

  it('filtre par domaine et par recherche dans le nom ou le résumé', () => {
    expect(filterCommands(help.commandes, 'law', '')).toHaveLength(1);
    expect(filterCommands(help.commandes, '', 'ancien')).toHaveLength(1);
    expect(filterCommands(help.commandes, '', 'law show')).toHaveLength(1);
    expect(filterCommands(help.commandes, 'pr', 'loi')).toHaveLength(0);
  });
});

describe('warnings', () => {
  it('dit les règles sans effet quand les comptes en publient', () => {
    expect(warnings(law())).toEqual([
      { id: 'regles-sans-effet', text: '2 règles sur 4 sans effet : 1 rangée dans un paquet que rien ne lit, 1 orpheline' },
    ]);
  });

  it('aucun avertissement sans règle sans effet, et rien d’inventé sans la loi', () => {
    expect(warnings(law({ comptes: { total: 4, partout: 4, projet: 0, demarrage: 0, citee: 0, rangee: 0, orpheline: 0 } }))).toEqual([]);
    expect(warnings(null)).toEqual([]);
  });
});
