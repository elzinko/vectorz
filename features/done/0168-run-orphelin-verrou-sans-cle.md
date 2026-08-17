---
id: 0168
title: "Run orphelin = verrou sans clé — un run jamais clôturé bloque toute émission, sans action de déblocage"
type: bug
priority: P0
epic:
depends: ["0105"]
labels: [supervision, dogfood, ux, contrat]
status: shipped
ready: 2026-07-30
pr: "#76"
created: 2026-07-30
product: mega-city
---

# 0168 — Un run non clôturé verrouille l'émetteur, et rien ne permet de le rouvrir

## Contexte / Problème

Le kit émetteur n'autorise **qu'un run ouvert par projet** :
`products/mega-city/src/supervision/runtime.ts:164-167` refuse `run_start` tant qu'un run
est ouvert. C'est un invariant sain — mais **rien ne clôt un run quand la session qui
l'a ouvert meurt** (fenêtre fermée, contexte perdu, standby, crash). Résultat : le projet
est **définitivement muet**, et le seul recours est qu'un opérateur lise le message
d'erreur, comprenne le modèle, et clôture à la main le run **de quelqu'un d'autre**.

### Symptôme observé (2026-07-30, repo vectorz)

1. Le run `ezk-sprint` `2026-07-29T12-48-47-648Z-2a4f2f22` est ouvert depuis la veille
   12:48, avec **1 seul événement** (`run.started`) — l'orphelin décrit en [0105](0105-bug-moniteur-silence-dogfood.md).
2. Session suivante, `/supervision-demo` appelle `run_start` →
   `run_start refusé : un run est déjà ouvert (run_id=…)`.
3. **Aucun outil de reprise ni de nettoyage** dans les 6 outils MCP : la démo est
   bloquée net. Le déblocage a exigé une décision humaine explicite du siège, prise
   dans le chat (`run_finished {status: "abandoned"}` émis à 2026-07-30 sur le run d'hier).
4. Effet de bord : clôturer à l'aveugle **écrase le signal** « silence prolongé » que le
   Moniteur affichait — or ce signal est précisément la preuve utile de 0105.

**Ce n'est pas 0105.** 0105 = *le Moniteur paraît cassé* (lisibilité de la carte run +
absence de signe de vie, réglée par `heartbeat`/0103). Ici le défaut est un **verrou sans
clé** : le remède n'est pas de l'affichage ni du heartbeat, c'est une **action de
déblocage** et une erreur qui la nomme.

## Valeur

Sans clé, un seul orphelin suffit à rendre un projet supervisé **inutilisable
définitivement** — le dogfooding s'arrête et la promesse « la méthode est observable »
tombe au premier crash de session. C'est le mode de panne le plus probable en usage réel
(une session Claude meurt bien plus souvent qu'elle ne finit proprement).

## Proposition

Deux volets, ordonnés. Le principe directeur : **c'est le siège humain qui tranche**, pas
une heuristique — un auto-abandon silencieux effacerait le signal que le Moniteur vient
d'apprendre à montrer.

1. **Action « Abandonner ce run » au Moniteur** (recommandé, volet principal).
   Le Moniteur détecte déjà `presumed_dead` / « Silence prolongé » (ADR-028) : c'est
   exactement là que l'humain a le contexte pour décider. Un bouton sur la carte du run
   en silence → écrit `run.finished {status: "abandoned"}` dans le journal, avec une trace
   de l'auteur (siège humain, pas la méthode). Le verrou se libère par le chemin normal.
2. **Erreur `run_start` actionnable côté émetteur.**
   Aujourd'hui l'erreur ne dit que le `run_id`. Elle doit porter de quoi décider sans
   aller lire le disque : méthode du run bloquant, âge, date du dernier événement, et la
   sortie (« clôturez-le au Moniteur, ou `run_finished {abandoned}` si c'est un orphelin
   de votre propre session »).

**Option écartée : auto-abandon par TTL.** Tentant, mais ça résout le verrou en détruisant
l'information — un run silencieux depuis 20 min serait effacé du « en cours » alors que
c'est justement ce qu'on veut voir. À reconsidérer seulement si le volet 1 s'avère
insuffisant en pratique.

## Critères d'acceptation

- [ ] Depuis le Moniteur, un run en « Silence prolongé » peut être abandonné par le siège
      humain, sans toucher au disque à la main.
- [ ] Après cet abandon, un `run_start` sur le même projet réussit.
- [ ] Le journal distingue l'abandon siège vs méthode : payload `run.finished` avec
      `status: "abandoned"` **et** `abandoned_by: "seat" | "method"` (Moniteur → `seat` ;
      outil MCP `run_finished` → `method` par défaut).
- [ ] Le message d'erreur `run_start refusé` nomme la méthode bloquante, l'âge du run et
      la marche à suivre (test sur le texte de l'erreur).
- [ ] Aucun run n'est clôturé automatiquement : sans action humaine, le run reste ouvert
      et visible en silence prolongé.
- [ ] Gate locale verte (typecheck/lint/tests) puis E2E Moniteur sur le bouton.
- [ ] Hors scope : ne pas changer la règle d'absorption `ezk-sprint` dans un run déjà
      ouvert — le déblocage siège suffit ; documenter le risque de pollution en note ADR
      courte si on touche au message d'erreur.

## Notes / décisions

- Verrou : `products/mega-city/src/supervision/runtime.ts:164-167` (`findOpenRun`).
- Découvert en tentant `/supervision-demo` le 2026-07-30 ; le run orphelin était celui
  servant de preuve disque à 0105.
- Voisines : [0105](0105-bug-moniteur-silence-dogfood.md) (lisibilité de la carte run),
  [0103](0103-heartbeat-methodes-supervision.md) (heartbeat, shipped),
  [0104](0104-kit-analyse-session-supervision.md) (`supervision:analyze`).
- **Groom 2026-07-30** — `abandoned_by: seat | method` : **oui, distinguer**. Le Moniteur
  et `analyze` ne racontent pas la même histoire (siège qui déverrouille vs méthode qui
  abandonne son propre run). Schéma actuel = `{ status }` seulement → étendre le payload.
- **Groom 2026-07-30** — absorption dans un run ouvert : c'est une **seconde façon de
  polluer** un journal étranger, pas un atténuateur fiable. **Hors scope 0168** (le bouton
  siège + erreur actionnable débloquent) ; ne pas retoucher l'absorption ici.
- **depends: [0105]** = même fil dogfood / issue #63, **pas un bloqueur de build** : 0168
  est tirable sans ship de 0105 (UX « partiel » côté 0105).

## Issue GitHub

- https://github.com/elzinko/vectorz/issues/63 — même fil que [0105](0105-bug-moniteur-silence-dogfood.md)
  (dogfood Moniteur / silence / orphelin).
- **Règle de clôture** : laisser l’issue **ouverte** jusqu’au ship de **0105 et 0168**.
  Au ship de la dernière des deux, fermer #63 avec un commentaire pointant les deux ships.
  Ne **pas** fermer #63 au seul ship de 0168 (ni au seul ship de 0105).
