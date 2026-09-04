---
id: "20260904091853948"
title: ezk-archive — recadrer en capacité + alléger (fast-path no-op + modèle adapté au jugement)
type: refactor
priority: P2
product: mega-city
version:
epic:
labels: [ezk-archive, methode, cout]
status: idea
ready:
pr:
created: 2026-09-04
---

# ezk-archive — recadrer en capacité + alléger

## En clair

ezk-archive (le rituel de clôture de session) est **long** et se déroule en entier même quand
la session n'a **rien** laissé en l'air. Un panel adverse (architecte / reviewer / PO,
2026-09-04) a tranché : ce **n'est pas une cérémonie agile**, c'est une **capacité** de
continuité d'exécution — il existe parce qu'un agent IA perd sa mémoire, pas parce qu'un
incrément produit est fini. On le **garde** (le handoff a une vraie valeur), mais on le
**recadre** et on l'**allège**.

## Contexte / Problème

- **Symptôme daté (2026-09-04).** Une session minuscule (créer 1 fiche-idée puis push sur
  main) a lancé un ezk-archive complet : portier 4 points + résumé + note de handoff. Le coût
  de clôture était **sans rapport** avec la taille du travail.
- **Panel adverse (3 regards indépendants).** Verdicts convergents : « à sortir de la
  méthode » (reviewer), « appartient mais mal cadré » (architecte), « valeur marginale — un
  noyau agile, le handoff, noyé dans de l'hygiène d'orchestration » (PO). Aucun antécédent
  agile : sprint→ezk-sprint, rétro→ezk-retro… « clôture de session » ne fait face à **rien**
  dans Scrum/SAFe. Le déclencheur (« je ferme le terminal ») est un événement d'**exécution**,
  pas produit/équipe.
- **Modèle (constat 2026-09-04).** Le sous-agent `products/mega-city/agents/ezk-archive.md`
  épingle `model: claude-opus-4-8`. Opus n'est justifié que pour **un** bout — juger si une
  branche réelle est un brouillon jetable ou du travail à récupérer. Le reste est mécanique :
  le portier est déjà un **script** (zéro modèle) et la note est un **gabarit** (un modèle
  léger suffit). En clôture « propre » (traitée en direct), c'est le **modèle de la session**
  qui paie — Opus ici.
- **Incohérence de description.** L'agent se décrit comme « délègue **systématiquement** »,
  alors que la skill ne délègue que sur verdict DIRTY (propre = traité en direct). À aligner.

## Proposition

1. **Recadrer en capacité, pas cérémonie.** Addendum d'**une ligne** à l'ADR-0022 (pas un
   nouvel ADR) : ezk-archive = capacité de continuité d'exécution / hygiène de session, rangée
   avec backlog / preview / sandbox — jamais dans la chaîne product-build→sprint→pr. Corriger
   le vocabulaire « cérémonie / rituel » de la skill pour couper la lecture « étape agile ».
2. **fast-path no-op (proportionnalité).** En tête du portier : si l'état à préserver est
   **vide** — arbre propre **et** déjà poussé, 0 branche/PR à soi en attente, 0 fiche livrée
   non réconciliée, 0 ADR de session — rendre **« rien à archiver »** en une ligne, **sans**
   produire de résumé, de note de handoff ni convoquer de sous-agent. Le déclenchement reste
   manuel ; c'est le **corps** qui s'auto-annule quand il n'y a rien à sauver.
3. **Modèle adapté au jugement.** Passer le sous-agent délégué en **léger (Sonnet) par
   défaut** ; n'escalader vers **Opus** que pour le pas de **jugement des branches réelles**
   (brouillon jetable vs travail à récupérer). Le portier reste un script ; la note reste un
   gabarit.
4. **Bonus cohérence.** Aligner la description de l'agent (« délègue systématiquement ») avec
   la vraie logique (propre = en direct, sale = délégué).

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] Une session « rien en l'air » sort en une ligne « rien à archiver » — 0 note, 0
      sous-agent, coût plancher.
- [ ] Une session « sale » déroule toujours la clôture complète (non-régression).
- [ ] Le sous-agent tourne sur un modèle léger par défaut ; Opus n'est appelé que pour le
      jugement des branches.
- [ ] L'ADR-0022 porte l'addendum « capacité » ; la skill ne se décrit plus en « cérémonie ».
- [ ] La description de l'agent reflète la logique réelle (propre = en direct).

## Comment vérifier

- **fast-path** : sur un worktree propre + poussé, `/ezk-archive check` rend « rien à
  archiver » sans écrire ; sur un worktree avec une branche non mergée, il déroule le rapport
  complet.
- **modèle** : le frontmatter de l'agent (ou le prompt de délégation) montre le modèle léger
  par défaut + l'escalade Opus scopée au jugement.
- **recadrage** : `grep -riE "cérémonie|rituel" skills/ezk-archive` ne présente plus
  ezk-archive comme une étape de la méthode ; l'ADR-0022 cite la capacité.

## Notes / décisions

- **Statut idea** : direction validée par le PO (2026-09-04), non groomée.
- Le **handoff** reste — c'est la seule brique à vraie valeur agile (continuité, « quoi
  ensuite » que git/backlog ne disent pas). On n'allège que l'enveloppe, pas lui.
- **Question de fond différée** : recouvrement handoff ↔ SPRINT.md ↔ récit de session (soulevé
  par le PO). La fiche sœur B (journal indépendant) déplace déjà une partie du problème.
- Voisines : [0088](done/0088-ezk-archive-cout-cloture-session-disciplinee.md) (coût de
  clôture, livrée — même esprit),
  [20260902224043892](20260902224043892_ezk-nettoyage-fin-session-worktrees-branches.md)
  (nettoyage fin de session), [0189](0189-handoff-durable-session-ephemere.md) (handoff en
  session éphémère), et la fiche sœur
  [20260904091853974](20260904091853974_journal-difficultes-artefact-independant.md) (journal
  indépendant).
