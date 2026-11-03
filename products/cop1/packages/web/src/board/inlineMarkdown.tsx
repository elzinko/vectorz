/**
 * Rendu en ligne du Markdown d'une fiche (fiche 20261103191932074) : le gras `**…**`, l'italique `*…*`
 * et le code `` `…` `` deviennent des éléments React. Aucun HTML n'est injecté : le reste du texte reste
 * du texte, et un signe sans partenaire s'affiche tel quel.
 */
import type { ReactNode } from 'react';

// Le code d'abord : ses astérisques ne sont pas de la mise en forme. Le gras et l'italique peuvent
// passer à la ligne, jamais d'un paragraphe à l'autre (ligne vide). L'italique exige un caractère non
// blanc après l'astérisque ouvrant, pour laisser « a * b » tranquille. Il ne s'ouvre ni ne se ferme
// collé à une lettre, un chiffre ou une barre oblique : un glob (`src/**/*.ts`) ou un calcul (5*4*3)
// écrit hors code reste du texte.
const TOKEN =
  /(`[^`\n]+`|\*\*(?:[^*\n]|\n(?!\n))+\*\*|(?<![\p{L}\p{N}/*])\*[^*\s](?:[^*\n]|\n(?!\n))*\*(?![\p{L}\p{N}/*]))/gu;

export function inlineMarkdown(text: string): ReactNode[] {
  // `split` avec un groupe capturant range les marques reconnues aux places impaires : seules elles
  // sont mises en forme, jamais un texte qui ressemble à une marque sans en être une.
  return text
    .split(TOKEN)
    .map((part, i): ReactNode => {
      if (i % 2 === 0) return part;
      if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
      if (part.startsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>;
      return <i key={i}>{part.slice(1, -1)}</i>;
    })
    .filter((node) => node !== '');
}
