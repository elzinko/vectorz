---
id: "20261102123552182"
title: "Mission control montre le pilotage : l'avancement par milestone et l'historique des sessions"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.23.0
depends: ["20261031160441412"]
labels: [board, mission-control, un-seul-ecran]
status: shipped
pr: "local (c5c0af6e)"
evidence: before-after
created: 2026-11-02
---

## En clair

La page web de la méthode a deux vues que mission control n'a pas : le pilotage (l'avancement par
milestone) et l'historique des runs (chaque session close et ce qu'elle a livré). Cette fiche les
apporte dans mission control, en une vue « Pilotage ». La méthode publie les données ; mission control
les affiche.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  fait de mission control le seul écran. Les pages « pilotage » et « runs » de la méthode doivent y
  trouver leur remplaçant avant le retrait de la page web.
- L'avancement par milestone est déjà publié : `ezk board show --json` porte `milestones`, avec le
  total, le livré et le détail par statut.
- L'historique des sessions ne l'est pas. La méthode le calcule (`src/core/runs-data.ts`, depuis les
  récits de `docs/sessions/`), mais seulement pour sa page web. Le 2026-11-02, vectorz a 27 récits de
  session.
- Mission control montre les runs en direct (chronologie), lus dans le journal de supervision. Il ne
  montre ni les milestones, ni les sessions closes.

## Valeur

- Le PO suit l'avancement par milestone dans le même écran que ses fiches.
- Il relit ce qu'une session passée a livré sans ouvrir `docs/sessions/`.

## Proposition

1. **La méthode publie l'historique.** `ezk board show --json` gagne un bloc `sessions` : la liste
   des sessions closes, avec leur date, ce qu'elles ont livré (PR, fiches) et le chemin du récit. Il
   réutilise `loadRuns` et `runs-data.ts`. Pas de nouvelle commande : mission control lit déjà ce
   contrat, et lire 27 récits ne coûte presque rien. Un champ ajouté ne change pas `schema_version`.
2. **Mission control ouvre une vue « Pilotage ».** En haut, l'avancement par milestone, lu dans
   `milestones`. En dessous, l'historique des sessions, de la plus récente à la plus ancienne.

## Critères d'acceptation

- [x] **Les milestones de la méthode.** Chaque milestone affiché vaut l'entrée de
      `ezk board show --json | jq .milestones` : total et livré.
- [x] **L'historique publié.** `ezk board show --json | jq '.sessions | length'` vaut le nombre de
      récits de `docs/sessions/`, `README.md` exclu (27 pour vectorz le 2026-11-02). Le schéma et
      l'exemple du contrat `board-show` sont régénérés, et le producteur valide le bloc.
- [x] **L'historique affiché.** La vue liste ces sessions, de la plus récente à la plus ancienne, avec
      leurs fiches et leurs PR.
- [x] **Jamais de faux chiffre.** Sans `ezk`, ou avec un format inconnu, la vue dit « pilotage
      indisponible : <raison> », jamais une liste vide présentée comme réelle.
- [x] **Avant / après.** Capture de la page « pilotage » de la méthode (avant) et de la vue
      « Pilotage » de mission control (après).

## Comment vérifier

```bash
ezk board show --json | jq '.milestones, (.sessions | length)'
pnpm cop1:dev
```

Ouvrir http://localhost:5273, vue « Pilotage ». Signal observable : les milestones et le nombre de
sessions valent ceux de la méthode.

## Notes

- Une des fiches du chantier « un seul écran », liées par `milestone: board` et le label
  `un-seul-ecran`, sans fiche chapeau. Le retrait vient en dernier :
  [retirer la page web de la méthode](20261102123552185_retirer-la-page-web-de-la-methode.md).
- Cette vue règle le doublon « runs » que l'ADR-086 laissait à revisiter : la chronologie montre le
  direct, le pilotage montre l'historique.
- Groom du 2026-11-02 (run autonome) : sources vérifiées dans le code. `runs-data.ts` existe et ne
  sert qu'à la page web. `docs/sessions/` porte 27 récits. Mission control ne lit pas encore
  `milestones`. Choix : un bloc de plus dans `board show --json` plutôt qu'une commande neuve, pour
  réutiliser la source que mission control interroge déjà.
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.
- Prête le 2026-11-02 : porte « prête » passée en run autonome (ezk-pm GO).
