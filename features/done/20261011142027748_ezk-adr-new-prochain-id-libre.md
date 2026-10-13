---
id: "20261011142027748"
title: "ezk adr new — un seul prochain id d'ADR libre sur les deux dossiers"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.11.0
labels: [adr, dx]
status: shipped
split_from: "20261010114133097"
pr: "local (fd89d74b)"
evidence: none # outillage CLI, pas d'écran
created: 2026-10-11
---

# 20261011142027748 — ezk adr new : le prochain id d'ADR libre, sans deviner

**En clair.** Les ADR vivent dans deux dossiers avec deux numérotations. Écrire « le numéro
d'après » d'un seul dossier entre en collision avec l'autre, et on le découvre au test — un
aller-retour perdu à chaque fois. On veut **une commande** qui donne le prochain id libre des
deux dossiers et pose le squelette au bon numéro.

**Si tu arrives frais.** Un *ADR* est une note de décision d'architecture, numérotée. Ici il y a
`docs/adr/` (format `ADR-0NN`) et `products/mega-city/docs/adr/` (format `00NN`) : deux séquences
physiques pour un seul espace de numéros logique.

## Contexte / Problème

- Vécu au sprint « vue process » (2026-10-10) : ADR-039 écrit d'après `docs/adr/` (max 038) →
  collision avec `products/mega-city/docs/adr/0039` → refait en 0069. Un aller-retour perdu.
- `check-adr-ids.sh . --next` donne déjà le vrai numéro (0069), mais ce n'est pas le chemin par
  défaut : on écrit d'abord, on découvre la collision au test.

## Proposition

Câbler `check-adr-ids.sh . --next` comme **source du prochain id**, exposée en commande
(`ezk adr new`) qui scanne les **deux** registres et crée le squelette au bon numéro. Partie
**purement mécanique** : aucune décision d'archi (celle-ci vit dans la fiche sœur
[où vivent les ADR dans un repo multi-projets](../20261011142027875_ou-vivent-les-adr-repo-multi-projets.md)).

## Critères d'acceptation

- [x] `ezk adr new` produit le prochain id d'ADR libre **des deux dossiers** et pose le squelette.
- [x] L'id proposé n'existe dans **aucun** des deux dossiers.
- [x] Mesure : 0 collision d'id sur les 5 prochains ADR créés par la commande.

## Comment vérifier

```bash
# Attendu : le prochain id proposé n'existe dans AUCUN des deux dossiers.
bash products/mega-city/bin/check-adr-ids.sh . --next
ezk adr new   # pose le squelette au bon numéro
```

## Notes

- Issue du découpage de « Un allocateur d'id d'ADR unique sur les deux dossiers » (20261010114133097)
  au grooming du 2026-10-11 : le **câblage** (`--next`, trivial) est tiré tôt ; la **décision** « où
  vivent les ADR » part dans la fiche sœur, à trancher en panel (v0.16).
