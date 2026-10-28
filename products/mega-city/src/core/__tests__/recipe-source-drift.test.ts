/**
 * Fiche 20261028130229418 — le garde-fou de dérive, cœur PUR. On éprouve :
 *   - `sourceDrift` : une source locale absente est une dérive ; présente, non ; vide, non (brouillon) ;
 *     l'ordre d'entrée est conservé ;
 *   - `renderSourceDrift` : « En clair » d'abord avec le bon dénominateur, le constat nommé
 *     (origine → id → source), un titre multiligne replié, et la ligne « hors périmètre » honnête.
 */
import { describe, expect, it } from 'vitest';
import {
  type CheckedSource,
  type DriftFinding,
  classifySource,
  renderSourceDrift,
  sourceDrift,
} from '../recipe-source-drift.js';

describe('classifySource — local / externe / brouillon (les pièges de chemin)', () => {
  const root = '/projet';

  it('une source vide (ou blanche) est un brouillon', () => {
    expect(classifySource('', root)).toEqual({ kind: 'draft' });
    expect(classifySource('   ', root)).toEqual({ kind: 'draft' });
  });

  it('une source « maison » (~/…) est externe', () => {
    expect(classifySource('~/git/ailleurs', root)).toEqual({ kind: 'external' });
  });

  it('une source absolue est externe', () => {
    expect(classifySource('/ailleurs/outil', root)).toEqual({ kind: 'external' });
  });

  it('une source relative qui s\'échappe de la racine (../) est externe', () => {
    expect(classifySource('../dehors', root)).toEqual({ kind: 'external' });
  });

  it('le préfixe trompeur ne piège pas : /projet ne « contient » pas /projetbis', () => {
    // resolve('/projet','../projetbis') === '/projetbis' → PAS sous /projet
    expect(classifySource('../projetbis', root)).toEqual({ kind: 'external' });
  });

  it('une source relative sous la racine est locale, avec son chemin absolu résolu', () => {
    expect(classifySource('apps/outil', root)).toEqual({ kind: 'local', abs: '/projet/apps/outil' });
  });

  it('« . » désigne la racine elle-même : locale', () => {
    expect(classifySource('.', root)).toEqual({ kind: 'local', abs: '/projet' });
  });
});

const checked = (over: Partial<CheckedSource> & { id: string }): CheckedSource => ({
  title: `Titre ${over.id}`,
  source: 'apps/outil',
  origin: `recipes/${over.id}.md`,
  exists: true,
  ...over,
});

describe('sourceDrift — une source locale qui ne résout plus', () => {
  it('signale une recette dont la source est absente', () => {
    const out = sourceDrift([checked({ id: '1', exists: false })]);
    expect(out.map((f) => f.id)).toEqual(['1']);
  });

  it('ne signale pas une recette dont la source existe', () => {
    expect(sourceDrift([checked({ id: '1', exists: true })])).toEqual([]);
  });

  it('ne signale pas un brouillon (source vide) même marqué absent', () => {
    // garde de sûreté : le bord n'est pas censé passer un brouillon, mais s'il le fait, pas de dérive.
    expect(sourceDrift([checked({ id: '1', source: '', exists: false })])).toEqual([]);
    expect(sourceDrift([checked({ id: '1', source: '   ', exists: false })])).toEqual([]);
  });

  it('conserve l\'ordre d\'entrée et ne garde que les absents', () => {
    const out = sourceDrift([
      checked({ id: 'a', exists: false }),
      checked({ id: 'b', exists: true }),
      checked({ id: 'c', exists: false }),
    ]);
    expect(out.map((f) => f.id)).toEqual(['a', 'c']);
  });

  it('reporte origine, titre et source sur le constat', () => {
    const out = sourceDrift([
      checked({ id: '9', title: 'Validation', source: 'apps/val', origin: 'apps/val/RECIPE.md', exists: false }),
    ]);
    expect(out[0]).toEqual<DriftFinding>({
      id: '9',
      title: 'Validation',
      source: 'apps/val',
      origin: 'apps/val/RECIPE.md',
    });
  });
});

describe('renderSourceDrift — le rapport', () => {
  const base = { rootLabel: '/p', checkedCount: 0, externalCount: 0, draftCount: 0 };

  it('ouvre par « En clair » avec le compte et le dénominateur vérifié', () => {
    const out = renderSourceDrift({ ...base, checkedCount: 3, findings: [] });
    expect(out).toContain('En clair : 0 recette(s) dont l\'implémentation a disparu, sur 3 vérifiée(s) sous /p');
    expect(out.indexOf('En clair')).toBeLessThan(out.indexOf('Hors périmètre'));
  });

  it('dit « Aucune dérive » quand tout résout', () => {
    const out = renderSourceDrift({ ...base, checkedCount: 2, findings: [] });
    expect(out).toContain('Aucune dérive');
    expect(out).not.toContain('## Recettes dont');
  });

  it('nomme chaque dérive (origine → titre → id → source)', () => {
    const findings: DriftFinding[] = [
      { id: '9', title: 'Validation desktop', source: 'apps/val', origin: 'apps/val/RECIPE.md' },
    ];
    const out = renderSourceDrift({ ...base, checkedCount: 1, findings });
    expect(out).toContain('## Recettes dont le `source:` ne résout plus');
    expect(out).toContain('- apps/val/RECIPE.md — Validation desktop (9) → source: apps/val');
  });

  it('replie un titre multiligne sur une seule ligne', () => {
    const findings: DriftFinding[] = [
      { id: '1', title: 'ligne 1\nligne 2\n  ligne 3', source: 's', origin: 'o' },
    ];
    const out = renderSourceDrift({ ...base, checkedCount: 1, findings });
    expect(out).toContain('ligne 1 ligne 2 ligne 3');
    expect(out).not.toContain('ligne 1\nligne 2');
  });

  it('rend compte des sources hors périmètre sans mentir sur les comptes', () => {
    const out = renderSourceDrift({
      rootLabel: '/p',
      findings: [],
      checkedCount: 1,
      externalCount: 10,
      draftCount: 5,
    });
    expect(out).toContain('Hors périmètre : 10 source(s) externe(s) (chemin absolu ou maison, non vérifié ici), 5 brouillon(s) sans source.');
  });
});
