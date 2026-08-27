import { describe, expect, it } from 'vitest';
import { type MdBlock, parseBlocks, stripFrontMatter, stripInline } from '../markdown-lite.js';

describe('markdown-lite — parseur block-level pur (fiche 20260826225817193)', () => {
  it('retire le front-matter (LF et CRLF)', () => {
    expect(stripFrontMatter('---\nid: 1\n---\nCorps')).toBe('Corps');
    expect(stripFrontMatter('---\r\nid: 1\r\n---\r\nCorps')).toBe('Corps');
    expect(stripFrontMatter('pas de front-matter')).toBe('pas de front-matter');
  });

  it('découpe titres, paragraphes, listes et blocs de code', () => {
    const md = '---\nid: 1\n---\n## Titre\n\nUn para.\n\n- a\n- b\n\n```\ncode\nligne\n```\n';
    expect(parseBlocks(md)).toEqual<MdBlock[]>([
      { kind: 'h', text: 'Titre' },
      { kind: 'p', text: 'Un para.' },
      { kind: 'li', text: 'a' },
      { kind: 'li', text: 'b' },
      { kind: 'code', text: 'code\nligne' },
    ]);
  });

  it('gère le CRLF (pas de blocs fantômes)', () => {
    expect(parseBlocks('## T\r\n\r\nP\r\n')).toEqual<MdBlock[]>([
      { kind: 'h', text: 'T' },
      { kind: 'p', text: 'P' },
    ]);
  });

  it('tolère un bloc de code jamais refermé (ne perd pas le contenu)', () => {
    const blocks = parseBlocks('avant\n```\ncode sans fin');
    expect(blocks).toContainEqual({ kind: 'p', text: 'avant' });
    expect(blocks).toContainEqual({ kind: 'code', text: 'code sans fin' });
  });

  it('XSS : le balisage reste du TEXTE brut (inerte via textContent côté vue)', () => {
    const blocks = parseBlocks('<script>alert(1)</script>\n\n- <img src=x onerror=alert(2)>');
    // Aucun HTML produit : les blocs portent la chaîne LITTÉRALE — rendue en textContent, inerte.
    expect(blocks[0]).toEqual({ kind: 'p', text: '<script>alert(1)</script>' });
    expect(blocks[1]).toEqual({ kind: 'li', text: '<img src=x onerror=alert(2)>' });
  });

  it('stripInline aplati emphase et liens', () => {
    expect(stripInline('**gras** et `code` et [texte](http://x)')).toBe('gras et code et texte');
  });
});
