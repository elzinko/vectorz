/**
 * recipe-frontmatter — le front-matter d'un brouillon de recette, émis par la lib YAML.
 *
 * Règle `development/yaml-emission-via-lib` : jamais de concaténation de chaînes. Vécu : un titre
 * nu contenant un antislash (`C:\dossier`) ou un guillemet donnait un YAML invalide, invisible aux
 * fixtures « simples ». Ici chaque sortie est RE-PARSÉE par deux vrais parseurs (`yaml`, et
 * `gray-matter` qui s'appuie sur js-yaml), jamais comparée à une chaîne seulement.
 */
import matter from 'gray-matter';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { recipeFrontMatter } from '../recipe-frontmatter.js';

const base = {
  id: '20260830000000101',
  title: 'Titre de test — feature-test',
  source: "TODO(jugement) — voir PR #999 (`gh pr view 999` pour le détail)",
  today: '2026-08-26',
};

/** Le bloc entre les deux `---`, tel que l'ouvrent les deux parseurs. */
const body = (fm: string): string => fm.replace(/^---\n/, '').replace(/\n---\n$/, '\n');

describe('recipeFrontMatter — format stable pour les cas bénins', () => {
  it('reproduit exactement l’ancien bloc émis par echo (les lecteurs awk et grep des recettes en dépendent)', () => {
    expect(recipeFrontMatter(base)).toBe(
      [
        '---',
        'id: "20260830000000101"',
        'title: "Titre de test — feature-test"',
        'makes: "TODO(jugement) — ce que cette recette fabrique (une ligne)"',
        'source: "TODO(jugement) — voir PR #999 (`gh pr view 999` pour le détail)"',
        'composes: [] # TODO(jugement) — rules composées (idiome ADR-0012/0025)',
        'profile: # TODO(jugement) — profil référencé, si pertinent',
        'status: draft',
        'home: central',
        'created: 2026-08-26',
        'updated: 2026-08-26',
        '---',
        '',
      ].join('\n'),
    );
  });
});

describe('recipeFrontMatter — titres hostiles : YAML valide pour les deux parseurs, titre restitué', () => {
  const hostiles: Record<string, string> = {
    'deux-points et dièse': 'Fix: le deux-points # et le dièse',
    'antislash (nu dans la fiche)': 'Fix C:\\dossier\\nouveau',
    'guillemets doubles': 'Il a dit "go" puis "stop"',
    'apostrophes': "L'été d'Élodie — c'est l'heure",
    'accents et emoji': 'Éléphant déjà vu ✓ 🚀',
    'commence par un caractère spécial': '- [x] @rien % ! & * ? | >',
    'ressemble à un nombre ou un booléen': 'true',
    'très long (pas de repli de ligne)': `${'mot '.repeat(60)}fin`,
    'saut de ligne glissé': 'ligne un\nligne deux',
  };

  for (const [label, title] of Object.entries(hostiles)) {
    it(`${label}`, () => {
      const fm = recipeFrontMatter({ ...base, title });
      expect(parse(body(fm)).title, 'parseur yaml').toBe(title);
      expect(matter(fm).data.title, 'parseur gray-matter (js-yaml)').toBe(title);
    });
  }

  it('un titre très long tient sur UNE ligne (les lecteurs awk lisent ligne à ligne)', () => {
    const fm = recipeFrontMatter({ ...base, title: `${'mot '.repeat(60)}fin` });
    const titleLines = fm.split('\n').filter((l) => l.startsWith('title:'));
    expect(titleLines).toHaveLength(1);
    expect(fm.split('\n').some((l) => l.startsWith('makes:'))).toBe(true);
  });

  it('source hostile (backticks, #, :, guillemets) : valide et restituée', () => {
    const source = 'TODO : voir PR #12 (`gh pr view 12`) — "best-effort" \\ fin';
    const fm = recipeFrontMatter({ ...base, source });
    expect(parse(body(fm)).source).toBe(source);
    expect(matter(fm).data.source).toBe(source);
  });

  it('l’id reste une CHAÎNE de 17 chiffres pour les deux parseurs (jamais un nombre)', () => {
    const fm = recipeFrontMatter(base);
    expect(parse(body(fm)).id).toBe('20260830000000101');
    expect(matter(fm).data.id).toBe('20260830000000101');
  });

  it('les autres champs gardent leur valeur : statut, dépôt, dates, liste vide, profil vide', () => {
    const data = parse(body(recipeFrontMatter(base)));
    expect(data.status).toBe('draft');
    expect(data.home).toBe('central');
    expect(data.composes).toEqual([]);
    expect(data.profile).toBeNull();
    expect(String(data.created)).toContain('2026-08-26');
  });
});
