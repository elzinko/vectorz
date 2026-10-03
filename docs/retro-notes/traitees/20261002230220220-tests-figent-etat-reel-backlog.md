---
date: 2026-10-03
session: session « WIP-v0.5 » (file de merge V0.4, PR #314 et #315)
type: friction
---

# Des tests figent l'état réel du backlog et cassent sur des gestes normaux

**En clair.** Deux tests lisent le vrai dépôt et y figent une valeur : l'id d'une fiche ouverte, le
statut d'un ADR. Un geste normal de la méthode change cette valeur. La CI rougit alors pour une raison
sans rapport avec le contenu de la PR. C'est arrivé deux fois le même jour.

**Les faits, datés (2026-10-01).**

1. **PR #314** (`188a0558`, ship de 8 fiches de la V0.4). Le test
   `products/mega-city/src/__tests__/project-root-bins.test.ts` visait une fiche vectorz écrite en dur.
   Le ship l'a rangée dans `done/`, et le test a cassé. Corrigé dans la même PR : la fonction
   `anOpenVectorzFiche()` choisit, au moment du test, la première fiche active du backlog.
2. **PR #315** (`dbd21b88`, ratification de 4 ADR). Le test
   `products/mega-city/src/__tests__/review-floor-contract.test.ts` exigeait l'ADR-0059 au statut
   « Proposé ». La ratification l'a fait casser. Corrigé dans la même PR : il attend désormais
   « Accepté (ratifié par le PO le 2026-10-01) ».

**Pourquoi ça coince.** La PR qui livre une fiche ou ratifie un ADR doit aussi réparer un test de code,
sans l'avoir prévu. Le cas 1 est une fragilité accidentelle. Le cas 2 est peut-être voulu : le test
sert d'alarme quand le statut de l'ADR change. Aucune règle ne distingue les deux.

**Piste pour la rétro.** Poser une règle simple. Un test qui lit le vrai dépôt ne fige pas une donnée
vivante : il la choisit au moment du test. Une alarme voulue le dit dans son nom ou dans son message
d'échec. À mesurer : sur les 10 prochains ships ou ratifications, 0 test cassé sans lien avec le
contenu de la PR.
