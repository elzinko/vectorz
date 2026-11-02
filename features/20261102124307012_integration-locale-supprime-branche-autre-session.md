---
id: "20261102124307012"
title: "L'intégration locale supprime la branche toute neuve d'une autre session"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [git, multi-sessions]
status: idea
pr:
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

À instruire au groom. Pistes :

- ne supprimer que la branche intégrée par ce squash, plus celles qui ont un commit absorbé par lui ;
- ou ne jamais supprimer une branche qui pointe exactement sur un commit de `main` : elle n'a encore
  rien fait, ce n'est pas un reste de travail livré.

Voisines livrées à relire au groom :
[hygiène des branches après un squash](done/0076-hygiene-branches-post-squash.md), qui a posé ce
nettoyage, et [le merge local ne supprime jamais main](done/20261004074008211_merge-local-ne-supprime-jamais-main.md),
qui l'a déjà restreint une fois.

## Critères d'acceptation

- [ ] Une branche créée au commit de `main` par une autre session, sans dossier de travail, survit à
  un squash local d'une autre branche.
- [ ] La branche intégrée par le squash est toujours supprimée, comme aujourd'hui.
- [ ] Les cas existants de `test-ship-merge.sh` restent verts.

## Comment vérifier

À écrire au groom : un cas de `test-ship-merge.sh`, sur un dépôt jetable, qui crée une branche au
commit de `main`, squashe une autre branche, puis vérifie que la première existe encore.

## Notes / décisions

- Constaté le 2026-11-02 pendant le sprint 5 (corrections de la passe scout).
- Appelants concernés : `ezk forge integrate` en squash local, `bin/commit-doc-via-worktree.sh`
  (comptes rendus de sprint et d'archive), `ezk-pr ship --local`.
