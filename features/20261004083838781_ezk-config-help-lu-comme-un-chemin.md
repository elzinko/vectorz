---
id: "20261004083838781"
title: "« ezk config --help » prend --help pour un chemin et affiche un faux statut"
type: bug
priority: P3
product: mega-city
milestone:
version:
labels: [cli]
status: idea
pr:
evidence: none # sortie de terminal, aucun écran
created: 2026-10-04
---

# 20261004083838781 — « ezk config --help » prend --help pour un chemin et affiche un faux statut

**En clair.** Taper `ezk config --help` n'affiche pas l'aide. La commande prend `--help` pour un
dossier de projet, lit une config qui n'existe pas, et affiche « GitHub tout ON » avec un code de
succès. Sur un projet qui a coupé GitHub, ce statut est faux. On veut l'aide pour `--help` et `-h`,
et une erreur claire pour toute option inconnue.

## Contexte / Problème

Reproduit le 2026-10-04 depuis muti, dont `.vectorz/config.yml` vaut `github: false` :

```text
$ ezk --root /Users/elzinko/git/bacasable/muti config --help
Config projet    : /Users/elzinko/git/bacasable/vectorz/--help/.vectorz/config.yml
github.pr            ON    (ouvrir une pull request)
github.ci            ON    (attendre la CI cloud)
github.codex-review  ON    (revue Codex)
rc=0
```

Même chose avec `-h`. Deux défauts se cumulent :

1. `bin/ezk-config.ts` garde une forme ancienne, `ezk config <projectRoot>` : tout mot autre que
   `github` ou `show` devient un chemin de projet, même un mot qui commence par `-`.
2. Le chemin est résolu depuis le dossier de vectorz, pas depuis le projet visé par `--root` : le
   statut affiché ne parle même pas du bon projet.

Un dossier absent donne le défaut « tout ON ». Le lecteur croit GitHub allumé sur muti, alors qu'il
est coupé.

## Proposition

- `--help` et `-h` affichent l'usage (le bloc déjà écrit en tête de `bin/ezk-config.ts`), code 0.
- Tout autre mot qui commence par `-` est refusé, code 2, avec l'usage.
- La forme ancienne `ezk config <projectRoot>` refuse un dossier qui n'existe pas, au lieu
  d'afficher un statut par défaut.

## Critères d'acceptation

- [ ] `ezk config --help` et `ezk config -h` affichent l'usage et sortent en 0.
- [ ] `ezk config --nimporte` sort en 2 avec un message qui nomme l'option.
- [ ] `ezk config <dossier-absent>` sort en erreur au lieu d'afficher « tout ON ».
- [ ] `ezk config`, `ezk config show` et `ezk config github …` gardent leur comportement.

## Comment vérifier

```bash
ezk config --help; echo "rc=$?"          # usage, rc=0
ezk config -h; echo "rc=$?"              # usage, rc=0
ezk config --nimporte; echo "rc=$?"      # erreur, rc=2
ezk config /dossier/absent; echo "rc=$?" # erreur, rc≠0
pnpm --dir products/mega-city test
```

## Notes / décisions

- Vu pendant la coupure de GitHub dans muti. Indépendant du guichet de
  [ADR-0061](../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md) : tirable tout de
  suite.
