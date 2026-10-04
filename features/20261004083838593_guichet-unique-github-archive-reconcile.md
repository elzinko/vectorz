---
id: "20261004083838593"
title: "Un seul guichet pour GitHub : ezk-archive et reconcile respectent « github: false »"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [github-optionnel, cross-repo]
status: idea
pr:
evidence: none # commandes et scripts, aucun écran
created: 2026-10-04
---

# 20261004083838593 — Un seul guichet pour GitHub : ezk-archive et reconcile respectent « github: false »

**En clair.** Un projet qui coupe GitHub (`github: false`) voit encore `ezk-archive` et
`ezk-backlog reconcile` appeler `gh pr list` : ces deux-là ne lisent pas la config. On pose un
guichet unique, `ezk forge`, qui lit la config une seule fois, et on y fait passer ces deux
appelants. Un test refuse ensuite tout nouvel appel à `gh` hors du guichet : l'oubli ne peut plus
revenir.

**Si tu arrives frais.** `.vectorz/config.yml` est la config d'un projet suivi par la méthode ;
`github: false` y coupe les PR, la CI cloud et la revue Codex. Le motif retenu est décrit dans
[ADR-0061](../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).

## Contexte / Problème

Vécu sur muti le 2026-10-04, le lendemain de sa coupure de GitHub (`.vectorz/config.yml` à
`github: false`, commit `c3a5d48b` de muti) :

- `skills/ezk-archive/scripts/check.sh` lance `gh pr list --state open` dès qu'un remote GitHub et
  un `gh` authentifié existent. Il ne lit pas la config.
- `/ezk-backlog reconcile`, lancé seul, demande `gh pr list --state merged`. Seul `ezk-sprint` le
  saute en `github: false` ; le texte de `reconcile` ne lit pas la config.

Ces appels ne font que lire : ils ne créent rien et ne coûtent pas de minutes Actions. Mais ils
contredisent la promesse de `github: false`. Et la cause est structurelle : chaque appelant doit
penser à lire la config. 7 fichiers de code et 9 textes de skills appellent `gh` ; 2 textes
seulement lisent la config (relevé dans l'ADR-0061).

## Proposition

Mettre en œuvre les décisions D1, D2 et D4 de
[ADR-0061](../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md), pour le premier
cran seulement :

1. **Le guichet.** Une commande `ezk forge changes --open|--merged`. Un cœur pur choisit l'adaptateur
   d'après `resolveGithub` ; l'adaptateur GitHub appelle `gh`, l'adaptateur local répond « sans
   objet ».
2. **Trois états distincts** en sortie : `ok`, `off` (coupé par la config), `unavailable` (`gh`
   absent, non authentifié ou hors ligne). `off` ne ressemble jamais à « aucune PR ».
3. **Deux premiers clients.** `check.sh` d'`ezk-archive` et le texte de `reconcile` passent par
   `ezk forge changes`. Le rapport d'archive dit « PR sans objet : GitHub coupé par la config ».
4. **Le test à cliquet.** Un test de mega-city relève chaque appel à `gh` hors de l'adaptateur,
   dans le code et dans les textes de skills. La liste d'aujourd'hui est la base ; un appel nouveau
   fait échouer le test. `ci-conso`, GitHub par nature, reste dans la base avec sa raison.
5. **La promesse reformulée.** `.vectorz/config.example.yml` dit « aucun appel à l'API GitHub »
   au lieu de « aucun appel GitHub » (ADR-0061 D3).

Hors périmètre : migrer les autres appelants. Ils passeront par le guichet quand on les touchera,
et la base du cliquet rétrécira d'autant.

## Critères d'acceptation

- [ ] Dans un projet à `github: false`, `ezk forge changes --open` et `--merged` rendent l'état `off`
      sans lancer `gh`.
- [ ] Dans un projet sans config, ils rendent la même liste que `gh pr list` (non-régression).
- [ ] `gh` absent ou non authentifié, config allumée : l'état est `unavailable`, distinct de `off`
      et d'une liste vide.
- [ ] `check.sh` d'`ezk-archive` ne lance plus `gh` en `github: false`, et son rapport le dit en
      clair.
- [ ] Le texte de `reconcile` passe par `ezk forge changes --merged` et dit « sans objet » en
      `github: false`.
- [ ] Le test à cliquet échoue si on ajoute un `gh pr list` dans un script ou un texte de skill
      hors de l'adaptateur, et passe sur la base.
- [ ] `ezk help` liste `ezk forge`.

## Comment vérifier

Un faux `gh` journalise chaque appel : un journal vide prouve qu'aucun appel n'est parti.

```bash
CHECK="$PWD/products/mega-city/skills/ezk-archive/scripts/check.sh"   # depuis la racine de vectorz
P=$(mktemp -d) && git -C "$P" init -q && git -C "$P" remote add origin https://github.com/x/y.git
mkdir -p "$P/.vectorz" && printf 'github: false\n' > "$P/.vectorz/config.yml"
mkdir -p "$P/bin" && printf '#!/bin/sh\necho "gh $*" >> %s/gh.log\n' "$P" > "$P/bin/gh" && chmod +x "$P/bin/gh"
PATH="$P/bin:$PATH" ezk --root "$P" forge changes --open; echo "rc=$?"     # état off
(cd "$P" && PATH="$P/bin:$PATH" bash "$CHECK" --gate)                  # rapport : PR sans objet
test ! -s "$P/gh.log" && echo "aucun appel gh"
pnpm --dir products/mega-city test
```

## Glossaire

- `ezk forge` — le guichet unique : la seule commande qui parle à GitHub pour la méthode.
- **Cliquet** — une liste qui peut rétrécir mais jamais grandir ; un test échoue si elle grandit.

## Notes / décisions

- Motif et options écartées : [ADR-0061](../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).
- Suite : [20261004083838687](20261004083838687_integrer-sans-pr-par-avance-rapide.md) ajoute le
  verbe `integrate` sur ce guichet.
- Codes de sortie des trois états : à fixer au grooming.
- Demandé depuis muti : sa gate locale (`ci:local:signal`) fait déjà son propre contrôle (option A
  de l'ADR). Elle pourra passer par le guichet plus tard.
