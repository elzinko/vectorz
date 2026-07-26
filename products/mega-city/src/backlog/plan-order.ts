/**
 * Parse la séquence CURÉE de `features/PLAN.md` en liste d'ids ordonnée
 * (fiche mc-0089 — brancher l'intake du backlog sur l'ORDRE du plan, pas
 * seulement sa priorité). Logique pure, sans I/O — la coquille est
 * `bin/plan-order.ts`.
 *
 * Qu'est-ce qu'une ENTRÉE de plan ? Le contrat `plan` (SKILL.md) : « une liste
 * ordonnée d'entrées `‹id› — ‹intention› ‹marqueur›` où le marqueur ∈
 * {build | audit | ship | groom} ». Une ligne de liste compte comme entrée si
 * elle **commence par son id** (forme `‹id› — …`, éventuellement en gras) OU
 * **porte un marqueur d'action** (forme `‹marqueur› ‹id› …`, ex. hygiène
 * `` `ship` 0059``). Ce critère est :
 *   - agnostique aux jalons à noms arbitraires (« A — … », « B — … ») — gater
 *     sur NOW/NEXT/LATER les omettrait silencieusement (revue Codex #52, 1er tour) ;
 *   - immunisé contre les puces qui ne sont pas des entrées — sous-bullet
 *     `- depends on 0017`, puce de note, paquet « parking » descriptif sans
 *     marqueur — qui seraient sinon pris pour de nouvelles entrées ordonnées
 *     (revue Codex #52, 2e tour).
 *
 * Limitations assumées : sur une ligne multi-ids, on garde le 1er id ; un paquet
 * « LATER » purement descriptif (ni id en tête, ni marqueur) n'est pas capté —
 * ces items ne sont de toute façon pas tirables.
 */

/** Une ligne de liste markdown : `- …`, `* …`, ou `N. …`. */
const LIST_ITEM_RE = /^(?:[-*]|\d+\.)\s+/;

/** L'item commence par un id (après d'éventuelles emphases `*` `_` `` ` ``). */
const LEADING_ID_RE = /^[\s*_`]*(mc-)?\d{4}/;

/** Marqueur d'action d'une entrée de plan (contrat `plan`). */
const MARKER_RE = /\b(?:build|audit|ship|groom)\b/i;

/** Premier id de fiche sur une ligne : `mc-0094` ou `0062` (préfixe `mc-` optionnel). */
const ID_RE = /(mc-)?\d{4}/;

export function parsePlanOrder(planMd: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const line of planMd.split('\n')) {
    const trimmed = line.trim();
    if (!LIST_ITEM_RE.test(trimmed)) continue;

    const content = trimmed.replace(LIST_ITEM_RE, '');
    // Entrée de plan = commence par son id, OU porte un marqueur d'action.
    // Sinon (sous-bullet `depends on 0017`, note, paquet descriptif) : ignorée.
    if (!LEADING_ID_RE.test(content) && !MARKER_RE.test(content)) continue;

    const match = content.match(ID_RE);
    if (!match) continue;

    const id = match[0];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}
