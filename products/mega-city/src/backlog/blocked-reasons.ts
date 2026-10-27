/**
 * Raisons typées du drapeau `blocked:` — une LISTE FERMÉE, lisible par l'humain ET par la machine
 * (fiche 20261013131632484). Le tirage (`plan:lot`/`plan:head`) et le run autonome lisent la raison
 * pour sauter une fiche différée **sans délibérer** : fini le texte libre que seul un humain décode.
 *
 * Convention d'un `blocked:` : **un seul mot anglais** de cette liste (fiche 20261027180541168). Le
 * « pourquoi / quand débloquer » vit dans les Notes de la fiche — ou, pour un park automatique, dans la
 * ligne de journal du run —, pas collé dans la valeur. Une raison vide = fiche NON bloquée. Le split
 * ci-dessous reste par tolérance d'une valeur héritée qui porterait encore un ` — <contexte>`.
 *
 * Partagée avec `plan-head`/`plan-lot` (fiche sœur 20261013131632277) : même vocabulaire.
 */
export const BLOCKED_REASONS = [
  'deferred', // le PO l'a différée (décision ou arbitrage en attente, « réveiller quand … »)
  'panel', // attend un panel adverse (décision structurelle, à tenir avec le PO)
  'design', // attend une maquette / un design validé
  'github', // attend une capacité ou une autorisation GitHub
  'dependency', // attend une autre fiche, un agent, un service pas encore prêt
  'review', // gros changement à faire sous revue manuelle, jamais en run autonome
  'risky', // édition de la méthode par elle-même, risquée sans garde
  'oversized', // trop grosse pour un sprint : à découper avant de construire
  'legacy', // drapeau hérité, raison non tracée à la création (à requalifier)
] as const;

export type BlockedReason = (typeof BLOCKED_REASONS)[number];

/**
 * Le TYPE d'un `blocked:` : son 1er segment avant ` — `, sinon toute la valeur. Convention : la valeur
 * est un seul mot (fiche 20261027180541168) ; le split tolère une valeur héritée avec un contexte.
 * Vide → ''.
 */
export function blockedType(blocked: string): string {
  return blocked.split(' — ')[0].trim();
}

/**
 * Vrai si `blocked:` porte une raison typée connue. Une valeur vide = fiche non bloquée : rien à
 * valider, donc vrai. Sinon, le TYPE (1er segment) doit appartenir à la liste fermée.
 */
export function isKnownBlockedReason(blocked: string): boolean {
  if (blocked.trim() === '') return true;
  return (BLOCKED_REASONS as readonly string[]).includes(blockedType(blocked));
}
