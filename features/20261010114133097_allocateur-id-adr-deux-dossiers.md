---
id: "20261010114133097"
title: "Un allocateur d'id d'ADR unique sur les deux dossiers (fin des collisions de numéro)"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [adr, dx]
status: idea
pr:
evidence: none # outillage CLI, pas d'écran
created: 2026-10-10
---

# 20261010114133097 — Un allocateur d'id d'ADR unique sur les deux dossiers

**En clair.** Les ADR vivent dans **deux dossiers** avec deux numérotations : `docs/adr/` (format
`ADR-0NN`, jusqu'à 038) et `products/mega-city/docs/adr/` (format `00NN`, jusqu'à 0069). Le « prochain
numéro évident » d'un seul dossier entre en collision avec l'autre. On veut **une seule commande** qui
donne le prochain id libre des deux, pour ne plus deviner.

**Si tu arrives frais.** Un *ADR* est une note de décision d'architecture, numérotée.

## Contexte / Problème

- Vécu au sprint « vue process » (2026-10-10) : ADR-039 écrit d'après `docs/adr/` (max 038) → collision
  avec `products/mega-city/docs/adr/0039` → refait en 0069. Un aller-retour perdu.
- `check-adr-ids.sh . --next` donne le vrai numéro (0069), mais ce n'est pas le chemin par défaut :
  on écrit d'abord, on découvre la collision au test.
- Un seul **espace d'id logique**, deux **séquences physiques**, pas d'autorité d'allocation.
- Issu de la rétro du 2026-10-10 (capture
  [2026-10-10-retro-vue-process-worktree-silences](../docs/captures/2026-10-10-retro-vue-process-worktree-silences.md)),
  proposition 5 (architecte + produit).

## Proposition

- Câbler `check-adr-ids.sh . --next` comme **source du prochain id**, exposée en commande (`ezk adr new`
  ou équivalent) qui scanne les **deux** registres et crée le squelette au bon numéro.
- **Avis d'architecte à trancher à part** : la cohabitation des deux dossiers est une décision non
  tranchée. Écrire un **ADR court** « où vivent les ADR dans un repo multi-projets » — sans recommander
  la fusion des dossiers sans panel (leçon mémoire : lire les ADR récents avant toute reco d'archi).

## Critères d'acceptation

- [ ] Une commande unique produit le prochain id d'ADR libre **des deux dossiers** et pose le squelette.
- [ ] 0 collision d'id sur les 5 prochains ADR créés.
- [ ] Un ADR tranche où vivent les ADR (ou acte explicitement le statu quo), appuyé sur un panel.

## Comment vérifier

```bash
# Attendu : le prochain id proposé n'existe dans AUCUN des deux dossiers.
bash products/mega-city/bin/check-adr-ids.sh . --next
```

## Notes

Mesure (retrait) : 0 collision sur 5 ADR, quand la création à la main n'est plus le chemin emprunté.
