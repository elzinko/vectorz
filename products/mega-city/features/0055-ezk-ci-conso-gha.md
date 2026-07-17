---
id: 0055
title: ezk-ci — surveiller et plafonner la consommation GitHub Actions (repos privés)
type: feature
priority: P1
status: todo
ready: 2026-07-17
pr:
created: 2026-07-15
---

## Contexte / Problème

`ezk-ci` couvre aujourd'hui UN angle : faire tourner la pipeline **en local** (act + Docker)
pour ne pas brûler de minutes avant de pousser. Il ne dit rien de la **consommation côté
GitHub** une fois le workflow poussé. Or le coût dépend de la visibilité du repo : en
**public**, les minutes Actions sont gratuites/illimitées ; en **privé**, chaque run
consomme le **quota mensuel** du compte. Faire passer un repo en privé transforme donc une
CI « gratuite » en une CI qui mange du quota — sans garde-fou, on le découvre à la facture.

## Proposition

Enrichir `ezk-ci` d'un volet **parcimonie / observabilité de la conso GHA**, en s'inspirant
des règles déjà en place sur le monorepo **muti** (à récolter / confirmer) :

- **Mesurer** : lire la conso Actions du repo (`gh api` billing / `gh run list` + durées) et
  la restituer — combien de minutes ce mois, quels workflows/jobs coûtent le plus.
- **Plafonner** : poser un **spending limit à 0** (coupe net dès le quota épuisé, aucun
  dépassement facturé) comme défaut recommandé sur un repo privé.
- **Réduire les déclenchements** : `paths-ignore` / `paths` pour ne pas lancer la CI sur des
  changements docs-only ; un bloc `concurrency` pour tuer les runs obsolètes :

  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
- **Gater le lourd** : mettre les jobs e2e / builds coûteux derrière un gate (label, branche,
  `workflow_dispatch`, ou nightly) au lieu de les lancer à chaque push.
- Rester dans la frontière ezk-ci : conseiller + éditer les `.github/workflows` + poser les
  réglages ; ne pas dupliquer un outil de billing.

## Critères d'acceptation

- [ ] Une sous-commande restitue la conso Actions d'un repo (minutes du mois, top jobs coûteux)
- [ ] Le skill sait poser/vérifier un spending limit à 0 sur un repo privé (ou explique où le faire si non pilotable par API)
- [ ] Le skill propose des diffs concrets : `paths-ignore`, bloc `concurrency` (`group` + `cancel-in-progress: true`), gate des jobs e2e lourds
- [ ] Détecte le passage public → privé comme moment-clé et alerte sur le coût
- [ ] Les règles de parcimonie `muti` sont récoltées et créditées (ou l'écart documenté si elles n'existent pas telles quelles)

## Notes

- Réf. d'implémentation : règles de parcimonie du monorepo `muti` (l'utilisateur pense qu'il
  y en a d'applicables — à confirmer / récolter, ne pas supposer).
- Continuité avec le savoir déjà encodé dans `ezk-ci` (safeguard anti-runaway
  `timeout-minutes`, la « leçon à 720 min ») : même esprit, côté cloud cette fois.
- **Enrichissement d'un skill existant**, pas un nouveau skill : reste sous `skills/ezk-ci/`.
