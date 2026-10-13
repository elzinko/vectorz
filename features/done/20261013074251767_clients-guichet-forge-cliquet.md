---
id: "20261013074251767"
title: "ezk-archive et reconcile passent par le guichet forge (+ cliquet anti-régression)"
type: feature
priority: P2
product: mega-city
version: v0.12.0
labels: [github-optionnel, cross-repo]
status: shipped
blocked:
pr: "local (140f340f)"
evidence: none # commandes et scripts, aucun écran
split_from: "20261004083838593"
created: 2026-10-13
---

# 20261013074251767 — ezk-archive et reconcile passent par le guichet forge

**En clair.** Deux outils appellent encore `gh` sans lire la config : le `check.sh` d'`ezk-archive` et le texte de `reconcile`. On les fait passer par le guichet `ezk forge`, et un **test à cliquet** refuse ensuite tout nouvel appel à `gh` hors du guichet — l'oubli ne peut plus revenir.

**Si tu arrives frais.** Le guichet `ezk forge` est posé par la fiche sœur [Le guichet ezk forge](20261013074251752_guichet-forge-trois-etats.md). Un *cliquet* est une liste qui rétrécit mais ne grandit jamais.

## Contexte / Problème

Découpée de la fiche « Un seul guichet pour GitHub » (20261004083838593), **côté clients**. Vécu sur muti (2026-10-04, lendemain de `github: false`) :
- `skills/ezk-archive/scripts/check.sh` lance `gh pr list --state open` dès qu'un remote + un `gh` existent, sans lire la config.
- `/ezk-backlog reconcile`, lancé seul, demande `gh pr list --state merged` ; seul `ezk-sprint` le saute en `github: false`.

## Critères d'acceptation

- [ ] `check.sh` d'`ezk-archive` ne lance plus `gh` en `github: false`, et son rapport dit « PR sans objet : GitHub coupé par la config ».
- [ ] Le texte de `reconcile` passe par `ezk forge changes --merged` et dit « sans objet » en `github: false`.
- [ ] Le test à cliquet échoue si on ajoute un `gh pr list` dans un script ou un texte de skill hors de l'adaptateur, et passe sur la base d'aujourd'hui (`ci-conso` reste dans la base avec sa raison).
- [ ] La promesse de `.vectorz/config.example.yml` dit « aucun appel à l'API GitHub » (ADR-0061 D3).

## Comment vérifier

```bash
CHECK="$PWD/products/mega-city/skills/ezk-archive/scripts/check.sh"   # depuis la racine de vectorz
P=$(mktemp -d) && git -C "$P" init -q && git -C "$P" remote add origin https://github.com/x/y.git
mkdir -p "$P/.vectorz" && printf 'github: false\n' > "$P/.vectorz/config.yml"
mkdir -p "$P/bin" && printf '#!/bin/sh\necho "gh $*" >> %s/gh.log\n' "$P" > "$P/bin/gh" && chmod +x "$P/bin/gh"
(cd "$P" && PATH="$P/bin:$PATH" bash "$CHECK" --gate)   # rapport : PR sans objet
test ! -s "$P/gh.log" && echo "aucun appel gh"
pnpm --dir products/mega-city test
```

## Glossaire

- **Cliquet** — une liste qui peut rétrécir mais jamais grandir ; un test échoue si elle grandit.

## Notes / décisions

- Découpée de la fiche `20261004083838593` le 2026-10-13 (côté **clients**). **Dépend du guichet** : fiche sœur [Le guichet ezk forge](20261013074251752_guichet-forge-trois-etats.md) — à construire d'abord. Même version v0.12.0.
- Motif : [ADR-0061](../../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).
- Dépendance **muti** (projet hôte d'origine) — accès constaté le 2026-10-04 (`github: false`, commit `c3a5d48b`). Le build vit dans mega-city, autonome.
- **Preuve sur projet hôte (2026-10-13)** — éprouvé sur un dépôt git **jetable** (`mktemp`, remote GitHub + `gh` factice qui journalise ses appels). En `github: false` : `check.sh --gate` rend « PR sans objet : GitHub coupé par la config » et le journal `gh` reste **vide** (zéro appel, pas même `gh auth status`). Config absente : `check.sh` appelle `gh` (non-régression). Le cliquet `forge-gh-ratchet` passe sur la base d'aujourd'hui.
