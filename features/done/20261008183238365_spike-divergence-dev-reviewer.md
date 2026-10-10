---
id: "20261008183238365"
title: Spike — ezk-dev et ezk-reviewer contrôlent-ils vraiment un contrat différent ?
type: chore
priority: P0
product: mega-city
milestone:
version: v0.8.0
labels: [loi, revue]
status: shipped
pr: "local (constat spike 2026-10-10)"
evidence: none
created: 2026-10-08
---

# 20261008183238365 — Spike : divergence dev ↔ reviewer ?

**En clair.** Avant de construire des listes DoD/DoR partagées (fiche F2), on vérifie que le
problème existe. Les règles que `ezk-dev` **applique** (procédé) et celles que `ezk-reviewer`
**contrôle** divergent-elles aujourd'hui ? Si oui, F2 vaut le coup. Si non, on re-park F2.
Spike pas cher : pas de code produit, juste un constat consigné.

**Si tu arrives frais.** `ezk-dev` est l'agent qui développe une fiche ; `ezk-reviewer` est
l'agent adverse qui juge le diff avant merge. Chacun déclare les règles qu'il suit
(`interactions:` dans son fichier d'agent). Si le reviewer contrôle une règle que le dev
n'applique pas (ou l'inverse), les deux travaillent sur un **contrat différent** — ce que F2
veut supprimer.

## Contexte / Problème

- F2 (DoD/DoR contrat partagé) part de l'hypothèse que dev et reviewer **recopient à la main**
  des règles et peuvent donc contrôler un contrat différent de celui qui est appliqué.
- Le PO a conditionné F2 à la **preuve** de cette divergence (décision 2026-10-08) : sans preuve,
  on n'implémente pas.
- Ce constat est **pas cher** et **décisif** : il mérite d'être fait seul, avant d'engager
  l'implémentation (qui, elle, dépend de F1).

## Proposition

1. Lire les règles effectivement suivies côté `ezk-dev` (procédé) et côté `ezk-reviewer`
   (`interactions:` + ce qu'il contrôle réellement).
2. Comparer les deux listes ; relever les écarts.
3. Chercher dans les rétros si la divergence a déjà été notée.
4. Trancher : divergence prouvée → tirer F2 ; sinon → re-park F2 avec la raison.

## Critères d'acceptation

- [x] Les règles suivies par `ezk-dev` et par `ezk-reviewer` sont **listées** côte à côte, et les
      écarts relevés. → voir « Constat ».
- [x] Une rétro qui a noté la divergence est **citée**, ou la fiche dit qu'il n'y en a pas. → aucune
      rétro ne note cette divergence (les « divergence » des captures portent sur le contrat de
      supervisabilité, pas dev↔reviewer). La preuve vient des fichiers d'agents.
- [x] **Seuil tranché** : « divergence prouvée » = au moins une règle contrôlée côté reviewer qui
      n'est pas appliquée côté dev (ou l'inverse), **constatée dans les fichiers**, pas supposée. →
      3 règles de ce type (voir « Constat »).
- [x] Le verdict est **consigné** : divergence prouvée → on tire F2 ; sinon → re-park F2 avec la
      raison. → **divergence prouvée → F2 à tirer** (voir « Constat »).

## Comment vérifier

```bash
# lire les interactions des deux agents
grep -A20 '^interactions:' products/mega-city/agents/ezk-dev.md products/mega-city/agents/ezk-reviewer.md
```

## Glossaire

- `spike` — une investigation bornée qui produit un **constat** (ici : divergence oui/non), pas du
  code produit.
- `contrat` — l'ensemble des règles qu'un agent applique ou contrôle.

## Constat (spike) — 2026-10-10

Lu dans `products/mega-city/agents/ezk-dev.md` et `ezk-reviewer.md` (champ `interactions:`,
les règles que chaque agent déclare suivre) :

| Règle | `ezk-dev` applique | `ezk-reviewer` contrôle |
|---|:---:|:---:|
| `testing/confinement-contract-at-boundary` | ✅ | ✅ |
| `clean-code/no-dead-code` | — | ✅ |
| `development/test-philosophy` | — | ✅ |
| `clean-code/no-silent-mutation` | — | ✅ |
| `development/adversarial-review-before-merge` | — | ✅ (propre au reviewer par nature) |

**Écart** : `ezk-dev` ne déclare suivre qu'**une** règle ; `ezk-reviewer` en contrôle **cinq**.
Trois sont des règles de **procédé** que le dev devrait appliquer en codant mais ne déclare pas :
`no-dead-code`, `test-philosophy`, `no-silent-mutation`. (La 4ᵉ, `adversarial-review-before-merge`,
est propre à l'acte de revue : elle ne compte pas comme divergence de contrat.)

**Rétros** : aucune rétro ne note cette divergence précise. Les occurrences de « divergence » dans
`docs/captures/` portent sur le contrat de supervisabilité (miroir/incident), pas sur dev↔reviewer.
La preuve est donc directe, dans les fichiers d'agents, pas supposée.

**Verdict : divergence PROUVÉE.** Au moins une (ici trois) règle de procédé est contrôlée côté
reviewer sans être appliquée côté dev. Le dev peut produire du code qui viole des règles qu'il n'a
jamais déclaré suivre, pendant que le reviewer les contrôle — exactement la prémisse de F2.
→ **F2 ([20261008154804532](20261008154804532_dod-dor-contrat-partage.md)) est à tirer** (reste
conditionnée à F1, livrée le 2026-10-10, et à son grooming).

## Notes / décisions

- Extrait de **F2** (20261008154804532_dod-dor-contrat-partage.md) par la coupe du 2026-10-08 :
  le spike était le critère 1 de F2, il devient une fiche à part, faisable **avant** F2 et **sans**
  dépendre de F1.
- **F2 est conditionnée à ce spike** : tirable seulement s'il prouve la divergence.
