/**
 * Le périmètre « ce sprint » = la section `## Lot` de `SPRINT.md` (fiche 20261008072305169, ADR-0068).
 *
 * Parseur PUR, zéro I/O : il reçoit le texte de `SPRINT.md` et rend les stories du lot avec leur
 * résultat. On lit `## Lot`, PAS `## Incréments scellés de la session` (zone accumulée, polluée par
 * l'héritage de sessions quand l'app recycle le dossier de travail). Une ligne :
 *   `- [x] <id> — <titre> (PR #12)`   livrée
 *   `- [~] <id> — <titre> (reportée : …)`  reportée
 *   `- [ ] <id> — <titre>`            ouverte (reste au moment d'un abandon)
 */
import type { LotEntrySummary, LotResult } from './types.js';

const MARKER: Record<string, LotResult> = { x: 'shipped', '~': 'reported', ' ': 'open' };

/** `## Lot`, puis une ligne `- [x|~| ] <id> — <titre>` par story, jusqu'au titre `##` suivant. */
const LOT_HEADER = /^##\s+Lot\b/;
const SECTION = /^##\s/;
// id = suite de chiffres (≥ 4) : horodaté 17 chiffres, ou legacy 4 ; séparateur `—` ou `-` entouré d'espaces.
const STORY = /^-\s*\[([ x~])\]\s*(\d{4,})\s*[—-]\s*(.*)$/;
// Suffixes posés par le cycle de vie, retirés du titre : `(PR #12)` et `(reportée : …)`.
const SUFFIX = /\s*\((?:PR #\d+|reportée[^)]*)\)\s*$/i;

export function parseSprintLot(sprintMd: string): LotEntrySummary[] {
  const lines = sprintMd.split('\n');
  const start = lines.findIndex((l) => LOT_HEADER.test(l));
  if (start === -1) return [];
  const entries: LotEntrySummary[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (SECTION.test(line)) break; // on s'arrête à la section suivante : jamais `## Incréments scellés`.
    const m = STORY.exec(line);
    if (m === null) continue;
    const result = MARKER[m[1]];
    const title = m[3].replace(SUFFIX, '').trim();
    entries.push(title ? { id: m[2], result, title } : { id: m[2], result });
  }
  return entries;
}
