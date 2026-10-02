---
id: "20261002155911257"
title: "Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [cross-repo]
status: idea
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-02
---

# 20261002155911257 — Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte

**En clair.** Les skills ezk appellent leurs outils par `pnpm --dir products/mega-city …`, un chemin
relatif au dépôt courant. Ça marche dans vectorz, mais pas depuis un projet qui utilise la méthode,
comme muti : le chemin n'existe pas, et le ship ou la régénération du backlog échouent. Les skills
doivent retrouver mega-city tout seuls, par configuration ou par le dépôt voisin.

**Si tu arrives frais.** *mega-city* est le catalogue d'outils de la méthode (scripts du backlog, des
rétros, des vues). Il vit dans `vectorz/products/mega-city`. Un *projet hôte*, comme muti, utilise la
méthode depuis son propre dépôt.

## Contexte / Problème

Session muti du 2026-10-01 :

- `ezk-backlog ship` et `regen` impossibles depuis muti : le ship d'une fiche mergée a dû être fait à
  la main (PR muti #268).
- Effet de bord : le pilote a conclu à tort « mega-city absent de cette machine », alors qu'il était
  dans le dépôt voisin.
- Même trou pour `ezk:config` et `retro:captures`. Appelés avec le chemin absolu de vectorz, ils
  marchent : seul le chemin pose problème.

## Proposition

Un seul point de résolution du chemin de mega-city, partagé par tous les skills :

- d'abord une variable (`VECTORZ_ROOT` ou équivalent) ou un réglage de la config du projet ;
- à défaut, la découverte d'un dépôt voisin `vectorz/products/mega-city` ;
- si rien n'est trouvé, un message qui dit quoi régler, jamais un `ENOENT` brut.

À arbitrer au grooming : variable, config `.vectorz/`, ou découverte seule.

## Critères d'acceptation

- [ ] `ship` et `regen` du backlog réussissent depuis muti, sans geste manuel.
- [ ] `ezk:config` et `retro:captures --check` aussi.
- [ ] Sans mega-city trouvable, le message dit quoi régler.
- [ ] Les skills ne contiennent plus `--dir products/mega-city` en dur.

## Comment vérifier

Depuis muti, lancer `/ezk-backlog regen` puis le ship d'une fiche mergée : les deux aboutissent sans
chemin tapé à la main et ne modifient que `features/`. Sur le terrain : 0 ship à la main sur les
3 prochains ships muti. *(Bloc provisoire, précisé au grooming.)*

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P1.
  L'architecte proposait P0 : c'est la frontière muti ↔ vectorz, et elle éteint une cause de fausse
  affirmation.
- Distincte de la fiche `20261001192624192` (sortir les artefacts de méthode de `docs/`).
- Version V0.5 proposée par le pilote (P1 → release en cours) ; à confirmer au planning.
