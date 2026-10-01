---
id: documentation-guidelines/next-step-affordance
kind: disposition
level: SHOULD
title: End a skill's human-facing answer with « Et maintenant ? »
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **En clair.** Quand une commande ezk se termine, elle dit **quoi lancer ensuite**. Un petit bloc « Et maintenant ? » clôt la réponse : 1 à 3 commandes, chacune avec une raison d'une ligne. Tu n'as plus à te souvenir de la commande d'après.
- **Portée** : la réponse de clôture qu'un humain lit à la fin d'une sous-commande de skill (fin de sprint, `add` / `groom` / `ready` / `ship` du backlog…). Pas le brouillon interne, pas un index généré : `/ezk-help` reste la liste globale « quelles commandes existent ». Ici, c'est « quoi faire **maintenant**, dans cet état ».
- **Place** : le bloc vient **en dernier**, après l'« En clair » et le détail. Court, sans jargon (règle [`documentation-guidelines/human-facing-lisibility`](human-facing-lisibility.md)).
- **Deux étages, jamais mélangés** :
  - **Suite logique** : la suivante est *déterminée* par l'état (ex. après `ready <id>` → `next --ready-only`). Une ligne : la commande + pourquoi.
  - **Pistes** : des idées au choix de l'humain. Jamais formulées comme une obligation.
- **1 à 3 commandes au total.** Chaque commande sur sa ligne, puis « — », puis une raison d'une ligne (« la fiche est tirable maintenant »). Le test compte ces « — ».
- **Pas de bloc creux.** Une sous-commande en lecture seule ou sans suite naturelle (`list`, `help`) ne propose rien. On n'invente jamais une suite pour remplir le bloc.
- **Où vivent les successions.** Chaque skill qui adopte la règle la déclare dans `applies:` et garde dans son `SKILL.md` une courte section « Et maintenant ? » : une table `quand | suite logique | pistes`. Il **ne ré-explique pas** le format : il renvoie ici. Le LLM rédige le bloc d'après la table. Aucun script, aucun menu généré.
- **Les commandes citées existent.** Chaque commande de la table est un vrai skill, une vraie commande, un vrai agent ou un vrai script pnpm (le test `next-step-affordance.test.ts` le vérifie).

Origin: demande PO 2026-08-25 (« à la fin d'un sprint ou d'une commande, proposer les commandes suivantes »), après le benchmark BMAD ([rapport](../../docs/benchmarks/2026-08-25-bmad-vs-ezk.md)). Prior art BMAD : chaque agent affiche un menu numéroté (`*help`), et chaque workflow nomme le suivant (« Create Story → Validate → Dev → Code Review → Retrospective ») ; un workflow « Sprint Status » ne fait que router vers le suivant. On garde l'**idée** (dire ce qui vient après), pas le **moteur** : c'est une convention de restitution, pas un moteur de menu (garde-fou ADR-0013). Measure (removability): sur les 5 prochaines fins de `ready` / `ship` / sprint, 5/5 se terminent par un bloc de 1 à 3 commandes avec une raison chacune, et aucune sous-commande en lecture seule n'en invente un.
