---
id: "20261009104436287"
title: next nu montre la suite, pas la liste entière
type: refactor
priority: P1
product: mega-city
milestone:
version:
labels: [ergonomie-cli]
status: idea
blocked: "prémisse périmée : le CLI n'a ni `next` ni `list` (migré vers plan-head/plan-lot, périmètre de version ADR-0070) ; construire un `next` reviendrait en arrière. Résidu = renommage de vocabulaire = décision PO (run auto 2026-10-11)"
pr:
evidence: none
created: 2026-10-09
---

# 20261009104436287 — `next` nu montre la suite, pas la liste entière

**En clair.** Aujourd'hui `ezk backlog next`, tapé seul, est un **alias de `list`** : il
déballe tout le backlog trié. On s'attend pourtant à ce que « next » montre **ce qui vient
ensuite**. Le vrai « suivant » est caché derrière `next --ready-only`. On veut que `next` nu
montre la suite proche, et on veut trancher si `plan-head` — un helper interne — doit rester
une commande exposée au CLI.

## Contexte / Problème

- `next` seul = `list` (déballage complet, tri P0→P3). Documenté ainsi, mais contre-intuitif :
  le mot « next » promet « la prochaine », pas « toutes ».
- La sémantique « donne-moi la prochaine à tirer » vit dans le **flag** `--ready-only`. Le flag
  porte tout le sens ; le verbe nu ne sert à rien de distinct de `list`.
- `plan-head` est un helper **mécanique** (calcule la tête du plan) sur lequel `next --ready-only`
  s'appuie. Il est aujourd'hui exposé comme commande CLI alors qu'il relève de la tuyauterie.
- Symptôme daté : le PO, 2026-10-09, « on ne comprend pas bien ce que font `plan-head` et
  `next --ready-only` ; `next` devrait montrer ce qui vient prochainement ».

## Valeur — coût de ne rien faire

- `next` est une commande **centrale** du pilotage. Quand son verbe nu ment (il déballe tout au
  lieu de montrer la suite), la friction se paie **à chaque session**, pas une fois.
- Le vrai « suivant » est planqué derrière un flag (`--ready-only`) : l'opérateur doit connaître
  l'incantation pour obtenir ce que le mot promet déjà.
- Une commande de tête qui trompe **érode la confiance dans tout le vocabulaire CLI** : si `next`
  ne veut pas dire « next », que valent les autres verbes ? Le coût n'est pas un clic, c'est la
  lisibilité de la méthode.

## Proposition

1. **`next` nu montre la suite proche** : la prochaine fiche tirable + la tête bloquée (ce que
   fait `--ready-only` aujourd'hui), pas le déballage complet.
2. **Contrat de rétro-compat (avis archi 2026-10-09)** : `next --ready-only` **reste** un
   synonyme documenté du nouveau défaut, donc `ezk-sprint` / `ezk-product-build`, qui l'appellent
   explicitement, ne cassent pas. Le déballage complet reste sur `list`, plus un `next --all`
   explicite pour qui le veut.
3. **`plan-head` démoté (avis archi 2026-10-09, option C)** : il reste **appelable** (primitive
   déterministe, utilisée par `next` sous le capot) mais sort de la **surface humaine** — retiré
   de la doc tournée vers l'humain et des blocs « Et maintenant ? ». Ni vitrine (entretient la
   confusion), ni suppression (casserait un helper qui sert).

## Critères d'acceptation

- [ ] `ezk backlog next` (sans flag) imprime la prochaine fiche tirable **et** la tête bloquée, et
      **n'imprime pas** la liste entière — vérifié par un test sur une sortie à une seule fiche de tête.
- [ ] `ezk backlog list` **et** `ezk backlog next --all` impriment le déballage complet (même sortie).
- [ ] `ezk backlog next --ready-only` reste accepté et **identique** au `next` nu (synonyme) — test
      qui compare les deux sorties.
- [ ] Rétro-compat prouvée : un test (ou un appel réel) montre qu'`ezk-sprint` et
      `ezk-product-build`, qui appellent `--ready-only`, tirent toujours la même fiche qu'avant.
- [ ] `plan-head` n'apparaît plus dans la doc humaine ni dans aucun bloc « Et maintenant ? » (grep
      à zéro hors références internes), mais `ezk backlog plan-head` **répond encore** (reste callable).
- [ ] Le SKILL.md d'`ezk-backlog` décrit la nouvelle sémantique : `next` ≠ `list`, `--ready-only`
      synonyme, `plan-head` tuyauterie.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
ezk backlog next          # montre la suite, pas tout le stock
ezk backlog list          # déballage complet
```

## Notes / décisions

- Friction remontée par le PO le 2026-10-09 en pilotant le grooming du trio loi.
- Rangée en **v0.9.0 « ranger la maison »** (rationalisation de la surface CLI) — décidée par le PO
  le 2026-10-09.
- **Avis architecte 2026-10-09** : rétro-compat par synonyme `--ready-only` (appelants intacts) ;
  `plan-head` démoté (option C — callable mais hors surface humaine). **Pas d'ADR** : convention
  CLI locale, pas une décision durable ; au plus une ligne dans le SKILL.md d'`ezk-backlog`.
- **Sortie de v0.9.0 — run auto du 2026-10-11.** Constat au build : le CLI `ezk backlog` n'expose
  **ni `next` ni `list`** (verbes réels : `plan-head`, `plan-lot`, `plan-order`). La prémisse de la
  fiche (« `next` nu = alias de `list` ») décrit un état **antérieur** à la refonte tirage
  (`plan-head`/`plan-lot`, périmètre de version ADR-0070). L'intention « montrer la suite, pas tout
  déballer » est **déjà tenue** par `plan-head`. Construire un verbe `next` comme décrit
  **réintroduirait** le vocabulaire que le CLI a volontairement retiré → conflit avec le design
  livré. Le seul résidu réel est un **renommage de vocabulaire** : le SKILL.md d'`ezk-backlog` parle
  encore de `next --ready-only`/`next --lot` en surface alors que le CLI dit `plan-head`/`plan-lot`.
  Aligner (renommer, ou garder la double lecture) est une **décision de nommage PO**, pas un build
  autonome. Fiche sortie de version, `blocked:` posé. À re-scoper par le PO : « faut-il aligner le
  vocabulaire SKILL sur les verbes CLI ? ».
