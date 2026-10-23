---
id: "20261018234206166"
title: "La commande park refuse une fiche non groomée (compile « tenter avant de parker »)"
type: feature
priority: P2
product: mega-city
milestone: preparation
version:
labels: [backlog, agent-ops]
status: ready
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-19
---

# 20261018234206166 — park refuse une fiche non groomée

**En clair.** Une règle que rien ne compile reste une intention. La règle
[`development/tenter-avant-de-parker`](../products/mega-city/rules/development/tenter-avant-de-parker.md)
dit « on tente avant d'écarter » — mais `ezk backlog park` peut écarter n'importe quelle fiche,
tout de suite, sans preuve de tentative. On veut que la commande **refuse** une fiche qu'on n'a pas
groomée.

## Contexte / Problème

Rétro du 2026-10-19 (capture `docs/captures/2026-10-19-retro-run-parking-frilosite.md`) : un run a
parké 16 fiches sur 22 sans lancer l'auto-groom. `ezk run eligibility` rend « groom » pour une fiche
`idea` sans `blocked:`, mais `ezk backlog park` ignore ce verdict : il écrit lui-même la raison
`blocked:` en sortie — le pilote fabrique au park le blocage que le groom aurait dû découvrir. Les
deux chemins (portier d'éligibilité et park) ne sont jamais séquencés.

## Proposition

`ezk backlog park <id>` **refuse (code ≠ 0)** une fiche dont le verdict d'éligibilité est `groom` ou
`build`, sauf preuve de tentative passée explicitement (`--after-groom <ref>` : un SHA d'essai ou une
référence de ligne `SPRINT.md`). Seules `escalate` (la fiche porte déjà un `blocked:` typé, ou c'est
un épic) et `defer` (hors version) restent parkables de plein droit. S'appuie sur le cœur pur
`src/backlog/run-eligibility.ts`, déjà écrit.

## Critères d'acceptation

- [ ] `park` sur une fiche `{status: idea, blocked: '', version ∈ périmètre}` **sans** `--after-groom`
      sort en erreur (code ≠ 0) et dit pourquoi.
- [ ] La même fiche avec un `blocked:` typé préexistant, OU avec `--after-groom <ref>`, se parke.
- [ ] Une fiche hors version (`defer`) ou avec un épic reste parkable comme avant.

## Comment vérifier

```bash
pnpm --dir products/mega-city test   # un test de backlog-park couvre les 3 cas ci-dessus
```

## Notes

- Compile la règle `development/tenter-avant-de-parker`. Fiche sœur : le rapport de run qui rend le
  ratio parké/livré visible (20261018234207272).
