---
schema: method-review@0.1
fiche: "20261102123552184"
branch: "feat/20261102123552184-cartes"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-02"
run_id: "2026-11-02T21-17-00-436Z-bf3b7868"
---

# Review — 20261102123552184

## Résumé

Revue adverse ezk-reviewer : GO. Double garde sur les chemins : la méthode liste, mission control ne demande qu'un nom listé, le daemon refuse le reste ; aucune traversée possible (id = dossier réel, nom = fichier ou données, égalité stricte). Erreurs toujours remontées, iframe en origine opaque, en-têtes no-store et nosniff. Trois remarques appliquées : la fiche citait une option --data qui n'existait pas (réécrite en --file, et une option inconnue sort désormais en code 2), un SVG ouvert en direct est isolé comme l'HTML (CSP sandbox), et l'extraction du lanceur ezk partagé est notée.

## Rendus

N.A.

## Matrice de validation

Gate de la méthode=2420 tests + 47 suites ; Mission control=780 tests ; Page web=141 tests + typecheck ; Lint=propre ; Essai réel=7 documents, carte avec données calculées, nom piégé 404 ; Revue adverse=GO

## À tester

ezk board maps liste 7 documents ; ezk board maps --file methode-mega-city carte-interactive.data.js rend les données ; ezk board maps --data x sort en code 2 ; dans mission control, Méthode puis Cartes ouvre la carte de la méthode dans un cadre isolé

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
