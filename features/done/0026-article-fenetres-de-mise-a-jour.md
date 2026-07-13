---
id: 0026
title: Article « fenêtres de mise à jour » — l'éligibilité de migration déclarée par le travailleur
type: feature
priority: P2
status: shipped
pr: "#59"
created: 2026-07-13
---

# 0026 — Article « fenêtres de mise à jour »

## Contexte / Problème

Issu de la discussion du 2026-07-13 sur la **clause 5 du contrat de supervisabilité**
([docs/articles/contrat-de-supervisabilite.md](../docs/articles/contrat-de-supervisabilite.md)) :
l'adoption de version se fait aux jalons (gates) — mais un jalon n'est **pas forcément un point
STABLE**. À la fin d'une étape, il peut rester des worktrees ouverts, une migration en cours,
un état intermédiaire non migrable. L'utilisateur a posé le principe : **« c'est la méthode qui
doit savoir quand le code est stable »** — il faut donc un **signal d'éligibilité déclaré par la
méthode elle-même**, pas déduit par le superviseur.

Le sujet a été jugé « à part entière » : il mérite son propre article, même format que la fiche
[0025](./0025-article-contrat-supervisabilite.md) (article = antichambre d'ADR, publication
externe différée).

## Proposition

Deux phases, calquées sur la fiche 0025 :

1. **Recherche préalable (première main).** Lire et ficher les systèmes qui savent « mettre à
   jour un système pendant qu'il travaille » : Temporal Worker Versioning (Pinned,
   Continue-as-New) ; Restate (snapshot de version incluant prompts/tool-defs) ; Kubernetes
   cordon/drain + PodDisruptionBudget (l'éligibilité d'éviction déclarée par la charge) ;
   migrations de schéma online gh-ost / pt-online-schema-change (la fenêtre de bascule) ;
   Erlang/OTP hot code swapping (le contre-exemple assumé) ; blue-green / canary. Sortie :
   notes de lecture avec citations exactes vérifiées (URL + passage), dans `docs/captures/`.
2. **Article dans `docs/articles/`** — même barre de qualité que
   [contrat-de-supervisabilite.md](../docs/articles/contrat-de-supervisabilite.md) : ouvert par
   un récit, vulgarisation avant formalisation, thèse en épigraphe, proposition d'implémentation
   cop1/mega-city (indicateur d'éligibilité dans le rapport de jalon, `adopt_version` uniquement
   sur jalon éligible, adoption toujours affichée). Relecture par panel indépendant avant merge.

Publication externe : explicitement différée, comme pour la 0025.

## Critères d'acceptation

- [x] Notes de lecture de première main des 6 sources, avec citations vérifiées (URL + passage),
      dans `docs/captures/` (datées du jour) →
      [2026-07-13-notes-lecture-fenetres-mise-a-jour.md](../docs/captures/2026-07-13-notes-lecture-fenetres-mise-a-jour.md)
      (6 citations porteuses contre-vérifiées par grep sur la source brute).
- [x] `docs/articles/<slug>.md` : article autonome, **ouvert par un récit** (la genèse : un
      contrat qui dit « adoption aux jalons », et l'objection — seul le travailleur sait si son
      état est migrable), ~2 000-2 500 mots, chaque référence glosée à la première occurrence →
      [fenetres-de-mise-a-jour.md](../docs/articles/fenetres-de-mise-a-jour.md).
- [x] L'article ne contredit ni la capture
      [2026-07-13-contrat-methode-et-versions.md](../docs/captures/2026-07-13-contrat-methode-et-versions.md)
      (D1, D2) ni ADR-021 (il *étend* la clause 5 : adoption aux jalons **éligibles**).
- [x] Relecture par panel indépendant passée (lecteur cible, juge essais, copy-editor, fidélité
      article↔notes, accessibilité des références) + contre-lecture finale « publier ».
- [x] Article et notes indexés dans [docs/index.md](../docs/index.md).
- [x] Gate locale verte (lint + build + tests ; pas de code touché).

## Notes / décisions

- Dépend de la capture 2026-07-13 (D1 : pas de migration à chaud ; D2 : adoption aux gates,
  toujours affichée) et de la clause 5 de l'article 0025. Indépendant du code cop1.
- Thèse candidate (à challenger pendant la rédaction) : *« on sait déployer sans couper le
  trafic ; on ne sait pas encore mettre à jour une méthode sans couper le travail — et c'est le
  travailleur qui sait quand c'est possible, pas l'opérateur »*.
- Implémentation proposée côté cop1/mega-city : le rapport de jalon porte un indicateur
  d'éligibilité (ex. `upgrade_ok: true|false` ou une fenêtre de migration) ; le superviseur ne
  peut émettre `adopt_version` que sur un jalon éligible ; l'adoption reste toujours affichée
  (D2).
