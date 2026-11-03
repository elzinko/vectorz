/**
 * Le rendu en ligne du Markdown d'une fiche (fiche 20261103191932074) : gras, italique et code mis en
 * forme, jamais de HTML interprété, un signe sans partenaire laissé tel quel.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FicheModal } from './FicheModal.js';
import { inlineMarkdown } from './inlineMarkdown.js';
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
