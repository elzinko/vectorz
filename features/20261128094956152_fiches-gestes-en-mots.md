---
id: "20261128094956152"
title: "Fiches : le menu d'une fiche propose ses gestes en mots — Groomer, Marquer prête, Parker"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control, fiches]
status: idea
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094956152 — Fiches : le menu d'une fiche propose ses gestes en mots — Groomer, Marquer prête, Parker

**En clair.** Dans la liste des fiches, le menu « ⋯ » d'une ligne ne propose que d'ouvrir la fiche. La
maquette y met les gestes utiles à l'étape de la fiche : « Groomer », « Marquer prête », « Parker ». On les
ajoute. Le clic montre la commande, mission control ne lance rien.

**Si tu arrives frais.** Groomer, c'est faire mûrir une idée jusqu'à ce qu'elle soit prête. Parker, c'est
mettre de côté une fiche qu'on ne peut pas construire maintenant. `CommandHint` est le composant qui
montre une commande sans l'exécuter. La maquette est la référence d'écran du PO : page « Fiches ».

## Contexte / Problème

Décision du PO en relecture de maquette (5 novembre) : des boutons en mots et un menu contextuel par fiche,
jamais une commande affichée comme action. L'app a le menu, mais sans les gestes : il faut connaître la
commande par cœur.

## Proposition

1. Le menu d'une fiche propose, selon son étape : pour une idée, « Groomer », « Marquer prête » et
   « Parker » ; pour une fiche prête, « Parker » ; pour toutes, « Ouvrir la fiche ».
2. Le clic sur un geste montre la commande exacte avec `CommandHint`, sans rien exécuter.
3. Un geste sans commande côté méthode n'apparaît pas : « Lever le blocage » reste absent tant qu'aucune
   commande ne le fait.
4. La même liste de gestes sert à la carte « Gestes selon l'étape » de la page d'une fiche.

## Critères d'acceptation

- [ ] Le menu d'une idée propose « Groomer », « Marquer prête », « Parker » et « Ouvrir la fiche ».
- [ ] Le menu d'une fiche livrée ne propose que « Ouvrir la fiche ».
- [ ] Le clic sur un geste montre sa commande, sans rien exécuter.
- [ ] Un test vérifie que chaque commande montrée existe côté méthode.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Fiches : http://localhost:5274 → Fiches → le menu « ⋯ » d'une idée
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
