---
schema: method-review@0.1
fiche: "20261031160441267"
branch: "feat/20261031160441267-detail-fiche"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "b39c7d10"
status: approved
created: "2026-11-01"
run_id: "2026-10-30T12-25-57-418Z-21e76858"
---

# Review — 20261031160441267

## Résumé

Revue adverse ezk-reviewer : GO, aucun bloquant. L'extraction du lecteur de sections hors de dor-manifest.ts ne change pas le contrôle de prêt (tests dor verts sans modification). Les six critères sont prouvés par des tests qui comparent la vraie commande aux exemples rangés. Trois remarques non bloquantes : la liste relit chaque fichier deux fois ; une case dans un bloc de code sous Critères compterait (comme chez cop1) ; dor-manifest recopiait le retrait du front-matter (corrigé). Après la revue, la gate a refusé un parse du front-matter dans la fixture (règle fiche-read-via-loader) : fixture réécrite, exemples générés identiques.

## Rendus

N.A.

## Matrice de validation

Gate locale (pnpm test + test:scripts, 2327 tests)=vert ; Test de contrat=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (commande en ligne)

## À tester

pnpm --dir products/mega-city exec vitest run src/__tests__/backlog-show.test.ts ; ezk backlog show 20261031160441412 ; ezk backlog show --json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["schema_version"], len(d["fiches"]))'

## Qualité

N.A.

## Provisioning / preview

Aucun : la fixture se construit dans un dossier jetable (git requis).

## Trouvailles

- Double lecture des fichiers dans la liste (reportée à la fiche mission control)
- Case dans un bloc de code sous Critères (comportement hérité de cop1)
- Serveur ezk-map orphelin d'un test tenait le port 30072 et a fait échouer une fois le test du lanceur
