---
date: 2026-10-15
session: "main / vectorz"
type: friction
---

# Gate « version prête à lancer » : toutes les fiches ready (DoR-ok) avant de lancer les sprints

Friction : v0.16 a été lancée alors que la version n'était pas « prête à lancer » — elle portait des fiches idea/bloquées (scrum, ADR-location), ce qui n'a sauté aux yeux qu'à la clôture (tag refusé). Proposition PO (2026-10-15) : un gate « version prête à lancer » AVANT de lancer les sprints de dev. Un script LECTURE SEULE lit les statuts des fiches d'une version ; la version (ou chacun de ses sprints) est « lançable » seulement si toutes ses fiches sont ready — et une fiche n'est ready que si sa DoR est OK (invariant ready ≡ DoR-ok à re-vérifier au lancement, pas seulement au moment où on a posé ready). Briques existantes à COMPOSER, pas réinventer : ezk dor check (DoR par fiche), ezk backlog version check (cohérence/complétude de version, voit déjà les bloquées), le filtre d'éligibilité livré en v0.15 (par fiche au tirage), health min-ready. Manque : un seul point d'entrée « cette version / ce lot de sprints est-il prêt à lancer ? ». À discuter en retro, puis fiche à créer (ne pas créer en direct — passer par l'anti-doublon du backlog).
