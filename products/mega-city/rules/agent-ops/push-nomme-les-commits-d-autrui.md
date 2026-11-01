---
id: agent-ops/push-nomme-les-commits-d-autrui
kind: disposition
level: SHOULD
title: Avant de pousser main, nommer les commits qu'on n'a pas faits soi-même
---

- **En clair.** Plusieurs sessions committent sur le même `main` local. Un push emporte tout ce qui est
  en avance sur GitHub, y compris le travail des autres, parfois pas encore fini ou corrigé. Avant de
  pousser `main`, ou de proposer de le faire, on liste `git log origin/main..main`, et on nomme au PO
  les commits qu'on n'a pas faits soi-même.
- **Symptôme fondateur** (rétro du 2026-11-01) : une session a poussé `main` deux fois (11 h 44 et
  13 h 27). Ces pushes ont emporté les commits d'un run voisin, dont une version de `ezk backlog show`
  qui coupait sa sortie à 64 Ko ; le correctif, lui, est resté local. Le run voisin ne l'a appris
  qu'en lisant `git reflog show origin/main`.
- **Frontière.** Ne remplace pas la confirmation d'un push par le PO (action sortante) : elle la
  rend informée.
- **Preuve mince.** Un seul incident : posée en SHOULD, sur décision du PO du 2026-11-01 (règle
  `agent-ops/preuve-mince-question-pas-veto`).
- **Mesure (removability).** 0 push de `main` qui emporte des commits d'une autre session sans les
  nommer.

Origine : rétro du 2026-11-01, capture `docs/captures/2026-11-01-retro-run-contrats-json-light.md`
(proposition 8, lentilles produit et architecture). Cible : globale.
