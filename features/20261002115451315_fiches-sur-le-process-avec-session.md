---
id: "20261002115451315"
title: "Voir les fiches posées sur le schéma du process, avec leur session"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [ezk-map, session]
status: idea
pr:
evidence:
created: 2026-10-02
---

# 20261002115451315 — Voir les fiches posées sur le schéma du process, avec leur session

**En clair.** Le board dit **quelles** fiches existent. Il ne dit pas **où elles en sont** dans la
méthode. Cette fiche dessine les étapes du process et pose chaque fiche sur la sienne, avec la
session qui la travaille. Tu vois d'un coup d'œil ce qui avance, ce qui attend, et qui s'en occupe.

**Si tu arrives frais.** Une *fiche* est une feature ou un bug du backlog (`features/`). Une
*session* est une conversation Claude Code, souvent dans son propre *worktree* : une copie de
travail du dépôt, sur sa propre branche.

## Contexte / Problème

- Cette vue a déjà été conçue, dans
  [Vue d'avancement — les fiches positionnées sur le process scrum](done/20260823124042842_vue-avancement-sprints-fiches.md).
  Elle prévoyait trois parties : le board, la frise des sprints, et le schéma du process avec les
  fiches posées dessus.
- Un panel d'archi (2026-08-23) n'a gardé que le board. Il a mis le reste en attente « jusqu'à ce
  que l'usage prouve le manque », et interdit d'inventer un objet « sprint » en données.
- Le 2026-10-02, le PO décrit précisément ce manque : « visualiser les fiches dans les étapes du
  process, avec leur session, pour s'y repérer ». C'est le signal d'usage qu'attendait le panel.
- Les morceaux existent, éparpillés : le statut de chaque fiche, le
  [cockpit des sessions](done/20260825141012293_ezk-sessions-cockpit.md) (quelle session tient
  quelle branche), l'historique des runs (quelle session a livré quoi), l'état des PR.
- Les journaux de supervision ne disent pas l'étape. Un battement de cœur porte une `note` en texte
  libre (« lecture du backlog… »), jamais « fiche X, étape revue » dans un champ lisible.

## Proposition

**Tranche 1 — la position grossière, sans nouvelle donnée.** Une page du tableau de bord dessine
cinq étapes et y pose chaque fiche active. L'étape se **déduit** de ce qui existe déjà :

| Étape | D'où on la déduit |
|---|---|
| Idée | `status: idea` |
| Prête | `status: ready` |
| En sprint | une branche `feat/<id>-…` existe, ou un worktree la porte |
| En revue | une PR ouverte porte la branche de la fiche |
| Livrée | `status: shipped`, les plus récentes seulement |

Une fiche travaillée par une session affiche cette session, comme le cockpit des sessions sait
déjà le faire. Rien n'est saisi à la main et aucun objet nouveau n'apparaît : le verdict du panel
est respecté.

**Tranche 2 — la position fine, plus tard.** Les étapes internes d'un sprint (BDD, TDD, gate,
revue) demandent que `ezk-sprint` annonce son étape à chaque passage. Hors de cette fiche. Piste :
[rendre les étapes d'un skill configurables](20260830110131228_schema-etapes-skill-configurables.md).

## Critères d'acceptation

- [ ] Une page du tableau de bord dessine les cinq étapes et place chaque fiche active sur la
      sienne, selon la table ci-dessus.
- [ ] Une fiche travaillée par une session affiche cette session (branche et worktree). Une fiche
      sans session n'affiche rien d'inventé.
- [ ] Cliquer une fiche ouvre son détail, comme sur le board.
- [ ] Les données sont calculées depuis les fiches, git et les PR, jamais saisies. Un test prouve
      que la page dit vrai sur le backlog réel.
- [ ] Sans `gh` ni remote, l'étape « En revue » se dégrade proprement : la page le dit, elle ne
      plante pas.
- [ ] La page marche sur un autre projet, avec `ezk --root <projet> dashboard`.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
ezk dashboard                  # ouvrir la nouvelle page « process »
git branch --list 'feat/*'     # chaque fiche « en sprint » a sa branche
gh pr list --state open        # chaque fiche « en revue » a sa PR ouverte
ezk sessions state             # chaque session affichée correspond à une session réelle
```

## Glossaire

- `position grossière` — l'étape macro d'une fiche (idée, prête, en sprint, en revue, livrée),
  déduite de ce qui existe.
- `position fine` — l'étape interne du sprint (BDD, TDD, gate, revue). Elle demanderait une
  annonce par `ezk-sprint`.

## Notes / décisions

- **Jalon `cockpit`, version V0.6** (décision PO du 2026-10-02 ; la V0.5 est « le sprint au lot »). Liaison par jalon, pas de fiche
  chapeau. Fiche sœur :
  [un seul tableau de bord pour tous tes projets](20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md).
  Son ADR dira dans quelle page vit cette vue : à faire d'abord.
- **Suite de** [Vue d'avancement](done/20260823124042842_vue-avancement-sprints-fiches.md), sa
  partie « schéma du process avec les fiches posées ». La frise des sprints reste hors périmètre.
- Créée le 2026-10-02, P1 (PO).
