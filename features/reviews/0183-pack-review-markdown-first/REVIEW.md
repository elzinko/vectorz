---
schema: method-review@0.1
fiche: "0183"
branch: "feat/0183-pack-review-markdown-first"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "0.1.0"
status: ready-for-review
created: "2026-08-17"
---

# Review — 0183

## Résumé

Pack de review markdown-first (contrat method-review@0.1, ADR-038) : SoT versionnee dans le code, deux rendus prouvent l'agnosticisme (markdown-file toujours actif, commentaire GitHub opt-in).

## Rendus

- products/mega-city/src/review/README.md
- features/reviews/REVIEW.template.md

## Matrice de validation

Voir docs/PR_VALIDATION.md - CI : N.A. (gate locale uniquement, pas de push) - Tests unitaires : OK (contract/render/markdown-file/github-comment, 4 suites dediees) - E2E navigateur : N.A. (aucune UI) - Before/after (UI) : N.A. (aucun changement UI) - Preview de deploiement : N.A.

## À tester

Rejouer : pnpm --dir products/mega-city test -- src/review/__tests__ - les 4 suites contract/render/markdown-file/github-comment. Le Gherkin src/review/__tests__/review-pack.feature reprend les 7 AC. features/checks/ (0178) n'existe pas encore : pas de recette externe a rejouer en plus.

## Qualité

Non produit (.quality/ absent sur ce sprint) - N.A. par degradation propre, invariant ADR-033.

## Provisioning / preview

pnpm --dir products/mega-city install --frozen-lockfile (worktree neuf) ; pnpm --dir products/mega-city typecheck ; pnpm --dir products/mega-city test. CLI de demo : pnpm --dir products/mega-city review:emit --fiche <id> --branch <feat/id-slug> --product mega-city --method-name ezk-sprint --method-version 0.1.0 --status ready-for-review --resume <...> --matrice <...> --a-tester <...> --provisioning <...> [--github].

## Trouvailles

- docs/PR_VALIDATION.md et features/checks/ (0178) n'existaient pas au moment du build de 0183 - docs/PR_VALIDATION.md cree/annote en cross-link (AC1) ; features/checks/ reste une degradation propre en attendant 0178.
