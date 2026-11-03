---
schema: method-review@0.1
fiche: "20261102100505596"
branch: "fix/20261102100505596-pid-par-port"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T17-58-04-719Z-1c9ce288"
---

# Review — 20261102100505596

## Résumé

Revue adverse ezk-reviewer : GO. Seul PidFileManager lit le fichier de pid : le renommage ne casse aucun autre lecteur (web, méthode, scripts). Les tests de status et stop prouvent l'orchestration ; le vrai cycle de vie est prouvé par le test à deux vrais daemons. Remarques non bloquantes : un daemon de l'ancien code garde daemon.pid, que start ne consulte pas pour sa garde (transitoire, le bind échoue) ; le refus du même port à start n'a pas de test dédié.

## Rendus

N.A.

## Matrice de validation

Gate locale 2314 tests et 47 suites de scripts verts ; 798 tests mission control ; typecheck et biome verts ; rejeu sur deux vrais daemons

## À tester

Lancer deux daemons du même dossier : cop1 status les liste tous deux ; cop1 stop sans port refuse

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
