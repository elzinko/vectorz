---
id: "20261002130235353"
title: "« En cours » se déduit des branches, il ne s'écrit pas"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [sprint]
status: idea
pr:
evidence: auto # la vue des sessions affiche l'état « en cours » ; décidé par le diff à la PR
created: 2026-10-02
---

# 20261002130235353 — « En cours » se déduit des branches

**En clair.** Le statut « en cours » existe dans le schéma des fiches, mais personne ne l'a jamais
posé : aucune des 330 fiches ne l'a porté. Le portier d'`ezk-sprint`, qui s'en sert pour repérer
deux sessions sur la même story, ne voit donc rien. On propose de ne pas l'écrire, mais de le
**déduire** : une story est « en cours » tant qu'un travail non livré existe pour elle, par exemple
une PR ouverte ou une branche pas encore absorbée par `main`.

**Si tu arrives frais.** Une *fiche* est une carte de backlog ; son statut vit dans son en-tête
(`status:`). Une *story* se construit sur une branche `feat/<id>-<slug>`, où `<id>` est celui de la
fiche. Le *portier* est le contrôle qu'`ezk-sprint` lance à l'ouverture d'un sprint.

## Contexte / Problème

**Le symptôme, daté.** Constat du 2026-10-02 : sur les 330 fiches du dépôt, aucune n'a jamais
porté `status: in-progress`. Pourtant le portier
(`products/mega-city/skills/ezk-sprint/scripts/check.sh`, point 3) compte ces fiches pour signaler
du travail en cours ailleurs. Le statut existe, il est lu, personne ne l'écrit.

**Pourquoi l'écrire ne marche pas.**

- Écrit sur la branche de la story, le statut reste invisible des autres sessions jusqu'au merge.
  Après le merge, il est déjà faux : la story est livrée.
- Écrit sur `main` à la prise, il recrée le blocage
  qu'[ADR-0049](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md) a
  supprimé : une session en worktree ne peut pas committer sur `main` quand il est pris. Et chaque
  prise régénérerait l'index du backlog, donc un conflit de plus entre sessions.

**Ce que disent déjà les décisions.**
[ADR-0042](../products/mega-city/docs/adr/0042-concurrence-inter-sessions-advisory-visibilite.md) :
la concurrence entre sessions se gère par la visibilité, pas par des verrous ni par le statut.
[ADR-0043](../products/mega-city/docs/adr/0043-vue-sessions-live-servie-jamais-committee.md) :
l'état vivant des sessions est calculé à la lecture, jamais committé.
[ADR-0055](../products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md) : les données
du board restent une **fonction pure des fichiers committés** ; l'état propre à la machine (sessions,
worktrees, branches locales) reste **hors** d'`ezk:map`.

**Les branches survivent au merge.** Un merge fait depuis l'UI GitHub ne supprime que la branche
distante : la copie locale reste jusqu'au ménage suivant. Une branche absorbée, mais tenue par un
autre worktree, est signalée et jamais supprimée de force (`ezk-pr`, garde-fous du `ship`). La
simple présence d'une branche ne prouve donc pas qu'une story est en cours.

## Proposition

- Une fiche est « en cours » si **trois conditions** tiennent ensemble :
  1. elle est encore **active** (pas dans `features/done/`) ;
  2. **aucune PR mergée ou fermée** ne porte une branche `feat/<id>-…` : une PR mergée ou fermée
     l'emporte sur toute branche restante ;
  3. il existe un **travail non livré** : une PR ouverte, ou une branche `feat/<id>-…` (locale,
     dans un worktree, ou distante) **non absorbée** par `main`. Le classifieur « absorbée /
     réelle » d'`ezk-archive` (fiche 0076) sait déjà le dire.
- Le rapprochement fiche ↔ branche reste mécanique, comme pour `reconcile` : l'id est dans le nom
  de branche.
