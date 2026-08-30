---
id: development/adversarial-review-before-merge
kind: disposition
level: MUST
title: Toute livraison passe une revue adverse avant merge
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **Aucun merge sans revue adverse.** Avant tout squash-merge sur `main`, le diff de la
  feature est passé au crible par un juge qui cherche activement à le CASSER
  (correctness, sécurité, perf, contrats, qualité réelle des tests) et rend un verdict
  **GO/NO-GO bloquant**.
- **Le juge tourne sur un modèle DIFFÉRENT de celui qui a écrit le code.** C'est la
  valeur du mécanisme : une seconde opinion indépendante, pas une relecture par le même
  regard.
- **La revue ne dépend d'aucun support particulier.** Une pull request est UN moyen
  (module GitHub) — une branche locale suffit : la règle porte sur le diff, pas sur
  l'outil qui le présente. Quand un bot de revue externe (Codex) est branché, ses
  findings se traitent en plus, jamais à la place.
- **Trace mesurable de conformité** (ajout rétro 2026-08-30) : le verdict **GO/NO-GO** de la
  revue adverse est **consigné** — commentaire de PR, ou `SPRINT.md` en flux local — pour
  **100 % des merges** sur `main`. La règle décrivait le mécanisme ; la trace le rend
  *vérifiable* : sans elle, « toute livraison passe une revue » n'est pas mesurable. Symptôme :
  session du 2026-08-30, Codex non configuré → `ezk-reviewer` a porté 6 revues et trouvé de
  vrais findings à chaque PR, mais rien n'obligeait à en garder une trace.
- Origine : décision PO du 2026-08-24 — « la revue est une règle de développement
  (DoD), pas une habitude » ; l'exécutant de l'enforcement est l'agent `ezk-reviewer`.
- **Portée honnête de l'enforcement** (revue adverse 2026-08-24) : `agent-check` est un
  contrôle de **niveau 1** — l'agent `ezk-reviewer` LIT cette règle et rend son verdict.
  Ce n'est PAS un verrou git déterministe (niveau 2 = `type: hook`, non posé ici). « Bloquant »
  veut donc dire : le reviewer refuse le GO, pas que le `git merge` est empêché mécaniquement.
  Le filet déterministe réel reste la **gate locale** (build + tests verts) avant merge.
  Durcir en `hook` pré-merge est possible plus tard si le besoin d'un blocage dur apparaît.
