---
id: "20261003011750521"
title: "Les portiers d'ezk-sprint et d'ezk-archive laissent tranquilles les copies de réserve propres"
type: bug
priority: P1
product: mega-city
milestone:
version: v0.6.0
labels: [sprint, archive, portier, worktree]
status: shipped
pr: "local (f0a5b0a9)"
evidence: none # script de contrôle, pas d'écran
created: 2026-10-03
---

# 20261003011750521 — Les portiers d'ezk-sprint et d'ezk-archive laissent tranquilles les copies de réserve propres

**En clair.** `ezk-sprint check` lève `ALERT` dès qu'il voit d'autres copies de travail (worktrees)
du dépôt. Or l'app Claude garde des copies **de réserve** : propres, en HEAD détaché, sans travail en
cours. Résultat : un choix humain obligatoire pour rien. Le ménage d'`ezk-archive`
(`check.sh --cleanup`) a le même défaut, en pire : il propose de retirer une copie de réserve. On veut
un seul détecteur, partagé par les deux outils, qui laisse ces copies tranquilles.

**Si tu arrives frais.** Le portier est le contrôle lancé à l'ouverture d'un sprint
(`ezk-sprint check`) ; le ménage liste, à la clôture, ce qu'on peut supprimer. Une copie de réserve
est recyclée par l'app pour une nouvelle session ; il ne faut jamais la supprimer à la main.

## Contexte / Problème

