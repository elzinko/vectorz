/**
 * Cœur pur du guichet `forge` — la seule porte de la méthode vers GitHub (ADR-0061, D1+D2).
 *
 * En clair : un projet qui coupe GitHub (`github: false`) ne doit jamais voir un outil appeler
 * `gh` « au cas où ». On centralise la décision ici : d'après la capacité `pr` de la config et la
 * disponibilité de `gh`, le guichet répond par TROIS états, jamais confondus :
 *   - `off`         — la config coupe GitHub (`github: false` ou `pr: false`). Jamais « aucune PR ».
 *   - `unavailable` — la config allume GitHub, mais `gh` est absent ou non authentifié.
 *   - `ok`          — GitHub allumé et joignable : l'appelant peut lister/agir.
 *
 * AUCUNE I/O ici (ADR-0003) : la lecture de la config et l'appel `gh` vivent dans le bin
 * `bin/forge-changes.ts`. Ce module ne fait que CHOISIR l'état depuis deux booléens déjà résolus.
 */

export type ForgeState = 'ok' | 'off' | 'unavailable';

/**
 * L'état du guichet, dans l'ordre de priorité : la config prime (un projet coupé ne touche jamais
 * `gh`), puis la disponibilité de l'outil. `prEnabled` = capacité `pr` résolue (`resolveGithub`) ;
 * `ghReady` = `gh` présent ET authentifié (jugé au bord, passé ici).
 */
export function decideForgeState(prEnabled: boolean, ghReady: boolean): ForgeState {
  if (!prEnabled) return 'off';
  if (!ghReady) return 'unavailable';
  return 'ok';
}

/**
 * Codes de sortie FIXES et documentés (critère de la fiche 20261013074251752) :
 *   - `ok` et `off` sortent en 0 : ce sont des réponses rendues (l'état est la 1re ligne de stdout,
 *     donc `off` ne ressemble jamais à une liste vide). Un `off` en 0 évite aussi d'affoler les
 *     appelants (ezk-archive, reconcile) qui sondent le guichet à chaque tour.
 *   - `unavailable` sort en 3 : le guichet n'a pas pu répondre (outil absent / non authentifié),
 *     distinct d'un `off` voulu et d'une liste vide.
 */
export const FORGE_EXIT: Readonly<Record<ForgeState, number>> = {
  ok: 0,
  off: 0,
  unavailable: 3,
};
