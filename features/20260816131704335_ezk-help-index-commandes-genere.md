---
id: "20260816131704335"
title: "/ezk-help — index de commandes ezk généré depuis les frontmatter"
type: feature
priority: P1
product: mega-city
epic: "20260816131703334"
labels: [doc, decouvrabilite, enabler]
status: todo
ready:
pr:
created: 2026-08-16
---

# /ezk-help — index de commandes généré

> Fille de l'épic [Rationalisation doc + découvrabilité](20260816131703334_doc-decouvrabilite-rationalisation.md),
> **Phase 1 (Générer)**. Déclencheur daté : le PO a demandé « quelle est la commande pour X »
> et a proposé un `/ezk-help` — le besoin de découvrabilité est prouvé par l'usage (2026-08-16).

## Contexte / Problème

Il y a **20 skills + 7 agents ezk**, chacun avec ses sous-commandes déclarées dans le
frontmatter (`argument-hint`, ex. `ezk-backlog : [help|init|list|add|groom|ready|next|plan|
review|reconcile|ship|regen]`). Mais **aucun index ne les agrège** : pour savoir « quelle
commande pour X », il faut ouvrir chaque `SKILL.md`. Les seules vues d'ensemble
(`skills/README.md`, `method-map.md`) sont **tenues à la main et dérivent** (compteurs faux
19/6 vs 20/7, `ezk-archive` oublié). La matière d'un index existe déjà dans les frontmatters —
inexploitée.

## Proposition

Un **helper de découvrabilité GÉNÉRÉ** (jamais maintenu à la main — principe de l'épic) :

1. **`/ezk-help`** (sans arg) : liste **tous** les skills ezk avec leur ligne `description`
   (une phrase) + leur `argument-hint`, **agrégés depuis les frontmatter** (source de vérité).
   Groupé par bande méthode (ADR-0022) si pertinent.
2. **`/ezk-help <nom>`** : déroule le détail d'une commande citée (sa table d'usage / son `help`).
3. **Généralisation** : le même script alimente un **inventaire à jour** (compteurs, table
   skills/agents) et remplace les compteurs à la main de `skills/README.md` — fin de la dérive.
   Piste : réutiliser `profiles/global.yml` comme liste des skills réellement bindés.

Frontière (ADR-0013 anti-surproduction) : **mince**. Le LLM ne juge rien ; **le script range**
(lit les frontmatter, imprime). C'est de la découvrabilité read-only. Distinct du `method-map`
(carte des *rôles*) : `/ezk-help` = index des *commandes*.

## Critères d'acceptation

- [ ] `ezk help` (ou `/ezk-help`) liste **les N skills réels** (compte exact, dérivé de la source, pas d'un nombre en dur) avec description + `argument-hint`
- [ ] `ezk help <nom>` affiche le détail d'un skill nommé (au moins sa table d'usage)
- [ ] un skill **ajouté/retiré** apparaît/disparaît **sans édition manuelle** de l'index (test : ajouter un skill fixture → il apparaît)
- [ ] les compteurs de `skills/README.md` sont **générés** (ou vérifiés par un test qui échoue si l'index dérive de la réalité) — fin du 19/6 faux
- [ ] gate locale verte (test du script)

## Notes

- Antidote direct au symptôme « la carte n'est pas à jour » : **généré = ne dérive pas**.
- Voisines : épic parent · [[0068]] (method-map à la main — antipattern remplacé) · [[0133]] (carte des rôles).
- Candidat idéal pour dogfooder `/ezk-product-builder build --check-ready false` (petit, outcome testable net).
