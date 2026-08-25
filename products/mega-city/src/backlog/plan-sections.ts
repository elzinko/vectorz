/**
 * parsePlanSections — lit `features/PLAN.md` en GARDANT ses sections (couloirs), pour la
 * vue « Plan » (fiche 20260825213807501). Fonction SŒUR de `parsePlanOrder` (0089) :
 *   - `parsePlanOrder` APLATIT le plan en une liste d'ids ordonnée et n'en garde qu'UN par
 *     ligne (l'ordre de tirage) — il reste INCHANGÉ (ses tests + les CLI plan:order/plan:head
 *     en dépendent) ;
 *   - `parsePlanSections` garde les TITRES de section ET capture TOUS les ids d'une ligne
 *     (fin de la troncature au 1er id) — la vue montre le plan tel qu'il est écrit, sans
 *     rien perdre en silence.
 *
 * Robustesse d'extraction (calée sur le vrai PLAN.md) : une capture globale naïve
 * ramasserait l'année d'une date (`2026-07-30` → « 2026 ») et un fragment de SHA
 * (`c45102b` → « 45102 »). Parade : neutraliser d'abord les dates ISO `AAAA-MM-JJ`, puis
 * ne capter que les tokens de LONGUEUR D'ID RÉELLE — 4 chiffres (legacy) ou 17 (horodaté,
 * fiche 0180) — bornés par des non-chiffres. Préfixe `mc-` legacy toléré, normalisé.
 *
 * Logique PURE, sans I/O (ADR-0003) ; la coquille est `bin/regen-plan-view.ts`.
 */

export type PlanMarker = 'build' | 'audit' | 'ship' | 'groom';

export interface PlanEntry {
  /** Tous les ids de la ligne, dans l'ordre du document, dédupliqués intra-ligne. */
  ids: string[];
  /** Le contenu de la ligne (après la puce), brut — l'intention/le marqueur en clair. */
  text: string;
  /** Marqueur d'action du contrat `plan`, ou null. */
  marker: PlanMarker | null;
  /** La ligne est-elle en `~~…~~` (raccourci de curation « livré ») — indice, pas vérité. */
  struck: boolean;
}

export interface PlanSection {
  /** Titre de section (`##`/`###`…), emoji inclus, sans les `#`. */
  label: string;
  /** Profondeur du titre : 2 pour `##`, 3 pour `###`, … */
  level: number;
  /** Entrées (puces au niveau racine porteuses d'au moins un id). */
  entries: PlanEntry[];
}

/** Un titre de section : `##`..`######` (le `#` de titre de doc, niveau 1, n'ouvre pas de couloir). */
const HEADING_RE = /^(#{2,6})\s+(.*\S)\s*$/;
/** Une ligne de liste markdown : `- …`, `* …`, ou `N. …`. */
const LIST_ITEM_RE = /^(?:[-*]|\d+\.)\s+/;
/** Dates ISO à neutraliser AVANT l'extraction d'ids (sinon l'année passe pour un id). */
const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/g;
/** Un id de fiche : 17 chiffres (horodaté) ou 4 (legacy), bornés par des non-chiffres. */
const ID_RE = /(?<!\d)(?:mc-)?(\d{17}|\d{4})(?!\d)/g;
/** Marqueur d'action d'une entrée de plan (contrat `plan`). */
const MARKER_RE = /\b(build|audit|ship|groom)\b/i;

export function parsePlanSections(planMd: string): PlanSection[] {
  const sections: PlanSection[] = [];
  let current: PlanSection | null = null;

  for (const line of planMd.split('\n')) {
    const heading = line.match(HEADING_RE);
    if (heading) {
      current = { label: heading[2].trim(), level: heading[1].length, entries: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue; // prose avant la 1re section : hors couloir
    // Une entrée est au NIVEAU RACINE (colonne 0) ; une puce indentée est un sous-item
    // (dépendance, note) — même règle que parsePlanOrder (revue Codex #52, 3e tour).
    if (/^\s/.test(line)) continue;
    const trimmed = line.trim();
    if (!LIST_ITEM_RE.test(trimmed)) continue;

    const content = trimmed.replace(LIST_ITEM_RE, '');
    // Neutraliser les dates AVANT l'extraction (l'affichage garde la date : on strippe une copie).
    const forIds = content.replace(ISO_DATE_RE, ' ');
    const ids: string[] = [];
    for (const m of forIds.matchAll(ID_RE)) {
      const id = m[1]; // le groupe = les chiffres (préfixe mc- déjà hors capture)
      if (!ids.includes(id)) ids.push(id);
    }
    if (ids.length === 0) continue; // puce racine sans id = prose structurante, pas une entrée

    const marker = content.match(MARKER_RE);
    current.entries.push({
      ids,
      text: content,
      marker: marker ? (marker[1].toLowerCase() as PlanMarker) : null,
      struck: content.includes('~~'),
    });
  }

  return sections;
}
