---
id: 0007
title: Format de session log + discipline de commit (anchor réel)
type: chore
priority: P3
product: vectorz
status: todo
pr:
created: 2026-06-23
---

# 0007 — Format de session log + discipline de commit

## Contexte / Problème

La clôture de V1-light (Plan B) a révélé deux lacunes qui survivent au pivot post-BMAD :

1. **Discipline de commit** : l'anchor réel n'est câblé qu'en opt-in
   (`COP1_COMMIT_ANCHOR=1`) — la stratégie SHA (amend vs 2-passes) n'est pas tranchée.
2. **Format de session log** exploitable à définir et documenter.

Les deux sont **agnostiques à la méthode** : ils concernent le journal d'un run et la
façon dont les commits d'agents s'ancrent, pas BMAD.

## Proposition

Définir un format de session log exploitable + verrouiller la discipline de commit
(anchor réel par défaut, stratégie SHA tranchée), en rattachant ici l'item **#11 de
l'inventaire 0042** (« commit-anchor réel + stratégie SHA amend vs 2-passes »,
sources `architecture.md` §B1/§B2 + `real-run-report` gap #4).

## Critères d'acceptation

- [ ] Format de session log décidé et documenté.
- [ ] Anchor de commit réel câblé par défaut (plus opt-in) ; stratégie SHA (amend vs
      2-passes) tranchée et testée sur un run réel.

## Notes / décisions

Source : mémoire `project_v1_light_closure`, `project_v1_1_architect_agenda`.

**Re-scope 2026-07-17 (review backlog)** : la fiche empilait 4 décisions ; deux sont
désormais **caduques** et retirées du périmètre :

- ~~ADR-009 à rédiger~~ — planning-ADR **statué caduc** par ADR-029 (Décision 2 : les
  planning-ADRs ne sont pas des ADR vivants ; ADR-005/009 déjà actés caducs).
- ~~D1 pin de version BMAD~~ — **contredit par ADR-029** : BMAD est retiré en E4
  (fiches [0038](0038-e3-pilote-natif.md)/[0039](0039-e4-retrait-bmad.md)), pinner sa
  version n'a plus d'objet. Le volet « à re-scoper avec D9 après L5/L6 » de l'épic 0034
  tombe avec.

Reste le **volet vivant** ci-dessus (format session log + discipline de commit), auquel
se rattache l'item #11 de l'inventaire [0042](0042-inventaire-idees-historiques-cop1.md).
Cadrage à froid conseillé (session `ezk-architect`) si le format session log s'avère non
trivial. Le volet « format session log » reste adjacent à D7 (double-writer, L3 de l'épic).
