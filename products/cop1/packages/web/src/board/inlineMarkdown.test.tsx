/**
 * Le rendu en ligne du Markdown d'une fiche (fiche 20261103191932074) : gras, italique et code mis en
 * forme, jamais de HTML interprété, un signe sans partenaire laissé tel quel.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FicheModal } from './FicheModal.js';
import { inlineMarkdown, markdownBlocks } from './inlineMarkdown.js';
import type { FicheDetail } from './types.js';

afterEach(cleanup);

const show = (text: string) =>
  render(<p>{inlineMarkdown(text)}</p>).container.firstElementChild as HTMLElement;

describe('inlineMarkdown', () => {
  it('met en forme le gras, l’italique et le code, sans leurs signes', () => {
    const p = show('un **gras**, un *italique* et du `code`');
    expect(p.textContent).toBe('un gras, un italique et du code');
    expect(p.querySelector('b')?.textContent).toBe('gras');
    expect(p.querySelector('i')?.textContent).toBe('italique');
    expect(p.querySelector('code')?.textContent).toBe('code');
  });

  it('un gras qui passe à la ligne reste du gras, pas d’un paragraphe à l’autre', () => {
    expect(show('**comment une\nméthode**').querySelector('b')?.textContent).toBe('comment une\nméthode');
    expect(show('**début\n\nfin**').querySelector('b')).toBeNull();
  });

  it('un glob ou un calcul écrit hors code reste du texte', () => {
    for (const text of ['lance src/**/*.ts ici', 'vaut 5*4*3', 'a/*.md et b/*.ts', 'mot*colle*mot']) {
      const p = show(text);
      expect(p.querySelector('i')).toBeNull();
      expect(p.textContent).toBe(text);
    }
    expect(show('(le *pourquoi*)').querySelector('i')?.textContent).toBe('pourquoi');
  });

  it('laisse les astérisques du code intacts', () => {
    const p = show('lance `ls *.md` ici');
    expect(p.querySelector('code')?.textContent).toBe('ls *.md');
    expect(p.querySelector('i')).toBeNull();
  });

  it('un signe sans partenaire reste affiché', () => {
    expect(show('a * b et un ` seul').textContent).toBe('a * b et un ` seul');
    expect(show('**ouvert sans fin').textContent).toBe('**ouvert sans fin');
  });

  it('un texte qui contient du HTML l’affiche comme du texte', () => {
    const p = show('<img src=x onerror=alert(1)> et <b>pas du gras</b>');
    expect(p.querySelector('img')).toBeNull();
    expect(p.querySelector('b')).toBeNull();
    expect(p.textContent).toBe('<img src=x onerror=alert(1)> et <b>pas du gras</b>');
  });
});

describe('FicheModal — le Markdown de la fiche', () => {
  const fiche: FicheDetail = {
    id: '20261103191932074',
    title: 'Une fiche',
    prio: 'P3',
    status: 'idea',
    ver: '',
    enclair: 'le **gras** compte',
    ctx: 'un *mot* et du `code`',
    crit: ['un critère **fort**'],
    verif: 'pnpm `brut` **brut**',
  };

  it('met en forme « En clair », le contexte et les critères, garde « Comment vérifier » brut', () => {
    render(<FicheModal fiche={fiche} onClose={() => {}} onOpenPage={() => {}} />);
    expect(screen.getByText('gras').tagName).toBe('B');
    expect(screen.getByText('mot').tagName).toBe('I');
    expect(screen.getByText('code').tagName).toBe('CODE');
    expect(screen.getByText('fort').tagName).toBe('B');
    expect(screen.getByText('pnpm `brut` **brut**')).toBeTruthy();
  });
});

// fiche 20261103203943912 — les paragraphes et les listes à puces du contexte
describe('markdownBlocks', () => {
  const blocks = (text: string) =>
    render(<div>{markdownBlocks(text)}</div>).container.firstElementChild as HTMLElement;

  it('une liste à puces devient une liste, un point par ligne, sans les tirets', () => {
    const d = blocks('Avant la liste :\n- un **point**\n* deux\nAprès la liste.');
    const items = [...d.querySelectorAll('ul.mdlist > li')].map((li) => li.textContent);
    expect(items).toEqual(['un point', 'deux']);
    expect(d.querySelector('li b')?.textContent).toBe('point');
    expect([...d.querySelectorAll('p')].map((p) => p.textContent)).toEqual(['Avant la liste :', 'Après la liste.']);
  });

  it('une ligne vide sépare deux paragraphes', () => {
    const d = blocks('premier\nsuite du premier\n\nsecond');
    expect([...d.querySelectorAll('p')].map((p) => p.textContent)).toEqual(['premier\nsuite du premier', 'second']);
  });

  it('une ligne en retrait prolonge le point précédent', () => {
    const d = blocks('- un point\n  qui continue\n- un autre');
    expect([...d.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['un point\nqui continue', 'un autre']);
  });

  it('« -- » ou « -x » en début de ligne n’ouvre pas de liste', () => {
    const d = blocks('-- un tiret double\n-x collé');
    expect(d.querySelector('ul')).toBeNull();
    expect(d.textContent).toBe('-- un tiret double\n-x collé');
  });

  it('un point qui contient du HTML l’affiche comme du texte', () => {
    const d = blocks('- <img src=x onerror=alert(1)>');
    expect(d.querySelector('img')).toBeNull();
    expect(d.querySelector('li')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('la fenêtre d’une fiche montre la liste de son contexte', () => {
    const fiche: FicheDetail = {
      id: '20261103203943912',
      title: 'Une fiche à liste',
      prio: 'P3',
      status: 'idea',
      ver: '',
      enclair: '',
      ctx: 'Trois choses :\n- Le guide\n- Les package.json\n- Six fonctions',
      crit: [],
      verif: '',
    };
    render(<FicheModal fiche={fiche} onClose={() => {}} onOpenPage={() => {}} />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      expect.arrayContaining(['Le guide', 'Les package.json', 'Six fonctions']),
    );
  });
});
