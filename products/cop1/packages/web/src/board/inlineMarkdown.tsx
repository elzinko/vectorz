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

const LIST_ITEM = /^\s*[-*] +(\S.*)$/;

/**
 * Le rendu par blocs d'un texte de fiche (fiche 20261103203943912) : une ligne vide sépare deux
 * paragraphes, des lignes « - … » ou « * … » forment une liste à puces, et une ligne en retrait
 * prolonge le point précédent. Chaque paragraphe et chaque point passent par le rendu en ligne.
 */
export function markdownBlocks(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];
  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push(<p key={blocks.length}>{inlineMarkdown(paragraph.join('\n'))}</p>);
      paragraph = [];
    }
  };
  const flushList = (): void => {
    if (items.length > 0) {
      blocks.push(
        <ul key={blocks.length} className="mdlist">
          {items.map((item, i) => (
            <li key={i}>{inlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      items = [];
    }
  };
  for (const line of text.split('\n')) {
    const item = LIST_ITEM.exec(line);
    if (line.trim() === '') {
      flushParagraph();
      flushList();
    } else if (item?.[1] !== undefined) {
      flushParagraph();
      items.push(item[1]);
    } else if (items.length > 0 && /^\s/.test(line)) {
      items[items.length - 1] += `\n${line.trim()}`;
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}
