/**
 * fiche-rows — les onze champs que les vues bash lisaient par `awk`, lus par le loader.
 * On fige ici les cas où un `awk` maison se trompe : valeur quotée avec `#` ou `:`, commentaire en fin
 * de ligne, champ cité dans le CORPS (pas dans le front-matter), produit absent.
 */
import { describe, expect, it } from 'vitest';
import { FIELD_SEP, ROW_FIELDS, ficheRowFields, formatRow } from '../fiche-rows.js';

const fiche = (frontMatter: string, body = 'corps\n'): string => `---\n${frontMatter}\n---\n\n${body}`;

const byName = (text: string, defaultProduct?: string): Record<string, string> =>
  Object.fromEntries(ROW_FIELDS.map((f, i) => [f, ficheRowFields(text, defaultProduct)[i]]));

describe('ficheRowFields — le front-matter, rien que lui', () => {
  it('lit les onze champs dans l’ordre des anciens extract() awk', () => {
    const text = fiche(
      [
        'id: "20260918114726706"',
        'title: Un titre',
        'type: chore',
        'priority: P2',
        'status: ready # notes',
        'pr: "#268"',
        'created: 2026-09-18',
        'version: V0.1',
        'epic:',
        'product: mega-city',
        'milestone: parked',
      ].join('\n'),
    );
    expect(ficheRowFields(text)).toEqual([
      '20260918114726706',
      'Un titre',
      'chore',
      'P2',
      'ready',
      '#268',
      '2026-09-18',
      'V0.1',
      '',
      'mega-city',
      'parked',
    ]);
  });

  it('une valeur quotée garde ses `:` et ses `#` (le # quoté n’est pas un commentaire)', () => {
    const text = fiche('title: "Fix: le deux-points # et le dièse"\npr: "#29"');
    const got = byName(text);
    expect(got.title).toBe('Fix: le deux-points # et le dièse');
    expect(got.pr).toBe('#29');
  });

  it('un commentaire YAML en fin de valeur nue est retiré', () => {
    expect(byName(fiche('status: idea # pas encore groomée')).status).toBe('idea');
  });

  it('un champ cité dans le CORPS n’est pas lu (seul le front-matter compte)', () => {
    const text = fiche('id: "1"\ntitle: Vrai titre', 'status: shipped\npriority: P0\n');
    const got = byName(text);
    expect(got.status).toBe('');
    expect(got.priority).toBe('');
    expect(got.title).toBe('Vrai titre');
  });

  it('champ absent → vide (pas de valeur par défaut, contrairement à loadFiches)', () => {
    const got = byName(fiche('id: "1"\ntitle: T'));
    expect(got.type).toBe('');
    expect(got.status).toBe('');
    expect(got.product).toBe('');
  });

  it('le produit par défaut ne remplace qu’un `product:` vide ou absent', () => {
    expect(byName(fiche('id: "1"'), 'vectorz').product).toBe('vectorz');
    expect(byName(fiche('id: "1"\nproduct:'), 'vectorz').product).toBe('vectorz');
    expect(byName(fiche('id: "1"\nproduct: mega-city'), 'vectorz').product).toBe('mega-city');
  });
});

describe('formatRow — une ligne prête pour `read -r` côté bash', () => {
  it('sépare les onze champs par le séparateur US et tient sur une ligne', () => {
    const row = formatRow(fiche('id: "1"\ntitle: T\nstatus: idea'));
    expect(row.split(FIELD_SEP)).toHaveLength(ROW_FIELDS.length);
    expect(row).not.toMatch(/[\r\n]/);
  });

  it('un séparateur ou un saut de ligne glissé dans une valeur ne décale pas les colonnes', () => {
    const row = formatRow(fiche(`title: "a${FIELD_SEP}b"`));
    expect(row.split(FIELD_SEP)).toHaveLength(ROW_FIELDS.length);
  });
});
