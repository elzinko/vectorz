> 🗎 Rendu de la fiche [features/20261117150620910_integration-imprime-son-commit.md](../done/20261117150620910_integration-imprime-son-commit.md)

# 20261117150620910 — L'intégration locale imprime l'identifiant de son commit

**En clair.** Après une intégration, la livraison de la fiche a besoin de l'identifiant du commit créé.
Aujourd'hui, on le lit en regardant le dernier commit de main. Quand une autre session committe au même
moment, on lit le sien, et la fiche pointe vers le mauvais commit. L'intégration doit imprimer elle-même
l'identifiant qu'elle vient de créer.

**Si tu arrives frais.** `ezk forge integrate` intègre une story dans main par un squash local ;
`ezk backlog ship … --pr "local (<commit>)"` range ensuite la fiche avec l'identifiant de ce commit.

## Contexte / Problème

Le 2026-11-17, au sprint 8, la fiche 20261117150145880 a été livrée avec `local (d40c6dd4)`, un commit
de la session parallèle, au lieu de `e4e02dfa`. L'identifiant avait été lu par `git rev-parse HEAD` juste
après l'intégration ; l'autre session avait committé entre-temps. Corrigé à la main.

## Proposition

`ship-merge.sh --local` imprime une ligne stable, par exemple `INTEGRATED: <sha court> <branche>`, et
`ezk forge integrate` la relaie. Le skill ezk-sprint lit cette ligne au lieu de `HEAD`.

## Critères d'acceptation

- [x] Une intégration locale réussie imprime `INTEGRATED: <sha> <branche>`, où `<sha>` est son commit.
- [x] Le skill ezk-sprint dit d'utiliser cette ligne pour le `--pr "local (<sha>)"` de la livraison.
- [x] Un test de `test-ship-merge.sh` vérifie la ligne, même quand un autre commit arrive juste après.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-pr/scripts/test-ship-merge.sh
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 3 critères prouvés ; `forge integrate` relaie bien la ligne. Restes ouverts, non bloquants : deux intégrations concurrentes au sujet identique, ou un sujet avec une tabulation ou un espace final, peuvent tromper ou taire la ligne ; le chemin push-ff n'imprime rien, puisqu'il ne crée pas de commit.


- Origine : [rétro du sprint 8 du 17 novembre](../../docs/captures/2026-11-17-retro-sprint-8-reponse-illisible.md),
  proposition 1, retenue par délégation du PO absent.


## Validation

| Modalité | Statut |
|---|---|
| Gate mega-city | ✅ 2516 tests + 49 suites |
| Revue ezk-reviewer | ✅ GO 3/3 |
| Before / after (UI) | N.A. — sortie de commande |
