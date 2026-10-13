> 🗎 Rendu de la fiche [features/20261013074251752_guichet-forge-trois-etats.md](../done/20261013074251752_guichet-forge-trois-etats.md)

# 20261013074251752 — Le guichet ezk forge : une commande, trois états

**En clair.** Un projet qui coupe GitHub (`github: false`) voit encore des outils appeler `gh` sans lire la config. On pose un **guichet unique**, `ezk forge changes`, qui lit la config une fois et répond par trois états clairs : `ok`, `off` (coupé par la config), `unavailable` (`gh` absent). C'est la fondation ; les clients viennent dans la fiche sœur.

**Si tu arrives frais.** `.vectorz/config.yml` règle un projet ; `github: false` y coupe les PR. Le motif est dans [ADR-0061](../../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).

## Contexte / Problème

Découpée de la fiche « Un seul guichet pour GitHub » (20261004083838593), **côté guichet**. Vécu sur muti (2026-10-04) : 7 fichiers de code et 9 textes de skills appellent `gh` ; 2 seulement lisent la config (ADR-0061). La cause est structurelle : chaque appelant doit penser à lire la config. On centralise.

## Proposition

Décisions D1 + D2 de [ADR-0061](../../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md), premier cran :
- une commande `ezk forge changes --open|--merged` ; un cœur pur choisit l'adaptateur d'après `resolveGithub` ; l'adaptateur GitHub appelle `gh`, l'adaptateur local répond « sans objet » ;
- trois états en sortie : `ok`, `off`, `unavailable` — `off` ne ressemble jamais à « aucune PR ».

## Critères d'acceptation

- [ ] Dans un projet à `github: false`, `ezk forge changes --open` et `--merged` rendent l'état `off` sans lancer `gh`.
- [ ] Dans un projet sans config, ils rendent la même liste que `gh pr list` (non-régression).
- [ ] `gh` absent ou non authentifié, config allumée : l'état est `unavailable`, distinct de `off` et d'une liste vide.
- [ ] `ezk help` liste `ezk forge`.
- [ ] Les codes de sortie des trois états sont fixés et documentés.

## Comment vérifier

```bash
P=$(mktemp -d) && git -C "$P" init -q && git -C "$P" remote add origin https://github.com/x/y.git
mkdir -p "$P/.vectorz" && printf 'github: false\n' > "$P/.vectorz/config.yml"
mkdir -p "$P/bin" && printf '#!/bin/sh\necho "gh $*" >> %s/gh.log\n' "$P" > "$P/bin/gh" && chmod +x "$P/bin/gh"
PATH="$P/bin:$PATH" ezk --root "$P" forge changes --open; echo "rc=$?"   # état off
test ! -s "$P/gh.log" && echo "aucun appel gh"
pnpm --dir products/mega-city test
```

## Glossaire

- `ezk forge` — le guichet unique : la seule commande qui parle à GitHub pour la méthode.

## Notes / décisions

- Découpée de la fiche `20261004083838593` le 2026-10-13 (côté **guichet**). Les clients (ezk-archive, reconcile) + le cliquet = fiche sœur [ezk-archive et reconcile passent par le guichet](../done/20261013074251767_clients-guichet-forge-cliquet.md). Même version v0.12.0.
- Motif et options écartées : [ADR-0061](../../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).
- La fiche [Sans PR, intégrer par avance rapide](../20261004083838687_integrer-sans-pr-par-avance-rapide.md) ajoute le verbe `integrate` sur ce guichet.
- Dépendance **muti** (projet hôte d'origine) — accès constaté le 2026-10-04 (`github: false`, commit `c3a5d48b`). Le build vit dans mega-city, autonome ; muti a motivé le besoin.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ |
| Revue | ✅ |
| Before/after (UI) | N.A. (terminal) |
