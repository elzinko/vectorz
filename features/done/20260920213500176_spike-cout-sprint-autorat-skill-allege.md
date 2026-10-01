---
id: "20260920213500176"
title: "Réduire le coût d'un sprint qui ne fait qu'éditer un skill (~330k jetons)"
type: chore
priority: P2
product: mega-city
version: V0.4
epic:
labels: [fabrique]
status: shipped
pr: "#300"
evidence: none # coût / méthode, pas d'écran
created: 2026-09-20
---

# SPIKE — alléger le coût d'un sprint d'autorat de skill

## En clair

Éditer un `SKILL.md` (de la prose) déclenchait tout le sprint et coûtait ~330k jetons. On a depuis
**mesuré** le run V0.1 → V0.4 : le coût ne vient pas de la longueur du travail, il vient du
**nombre d'appels d'agent**. Chaque appel emporte ~85k jetons de contexte fixe. La décision : on
compte le coût en appels, on fixe un budget d'appels par fiche, et on écrit les gestes qui ont
fait passer la moyenne de ~500k à ~215k par fiche. La revue reste toujours là.

## Contexte / Problème

Symptôme daté (rétro du 2026-09-20, run du 2026-09-12) : chaque sprint qui éditait un `SKILL.md`
coûtait ~330k. Trois postes dominaient : `ezk-pm` (concurrence DoR) ~85k pour un oui/non,
`ezk-architect` ~120k, `ezk-reviewer` ~120k. Pour de la prose, BDD, TDD et E2E ne mordent pas.

**Mesures réelles du run V0.1 → V0.4** (à citer, on ne les refait pas) :

- chaque appel d'agent embarque ~85k jetons de contexte fixe ;
- `ezk-pm` (DoR) : 87-95k, même pour 5 lignes ;
- `ezk-reviewer` : 107-162k ;
- un agent de sprint : 250-700k ;
- un explorateur mal borné : 370k.

**Leviers qui ont marché** : une seule validation DoR pour N fiches ; une revue pour 2-3 patchs ;
pas d'explorateur ; la livraison (`ship`) sortie des PR ; les vues générées hors git (ADR-0055).
Coût moyen : ~500k → ~215k par fiche.

## Décision proposée (ADR court, 0060)

1. **L'unité de coût est l'appel d'agent**, pas la longueur de la tâche. Plancher : ~85k.
2. **Budget d'appels par fiche** : l'agent qui mène la fiche, plus au plus une revue (mutualisée
   sur 2-3 patchs) et une DoR groupée pour N fiches (aucune si la fiche est déjà `ready`).
   `ezk-architect` seulement pour une décision de structure non triviale.
3. **Cible révisée : ≤ 200k par fiche en moyenne de run.** La cible « < 100k » de la fiche d'origine
   est requalifiée : sous le plancher d'un appel, la revue seule (107-162k, partagée) la dépasse.
4. **Pas de nouveau mode d'`ezk-sprint`.** Le mode « léger » est un jeu de consignes dans `lean`,
   pas un mécanisme. Le schéma d'étapes configurables (20260830110131228) reste parké.
5. **« DoR réduite à ~3 champs » : écartée comme levier.** Le coût est l'appel (~85k), pas la lecture
   de la fiche ; la lecture bornée a déjà été tentée sans gain. On groupe l'appel à la place.

## Critères d'acceptation

- [x] L'ADR-0060 cite les mesures ci-dessus et tranche les cinq points, alternatives rejetées comprises.
      *Preuve : `docs/adr/0060-cout-sprint-compte-en-appels-agent.md` (premier numéro libre sur `main`
      au 2026-10-01 : le 0059 est pris par l'ADR de la revue locale, PR #308) ; statut « Proposé » : la
      cible change, le PO confirme à la livraison.*
- [x] **Le filet de qualité reste** : `ezk-reviewer` n'est jamais sauté ; on n'allège que BDD, TDD et
      E2E d'agent pour de la prose. Les tests de contrat sur le texte restent (sans jetons d'agent).
      *Preuve : décision 6 de l'ADR ; « jamais sautée » gardé dans les deux `SKILL.md` par le test.*
- [x] Règle `token-economy/agent-call-budget` créée, rangée dans `bundles/token-economy.yml`, comptée
      par `expand.test.ts` (55 → 56), et appliquée (`applies:`) par `ezk-product-build`. Pour
      `ezk-sprint`, la règle est citée par id dans son § Budget tokens ; la déclaration `applies:`
      attend le merge de la PR #275, qui réécrit les lignes voisines de son frontmatter (voir « Suite »).
      *Preuve : `sprint-cost-budget-contract.test.ts` (7 tests), `expand.test.ts`.*
- [x] Consignes écrites dans `ezk-sprint` (§ Budget tokens) et `ezk-product-build` (§ `lean`) :
      ces deux textes sont ceux que les sprints lisent vraiment.
      *Preuve : cinq consignes dans `ezk-sprint`, un paragraphe dans `ezk-product-build`.*
- [x] Les deux critères d'origine non retenus sont tranchés par écrit dans l'ADR (< 100k ; DoR à
      3 champs) avec la raison.
      *Preuve : décisions 3 et 5 de l'ADR.*

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/sprint-cost-budget-contract.test.ts src/__tests__/expand.test.ts src/__tests__/graph.test.ts
bash products/mega-city/bin/check-links.sh . features docs/adr docs/captures
```

Puis à l'usage : le compte rendu de chaque fiche donne sa consommation ; sur 4 fiches d'un même
run, la moyenne tient sous 200k. Cette dernière mesure est la « Suite » (elle demande un run).

## Suite (hors spike)

- Mesurer la moyenne sur les 4 prochaines fiches. Il manque une vraie jauge de dépense (fiche
  « fenêtre de contexte »).
- Aucune gate mécanique ne vérifie un budget de jetons aujourd'hui : la règle est une consigne.
- Encoder ces choix par type de fiche dans le schéma d'étapes, si on le débloque.
- Déclarer `applies: [token-economy/agent-call-budget]` sur `ezk-sprint` une fois la PR #275 mergée.
- Faire de la livraison hors PR (`ship` par le PO, en une PR dédiée) le défaut d'`ezk-sprint` : c'est
  aujourd'hui le choix du run, pas encore la consigne du skill.
- La règle n'est matérialisée que par le profil `cop1-target` ; le profil global ne porte pas le
  bundle `token-economy`. À décider si elle doit y entrer.

## Notes / anti-doublon

- **S'appuie sur** [20260830110131228](../20260830110131228_schema-etapes-skill-configurables.md)
  (schéma d'étapes configurables = le mécanisme) et [0143](0143-aligner-nommage-modes-tokens.md)
  (nommage des modes) — cette fiche est le **besoin mesuré**, pas le mécanisme.
- Voisins « coût disproportionné pour un petit geste » :
  [20260904091853948](20260904091853948_ezk-archive-capacite-allegement.md) et
  [0088](0088-ezk-archive-cout-cloture-session-disciplinee.md) (allègement d'`ezk-archive`).
- Origine : rétro auto-amélioration 2026-09-20 (note de carnet N3, run du 2026-09-12).
