---
id: clean-code/no-silent-mutation
kind: disposition
level: MUST
title: Une commande qui mute ne finit jamais en « succès » muet
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **En clair.** Une commande ezk qui **écrit** (ship, regen, registry-add…) et qui s'attendait à
  écrire au moins une fois **ne doit jamais rendre « succès » sans rien avoir écrit, en silence**.
  Sinon elle ment sur ce qu'elle a fait, et la vérité du pilotage se corrompt sans un mot.
- **Symptôme fondateur** (rétro du 2026-10-10, sprint « vue process ») : `ezk backlog ship` a barré
  **0 entrée** de `PLAN.md` pour une fiche pourtant présente — au format de ligne non standard —
  **sans avertir**. La fiche annoncée livrée serait restée affichée « à faire » si la sortie n'avait
  pas été relue à l'œil. Même famille : `registry-add` qui efface l'en-tête du registre.
- **La règle.** Une mutation qui **attendait ≥ 1 écriture** et n'en fait **aucune** sort en **exit
  ≠ 0** ou imprime un **WARN visible** qui nomme ce qui n'a pas été fait — jamais un succès muet. Le
  no-op inattendu est traité comme une anomalie, pas comme une réussite.
- **Frontière.** Distincte de la règle des **comptes** (`documentation-guidelines/human-facing-lisibility`,
  « un compte qui contredit sa liste ment ») : celle-ci porte sur la **restitution** d'un nombre ;
  ici on parle du **comportement d'une commande qui écrit**. Complémentaires, pas doublon (juge de
  cohérence du 2026-10-10).
- **Mesure (removability).** Un test de régression : une ligne cible mal formée pendant un `ship`
  produit un exit ≠ 0 ou un WARN visible, jamais un succès muet. Sur les 5 prochains sprints, 0 fiche
  shippée laissée « à faire » sans signal. Retrait quand ce test tient au vert.

Origine : rétro du 2026-10-10, capture
`docs/captures/2026-10-10-retro-vue-process-worktree-silences.md` (proposition 2, convergence des 3
lentilles, GARDER reformulée par le juge).
