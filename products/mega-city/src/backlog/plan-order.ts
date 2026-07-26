/**
 * Parse la séquence CURÉE de `features/PLAN.md` en liste d'ids ordonnée
 * (fiche mc-0089 — brancher l'intake du backlog sur l'ORDRE du plan, pas
 * seulement sa priorité). Logique pure, sans I/O — la coquille est
 * `bin/plan-order.ts`.
 */

/** Une ligne de liste markdown : `- …`, `* …`, ou `N. …` (contenu trimmé). */
const LIST_ITEM_RE = /^(?:[-*]|\d+\.)\s+/;

/** Premier id de fiche sur une ligne : `mc-0094` ou `0062` (préfixe `mc-` optionnel). */
const ID_RE = /(mc-)?\d{4}/;

/** Titre markdown de niveau ≥2 (`##`, `###`, …) — délimite les sections du plan. */
const SECTION_HEADING_RE = /^(#{2,6})\s/;

/**
 * Une section de niveau ≥2 fait partie de la SÉQUENCE curée (NOW/NEXT/LATER) si
 * son titre contient l'un de ces mots. Les autres sections de ce niveau
 * (« Hygiène préalable », « Note — lancement autonome ») sont volontairement
 * ignorées : ce sont des notes de contexte, pas l'ordre de travail lui-même.
 * Le titre de niveau 1 (nom du document) ne change pas l'état courant.
 */
const SEQUENCE_SECTION_RE = /\b(NOW|NEXT|LATER)\b/i;

export function parsePlanOrder(planMd: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  let inSequenceSection = true;

  for (const line of planMd.split('\n')) {
    const trimmed = line.trim();

    if (SECTION_HEADING_RE.test(trimmed)) {
      inSequenceSection = SEQUENCE_SECTION_RE.test(trimmed);
      continue;
    }

    if (!inSequenceSection || !LIST_ITEM_RE.test(trimmed)) continue;

    const match = trimmed.match(ID_RE);
    if (!match) continue;

    const id = match[0];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}
