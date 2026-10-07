> 🗎 Rendu de la fiche [features/20261002133125444_fermer-run-supervision-vise-son-run.md](../done/20261002133125444_fermer-run-supervision-vise-son-run.md)

# 20261002133125444 — Fermer un run de supervision peut fermer celui d'une autre session

**En clair.** Le suivi des runs n'a qu'une seule place, partagée par toutes les sessions. Sa commande
de fermeture ne précise pas quel run elle ferme : elle ferme celui qui occupe la place. Une session peut
donc fermer la trace d'une autre sans le savoir. On veut que chaque session ne puisse fermer que son
propre run.

**Si tu arrives frais.** La supervision est un journal facultatif : une méthode y note son départ, ses
points d'arrêt et son arrivée, et le Moniteur l'affiche en direct. `run_start` ouvre un run, et
`run_finished` le ferme.

## Contexte / Problème

Le 2026-10-02, la session « EZK product build run » a voulu fermer son run d'hier. Il avait déjà été
abandonné sur ordre du PO. Son `run_finished` a donc fermé le run V0.5 d'une autre session, alors arrêté
à un point de décision. Le travail n'a pas souffert, mais la trace s'est perdue sans prévenir.

## Proposition

`run_finished` exige le run visé : l'id rendu par `run_start`. Un id qui ne correspond pas au run ouvert
est refusé, avec un message clair qui nomme le run en place. Même règle pour `gate_reached`,
`gate_resumed` et `heartbeat`, si elles visent un run.

## Critères d'acceptation

- [ ] `run_finished` sans id, ou avec l'id d'un autre run, est refusé et ne ferme rien.
- [ ] Le refus nomme le run ouvert, son âge et la méthode qui l'a ouvert.
- [ ] Les méthodes qui émettent passent l'id rendu par leur `run_start`.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
```

## Notes / décisions

- Incident vécu le 2026-10-02, pendant le run de la V0.5.
- 2026-10-07 : groomée `ready`, version **V0.7** (socle « voir sous le capot » : rendre la trace
  fiable). DoR tenue — fix clair (`run_finished` exige l'id du run), critères testables. Fait lot
  socle V0.7 avec 20261003201035260.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale (1849 tests) | ✅ |
| Revue adverse (ezk-reviewer) | ✅ GO |
| E2E | N.A. — pas d'UI |
| Before / after (UI) | N.A. — pas d'écran (evidence: none) |
