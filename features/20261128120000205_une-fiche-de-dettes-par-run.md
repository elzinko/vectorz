---
id: "20261128120000205"
title: "Les dettes non bloquantes nommées à l'acceptation vont dans une fiche de dettes du run"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [theme:outillage-methode, origine:retro-2026-11-28]
status: idea
blocked:
depends: []
pr:
evidence: none
created: 2026-11-28
---

# 20261128120000205 — Les dettes non bloquantes nommées à l'acceptation vont dans une fiche de dettes du run

**En clair.** Au run du 26 novembre, le product owner virtuel a nommé une douzaine de dettes non bloquantes en acceptant les fiches. Trois seulement ont donné une fiche. Les autres sont restées dans le journal de sprint, qui n'est pas versionné. Cette fiche les range dans une seule fiche de dettes par run.

## Contexte / Problème

Exemples de dettes perdues : le motif de blocage pas affiché dans Fiches, `suites[]` de la cloche non affiché, la vignette « Dernière rétro » pas branchée, le menu « ⋯ » qui ne se ferme pas au clic dehors. Une fiche par dette noierait le backlog : l'équipe de la rétro l'a écarté.

## Proposition

À chaque acceptation, `ezk-pm` écrit ses dettes dans une fiche `idea` du run, créée au premier besoin : une ligne par dette, avec le lien vers la fiche mère. Le bilan de run cite cette fiche. Au grooming suivant, le PO promeut une dette en fiche ou la laisse.

## Critères d'acceptation

- [ ] Un run qui nomme des dettes produit exactement une fiche de dettes.
- [ ] Chaque dette y figure avec le lien vers sa fiche mère.
- [ ] Le bilan de run cite la fiche de dettes.
- [ ] Un run sans dette ne crée aucune fiche.

## Comment vérifier

- Après un run, compter les dettes nommées dans le journal de sprint et les lignes de la fiche de dettes : les deux nombres sont égaux.

## Hors périmètre

- Reprendre les dettes du run du 26 novembre (elles peuvent servir d'exemple au build).

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
