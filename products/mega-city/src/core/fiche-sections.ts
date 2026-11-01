/**
 * fiche-sections — LE lecteur des sections d'une fiche (`## Titre` … jusqu'au titre suivant). PUR.
 *
 * Un seul lecteur pour toute la méthode (fiche 20261031160441267, ADR-086) : le contrôle de prêt
 * (`dor-manifest.ts`) et le détail d'une fiche (`fiche-detail.ts`) passent par ici. Il ignore les
 * titres écrits dans un bloc de code, et s'arrête au titre suivant de même niveau ou plus haut.
 */

/** Le bloc de front-matter en tête d'une fiche, fins de ligne LF ou CRLF. */
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const HEADING = /^(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const FENCE = /^\s{0,3}(?:```|~~~)/;

/** Le corps d'une fiche : son texte sans le front-matter. */
export function ficheBodyText(ficheText: string): string {
  return ficheText.replace(FRONT_MATTER, '');
}

/** Minuscules, sans accents, espaces réduits : la forme sous laquelle on compare deux textes. */
export function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Un titre sous forme comparable : sans gras ni code, sans deux-points final. */
export function plainHeading(text: string): string {
  return plain(text.replace(/[*_`]/g, '')).replace(/\s*:$/, '');
}

/**
 * Les lignes de la section dont le titre correspond (jusqu'au titre suivant de même niveau ou plus
 * haut), ou `undefined` si aucun titre ne correspond. `heading` est soit un titre, comparé en entier
 * sous forme `plainHeading`, soit un test sur ce titre comparable (« commence par contexte »).
 */
export function sectionLines(body: string, heading: string | ((plainTitle: string) => boolean)): string[] | undefined {
  const target = typeof heading === 'string' ? plainHeading(heading) : undefined;
  const matches = (title: string): boolean =>
    typeof heading === 'string' ? plainHeading(title) === target : heading(plainHeading(title));
  const out: string[] = [];
  let inFence = false;
  let found = false;
  let level = 0;
  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      if (found) out.push(line);
      continue;
    }
    const m = inFence ? null : HEADING.exec(line);
    if (m) {
      const depth = m[1].length;
      if (found && depth <= level) break;
      if (!found && matches(m[2])) {
        found = true;
        level = depth;
        continue;
      }
    }
    if (found) out.push(line);
  }
  return found ? out : undefined;
}
