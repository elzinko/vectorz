---
id: "20260826072532622"
title: Revue & validation des fiches dans ezk:map — pouce 👍/👎 pour marquer une fiche OK ou pas
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# Revue & validation des fiches dans `ezk:map` (pouce 👍/👎)

## En clair

Pouvoir **relire les fiches depuis `ezk:map`** et leur mettre un **pouce haut ou bas**,
pour dire « celle-ci OK / celle-là non ». Un geste simple pour passer le backlog en
revue à l'œil. Attention : aujourd'hui la map ne fait que **lire** — ce pouce l'oblige
à **écrire** un verdict, et c'est là tout l'enjeu.

## Contexte / Problème

Le board des fiches est déjà affiché dans la map (fiche livrée [[20260823124042842]] :
`pnpm ezk:map avancement`). On peut **voir** les fiches, cliquer pour ouvrir le fichier
source. Mais on ne peut **rien marquer**.

La map est **en lecture seule** (GET-only, décision de conception existante). Mettre un
pouce, c'est enregistrer un jugement du PO qui doit **persister** entre deux sessions.
C'est la **première écriture** depuis la map — donc un vrai changement, pas un bouton de
plus.

## Décision d'architecture à prendre au grooming (bloquante)

**Où stocker le verdict ?** Trois options, chacune avec un coût :

- **(a) Un champ dans le front-matter de la fiche** (ex. `verdict: ok`) — simple à lire,
  mais **alourdit le schéma** et risque la dérive (même argument que le refus de stocker
  les dates dans la fiche, cf. [[20260823121712716]]).
- **(b) Un fichier de verdicts à part** (ex. `features/reviews/verdicts.yaml`) — n'alourdit
  pas les fiches, mais **deuxième source** à tenir cohérente.
- **(c) Un commit git** au moment du pouce — traçable et daté, mais **friction** (la map
  déclenche un commit).

À trancher avant de coder — probablement via un **ADR court** (panel si besoin), parce que
ça engage l'architecture « la map écrit ».

## Proposition (esquisse — à groomer)

- Sur le board (`pnpm ezk:map avancement`), un contrôle **👍 / 👎** par fiche.
- Au clic : **persister** le verdict (mécanisme = décision archi ci-dessus) + la date.
- **Afficher l'état** : validée · rejetée · non revue (filtrable).

## Critères d'acceptation (esquisse — non ready)

- [ ] Depuis le board, chaque fiche porte un **👍 / 👎** cliquable.
- [ ] Le verdict **persiste** : relancer la map, il est toujours là.
- [ ] L'état (OK / pas OK / non revu) est **visible** et filtrable.
- [ ] Le **lieu de stockage** du verdict est tranché (ADR si besoin) — pas de write-back
      improvisé.

## Comment vérifier

```bash
pnpm ezk:map avancement
```

Mettre 👍 sur une fiche, 👎 sur une autre, arrêter puis relancer le serveur → les deux
verdicts sont **toujours affichés**.

## Notes

- **Neuf** : rien d'équivalent au backlog.
- **Rupture assumée** : introduit la première **écriture** depuis la map (jusqu'ici
  GET-only). C'est le morceau le plus lourd des trois vues demandées le 2026-08-26.
- **Cible** : le board des fiches [[20260823124042842]].
- **Product `mega-city`**.
