---
id: "20261102124307012"
title: "L'intégration locale supprime la branche toute neuve d'une autre session"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [git, multi-sessions]
status: shipped
pr: "local (main 9e60c6cc)"
evidence: none # comportement git des scripts ; pas d'écran
created: 2026-11-02
---

# L'intégration locale supprime la branche toute neuve d'une autre session

**En clair.** Après chaque squash local, la méthode supprime toutes les branches dont le contenu est
déjà dans `main`. Une branche qu'une autre session vient de créer n'a encore aucun commit à elle : elle
entre donc dans ce lot, et la méthode tente de la supprimer. Rien n'est perdu en contenu, mais l'autre
session perd sa branche sans être prévenue. La suppression devrait se limiter aux branches que
l'intégration vient d'absorber.

**Si tu arrives frais.** Une branche est « absorbée » quand la fusionner dans `main` ne changerait
rien : tout son contenu y est déjà. Le squash local est l'intégration sans PR, faite par
`ezk forge integrate`, la clôture de sprint et le commit des comptes rendus.

## Contexte / Problème

Gravité : **mineure à majeure**. Aucun contenu ne peut se perdre : une branche absorbée n'a rien en
propre. Mais plusieurs sessions travaillent sur le même dépôt, et chacune réserve sa branche. La
supprimer casse le travail d'une session voisine, qui ne l'apprend qu'à son prochain `git switch`.

Constat du 2026-11-02, à la clôture du sprint 5 :

- Une autre session venait de créer la branche `docs/un-seul-ecran`, au commit de `main`.
- `sprint.sh close` a committé le compte rendu du sprint par un squash local.
- Le message « branche absorbée 'docs/un-seul-ecran' non supprimée (tenue par un worktree ?) —
  ignorée » est apparu.
- La branche n'a survécu que parce qu'un dossier de travail la tenait. Une branche créée sans dossier
  de travail aurait été supprimée.

Le mécanisme : la fonction `prune_absorbed_branches` de
`products/mega-city/skills/ezk-pr/scripts/ship-merge.sh` parcourt **toutes** les branches locales
(`refs/heads/`). Elle supprime chacune de celles qui sont absorbées, sauf `main`, `master` et la base.

## Valeur

Une session ne touche plus aux branches des autres. C'est la règle des dépôts partagés entre
sessions : on ne modifie que ce qu'on a créé.

## Proposition

**Décision du groom : le nettoyage épargne toute branche dont la pointe est déjà dans l'historique de
`main`.** Concrètement, `prune_absorbed_branches` saute une branche quand
`git merge-base --is-ancestor <branche> <base>` réussit. Une seule condition de plus, dans une seule
fonction.

Pourquoi ce critère. Après un squash, trois sortes de branches sont « absorbées » :

| Sorte | Sa pointe est-elle dans l'historique de `main` ? | Que faire |
|---|---|---|
| La branche qu'on vient d'intégrer | non : ses commits ont été recopiés en un seul | supprimer (inchangé) |
| Un reste d'un squash plus ancien | non : même raison | supprimer (inchangé, c'est l'hygiène de la fiche 0076) |
| Une branche neuve, sans commit à elle | **oui** : elle pointe sur un commit de `main` | **épargner** |

Un squash recopie le contenu d'une branche dans un commit neuf. Une branche livrée par squash garde
donc des commits que `main` n'a pas dans son historique. Seule une branche qui n'a encore rien fait
pointe sur un commit de `main`. Le critère sépare exactement les deux cas.

Ce qu'on perd : une branche intégrée par avance rapide, sans squash, n'est plus nettoyée. Ce n'est pas
le problème de la fiche 0076 : git la voit déjà comme fusionnée (`git branch --merged`), elle ne crée
aucun faux « non fusionné ».

Piste écartée : ne supprimer que la branche intégrée. Elle casserait l'hygiène de la fiche 0076, qui
rattrape aussi les restes des squashs plus anciens.

**Le test actuel est à réécrire.** `test-ship-merge.sh` simule « un reste d'une session précédente »
par `git branch old-absorbed main`, aux cas 1 et 8. C'est la forme d'une branche neuve, pas celle d'un
reste. La fixture devient un vrai reste : une branche avec un commit à elle, dont le contenu est déjà
dans `main` par un squash.

Voisines livrées, relues au groom :
[hygiène des branches après un squash](0076-hygiene-branches-post-squash.md), qui a posé ce
nettoyage, et [le merge local ne supprime jamais main](20261004074008211_merge-local-ne-supprime-jamais-main.md),
qui l'a déjà restreint une fois.

## Critères d'acceptation

- [x] Une branche créée au commit de `main`, sans dossier de travail, survit à un squash local d'une
  autre branche.
- [x] Une branche qui pointe sur un commit plus ancien de `main` survit elle aussi.
- [x] La branche intégrée par le squash est toujours supprimée, avec la ligne `pruned:` qui la recrée.
- [x] Un reste d'un squash plus ancien, avec un commit à lui et son contenu déjà dans `main`, est
  toujours supprimé.
- [x] `test-ship-merge.sh` est vert : la fixture `old-absorbed` est réécrite en vrai reste, et un cas
  neuf couvre la branche neuve.

## Comment vérifier

Depuis `products/mega-city` :

```bash
# Le test du script, avec le cas neuf et la fixture réécrite
bash skills/ezk-pr/scripts/test-ship-merge.sh

# La gate complète de la méthode (vitest + suites bash)
pnpm gate
```

Attendu : toutes les lignes `ok`, aucune `fail`, et la gate verte. Le cas neuf affiche une ligne qui
dit que la branche neuve est toujours là après le squash.

## Notes / décisions

- Constaté le 2026-11-02 pendant le sprint 5 (corrections de la passe scout).
- Appelants concernés : `ezk forge integrate` en squash local, `bin/commit-doc-via-worktree.sh`
  (comptes rendus de sprint et d'archive), `ezk-pr ship --local`. Tous passent par
  `prune_absorbed_branches` : une seule correction les couvre.
- Groom du 2026-11-02. Seul `ship-merge.sh` supprime des branches. Le portier d'`ezk-archive`
  (`check.sh`) propose des commandes `git branch -D` à l'humain, sans les lancer : hors périmètre.
- Dépendances externes : aucune. Taille : 5 critères, une surface (le script et son test).
- Régression trouvée le 2026-11-02, le soir même. La ligne « la branche qu'on vient d'intégrer » du
  tableau avait un trou. Une branche d'un seul commit, squashée dans la même seconde avec le même
  message, donne un commit de squash identique à l'octet. Sa pointe devient alors celle de `main`, et
  le garde l'épargnait. C'est le chemin de l'archive et des comptes rendus : `test-archive-commit.sh`
  est passé au rouge (cas L1). Correction : le garde compare la branche à `main` **d'avant** le
  squash, pas d'après. Les branches neuves restent épargnées. Le cas 11 de `test-ship-merge.sh`
  rejoue le piège avec des dates figées.
