/** lawModel — « ce qui s'applique ici » : règles en vigueur et état des paquets (fiche 20261126170000109). */
import { describe, expect, it } from 'vitest';
import { type LawData, type LawRule, enVigueur, loiProjetInstallee, paquets, reglePar, titreClair } from './lawModel.js';

const rule = (id: string, portee: LawRule['portee'], over: Partial<LawRule> = {}): LawRule => ({
  id,
  titre: id,
  niveau: 'SHOULD',
  fichier: `r/${id}.md`,
  bundles: ['base'],
  profils: [],
  appliqueePar: [],
  verifieePar: [],
  portee,
  ...over,
});
const law = (regles: LawRule[], objets: LawData['objets'] = []): LawData => ({
  comptes: { total: regles.length, partout: 0, projet: 0, demarrage: 0, citee: 0, rangee: 0, orpheline: 0 },
  regles,
  objets,
});

describe('enVigueur', () => {
  it('garde installées, lues au démarrage et propres au projet, avec leur origine', () => {
    const rows = enVigueur(law([rule('a/x', 'partout'), rule('a/y', 'demarrage'), rule('a/z', 'projet'), rule('a/r', 'rangee'), rule('a/o', 'orpheline'), rule('a/c', 'citee')]));
    expect(rows.map((r) => [r.rule.id, r.origine])).toEqual([
      ['a/x', 'installee'],
      ['a/y', 'demarrage'],
      ['a/z', 'projet'],
    ]);
  });
});

describe('titreClair', () => {
  it('garde le titre publié quand il est en clair', () => {
    expect(titreClair(rule('a/x', 'partout', { titre: 'Une phrase claire' }))).toBe('Une phrase claire');
  });
  it('remplace un identifiant technique par son dernier segment en mots', () => {
    expect(titreClair(rule('clean-code/no-dead-code', 'partout'))).toBe('no dead code');
  });
});

describe('reglePar', () => {
  it('dit qui règle la règle, sans inventer un profil', () => {
    expect(reglePar('installee')).toBe('profil lié');
    expect(reglePar('demarrage')).toBe('méthode');
    expect(reglePar('projet')).toBe('projet');
  });
});

describe('loiProjetInstallee', () => {
  it('oui / non quand publié, non publié sinon', () => {
    const base = law([]);
    expect(loiProjetInstallee({ ...base, lois: { projet: { chemin: 'x', installee: true } } })).toBe('oui');
    expect(loiProjetInstallee({ ...base, lois: { projet: { chemin: 'x', installee: false } } })).toBe('non');
    expect(loiProjetInstallee(base)).toBe('non publié');
  });
});

describe('paquets', () => {
  const regles = [
    rule('a/1', 'partout', { bundles: ['base'] }),
    rule('a/2', 'partout', { bundles: ['base'] }),
    rule('b/1', 'demarrage', { bundles: ['dod'], appliqueePar: ['agent:ezk-dev', 'agent:ezk-reviewer'] }),
    rule('c/1', 'demarrage', { bundles: ['mixte'], appliqueePar: ['skill:s'] }),
    rule('c/2', 'rangee', { bundles: ['mixte'] }),
    rule('d/1', 'rangee', { bundles: ['libre'] }),
  ];
  const objets: LawData['objets'] = ['base', 'dod', 'mixte', 'libre'].map((n) => ({
    id: `bundle:${n}`,
    type: 'bundle' as const,
    regles: regles.filter((r) => r.bundles.includes(n)).map((r) => r.id),
  }));
  objets.push({ id: 'skill:s', type: 'skill', regles: [] });
  const rows = paquets(law(regles, objets));
  const by = (n: string) => rows.find((p) => p.nom === n);

  it('une ligne par paquet, jamais un skill ou un agent', () => {
    expect(rows.map((p) => p.nom)).toEqual(['base', 'dod', 'mixte', 'libre']);
  });
  it('installé par la loi quand toutes ses règles sont installées', () => {
    expect(by('base')).toMatchObject({ total: 2, enVigueur: 2, par: 'profil lié', etat: { kind: 'installe', texte: 'installé par la loi' } });
  });
  it('lu au démarrage par les skills et agents quand toutes ses règles le sont', () => {
    expect(by('dod')).toMatchObject({ total: 1, enVigueur: 1, par: 'méthode', etat: { kind: 'lu', texte: 'lu au démarrage par ezk-dev, ezk-reviewer' } });
  });
  it('en partie : N règles sur M en vigueur, réglé par la méthode', () => {
    expect(by('mixte')).toMatchObject({ total: 2, enVigueur: 1, par: 'méthode', etat: { kind: 'partiel', texte: '1 règle sur 2 en vigueur' } });
  });
  it('disponible quand aucune règle ne s’applique, réglé par « — »', () => {
    expect(by('libre')).toMatchObject({ enVigueur: 0, par: '—', etat: { kind: 'disponible', texte: 'disponible' } });
  });
});
