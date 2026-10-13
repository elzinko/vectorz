/**
 * Raisons typées du drapeau `blocked:` — une LISTE FERMÉE, lisible par l'humain ET par la machine
 * (fiche 20261013131632484). Le tirage (`plan:lot`/`plan:head`) et le run autonome lisent le TYPE
 * pour sauter une fiche différée **sans délibérer** : fini le texte libre que seul un humain décode.
 *
 * Format d'un `blocked:` : `<type>` ou, avec du contexte, `<type> — <contexte libre>`. Le TYPE est
 * le 1er segment (avant ` — `) ; il doit appartenir à cette liste. Le contexte reste du texte libre,
 * pour l'humain. Une raison vide = fiche NON bloquée (rien à valider).
 *
 * Partagée avec `plan-head`/`plan-lot` (fiche sœur 20261013131632277) : même vocabulaire.
 */
export const BLOCKED_REASONS = [
  'différée-PO', // le PO l'a différée (décision ou arbitrage en attente, « réveiller quand … »)
  'attend-panel', // attend un panel adverse (décision structurelle, à tenir avec le PO)
  'attend-maquette', // attend une maquette validée
  'attend-GitHub', // attend une capacité ou une autorisation GitHub
  'attend-dépendance', // attend une autre fiche, un agent, un service pas encore prêt
  'sous-revue', // gros changement à faire sous revue manuelle, jamais en run autonome
  'auto-édition-risquée', // édition de la méthode par elle-même, risquée sans garde
  'à-découper', // trop grosse pour un sprint : à découper avant de construire
  'hérité', // drapeau hérité, raison non tracée à la création (à requalifier)
] as const;

export type BlockedReason = (typeof BLOCKED_REASONS)[number];

/** Le TYPE d'un `blocked:` : son 1er segment avant ` — `, sinon toute la valeur. Vide → ''. */
export function blockedType(blocked: string): string {
  return blocked.split(' — ')[0].trim();
}

/**
 * Vrai si `blocked:` porte une raison typée connue. Une valeur vide = fiche non bloquée : rien à
 * valider, donc vrai. Sinon, le TYPE doit appartenir à la liste fermée.
 */
export function isKnownBlockedReason(blocked: string): boolean {
  if (blocked.trim() === '') return true;
  return (BLOCKED_REASONS as readonly string[]).includes(blockedType(blocked));
}
