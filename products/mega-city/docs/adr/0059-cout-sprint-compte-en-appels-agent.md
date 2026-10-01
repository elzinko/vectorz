# ADR 0059 — Le coût d'un sprint se compte en appels d'agent

**Statut :** Proposé (à confirmer par le PO à la livraison de la fiche)
**Date :** 2026-10-01
**Deciders :** PO (demande du spike, cible de coût du run V0.1 → V0.4) ; mesures fournies par le run
**Fiche :** `20260920213500176` (spike « coût d'un sprint d'autorat de skill »)
**Précise :** [ADR-0055](0055-artefacts-generes-hors-versionnage.md) (les vues générées hors git sont l'un des leviers)

## En clair

Un sprint qui édite seulement un skill coûtait ~330k jetons. Le run V0.1 → V0.4 a mesuré d'où ça
vient : chaque appel d'agent emporte ~85k jetons de contexte fixe, quelle que soit la taille de la
tâche. On compte donc le coût en **appels**, pas en lignes. On fixe un budget d'appels par fiche et on
vise **≤ 200k par fiche**. La revue reste toujours là.

## Contexte : les mesures du run V0.1 → V0.4

- Un appel d'agent embarque ~85k jetons de contexte fixe.
- `ezk-pm` (DoR) : 87-95k, même pour 5 lignes. `ezk-reviewer` : 107-162k. Un agent de sprint :
  250-700k. Un explorateur mal borné : 370k.
- Base de départ (rétro du 2026-09-20) : ~330k par sprint d'autorat de skill, dont `ezk-pm` ~85k,
  `ezk-architect` ~120k et `ezk-reviewer` ~120k.
- Leviers qui ont marché : une seule validation DoR pour N fiches ; une revue pour 2-3 patchs ; pas
  d'explorateur ; la livraison (`ship`) sortie des PR ; les vues générées hors git. Le coût moyen est
  passé de ~500k à ~215k par fiche.

## Décision

1. **L'unité de coût est l'appel d'agent.** Plancher : ~85k. On réduit le nombre d'appels, pas la
   longueur de chacun.
2. **Budget d'appels par fiche.** L'agent qui la mène, plus au plus une revue (mutualisée sur 2-3
   petits patchs) et une DoR groupée pour N fiches (aucune si la fiche est déjà `ready`).
   `ezk-architect` seulement pour une décision de structure non triviale.
3. **Cible révisée : ≤ 200k par fiche, en moyenne de run.** La cible « < 100k » de la fiche d'origine
   est requalifiée. Un agent de sprint (≥ 85k de contexte fixe) plus sa part de revue (~40-80k une
   fois partagée) dépasse déjà 100k avant le moindre travail.
4. **Pas de nouveau mode d'`ezk-sprint`.** Le mode « léger » est un jeu de consignes dans `lean`, pas
   un mécanisme : la règle `token-economy/agent-call-budget`, le § Budget tokens d'`ezk-sprint` et le
   § Vigilance tokens d'`ezk-product-build`. Le schéma d'étapes configurables (20260830110131228)
   reste parké.
5. **« DoR réduite à ~3 champs » est écartée.** Le coût est l'appel (~85k), pas la lecture de la
   fiche. La lecture bornée a déjà été tentée sans gain. On groupe l'appel à la place.
6. **Le filet de qualité reste.** `ezk-reviewer` n'est jamais sauté. Pour de la prose, on saute BDD,
   TDD et E2E d'agent. Les tests de contrat sur le texte restent : ils ne coûtent aucun jeton d'agent.

## Alternatives écartées

- **Supprimer la revue pour la prose.** Écarté : c'est le filet, et la prose de méthode est lue par
  des agents qui l'exécutent.
- **Coder un mode « autorat de skill » dans `ezk-sprint`.** Reporté : les consignes suffisent, et le
  mécanisme d'étapes configurables n'existe pas encore.
- **Un compteur de jetons qui bloque.** Pas de jauge de dépense fiable aujourd'hui.

## Conséquences

- **+** La moyenne mesurée passe de ~500k à ~215k par fiche ; les gestes sont écrits là où les
  sprints les lisent.
- **−** Aucune gate mécanique ne vérifie le budget. C'est une consigne, mesurée au compte rendu de
  chaque fiche. Le test `sprint-cost-budget-contract.test.ts` garde les mots, pas les jetons.
- **−** La règle n'est matérialisée que par le profil `cop1-target` (bundle `token-economy`). Pour les
  sprints de ce dépôt, le texte qui compte est celui des `SKILL.md`, déployés par le profil global.
- **Suite.** Mesurer la moyenne sur les 4 prochaines fiches. Faire de la livraison hors PR le défaut
  d'`ezk-sprint` (aujourd'hui c'est le choix du run). Déclarer `applies:` aussi sur `ezk-sprint`.
