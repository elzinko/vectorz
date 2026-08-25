import { describe, expect, it } from 'vitest';
import {
  type DiagramEntry,
  FEATURED_SLUG,
  injectNavIntoHtml,
  orderDiagrams,
  readMetaTitle,
  renderMenuHtml,
  renderNavBar,
  renderSvgWrapper,
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

  it('tolère les guillemets simples et les espaces internes', () => {
    expect(readMetaTitle("title:   'Titre espacé'  ")).toBe('Titre espacé');
  });

  it('IGNORE une clé title/titre indentée (sous-clé d’un autre bloc, pas un titre de 1er niveau)', () => {
    expect(readMetaTitle('links:\n  title: piège indenté\n')).toBeNull();
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

  it('met en avant la carte méthode (par identité, pas par position)', () => {
    const html = renderMenuHtml(items);
    expect(html).toMatch(/class="carte featured"/);
    // Une seule carte featured (la méthode).
    expect(html.match(/carte featured/g)).toHaveLength(1);
  });

  it('ne met AUCUNE carte en avant si la méthode est absente (pas de badge trompeur)', () => {
    const html = renderMenuHtml([
      { slug: 'avancement', entry: 'board.html', title: 'Board' },
      { slug: 'qualite-deploiement', entry: 'd.svg', title: 'Qualité' },
    ]);
    expect(html).not.toContain('carte featured');
    expect(html).not.toContain('méthode</span>');
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

describe('navigation dans une carte (fiche 20260825232147620)', () => {
  const items: DiagramEntry[] = [
    { slug: 'avancement', entry: 'board.html', title: "Board d'avancement" },
    { slug: 'domaine-mega-city', entry: 'diagram.svg', title: 'Le domaine' },
  ];

  describe('renderNavBar', () => {
    it('est repliable (<details> + bouton) et rend « ← Retour au menu » + un lien par carte', () => {
      const nav = renderNavBar(items, 'avancement');
      expect(nav).toContain('<details class="ezknav"');
      expect(nav).toContain('<summary'); // le petit bouton qui ouvre
      expect(nav).toContain('href="/"'); // retour au menu
      expect(nav).toContain('← Retour au menu');
      expect(nav).toContain('<a href="/diagrams/avancement/board.html"');
      expect(nav).toContain('<a href="/diagrams/domaine-mega-city/diagram.svg"');
    });

    it('repère la carte courante (aria-current), une seule', () => {
      const nav = renderNavBar(items, 'domaine-mega-city');
      expect(nav).toMatch(/href="\/diagrams\/domaine-mega-city\/diagram\.svg" aria-current="page"/);
      expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    });

    it('échappe les titres (anti-injection)', () => {
      const nav = renderNavBar([{ slug: 's', entry: 'e.html', title: '<img onerror=x>' }], 's');
      expect(nav).not.toContain('<img onerror');
      expect(nav).toContain('&lt;img onerror');
    });
  });

  describe('injectNavIntoHtml', () => {
    it('insère la nav juste avant la dernière </body>', () => {
      const out = injectNavIntoHtml('<body><h1>carte</h1></body>', '<nav>NAV</nav>');
      expect(out).toBe('<body><h1>carte</h1><nav>NAV</nav></body>');
    });

    it('appende si aucune </body> (dégradation propre)', () => {
      expect(injectNavIntoHtml('<svg>...</svg>', 'NAV')).toBe('<svg>...</svg>NAV');
    });
  });

  describe('renderSvgWrapper', () => {
    it('enveloppe le SVG : nav + image pointant le brut, titre échappé', () => {
      const html = renderSvgWrapper('/diagrams/x/y.svg?raw', '<nav>NAV</nav>', 'Titre <b>');
      expect(html).toContain('<nav>NAV</nav>');
      expect(html).toContain('src="/diagrams/x/y.svg?raw"');
      expect(html).toContain('Titre &lt;b&gt;');
      expect(html).not.toContain('Titre <b>');
    });
  });
});
