---
id: "20261013073300242"
title: "Les commandes ezk de lecture visent le projet hôte (--root)"
type: feature
priority: P1
product: mega-city
version: v0.12.0
labels: [installation, flux-local]
status: idea
blocked:
pr:
evidence: none # commandes et messages de terminal, pas d'écran
split_from: "20261004083344960"
created: 2026-10-13
---

# 20261013073300242 — Les commandes ezk de lecture visent le projet hôte

**En clair.** Depuis un projet hôte comme samplerz, plusieurs commandes `ezk` de **lecture** ne visent que le dépôt de la méthode (vectorz), pas l'hôte. On veut qu'elles acceptent la racine du projet hôte, qu'un refus montre la bonne cible, et qu'elles ne lisent jamais vectorz en silence.

**Si tu arrives frais.** Un projet hôte utilise la méthode sans la contenir (samplerz ; la méthode vit dans vectorz). `--root` dit à une commande `ezk` quel dépôt viser.

## Contexte / Problème

Découpée de la fiche « Les outils de la méthode marchent depuis un projet hôte » (20261004083344960), **côté lecture**. Vécu au sprint 1 de samplerz (2026-10-03) et aux rétros suivantes :

- `ezk backlog plan-head`, `ezk backlog plan-lot`, `ezk docs check-links`, `ezk board check`, `ezk run context`, `ezk run report` ne visent que vectorz.
- Appelé sans `--root`, `plan-lot` a lu le backlog de vectorz **depuis samplerz, sans prévenir**.
- Le skill `ezk-sprint` prescrit `products/mega-city/skills/ezk-pr/scripts/ship-in-pr.sh`, un chemin qui n'existe que dans vectorz.

## Critères d'acceptation

- [ ] `ezk backlog plan-head`, `ezk backlog plan-lot`, `ezk docs check-links`, `ezk board check`, `ezk run context`, `ezk run report` acceptent `--root <projet hôte>` et lisent **ce** dépôt.
- [ ] Un refus nomme la racine du **projet hôte**, pas celle de vectorz.
- [ ] Sans `--root` depuis un projet hôte, aucune ne lit le backlog de vectorz en silence : elle vise le dépôt du dossier courant, ou refuse en le disant.
- [ ] Le skill `ezk-sprint` ne prescrit plus un chemin `products/mega-city/…` qui n'existe que dans vectorz.
- [ ] Mesure : au prochain sprint samplerz, 5 refus de lecture sur 5 nomment le projet hôte.

## Comment vérifier

```bash
cd <projet-hote>
ezk backlog plan-lot 1 --root "$(git rev-parse --show-toplevel)"  # lit le backlog hôte, pas vectorz
ezk run context --root "$(git rev-parse --show-toplevel)"         # vise l'hôte
```

## Notes / décisions

- Découpée de la fiche `20261004083344960` le 2026-10-13 (côté **lecture**). Le côté **écriture** est la fiche sœur [Les commandes ezk qui écrivent visent le bon dépôt hôte](20261013073300256_commandes-ecriture-ezk-projet-hote.md). Même version v0.12.0.
- Origine : rétro samplerz 2026-10-03 + rétro « vue process » 2026-10-10 + run v0.11 2026-10-13 (règle de taille `20261013013553179`).
