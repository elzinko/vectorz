/**
 * Calcule la « tête réelle » du plan **à travers les deux backlogs** (fiche
 * mc-0097). Réutilise l'ordre donné par `parsePlanOrder` (mc-0089) ; ici on
 * traverse cet ordre en résolvant chaque id vers sa carte (produit + statut +
 * ready), quelle que soit la liste qui la porte.
 *
 * Logique pure, sans I/O : la coquille `bin/plan-head.ts` construit l'index en
 * scannant les deux dossiers `features/` (actifs + `done/`).
 */

export interface PlanCard {
  /** Id sous la forme du PLAN.md : `mc-0094` (méthode) ou `0062` (produit). */
  id: string;
  /** Liste d'appartenance, informatif : `mega-city` ou `vectorz`. */
  product: string;
  status: string;
  ready: boolean;
}

export interface CrossBacklogHead {
  /** 1re carte `todo` + `ready` dans l'ordre du plan, tous backlogs confondus. */
  head: PlanCard | null;
  /** Cartes `todo` sans `ready:` qui PRÉCÈDENT la tête dans l'ordre — à groomer. */
  blockedAhead: PlanCard[];
  /** Ids du plan introuvables dans les deux listes — signalés, jamais ignorés. */
  unresolved: string[];
}

/**
 * @param planIds ids dans l'ordre du plan (sortie de `parsePlanOrder`).
 * @param index   id (forme PLAN.md) → carte résolue, tous backlogs confondus.
 */
export function crossBacklogHead(
  planIds: string[],
  index: Map<string, PlanCard>,
): CrossBacklogHead {
  const blockedAhead: PlanCard[] = [];
  const unresolved: string[] = [];

  for (const id of planIds) {
    const card = index.get(id);
    if (!card) {
      unresolved.push(id);
      continue;
    }
    if (card.status === 'todo' && card.ready) {
      return { head: card, blockedAhead, unresolved };
    }
    if (card.status === 'todo' && !card.ready) {
      blockedAhead.push(card);
    }
    // idea | blocked | in-progress | shipped | epic → ni tirable, ni signal de
    // blocage à l'intake : on passe (miroir de la règle mc-0089).
  }

  return { head: null, blockedAhead, unresolved };
}
