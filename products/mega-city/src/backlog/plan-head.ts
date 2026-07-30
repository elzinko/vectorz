/**
 * Calcule la « tête réelle » du plan sur la **liste unique** `features/`
 * (fiche 0064 ; remplace le routage cross-liste 0097). Réutilise l'ordre
 * donné par `parsePlanOrder` (0089) ; le `product:` vient du front-matter.
 *
 * Logique pure, sans I/O : la coquille `bin/plan-head.ts` construit l'index
 * en scannant `features/` (actifs + `done/`).
 */

export interface PlanCard {
  /** Id nu à 4 chiffres (forme PLAN.md post-0064). */
  id: string;
  /** Produit déclaré en front-matter : `mega-city` | `vectorz` | … */
  product: string;
  /** `feature | bug | refactor | chore | epic`. Un `epic` n'est jamais tirable. */
  type: string;
  status: string;
  ready: boolean;
}

export interface CrossBacklogHead {
  /** 1re carte `todo` + `ready` dans l'ordre du plan. */
  head: PlanCard | null;
  /** Cartes `todo` sans `ready:` qui PRÉCÈDENT la tête dans l'ordre — à groomer. */
  blockedAhead: PlanCard[];
  /** Ids du plan introuvables dans `features/` — signalés, jamais ignorés. */
  unresolved: string[];
}

/**
 * @param planIds ids dans l'ordre du plan (sortie de `parsePlanOrder`).
 * @param index   id → carte résolue (product depuis le front-matter).
 */
export function crossBacklogHead(
  planIds: string[],
  index: Map<string, PlanCard>,
): CrossBacklogHead {
  let head: PlanCard | null = null;
  const blockedAhead: PlanCard[] = [];
  const unresolved: string[] = [];

  // On parcourt TOUT le plan (pas de return anticipé) : les introuvables doivent
  // être signalés même après la tête (revue Codex #53).
  for (const id of planIds) {
    const card = index.get(id);
    if (!card) {
      unresolved.push(id);
      continue;
    }
    // Un épic (ADR-0017) n'est jamais tirable — ce sont ses enfants ; on ne le
    // choisit ni comme tête ni comme blocage (revue Codex #53).
    if (card.type === 'epic') continue;
    if (head) continue; // tête déjà trouvée : on ne scanne plus que les introuvables
    if (card.status === 'todo' && card.ready) {
      head = card;
      continue;
    }
    if (card.status === 'todo' && !card.ready) {
      blockedAhead.push(card);
    }
    // idea | blocked | in-progress | shipped → ni tirable, ni signal de blocage
    // à l'intake : on passe (miroir de la règle 0089).
  }

  return { head, blockedAhead, unresolved };
}
