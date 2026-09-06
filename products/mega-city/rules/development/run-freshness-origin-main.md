---
id: development/run-freshness-origin-main
kind: disposition
level: MUST
title: Un run part d'un origin/main frais, jamais du main local
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
- **Verdict binaire.** Si le compteur `HEAD..origin/main` est `>0`, on rebase sur `origin/main`
  ou on stoppe ; on ne déroule pas le run tant que la base n'est pas fraîche.
- **Mesurable :** 100 % des runs comparent à `HEAD..origin/main` *après* un `git fetch` et
  journalisent le verdict (retard = N commits, décision = rebase | stop | go).
- **Bord offline** — un run sans remote (pas d'`origin`, machine hors ligne) ne doit pas être
  cassé par cette gate. Le coût et le seuil de tolérance sont mesurés par le spike
  `20260906122942825`. En attendant : pas de remote joignable = gate en avertissement, jamais
  bloquante.
- Origine : rétrospective du 2026-09-05 (symptômes 1 et 5). Un run avait comparé au `main`
  local et travaillé sur une base périmée. Enforcement niveau 1 : l'agent `ezk-pm` lit cette
  règle au checkpoint d'intake ; le durcir en `hook` pré-run reste possible plus tard.
