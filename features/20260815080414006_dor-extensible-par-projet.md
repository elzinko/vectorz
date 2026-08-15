---
id: "20260815080414006"
title: DoR extensible par projet — base 3+1 + manifeste de slots par repo, lu par groom/ready
type: feature
priority: P2
product: mega-city
epic: "20260815080413884"
status: idea
ready:
pr:
created: 2026-08-15
---

# DoR extensible par projet

## Contexte / Problème

La DoR maison est **figée dans le skill** : 3 slots (problème / valeur / critères) + 1
conditionnel (dépendances externes), en dur dans `ezk-backlog groom`/`ready`. Or le
« ready » **varie par projet** : un produit à vitrine a besoin d'un slot « surfaces
impactées » ([[20260812104022231]]), une lib d'un « contrat d'API publique + note de
migration », un produit data d'une « dispo des données constatée ». Aujourd'hui, ajouter
un critère = éditer le skill **global** — donc valable pour tous les repos, ou pour aucun.
Pas de milieu.

## Proposition (à groomer — pistes archi)

**Base + extension déclarée par repo, en composant l'existant** ([ADR-0001] : le script
range, le LLM juge ; [ADR-0013] : pas de couche neuve si l'existant suffit).

- **Base** : les 3+1 slots restent le socle universel (inchangé, pas de régression).
- **Manifeste par projet** (léger, commité sur `main` — invariant n°1 d'ezk-backlog) :
  déclare **quels** slots supplémentaires s'appliquent à ce repo. Lisible par script
  (`regen` peut émettre « slots définis / remplis »). Piste : une section dédiée dans
  `rules/` **ou** un `features/dor.yml`.
- **Jugement** : *comment* on juge chaque slot reste **LLM** (règle opposable dans
  `rules/`), pas un compteur. `groom` lit le manifeste pour savoir quels slots remplir ;
  `ready` le lit pour savoir quoi exiger — **sans dupliquer** la logique du gate ni casser
  le point d'entrée unique `next --ready-only`.
- **Opt-in franc** : un slot **déclaré** pour le repo **bloque** `ready` s'il est vide
  (sinon ce n'est pas un gate) ; un slot **non déclaré** est absent (zéro bruit).

**Slots candidats agent-natifs (parqués `idea` — ne pas construire sans qu'un projet les
réclame) :**

- **Indépendance / concurrence** — « constructible dans un worktree isolé sans collisionner
  avec ce qui est en vol ? ». Sûreté de parallélisation entre sessions (PAS l'heuristique
  « deps ≤ 3 »). Valeur croissante vu l'historique de collisions d'ids entre worktrees.
- **Estimation / prédictibilité** — baseline empirique de coût-token par classe de fiche,
  pour une équipe mûre sur sujets récurrents. Dépend d'une **capture de coût par fiche**
  qu'on n'a pas encore (journal de supervision) → **différé** ; l'absence de prédictibilité
  est une info valable, pas un échec.

## Critères d'acceptation

- [ ] (à définir au grooming — DoR ; archi via `engineering:architecture`, cf. [[20260812104022243]])
- [ ] Un repo peut déclarer ≥1 slot supplémentaire ; `ready <id>` le **refuse** s'il est vide.
- [ ] Un repo **sans** manifeste garde le comportement actuel (3+1), sans régression.
- [ ] Frontière script/LLM respectée ([ADR-0001]) : le script lit *quels* slots, le LLM juge *si* ils sont tenus.

## Notes / décisions

- **Épine de l'épic** [[20260815080413884]] ; [[20260812104022231]] en est le 1er slot concret.
- Compose : `ezk-backlog` (groom / ready / regen), `rules/`, éventuellement Skema [[0186]]
  pour faire évoluer le manifeste. La DoR reste **évolutive via `ezk-retro`**.
- **Anti-sur-outillage** : si le manifeste vire au mini-langage, c'est le signal de s'arrêter
  ([ADR-0013] §4) — commencer par **1 slot réel** (surfaces), pas un framework de slots.
- Origine : session 2026-08-15 (audit méthode) — décision PO « DoR de base extensible par projet ».
