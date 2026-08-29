---
id: "20260812104022237"
title: Tracer la session/branche responsable d'une PR — une PR = une seule session (éviter le double-travail)
type: feature
priority: P1 # choisie par le PO (session 2026-08-12)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-12
---

# Owner d'une PR — quelle session/branche en a la responsabilité

> **⛔ Absorbée le 2026-08-28 dans le cockpit de sessions [[20260825141012293]]** (décision PO).
> Le cockpit répond à ce besoin : il affiche session × branche × PR et **alerte quand deux
> sessions touchent le même fichier** (advisory, pas de verrou exclusif). La question
> « exclusif vs advisory » laissée ouverte ici est tranchée par **ADR-0042**
> (`products/mega-city/docs/adr/0042-concurrence-inter-sessions-advisory-visibilite.md`) :
> **advisory**. Cette fiche reste comme trace ; à clore quand le cockpit ship.

## Contexte / Problème

Besoin PO (session 2026-08-12) : depuis une **PR** (ou une feature), pouvoir savoir
**quelle session/branche l'a créée et la pilote** — au minimum une info, quelque part,
sur la session « en responsabilité » d'une PR. Objectif : **empêcher que deux sessions
traitent la même feature/PR en parallèle** sans le savoir. Hypothèse PO à valider au
grooming : *il ne peut y en avoir qu'une* (ownership exclusif).

**Symptôme daté (dogfood, le jour même).** Cette session de grooming
(`backlog-grooming-features-453078`) et une autre ont **minté indépendamment les ids
0186-0188** pour des fiches **différentes** (screenshots / DoR-surfaces / marketing vs
Skema / article-llm / ADR-lisibles) — double-mint résorbé à la main par renumérotation
en id horodaté. C'est exactement la classe « deux sessions, même objet, sans le savoir ».

**Prior art à composer (ne pas redécrire).**
- Convention de branche `feat/<id>-<slug>` — lie fiche↔PR **mécaniquement**.
- Garde-fou *STAND-DOWN* d'`ezk-codex` — détecte déjà « branche pilotée par un autre
  worktree / commits d'une autre session apparus » et rend la main.
- `0090` verrou de sprint (shipped), `0002` worktree en session concurrente (shipped).
- `0180` id horodaté (fiche 0180) — **tue la collision d'id**, mais **pas** l'ownership :
  savoir *qui possède la PR* reste non tracé.

## Proposition

**Solution volontairement non tranchée** (demande PO explicite : « je ne souhaite pas
influencer la solution ») → décision à l'architecte au grooming. Pistes ouvertes :

- **Où vit l'info d'ownership** : front-matter de la fiche ? un registre dédié ? le
  corps de PR ? une trace de session côté supervision (runs/journal) ? Comment un
  worktree la lit/écrit **sans coordination centrale**.
- **Exclusif vs advisory** : une PR = une seule session (bloquant) *ou* on signale et on
  laisse arbitrer (comme le STAND-DOWN d'`ezk-codex`).
- Lien fort avec le **modèle worktree/session** et l'id horodaté (`0180`).

**À groomer avec `/engineering:architecture`** (où stocker, exclusif vs advisory,
frontière avec ezk-codex) **et `/product-management:product-brainstorming`** (le vrai
besoin, la bonne UX de restitution « qui tient cette PR »).

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)

## Notes / décisions

- Voisins : `ezk-codex` (STAND-DOWN), `0090` (verrou de sprint), `0180` (id horodaté),
  `0002` (worktree concurrent) ; [[20260812104022240]] (rationalisation backlog, même
  session).
- Origine : session 2026-08-12, avec **preuve datée** de collision 0186-0188 le jour même
  (résorbée dans le commit de merge de cette branche).
