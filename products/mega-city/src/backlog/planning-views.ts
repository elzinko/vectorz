import { parsePlanSections } from './plan-sections.js';

/**
 * Filet « vue de planning qui ment » (fiche 20260812100109940).
 *
 * Au `ship`, l'index `BACKLOG.md` est régénéré, mais `PORTFOLIO.md` (généré) et
 * `PLAN.md` (curé) peuvent rester périmés — ils continuent de pointer une fiche
 * livrée comme du travail à faire. Ce module DÉTECTE ces incohérences (déterministe,
 * ADR-0001 : le script constate, le LLM/humain corrige la vue curée).
 */

/** Une fiche livrée encore présentée comme à faire dans une vue de planning. */
export interface StalePlanningEntry {
  /** Id de la fiche concernée. */
  id: string;
  /** Vue où l'incohérence apparaît. */
  view: 'PLAN' | 'PORTFOLIO';
  /** Ce que la vue montre (marqueur d'action, ou statut affiché). */
  shown: string;
  /** Contexte lisible (section du plan, ou nature de l'écart). */
  where: string;
}

/** Un id de fiche : 4 chiffres (legacy) ou 17 (horodaté, fiche 0180). */
const VALID_ID = /^(?:\d{4}|\d{17})$/;

/**
 * Lit un champ du front-matter d'une fiche, en TEXTE (garde `0018` intact — un parsing
 * YAML lirait `0018` en octal). Ne regarde que le front-matter (avant le 2e `---`),
 * retire les quotes et un commentaire inline `# …`.
 */
export function fmField(content: string, field: string): string {
  const secondSep = content.indexOf('\n---', 3);
  const frontMatter = secondSep > 0 ? content.slice(0, secondSep) : content;
  const match = frontMatter.match(new RegExp(`^${field}:\\s*(.*)$`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^["']|["']$/g, '').replace(/\s*#.*$/, '').trim();
}

/**
 * Entrées de `PLAN.md` (curé) présentant comme À FAIRE une fiche déjà `shipped`.
 * Une ligne barrée (`~~…~~`) est réputée déjà curée → jamais signalée.
 */
export function findStalePlanEntries(
  planMd: string,
  statusById: Map<string, string>,
): StalePlanningEntry[] {
  // Limite connue (best-effort — ADR-0001, PLAN.md = décision humaine) : le marqueur n'est
  // lu que sur la ligne-racine d'une puce (parsePlanSections). Une entrée dont le marqueur
  // est sur une ligne de continuation repliée n'est pas signalée — la curation reste humaine.
  const stale: StalePlanningEntry[] = [];
  for (const section of parsePlanSections(planMd)) {
    for (const entry of section.entries) {
      if (entry.struck || !entry.marker) continue; // curée, ou sans action annoncée
      for (const id of entry.ids) {
        if (statusById.get(id) === 'shipped') {
          stale.push({ id, view: 'PLAN', shown: entry.marker, where: section.label });
        }
      }
    }
  }
  return stale;
}

/**
 * Lignes de `PORTFOLIO.md` (généré) affichant une fiche `shipped` avec un statut
 * autre que « shipped » — signe que la vue n'a pas été régénérée après un `ship`.
 */
export function findStalePortfolioEntries(
  portfolioMd: string,
  statusById: Map<string, string>,
): StalePlanningEntry[] {
  const stale: StalePlanningEntry[] = [];
  for (const line of portfolioMd.split('\n')) {
    if (!line.startsWith('|')) continue;
    // | (vide) | product | id | title | type | prio | statut | pr | (vide) |
    // Split sur les `|` NON échappés : portfolio.sh échappe en `\|` les `|` des titres.
    const cells = line.split(/(?<!\\)\|/).map((cell) => cell.trim());
    const id = cells[2] ?? '';
    const shown = cells[6] ?? '';
    if (!VALID_ID.test(id)) continue; // en-tête, séparateur, ou ligne hors données
    if (statusById.get(id) === 'shipped' && !shown.includes('shipped')) {
      stale.push({ id, view: 'PORTFOLIO', shown, where: 'section actionnable' });
    }
  }
  return stale;
}

/** Filet complet : toutes les incohérences des deux vues de planning. */
export function findStalePlanningViews(
  statusById: Map<string, string>,
  portfolioMd: string,
  planMd: string,
): StalePlanningEntry[] {
  return [
    ...findStalePortfolioEntries(portfolioMd, statusById),
    ...findStalePlanEntries(planMd, statusById),
  ];
}
