---
id: development/run-freshness-origin-main
kind: disposition
level: MUST
title: Un run part d'un origin/main frais — avertir, ou se réaligner quand c'est sûr
enforcements:
  - type: agent-check
    agent: ezk-pm
---

- **À l'intake d'un run** (`ezk-product-build` étape 1, `ezk-sprint` check de départ),
  on rafraîchit AVANT de statuer : `git fetch`, puis on lit
  `git rev-list --count HEAD..origin/main`. C'est le seul point de comparaison autorisé.
- **Comparer au `main` local est interdit.** Le main local peut être en retard (squash-merge
  passé, branche d'une autre session) — un run lancé sur cette base travaille sur une photo
  périmée du produit.
- **Verdict : avertir, ou se réaligner tout seul quand c'est sûr (ADR-0052).** Si le
  compteur `HEAD..origin/main` est `>0`, deux issues possibles :
  - **Prédicat de sûreté D4** — le worktree est **propre** (aucun fichier modifié ni non
    suivi) ET un **fast-forward strict** vers `origin/main` est possible (son `HEAD` est
    ancêtre de `origin/main`, jamais l'inverse ni une vraie divergence). Dans ce seul cas,
    on peut se réaligner tout seul par fast-forward — jamais par merge ni rebase, jamais de
    perte possible puisqu'on ne fait qu'avancer un pointeur.
    Implémentation de référence : `skills/ezk-pr/scripts/refresh-worktrees.sh`, appelé
    après chaque `ship` (fiche merge-local-first) et réutilisable ici tel quel.
  - **Sinon → avertissement seul, jamais d'écriture.** Un worktree sale (modifications en
    cours) ou divergent (un commit local que `origin/main` n'a pas) n'est **jamais** déplacé
    tout seul (ADR-0042 : pas de geste sur une vue tenue par une session vivante) — on
    signale clairement le retard et on laisse la décision (rebase | stop | go) à l'appelant.
- **Mesurable :** 100 % des runs comparent à `HEAD..origin/main` *après* un `git fetch` et
  journalisent le verdict — soit `realigned (fast-forward)`, soit `signal (dirty|diverged)`
  suivi de la décision humaine/agent (rebase | stop | go).
- **Bord offline** — un run sans remote (pas d'`origin`, machine hors ligne) ne doit pas être
  cassé par cette gate. Le coût et le seuil de tolérance sont mesurés par le spike
  `20260906122942825`. En attendant : pas de remote joignable = gate en avertissement, jamais
  bloquante.
- Origine : rétrospective du 2026-09-05 (symptômes 1 et 5). Un run avait comparé au `main`
  local et travaillé sur une base périmée. Enforcement niveau 1 : l'agent `ezk-pm` lit cette
  règle au checkpoint d'intake ; le durcir en `hook` pré-run reste possible plus tard.
- **Promotion (ADR-0052, merge-local-first) :** cette règle passait par « avertir »
  seulement ; elle sait désormais aussi se réaligner (D4 ci-dessus). Le bord offline
  n'est **pas** concerné par ce changement : pas de remote joignable reste un
  avertissement, jamais bloquant (seuil et coût toujours gatés sur le spike
  `20260906122942825`).
