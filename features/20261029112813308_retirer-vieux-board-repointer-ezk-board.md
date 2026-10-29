---
id: "20261029112813308"
title: "Retirer le vieux board (ezk-map) et repointer `ezk board` sur le nouveau dashboard"
type: refactor
priority: P2
product: cop1
milestone: board
version:
labels: [board, dashboard, cockpit, cleanup]
status: ready
pr:
evidence: before-after
created: 2026-10-29
---

## En clair

On a deux tableaux de bord. Le vieux (`ezk-map.ts`) sert des pages HTML depuis `diagrams/`.
Le neuf (`@cop1/web`) est une vraie application React qui lit les données réelles. Le neuf
remplace le vieux. Cette fiche retire le vieux **proprement** : d'abord vérifier que le neuf
couvre ce que le vieux faisait seul, puis repointer la commande `ezk board`, puis supprimer
le code mort.

Ce n'est pas un simple `rm`. Le vieux board fait **trois choses** que le neuf ne reproduit
pas encore. Tant qu'elles ne sont pas couvertes ou assumées perdues, on ne supprime rien.

## Contexte / Problème

Aujourd'hui, `ezk board open` lance `bin/ezk-map.ts`.

C'est un petit serveur `node:http`, sans dépendance, sur le port 4173.

Le nouveau board vit ailleurs :

`products/cop1/packages/web/` — l'application `@cop1/web`, en React + Vite.

Elle lit les vraies données via `/api/board`, elle a des vues riches (vue d'ensemble, flotte,
chronologie, fiches, détail de run), elle est testée et travaillée récemment. Elle se lance
par la config `mission-control`, **pas** par `ezk board`.

Donc deux portes d'entrée coexistent, et la commande officielle ouvre encore la vieille.

Le vieux board n'est pas que des pages périmées. Il porte **trois capacités** que le neuf
n'a pas reprises :

1. **Les pages `diagrams/`** — la carte de la méthode, la carte LA LOI, le plan. Le neuf ne
   les sert pas : il **renvoie vers elles** par un lien `/v1/index.html`
   (voir `Board.tsx:306`, « Pages de l'ancien dashboard »).
2. **Le sélecteur de projet (cockpit)** — choisir le projet regardé, mémorisé en cookie.
3. **Le pouce 👍/👎** — la **seule écriture** du vieux board : `POST /api/verdict` pose un
   verdict de fiche dans `features/reviews/verdicts/<id>.json` (ADR-0057). Le neuf affiche
   un champ `verdict` en lecture, mais n'écrit aucun pouce.

Supprimer `ezk-map.ts` sans traiter ces trois points casserait en silence la carte de la loi
et le pouce de revue.

## Valeur

Pour qui : toi, qui pilotes, et toute session qui tape `ezk board`.

Aujourd'hui la commande officielle ouvre la **vieille** interface. Le neuf se lance par un
autre chemin (`mission-control`). Deux portes pour une même chose, et la mauvaise est la porte
d'entrée. Si on ne fait rien : la confusion dure, le code du vieux board reste à maintenir, et
un lecteur neuf ne sait pas lequel fait foi.

Après : **une seule porte**, qui ouvre le board qui dit vrai (données réelles). Moins de code
mort. Un piège en moins pour qui découvre la méthode.

## Proposition

Un chantier en trois temps, dans cet ordre.

1. **Vérifier la parité.** Pour chacune des trois capacités, décider : reprise dans
   `@cop1/web`, ou abandon assumé et journalisé. Défauts recommandés, à confirmer au build :
   - **Pages `diagrams/`** → les **garder en pages statiques liées** depuis le neuf (le lien
     `/v1/index.html` existe déjà). Pas de réécriture React : on sert `diagrams/` à part et on
     pointe dessus. Le moins cher, et ça n'efface rien.
   - **Sélecteur de projet** → **déjà couvert** côté neuf (vue flotte, `AddProjectModal`).
     Juste confirmer, rien à reprendre.
   - **Pouce 👍/👎** → **reprendre l'écriture** dans le neuf (une route qui écrit
     `features/reviews/verdicts/<id>.json`, ADR-0057). C'est la seule capacité qui écrit : on
     ne la perd pas sans décision explicite.
2. **Repointer la commande.** `ezk board open` ouvre le nouveau dashboard. Mettre à jour
   l'entrée `board / open` du manifeste (`ezk-manifest.yml`, aujourd'hui `run: bin/ezk-map.ts`)
   et la config `mission-control` de `.claude/launch.json`.
3. **Retirer le code mort.** Supprimer `bin/ezk-map.ts`, ses tests et ce qui ne sert plus
   qu'à lui (sans casser `verdict-endpoint`, `cockpit` et les autres modules partagés s'ils
   gardent un usage). Mettre à jour les skills, docs et mémoires qui disent « le board =
   ezk-map ».

## Critères d'acceptation

- [ ] `ezk board open` ouvre le nouveau dashboard `@cop1/web`, pas `ezk-map.ts`.
- [ ] Les trois capacités du vieux board sont tranchées : chacune reprise dans le neuf, ou
      son abandon journalisé (où, pourquoi).
- [ ] La carte de la méthode / carte LA LOI reste atteignable (reprise, ou lien assumé).
- [ ] Le pouce 👍/👎 de revue est tranché : reproduit côté neuf, ou son retrait décidé et noté.
- [ ] `bin/ezk-map.ts` et ses tests sont supprimés ; `grep -rn ezk-map` ne laisse aucun appel
      vivant (hors historique git).
- [ ] Les skills / docs / mémoires qui pointaient le vieux board sont à jour.
- [ ] La gate reste verte (`test` + `test:scripts`).

## Comment vérifier

```bash
# Le point d'entrée officiel lance bien le neuf, plus l'ancien serveur
ezk board open            # doit ouvrir @cop1/web (mission-control), pas 4173/ezk-map

# Plus aucune référence vivante au vieux board
grep -rn "ezk-map" products/mega-city --include="*.ts" --include="*.yml" --include="*.md"

# La gate passe
cd products/mega-city && pnpm test && pnpm test:scripts
```

Preuve avant / après (UI) : capture de `ezk board open` **avant** (ancien ezk-map sur 4173)
et **après** (nouveau dashboard). À joindre au corps de PR / rendu local (ADR-0045).

## Notes

- Suite de la vision d'unification des tableaux de bord
  (voir [Unifier les tableaux de bord en un seul](20261007135620590_refondre-vue-supervision-moniteur-lisible.md),
  `status: split`). Cette fiche-ci est le **retrait de l'ancienne implémentation**, pas une
  nouvelle vue.
- S'appuie sur le socle déjà livré
  (voir [Board web branché sur le plan réel](done/20261024130842122_board-web-plan-reel-lecteur-backlog-cop1.md)) :
  le neuf lit déjà les vraies données via `/api/board`.
- Les pages `diagrams/` recoupent deux idées parkées :
  [carte LA LOI](20260826222044335_carte-la-loi-graphe-visuel.md) et
  [page des rétros passées](20260826072532537_vue-retros-actions-ezk-map.md). Décider si on les
  rapatrie dans le neuf ou si on les laisse vivre en pages statiques liées.
- Le pouce de revue est cadré par l'ADR-0057 (une seule écriture, `features/reviews/verdicts/`).
- Priorité P2 (rangement, non urgent), confirmée au grooming.
