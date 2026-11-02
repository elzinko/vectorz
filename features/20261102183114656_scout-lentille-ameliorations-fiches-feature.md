---
id: "20261102183114656"
title: "ezk-scout propose aussi des améliorations, sous forme de brouillons de fiches feature"
type: feature
priority: P2 # provisoire — posée à la capture (PO à confirmer au grooming)
product: mega-city
milestone: exploration-app
labels: [test-local, exploration-app]
status: idea
pr:
evidence: none # skill et scripts, sans écran ; la preuve, ce sont ses tests
created: 2026-11-02
---

# 20261102183114656 — ezk-scout propose aussi des améliorations, sous forme de brouillons de fiches feature

**En clair.** Aujourd'hui, le scout ne cherche que des bugs. On lui ajoute un mode « améliorations ».
En utilisant l'app, il note ce qui marche mais gêne, et ce qui manque. Il rend des brouillons de fiches
feature. Comme pour les bugs, rien n'entre au backlog sans ton accord.

**Si tu arrives frais.** `ezk-scout` teste une app qui tourne, dans un état isolé, et rend un rapport
de brouillons de fiches. Sa « lentille » dit ce qu'il cherche : aujourd'hui, seulement les bugs.

## Contexte / Problème

Le 2026-11-02, le PO demande une commande pour tester son app, trouver les bugs, et « proposer aussi
des améliorations » : suggérer la création de fiches feature. Le scout ne sait faire que la première
moitié. Son contrôle de rapport refuse toute autre lentille que `bugs`
(`products/mega-city/skills/ezk-scout/scripts/check-report.sh:80`).

La fiche explorateur prévoyait cette lentille, mais par PR, et derrière un siège automatique qui
n'existe pas encore. Elle a été recentrée le 2026-11-02 sur ce seul siège :
[Un siège automatique qui joue une vraie session Claude Code](20260821210633457_explorateur-llm-pilote-siege-exploration-pr.md). Le
skill du scout prévoit déjà d'accueillir une lentille `features` sur sa brique commune
(`products/mega-city/skills/ezk-scout/SKILL.md:159-162`). Cette fiche la construit maintenant, à la
demande, sans PR ni siège.

## Proposition

- **Une lentille de plus** : `/ezk-scout run --lens ameliorations`. La lentille `bugs` reste le
  défaut. Banc isolé, garde find-only, bornes et `file` ne changent pas.
- **La frontière avec un bug.** Un bug contredit ce que l'app doit faire. Une amélioration part d'une
  app qui fait ce qu'elle doit, mais qui pourrait mieux servir.
- **Deux classes de brouillon**, reprises de la fiche explorateur :
  - « il manque une pièce » : rien n'est faux, mais une étape ou une information manque ;
  - « ça marche mais ça gêne » : c'est illisible, trop long, ou mal placé.
- **Chaque brouillon dit** ce qui gêne, pour qui, ce qu'il propose, et cite l'observation qui le
  prouve : une capture ou une sonde rejouable. Une proposition sans observation n'est pas rendue.
- **Le rapport liste aussi chaque erreur ou refus** rencontré pendant la passe, même s'il n'en tire
  pas de brouillon. C'est la parade « juge et partie » choisie par le PO le 2026-10-14 : un agent ne
  peut pas taire ce qui l'a gêné.
- **Les améliorations visuelles passent par `--ui`**, comme pour les bugs de rendu.

## Critères d'acceptation

- [ ] `/ezk-scout run --lens ameliorations` rend un rapport de brouillons de type feature. Chacun dit
      ce qui gêne, pour qui, et ce qu'il propose.
- [ ] Chaque brouillon est classé : « il manque une pièce » ou « ça marche mais ça gêne ».
- [ ] Chaque brouillon cite son observation, capture ou sonde rejouable. `check-report.sh` refuse un
      brouillon sans observation.
- [ ] Le rapport liste chaque erreur ou refus rencontré pendant la passe, même sans brouillon associé.
- [ ] Chaque brouillon passe l'anti-doublon contre le backlog, fiches actives et `done/`, et nomme sa
      voisine s'il en a une. Après ton accord, `ezk-scout file` crée les retenus en `type: feature`,
      `status: idea`, étiquetés `scout`.
- [ ] La lentille `bugs` reste le défaut. Ses tests passent sans changement, et la garde find-only
      reste OK.

## Comment vérifier

1. Ajouter à l'app jouet du scout un défaut d'usage connu, qui n'est pas un bug. Par exemple : une
   réponse correcte, mais qui ne dit pas quelle valeur l'utilisateur peut essayer ensuite.
2. Lancer `/ezk-scout run --lens ameliorations` sur l'app jouet : le rapport contient un brouillon
   « ça marche mais ça gêne » qui cite la sonde rejouable.
3. Retirer l'observation d'un brouillon : `check-report.sh` refuse le rapport.
4. Les tests du scout passent :

```bash
bash products/mega-city/skills/ezk-scout/scripts/test-check-report.sh
bash products/mega-city/skills/ezk-scout/scripts/test-demo-app.sh
bash products/mega-city/skills/ezk-scout/scripts/test-find-only-guard.sh
```

## Glossaire

- `lentille` — ce que le scout cherche pendant une passe : des bugs, ou des améliorations.
- `observation` — ce que le scout a vu et qui fonde un brouillon : une capture, ou une sonde qu'on
  peut rejouer.

## Notes / décisions

- **Origine** : demande PO du 2026-11-02. Le PO a choisi une nouvelle fiche plutôt qu'enrichir la fiche
  explorateur, le même jour.
- **Relation avec l'explorateur**
  ([Un siège automatique qui joue une vraie session Claude Code](20260821210633457_explorateur-llm-pilote-siege-exploration-pr.md)) :
  cette fiche reprend la lentille « features » de son ancienne brique 3, à la demande. L'explorateur,
  recentré le 2026-11-02, ne garde que le siège automatique.
- **Décisions PO du 2026-10-14, reprises de l'explorateur** :
  - la parade « juge et partie » : journaliser tout refus rencontré pendant la passe (critère 4) ;
  - pas de nouvel agent qualifieur. `ezk-backlog add` fait l'anti-doublon, le type et la priorité ;
    `ezk-pm` porte le jugement produit. L'indépendance vient d'une passe séparée, pas d'un agent neuf.
- **Au build** : mettre à jour `products/mega-city/skills/ezk-scout/SKILL.md:158-162`, qui cite encore
  l'explorateur comme futur porteur de la lentille `features`.
- **Avec le carnet**
  ([Un carnet qui note ce qui est testé dans l'app, et quand la preuve expire](done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md)) :
  aucune dépendance. Une fois le carnet là, la passe pourra viser une branche de l'arbre.
- **Question ouverte, héritée de l'explorateur** : le PO voulait en 2026-10 que les propositions vivent
  dans un dossier séparé du backlog. Défaut actuel : `status: idea` et l'étiquette `scout`. À trancher
  au grooming.
- **Priorité provisoire** : P2, comme ses voisines de la milestone. À confirmer par le PO.
