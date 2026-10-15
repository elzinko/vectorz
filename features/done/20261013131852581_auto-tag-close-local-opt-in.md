---
id: "20261013131852581"
title: "Auto-tag et clôture de version en local, en opt-in explicite (+ ADR)"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.15.0
labels: [methode, ezk-product-build]
status: shipped
blocked:
pr: "local 8156ad0c"
evidence: none # pilote de run + ADR, pas d'écran
split_from: "20261011103839682"
created: 2026-10-13
---

# 20261013131852581 — Auto-tag et clôture de version en local, en opt-in explicite

**En clair.** Poser l'étiquette d'une version (`version close --tag`) est aujourd'hui le seul geste
git **réservé au PO**. Le PO a demandé qu'un run autonome puisse taguer et clore en local tout seul.
On l'ajoute, mais **en opt-in** : un drapeau explicite, **absent par défaut**, et un **ADR** qui acte
cet assouplissement. Pas d'auto-tag silencieux.

**Si tu arrives frais.** « Clore une version » = `ezk backlog version close <v> --tag` : poser
l'étiquette git. En flux local (`github: false`), rien n'est poussé. Le POC de boucle multi-versions
est la fiche sœur ; ici on ajoute **seulement** le scellage automatique, derrière un opt-in.

## Contexte / Problème

Demande PO du 2026-10-11 : « tague et merge en local tout seul » pour un run multi-versions. Or
`version close --tag` est **exprès** réservé au PO (le seul geste git que la méthode lui laisse). Un
run autonome qui tague touche ce garde-fou **voulu** — donc pas un ajout silencieux : il faut un
opt-in et un ADR, comme l'a demandé le PO (« via une fiche/ADR, pas en ajout silencieux »).

## Proposition

- Un opt-in explicite pour l'auto-tag/close local, par exemple **`--seal-versions local`**, **absent
  par défaut**. Sans lui, un run multi-versions clôt mais **ne tague pas** (le tag reste au PO).
- Un **ADR** acte l'assouplissement : le tag n'est plus seulement un geste PO **quand ce drapeau est
  posé, en flux local (`github: false`)**. Hors flux local, le tag reste au PO.
- Garde-fou ADR-0001 : le skill décide de poser le drapeau ; `ezk backlog version` exécute le git.

## Critères d'acceptation

- [ ] L'auto-tag/close local est **opt-in** (`--seal-versions local` ou équivalent) et **absent par
      défaut** : un run sans le drapeau clôt sans taguer.
- [ ] Avec le drapeau, en flux local, chaque frontière de version pose l'étiquette toute seule.
- [ ] Un **ADR** consigne l'assouplissement et sa limite (local uniquement) ; hors local, le tag reste
      réservé au PO.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# run --versions all SANS le drapeau : clôt, ne tague pas
# run --versions all AVEC --seal-versions local : tague à chaque frontière, rien n'est poussé
```

## Notes / décisions

- Découpée de la fiche `20261011103839682` le 2026-10-13 (le point 2 : l'auto-tag, qui touche un
  garde-fou PO voulu). Le POC de boucle est la fiche sœur
  [ezk-product-build enchaîne plusieurs versions](20261013131852375_product-build-boucle-multi-versions.md) ;
  le park-hors-version est [l'auto-groom sort une fiche hors version](20261013131852779_auto-groom-sort-fiche-hors-version.md).
  Même version v0.15.0.
- **Demande PO explicite** (2026-10-11) : le PO a déjà tagué en local sur autorisation à chaque run
  autonome v0.7→v0.12 ; cette fiche automatise ce geste **derrière un opt-in**, pas à son insu.
