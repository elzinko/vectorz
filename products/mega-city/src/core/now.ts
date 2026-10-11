/**
 * now — le cœur PUR de la boussole de session (fiche 20261010091118580).
 *
 * « Que faire maintenant ? » Entrée = l'ÉTAT du dépôt (sprint ouvert ? tête tirable ? tête à
 * groomer ?), lu par le bord `bin/ezk-now.ts`. Sortie = 1 à 3 suites motivées, au format de la
 * règle `next-step-affordance` (commande + raison, suite logique séparée des pistes).
 *
 * L'ORDRE vit dans les tables « Et maintenant ? » des skills (colonne `quand` = l'état), PAS dans
 * le graphe compilé (verbes fermés et structurels — ADR-0072). Ce module ENCODE les transitions
 * clés pilotées par l'état du dépôt (POC : les 2 skills qui ont déjà la table, `ezk-backlog` /
 * `ezk-sprint`). Ce n'est pas un moteur de menu : une petite table état → suite, aucune invention.
 * Généraliser aux autres skills viendra avec le socle « citer un bundle » (fiche 20261008154803440).
 */
export interface NowState {
  /** Ids des stories encore ouvertes dans SPRINT.md (`- [ ]`). Non vide ⇒ un sprint est en cours. */
  readonly sprintOpenIds: readonly string[];
  /** La prochaine fiche tirable (`status: ready`) du plan, ou null. */
  readonly headReady: string | null;
  /** Les têtes `idea` à groomer qui précèdent une éventuelle fiche prête. */
  readonly blockedAhead: readonly string[];
}

export interface NowSuggestion {
  readonly command: string;
  readonly reason: string;
  /** `suite` = déterminée par l'état ; `piste` = idée au choix de l'humain. */
  readonly kind: 'suite' | 'piste';
}

/**
 * De l'état du dépôt vers 1 à 3 suites. Priorité : finir un sprint ouvert, sinon tirer une fiche
 * prête, sinon groomer la tête bloquée, sinon (rien de tirable) revoir le stock / clore l'itération.
 */
export function suggestNow(state: NowState): NowSuggestion[] {
  // 1. Un sprint est ouvert → le finir avant tout (ne pas en ouvrir un second).
  if (state.sprintOpenIds.length > 0) {
    const n = state.sprintOpenIds.length;
    return [
      {
        kind: 'suite',
        command: '/ezk-sprint',
        reason: `un sprint est ouvert (${n} story${n > 1 ? 's' : ''} non livrée${n > 1 ? 's' : ''}) — construis le lot, puis close`,
      },
      {
        kind: 'piste',
        command: '/ezk-sprint close',
        reason: 'si le lot est entièrement mergé, scelle l’incrément',
      },
    ];
  }
  // 2. Une fiche prête à tirer → la développer (table ezk-sprint : `check CLEAR` → `run`).
  if (state.headReady) {
    return [
      {
        kind: 'suite',
        command: '/ezk-sprint run',
        reason: `la fiche ${state.headReady} est tirable maintenant — développe-la`,
      },
      {
        kind: 'piste',
        command: '/ezk-backlog next --ready-only',
        reason: 'voir d’abord quelle fiche sera tirée',
      },
    ];
  }
  // 3. La tête du plan n'est pas prête → la groomer (table ezk-backlog : après `add` → `groom`).
  if (state.blockedAhead.length > 0) {
    return [
      {
        kind: 'suite',
        command: `/ezk-backlog groom ${state.blockedAhead[0]}`,
        reason: 'la tête du plan n’est pas prête — groome-la pour la rendre tirable',
      },
    ];
  }
  // 4. Rien de tirable dans la version en cours → revoir le stock / clore l'itération.
  return [
    {
      kind: 'suite',
      command: '/ezk-backlog list',
      reason: 'plus de fiche tirable dans la version en cours — revois le stock',
    },
    {
      kind: 'piste',
      command: '/ezk-retro run',
      reason: 'si une itération vient de se terminer',
    },
  ];
}