- muti, 2026-10-02 (PR muti #271) : `ALERT points=1,2`, `sibling_worktrees=4` : le checkout
  principal, 2 copies de réserve (HEAD détaché, propres) et 1 session déjà fusionnée (#266) et
  archivée (#269). Aucune ne touchait au sujet du sprint ; le PO a dû passer outre.
- muti, 2026-10-03 : `ezk-archive check.sh --cleanup` a proposé `git worktree remove` sur la copie de
  réserve `nice-visvesvaraya-c1c830` (HEAD détaché, propre, inactive 65 h). La retirer à la main
  casse la réserve de l'app.

## Proposition

**Une seule règle, partagée par les deux outils.** Une copie voisine est *sans risque* quand deux
choses tiennent ensemble : son arbre est propre, et son contenu est déjà dans la base. La base est le
`main` local ou `origin/main`, comme pour le ménage. Le « contenu », c'est la branche de la copie, ou
son commit si elle est en HEAD détaché. Le checkout principal suit la même règle, sans cas à part.

Cette règle remplace les trois cas particuliers d'avant (principal / détaché / branche fusionnée) :
chacun la satisfait déjà. Elle réutilise le détecteur de contenu-absorbé déjà en place pour le squash
([[20261002155911250]]).

- Le point « copies voisines » d'`ezk-sprint check` ignore les copies sans risque et **nomme la
  raison** (principal à jour · réserve de l'app · session fusionnée). Il signale les autres, chacune
  avec sa raison (modifications en cours · travail non fusionné).
- Le ménage d'`ezk-archive` appelle *copie de réserve* une copie sans risque en HEAD détaché : il ne
  propose jamais de la retirer, et la compte à part (`reserve=N`). Une copie sans risque sur une
  branche fusionnée reste proposée au retrait, comme aujourd'hui.

**Où vit la règle** (avis architecte 2026-10-05). La règle « sans risque » est extraite dans une lib
bash sourçable, rangée dans `ezk-archive/scripts/` — là où la preuve d'absorption (`classify_ref` /
`absorbed_by_any`) existe déjà et a été durcie. Le portier d'archive la source directement et retire
ses copies inline (pas de code mort). Le portier de sprint la source en best-effort, sous la même
garde que le `handoff.sh` qu'il source déjà, avec repli sur son comptage actuel si la lib est absente.
La preuve ne descend **pas** dans `ezk` (TS) : le déploiement par liens ne rend atteignable aucun
emplacement tiers neutre, et réécrire la preuve en TS fragiliserait la garantie « verdict propre sur
preuve positive ». La lib n'a aucun effet de bord au source (que des défs de fonctions, bases de preuve
passées en argument, pas de `cd` ni de global posé à l'import).

## Critères d'acceptation

- [ ] Cas muti du 2026-10-02 rejoué en test : principal propre sur `main`, 2 copies détachées
      propres, 1 copie propre sur une branche fusionnée par squash → le point « copies voisines » rend
      `CLEAR`.
- [ ] Le point lève toujours `ALERT` dans trois cas, et chaque fait nomme sa raison : copie avec
      modifications non commitées (principal compris) · copie sur une branche non fusionnée · copie
      détachée sur un commit absent de la base.
- [ ] `test-check-gate.sh` couvre les trois cas ignorés et les trois cas signalés.
- [ ] `check.sh --cleanup` ne propose aucun `git worktree remove` sur une copie de réserve et la
      compte dans `reserve=N` ; `test-cleanup.sh` rejoue le cas du 2026-10-03.
- [ ] Non-régression du ménage : une copie propre, inactive, sur une branche fusionnée reste proposée
      au retrait.
- [ ] Les deux outils appellent le même détecteur : la règle « sans risque » n'est écrite qu'une fois.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-sprint/scripts/test-check-gate.sh
bash products/mega-city/skills/ezk-archive/scripts/test-cleanup.sh
```

## Notes / décisions

- 2026-10-03 : née de la rétro muti docs/captures/2026-10-03-retro-fps-auto-adaptatif.md (dépôt muti), retenue (choix délégué par le PO au pilote).
- 2026-10-03 : élargie à l'outil de ménage d'`ezk-archive` par la rétro muti
  `docs/captures/2026-10-03-retro-cloture-et-menage.md` (décision PO ✅).
- Voisines : SPRINT.md commité [[20261003011750433]] ; portier d'archive et squash
  [[20261002155911250]] ; ménage lançable en mode auto [[20261003105820099]].
- **Cas du 2026-10-03** (run V0.5, rétro de l'itération, capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`) : le portier d'ezk-sprint a
  levé la même alerte aux trois ouvertures de sprint du run. Voisins : le dossier principal propre sur
  `main`, trois worktrees détachés propres sur d'anciens commits de `main`, un worktree d'une session
  muti. Trois passages outre journalisés dans `SPRINT.md`, aucun n'était un vrai risque.
- **Cas du 2026-10-04** (run `--once`, rétro légère de fin de V0.5, capture
  `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`) : `sprint.sh start --dry-run` a rendu
  `ALERT` pour 4 worktrees voisins, tous propres, aucun ne touchait la fiche (le dossier principal sur
  `main`, deux worktrees détachés sur d'anciens commits, un worktree sur une branche déjà absorbée).
  En mode auto, le run a dû s'arrêter pour demander au PO de passer outre. Quatrième run de suite où
  l'alerte n'était pas un vrai risque.
- **Décision d'archi 2026-10-05** (grooming) : la règle partagée vit dans une lib bash sourçable sous
  `ezk-archive/scripts/`, sourcée directement par archive et en best-effort par sprint (option A).
  Écartées : porter la preuve dans `ezk` (TS) — le déploiement par liens ne rend atteignable aucun
  emplacement tiers, et réécrire la preuve durcie la fragiliserait. **ADR à produire au sprint** :
  « Le détecteur "copie sans risque" vit en lib bash partagée dans ezk-archive, sourcée best-effort
  par ezk-sprint » (avec schéma de dépendance : les deux `check.sh` → la lib, trait plein pour
  archive, best-effort pour sprint).
- **Passée en P1 le 2026-10-04** (rétro légère du run cockpit de la V0.6, capture
  `docs/captures/2026-10-04-retro-run-cockpit-v0-6-legere.md`, décision PO) : cinquième passage outre
  en deux jours. Ce soir, l'ouverture du run puis celle du sprint de correction ont demandé au PO de
  passer outre pour deux dossiers voisins propres (le dossier principal sur `main`, un worktree
  détaché), sans lien avec les fiches. Inscrite au plan, en tête de ce qui reste de la V0.6.
