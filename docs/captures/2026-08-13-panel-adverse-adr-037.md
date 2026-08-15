# Panel adverse — ADR-037 (2026-08-13)

Revue adverse de [ADR-037](../adr/ADR-037-grain-merge-separable-du-grain-revue.md) **avant**
passage Proposé→Accepté. Objet soumis : la **1ʳᵉ version** (mode agrégé — N features dans
**1 PR**, merge en **`rebase-merge`**, « réutilise `ezk-pr-pilot` »).

## Méthode

3 lentilles adverses, **agents indépendants** lancés en parallèle, chacun avec la consigne de
*casser* la décision (pas la valider). Juge = session principale (synthèse + arbitrage PO).

| Lentille | Agent | Verdict |
|---|---|---|
| Architecture | `ezk-architect` | **🔴 NO-GO** |
| Faisabilité / implémentabilité | `general-purpose` | 🟠 GO-avec-réserves |
| Valeur produit | `ezk-pm` | 🟠 GO-avec-réserves |

## Findings consolidés (convergences des 3 lentilles)

- **[🔴 BLOQUANT] Exécutant du `rebase-merge` agrégé sans hôte valide** (archi, corroboré
  faisabilité). `ezk-product-builder` a interdiction de toucher au git (frontière ADR-0001) ;
  `ezk-sprint` ne merge plus dans ce mode ; le `ship` d'`ezk-pr-pilot` est **squash-only**.
  L'assemblage linéaire + `rebase-merge` est une **capacité net-neuve sans siège** → contredit
  « on ne réimplémente rien ». *Défaut non vu à la rédaction de l'ADR — valeur du panel.*
- **[MAJEUR] Prémisse « moins de merges = moins de frictions » fausse aux ⅔** (les 3). Collisions
  d'ids (réglées par 0180, mergé) et ~45 liens cassés/ship = fonction du **contenu**, pas de
  l'acte de merge → agréger les **concentre**. Seule « `main` décale » est par-merge, et
  `ezk-pr-pilot` l'automatise déjà.
- **[MAJEUR] « Réutilise `ezk-pr-pilot` » nominal** (les 3). Sa branche d'intégration = `git merge`
  **jetable pour tester** (conditionné `merge-tree` propre), pas un artefact de livraison linéaire.
  Obtenir N commits conventional propres exige une boucle `merge --squash` que le squelette n'a
  pas → assembleur net-neuf, réécriture déguisée en composition.
- **[MAJEUR] Orthogonalité des axes surclamée** (archi). Codex/`code-review` relit **la PR** (diff
  agrégé), pas les sections de corps → changer le grain de merge **change** le grain de revue.
  « Invariant `ezk-sprint` intact » = vrai par **vacuité** (en agrégé il n'a ni PR ni squash) ; le
  `rebase-merge` **exposerait** les commits red-green-refactor TDD que le squash masque.
- **[MAJEUR] Régression de l'objectif de 0065** (valeur). 0065 voulait *mieux* revoir ; le mode
  agrégé = tout-ou-rien + gros diff = **recul** de la revue. Rejet d'1/N features → bloquer les
  autres ou reconstruire la branche.
- **[MINEUR]** `check-pr-body.sh` « tolérer la répétition » = non-correctif (grep passe déjà, teste
  la présence pas la structure) ; `rebase-merge` **refuse** quand `main` a avancé (la friction
  elle-même) ; politique bimodale (squash/rebase) = surface cognitive + gate lourde (quota GHA
  épuisé).

## Verdict de juge & décision

**NO-GO pour graver le mode agrégé.** L'insight de base — *l'orchestrateur peut décider la
stratégie de livraison d'un lot* — **survit** ; c'est le **mode agrégé** (rebase-merge / PR-unique)
qui ne tient pas. Les 3 lentilles convergent vers une **version réduite** : le flag `--delivery`
**décide**, `ezk-pr-pilot` **exécute** le train de merge (N PR conservées, squash unique), le mode
agrégé abandonné.

**Arbitrage PO (2026-08-13) : réviser vers la version réduite.** ADR-037 réécrit en conséquence
(statut Accepté, version réduite) ; le mode agrégé consigné en *Alternatives écartées* ; fiche
[0065](../../features/0065-sprint-composition-lot-coherent.md) répercutée.

*Leçon méthode : le panel a attrapé un défaut bloquant (exécutant orphelin) invisible à l'auteur
de l'ADR — 3 lentilles = 3 classes de défauts vues par quelqu'un d'autre.*
