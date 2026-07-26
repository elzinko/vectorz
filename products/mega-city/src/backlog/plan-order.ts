/**
 * Parse la séquence CURÉE de `features/PLAN.md` en liste d'ids ordonnée
 * (fiche mc-0089 — brancher l'intake du backlog sur l'ORDRE du plan, pas
 * seulement sa priorité). Logique pure, sans I/O — la coquille est
 * `bin/plan-order.ts`.
 *
 * Contrat `plan` (SKILL.md) : PLAN.md est « une liste ordonnée d'entrées
 * `‹id› — ‹intention› ‹marqueur›`, regroupées en **jalons nommés si utile**
 * (ex. "A — finir 0005", "B — bugs nav") ». Les noms de jalons sont donc
 * **arbitraires** : on ne peut PAS gater sur des titres particuliers (NOW/NEXT/
 * LATER) sans omettre silencieusement les entrées d'un jalon nommé autrement —
 * l'omission silencieuse est exactement ce que mc-0089 combat (revue Codex #52).
 *
 * Règle retenue : la séquence = **tous les items de liste** du document, dans
 * l'ordre. La prose (paragraphes, citations) et les titres ne sont pas des items
 * de liste → naturellement exclus. Une section de notes purement rédactionnelle
 * n'a donc pas d'effet tant qu'elle n'utilise pas de puces porteuses d'id.
 */

/** Une ligne de liste markdown : `- …`, `* …`, ou `N. …` (contenu trimmé). */
const LIST_ITEM_RE = /^(?:[-*]|\d+\.)\s+/;

/** Premier id de fiche sur une ligne : `mc-0094` ou `0062` (préfixe `mc-` optionnel). */
const ID_RE = /(mc-)?\d{4}/;

export function parsePlanOrder(planMd: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const line of planMd.split('\n')) {
    const trimmed = line.trim();
    if (!LIST_ITEM_RE.test(trimmed)) continue;

    const match = trimmed.match(ID_RE);
    if (!match) continue;

    const id = match[0];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}
