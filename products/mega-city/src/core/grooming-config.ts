/**
 * grooming-config — le menu de `ezk-backlog groom` pré-réglé par la config du projet
 * (fiche 20261009104401282, premier morceau).
 *
 * En clair : `groom` propose ses techniques de raffinement dans un menu et attend un choix. Un projet
 * peut répondre d'avance dans `.vectorz/config.yml` :
 *
 *   grooming:
 *     techniques: all              # toutes les techniques du catalogue
 *     techniques: none             # aucune : le groom saute la boucle
 *     techniques:                  # ou une table, par id du catalogue
 *       avis-architecte: true
 *       criteres-testables: false
 *
 * Les clés sont les ids stables du catalogue (`skills/ezk-backlog/groom-techniques.yml`), jamais des
 * numéros de menu (préférence du PO du 2026-10-09). Une clé inconnue ou une valeur qui n'est pas un
 * booléen est refusée, avec la clé et les ids connus : une config mal orthographiée ne ment jamais en
 * silence. Rien de posé : le menu d'aujourd'hui. Logique PURE, sans I/O (ADR-0003).
 */

export type GroomingTechniques =
  | { mode: 'menu' }
  | { mode: 'all' | 'none' | 'selection'; ids: string[] }
  | { mode: 'error'; error: string };

const known = (catalog: readonly string[]): string => catalog.join(', ');

/** `raw` est la valeur de la clé `grooming` de la config ; `catalog`, les ids du catalogue dans son ordre. */
export function resolveGroomingTechniques(raw: unknown, catalog: readonly string[]): GroomingTechniques {
  if (raw === undefined || raw === null) return { mode: 'menu' };
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { mode: 'error', error: 'grooming : une table est attendue (ex. « grooming: { techniques: all } »).' };
  }
  const techniques = (raw as { techniques?: unknown }).techniques;
  if (techniques === undefined || techniques === null) return { mode: 'menu' };
  if (techniques === 'all') return { mode: 'all', ids: [...catalog] };
  if (techniques === 'none') return { mode: 'none', ids: [] };
  if (typeof techniques !== 'object' || Array.isArray(techniques)) {
    return {
      mode: 'error',
      error: `grooming.techniques : « all », « none » ou une table par id est attendue, reçu « ${String(techniques)} ».`,
    };
  }
  const entries = Object.entries(techniques as Record<string, unknown>);
  const unknown = entries.map(([id]) => id).filter((id) => !catalog.includes(id));
  if (unknown.length > 0) {
    return {
      mode: 'error',
      error: `grooming.techniques : technique inconnue « ${unknown.join(', ')} » (ids connus : ${known(catalog)}).`,
    };
  }
  const notBoolean = entries.filter(([, v]) => typeof v !== 'boolean').map(([id]) => id);
  if (notBoolean.length > 0) {
    return { mode: 'error', error: `grooming.techniques : « ${notBoolean.join(', ')} » attend true ou false.` };
  }
  const chosen = new Set(entries.filter(([, v]) => v === true).map(([id]) => id));
  return { mode: 'selection', ids: catalog.filter((id) => chosen.has(id)) };
}

/** La ligne que `ezk config show` affiche, et que `groom` lit avant son menu. */
export function groomingStatusText(r: GroomingTechniques): string {
  switch (r.mode) {
    case 'menu':
      return 'grooming.techniques  menu  (rien de posé : groom propose son menu)';
    case 'all':
      return 'grooming.techniques  all   (groom applique toutes les techniques, sans menu)';
    case 'none':
      return 'grooming.techniques  none  (groom saute la boucle de raffinement, sans menu)';
    case 'selection':
      return `grooming.techniques  ${r.ids.length > 0 ? r.ids.join(', ') : '(aucune à true)'}  (groom applique celles-ci, sans menu)`;
    case 'error':
      return `grooming.techniques  ERREUR : ${r.error}`;
  }
}
