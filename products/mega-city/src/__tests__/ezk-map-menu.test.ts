import { describe, expect, it } from 'vitest';
import {
  type DiagramEntry,
  FEATURED_SLUG,
  orderDiagrams,
  readMetaTitle,
  renderMenuHtml,
} from '../core/ezk-map-menu.js';

describe('readMetaTitle (fiche 20260825152954193)', () => {
  it('lit la clé anglaise `title:` (guillemets retirés)', () => {
    expect(readMetaTitle('title: "Board d\'avancement — X"\ndate: 2026')).toBe(
      "Board d'avancement — X",
    );
  });

  it('lit AUSSI la clé française `titre:` (les deux coexistent dans le dépôt)', () => {
    expect(readMetaTitle('type: board\ntitre: Le domaine mega-city\n')).toBe(
      'Le domaine mega-city',
    );
  });

  it('renvoie null si aucune clé title/titre (⇒ repli slug côté appelant)', () => {
    expect(readMetaTitle('date: 2026\nlinks:\n  entry: x.html')).toBeNull();
  });

  it('ne confond pas une sous-clé (`links:` avec `entry:`) avec un titre', () => {
    expect(readMetaTitle('links:\n  entry: board.html\n  fiche: ../x.md')).toBeNull();
  });

  it('tolère les guillemets simples et les espaces', () => {
    expect(readMetaTitle("  title:   'Titre espacé'  ")).toBe('Titre espacé');
  });
});

describe('orderDiagrams', () => {
  const mk = (slug: string): DiagramEntry => ({ slug, entry: 'x.html', title: slug });

  it('place la carte méthode en tête, le reste inchangé', () => {
    const items = [mk('avancement'), mk(FEATURED_SLUG), mk('domaine-mega-city')];
    expect(orderDiagrams(items).map((d) => d.slug)).toEqual([
      FEATURED_SLUG,
      'avancement',
      'domaine-mega-city',
    ]);
  });

  it('reste stable si la carte méthode est absente', () => {
    const items = [mk('avancement'), mk('qualite-deploiement')];
    expect(orderDiagrams(items).map((d) => d.slug)).toEqual([
      'avancement',
      'qualite-deploiement',
    ]);
  });
});

describe('renderMenuHtml', () => {
  const items: DiagramEntry[] = [
    { slug: 'methode-mega-city', entry: 'methode.svg', title: 'La méthode en une carte' },
    { slug: 'avancement', entry: 'board.html', title: "Board d'avancement" },
  ];

  it('rend un lien cliquable par carte, vers son entrée', () => {
    const html = renderMenuHtml(items);
    expect(html).toContain('href="/diagrams/methode-mega-city/methode.svg"');
    expect(html).toContain('href="/diagrams/avancement/board.html"');
    expect(html).toContain('La méthode en une carte');
    expect(html).toContain("Board d'avancement");
  });

  it('met en avant la 1re carte (featured)', () => {
    const html = renderMenuHtml(items);
    expect(html).toMatch(/class="carte featured"/);
    // Une seule carte featured (la tête).
    expect(html.match(/carte featured/g)).toHaveLength(1);
  });

  it('échappe le texte de titre (anti-injection HTML)', () => {
    const html = renderMenuHtml([
      { slug: 's', entry: 'e.html', title: 'X <img onerror=alert(1)> Y' },
    ]);
    expect(html).not.toContain('<img onerror');
    expect(html).toContain('&lt;img onerror');
  });

  it('rend un état vide propre si aucune carte', () => {
    expect(renderMenuHtml([])).toContain('Aucune carte');
  });
});
