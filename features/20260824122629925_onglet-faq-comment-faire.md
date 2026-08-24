---
id: "20260824122629925"
title: Onglet FAQ « comment faire » — ancrer une bonne fois les questions récurrentes du PO
type: feature
priority: P1
product: mega-city
version:
epic:
depends: ["20260824122629794"]
status: idea
ready:
pr:
created: 2026-08-24
---

## En clair

Tu te reposes souvent les mêmes questions (« ai-je déjà implémenté telle commande ? »,
« quel mécanisme sert à ça ? ») et tu ne retrouves pas la réponse. Cette fiche demande
un **onglet FAQ « comment faire »** — un endroit unique où chaque question récurrente
est répondue **une bonne fois pour toutes**, avec un pointeur vers la commande ou l'ADR
qui fait autorité. Premier candidat d'entrée : « comment capitaliser une feature d'un
projet en recette ? » — **mais cette entrée-là attend** que le mécanisme existe (fiche
`20260824122629794`), sinon elle documenterait du vide.

## Contexte / problème

Constat PO (2026-08-24) : les mécanismes de la méthode (recette, rule, capability,
profil, extract…) se mélangent dans sa tête ; il perd du temps à re-chercher ou
re-demander. Le glossaire (`docs/glossaire-jargon-ezk.md`) définit les MOTS ; il manque
le « **comment faire X** » (procédures, quelle commande, déjà implémenté ou pas).

Anti-doublon : aucune fiche FAQ n'existe. Voisin de l'épic `20260816131703334`
(rationalisation doc + découvrabilité) — cette FAQ pourrait en devenir une fille.

## Proposition

1. **Un onglet FAQ** — le support à trancher au grooming : soit un **nouvel onglet de la
   carte** (`carte-interactive.html`, à côté du 🧭 « domaine »), soit un doc
   `docs/faq-comment-faire.md` lié depuis README/GETTING_STARTED. Chaque entrée =
   question + réponse courte + pointeur (commande / ADR / fiche).
2. **Une règle de fraîcheur** (optionnelle, à l'image du test d'invariant de la carte) :
   une entrée FAQ qui cite une commande inexistante devrait être détectable.
3. **Format** : « En clair » par entrée, jamais de jargon non défini (règle
   `human-facing-lisibility`).

## Dépendance (le point que tu as demandé)

`depends: 20260824122629794`. L'entrée FAQ « **comment capitaliser une feature en
recette** » ne peut être écrite **véridiquement** qu'une fois le mécanisme
d'extraction construit. Tant que `extract` n'existe pas, écrire « lance ezk-ezk
extract » serait faux. Donc : **l'onglet peut naître avec d'AUTRES entrées**, mais
cette entrée-ci reste **bloquée** derrière la fiche sœur.

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] Support tranché (onglet carte vs doc lié), et lié depuis un point d'entrée.
- [ ] Au moins 3 entrées « comment faire » réelles (les questions récurrentes du PO).
- [ ] L'entrée « capitaliser une feature » n'est ajoutée QUE si `20260824122629794`
      est livrée (dépendance respectée).
- [ ] Chaque entrée pointe vers une commande/ADR/fiche qui existe vraiment.

## Comment vérifier

```bash
pnpm ezk:map   # l'onglet FAQ est présent et cliquable (si support = carte)
```

## Notes

Origine : `/ezk-backlog add` du 2026-08-24. P1 proposée (PO « urgent ») — à confirmer.
Fiche sœur : `20260824122629794` (le mécanisme d'extraction), dont dépend l'entrée
« capitaliser une feature ». À rapprocher de l'épic doc/découvrabilité
`20260816131703334`.