- Cet état est calculé **à la lecture** par le **portier** d'`ezk-sprint` et par la **vue des
  sessions** (`ezk:sessions`, ADR-0043). Rien n'est committé.
- Le **board** n'affiche pas cet état : ses données restent une fonction pure des fichiers committés
  (ADR-0055). L'y montrer demanderait de réviser explicitement cette frontière, ce qui est hors de
  cette fiche.
- Décision durable, à écrire dans un ADR court : que devient la valeur `in-progress` du schéma, que
  plus personne n'écrit ? Deux options. La garder comme état **calculé**, affiché par les vues. Ou la
  **retirer** du schéma par une migration (règle « pas de code mort »).

## Critères d'acceptation

- [ ] Dès qu'une branche `feat/<id>-…` non absorbée existe pour une fiche active, la fiche `<id>`
      apparaît « en cours » dans le portier et la vue des sessions, **sans aucun commit sur `main`**.
- [ ] Une seconde session qui ouvre un sprint voit la story déjà « en cours » ailleurs.
- [ ] Une branche supprimée, une PR mergée ou une PR fermée fait disparaître l'état « en cours ».
- [ ] Une branche **restée après le merge** (copie locale d'un merge fait depuis l'UI, ou branche
      absorbée tenue par un autre worktree) ne rend **pas** la story « en cours ».
- [ ] Le board reste une fonction pure des fichiers committés (ADR-0055) : il n'affiche pas l'état
      « en cours ».
- [ ] Le sort de la valeur `in-progress` du schéma est tranché dans un ADR court, et appliqué.

## Comment vérifier

- Session 1 : créer une branche `feat/<id>-essai` dans un worktree. Session 2 : lancer le portier
  d'`ezk-sprint` (`start --dry-run`) ; il liste `<id>` en cours.
- Supprimer la branche, relancer le portier : `<id>` n'est plus en cours.
- Merger une PR de story depuis l'UI GitHub **sans** supprimer la copie locale de sa branche,
  relancer le portier : la story n'est plus en cours.
- `grep -l 'status: in-progress' features/*.md` reste vide : rien n'a été écrit.

## Glossaire

- `portier` — le contrôle qu'`ezk-sprint` lance à l'ouverture d'un sprint (`start --dry-run`) : il
  signale le travail en cours ailleurs avant d'en commencer un nouveau.
- `worktree` — une copie de travail séparée du dépôt ; chaque session en a une, sur sa branche.
- `reconcile` — croise les fiches actives avec les PRs déjà mergées ; il rapproche une fiche de sa
  branche grâce à l'id dans le nom de branche.

## Notes / décisions

- **Origine** : découpage du grooming de la fiche mère
  [La fiche d'une story arrive en done avec son merge](20261002114435782_done-par-story-a-la-validation.md),
  le 2026-10-02. Le « done » y reste ; le « en cours » vient ici, car il ne cause pas la corvée de
  rattrapage et il touche au schéma des statuts.
- **Priorité P2** : un cran sous la fiche mère, qui porte la corvée. Acceptée par le PO au grooming
  du 2026-10-02.
- **Précédent écarté** : la fiche [cohérence de sprint](done/0090-coherence-de-sprint.md)
  envisageait un verrou par `status: in-progress` committé. ADR-0042 a écarté les verrous au profit
  de la visibilité.
- **Voisine distincte** :
  [Retrouver quand une fiche est passée prête ou livrée](20260823121712716_vues-generees-board-kanban-history-git.md)
  fait le même constat (les étapes committées sur une branche disparaissent au squash), mais vise un
  autre besoin : l'historique des dates.
- **Panel adverse facultatif** : la décision sur la valeur `in-progress` est nouvelle. `ezk-reviewer`
  revoit le build dans tous les cas (ADR-0059).
- **Revue Codex de la PR #327 (2026-10-02)**, intégrée : l'état « en cours » ne va pas dans le board
  (frontière ADR-0055) ; une PR mergée ou fermée et une branche absorbée l'emportent sur une branche
  restante.
