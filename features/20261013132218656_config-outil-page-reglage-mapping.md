---
id: "20261013132218656"
title: "Board : la page ⚙ config outil (mapping tier→modèle) + sa route d'écriture gardée"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, config]
status: ready
blocked:
pr:
evidence: before-after
split_from: "20261002205205417"
created: 2026-10-13
---

# 20261013132218656 — Board : la page ⚙ config outil + sa route d'écriture gardée

**En clair.** Le board gagne une page **globale** (bouton ⚙) pour régler l'**outil** (le poste) :
quel modèle concret et quel effort derrière chaque tier (performant / standard / économe), **par
IDE**. On y édite le mapping. C'est la **deuxième écriture** du board, après les pouces 👍/👎 : sa
route reprend les mêmes gardes et n'écrit que la config de l'outil.

**Si tu arrives frais.** La portée **projet** (le tier par rôle) vit dans l'onglet config du projet
(fiche sœur du board) ; la portée **outil** (le mapping tier → modèle) est globale, car un modèle
écrit dans le projet casserait dans un autre IDE (ADR-074). Le **moteur** (schéma, résolveur, CLI)
est porté par deux fiches mega-city sœurs.

## Contexte / Problème

Découpée de la fiche [Régler le modèle et l'effort de chaque agent](done/20261002205205417_modele-effort-agents-par-projet.md),
**côté board / écriture**. L'onglet « config projet » du board
([slice 250](20261012231419250_board-config-projet.md)) affiche le tier par rôle + le modèle résolu,
et renvoie « régler l'outil » **ici**. Aucune tranche du board ne couvrait encore cette page ⚙ ni la
route qui écrit la config. L'[ADR-0057](../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)
n'autorise qu'une écriture (les pouces) : cette fiche l'amende pour en autoriser une deuxième, bornée.

## Proposition

- **La page ⚙.** Un bouton global (en-tête du board) ouvre une page « config outil » : le mapping
  tier → modèle + effort, **éditable**, **par IDE** (Claude Code, Cursor…). Plus les défauts de l'outil.
- **La route gardée.** L'édition passe par une route d'écriture qui reprend **toutes** les gardes de la
  route des pouces (méthode, `Host`, `Origin`, type, taille, projet inconnu) et refuse en plus un tier,
  un agent ou une valeur inconnus. Elle n'écrit **que** la config de l'outil.
- **L'amendement.** Un amendement de l'ADR-0057 consigne cette deuxième écriture et sa limite.
- Elle appelle le **moteur** (fiches sœurs mega-city) : elle n'a aucune logique de calcul propre.

## Critères d'acceptation

- [ ] La page ⚙ montre le mapping tier → modèle + effort par IDE, et permet de le **modifier** ;
      ensuite, `ezk config show` (ou le résolveur) reflète la nouvelle valeur.
- [ ] La route d'écriture **refuse tout ce que refuse celle des pouces** (ADR-0057), **plus** un tier,
      un agent ou une valeur inconnus ; elle n'écrit que la config de l'outil.
- [ ] Un amendement de l'ADR-0057 consigne cette deuxième écriture.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web build
# ouvrir la page ⚙ : éditer le mapping d'un tier pour un IDE, vérifier que le résolveur voit la valeur
# rejouer les cas de refus de la route des pouces : la nouvelle route les refuse aussi
```

## Notes / décisions

- Découpée de `20261002205205417` le 2026-10-13 (**page ⚙ outil + route gardée**, critères 10-11).
  Fiches sœurs **moteur** (mega-city, v0.17.0) :
  [schéma + résolveur](20261013132218242_config-modeles-schema-et-resolveur-pur.md) et
  [pointeurs + CLI](20261013132218451_config-modeles-pointeurs-et-cli.md). À construire **après** elles.
- Ne duplique pas l'onglet config projet du board ([slice 250](20261012231419250_board-config-projet.md)),
  qui porte le tier par rôle + le modèle résolu (portée projet). Ici = portée **outil** + l'écriture.
- Design de référence : [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ;
  maquette [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html) (vue « config outil »).
