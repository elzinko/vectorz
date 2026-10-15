---
id: "20261015125606808"
title: La frontière de version est un checkpoint explicite du run autonome (sceller ou s'arrêter)
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [methode, ezk-product-build]
status: idea
blocked: attend-panel — décision structurelle (touche ADR-0070 et le contrat d'arrêt du run), à tenir avec le PO
pr:
evidence: none # pilote de run, pas d'écran
created: 2026-10-15
---

# 20261015125606808 — La frontière de version est un checkpoint explicite du run autonome

**En clair.** Versionner n'est pas une étape de *build*. Construire, c'est transformer des fiches
prêtes en incréments livrés (des sprints). **Sceller** une version — poser l'étiquette — est une
décision de **release** du PO. Aujourd'hui, en `--mode auto` sur un backlog découpé en versions, le
run construit la version en cours puis **s'arrête en silence** à la frontière. On veut que cette
frontière devienne un **arrêt explicite** : « la version vX est complète — la sceller pour débloquer
vX+1, ou je m'arrête ? ». Le sceau reste au PO ; le run ne fait que poser la question.

**Si tu arrives frais.** Le *run autonome* = `ezk-product-build run --mode auto`, qui enchaîne les
sprints seul. Une *version* = le lot de livraison (champ `version:` des fiches). La *frontière de
version* = le garde-fou [ADR-0070](../docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) :
on ne tire pas la version suivante tant que la courante n'a pas son étiquette git. *Sceller* =
`ezk backlog version close <v> --tag` (poser l'étiquette).

## Contexte / Problème

Discussion PO du 2026-10-15, après le run v0.15. Deux constats mêlés :

1. **Versionner n'est pas intrinsèque au build.** On doit pouvoir lancer `ezk-product-build` et
   enchaîner des sprints **sans jamais versionner**. C'est déjà le cas sur un backlog **non loti**
   (fiches sans `version:`) : le périmètre les garde toutes tirables, aucune frontière, le run va
   jusqu'à épuisement du stock prêt.
2. **Mais sur un backlog loti, l'arrêt à la frontière est muet.** ADR-0070 bloque la version
   suivante tant que la courante n'est pas scellée. Le run construit la version en cours, puis
   `plan-lot` ne rend plus rien → le run **s'arrête sans rien demander**. Le signal « version
   complète → pousse l'étiquette » existe dans la sortie de `plan-lot`, mais n'est pas un checkpoint.

Le manque : en auto, atteindre une frontière avec d'autres versions en attente devrait **faire
surface** à la décision de scellage, au lieu de s'arrêter en silence.

## Proposition

Ajouter un **moment de checkpoint « frontière de version »** au run autonome : quand la version en
cours est complète (tout livré, pas encore étiquetée) et qu'au moins une version suit dans le plan,
le run **s'arrête et demande** — « sceller vX pour débloquer vX+1, ou stop ? ». Le sceau (tag) reste
une **décision humaine** (un des 4 STOP), **sauf** pré-autorisation déjà livrée en v0.15 :
`--seal-versions local` (auto-tag en flux local) ou `--versions all` (enchaînement rétro + clôture à
chaque frontière). En multi-sessions, cette décision passe par la session **MASTER pilote** (règle de
coordination : le versionnement se propose depuis le pilote de la chaîne, pas depuis une session sœur).

C'est un **POC léger** : élever le signal de frontière existant en checkpoint, pas réécrire la boucle.

## Critères d'acceptation

> Provisoires — à finaliser au panel (cf. la question ouverte dans les Notes).

- [ ] En `--mode auto`, backlog loti, version en cours complète et une version suivante en attente :
      le run **s'arrête et demande** s'il faut sceller, au lieu de s'arrêter en silence.
- [ ] `--seal-versions local` et `--versions all` **lèvent** cette demande (comportement v0.15 inchangé).
- [ ] Backlog **non loti** (fiches sans `version:`) : **aucune** frontière, le run enchaîne sans jamais
      demander de versionner (non-régression).
- [ ] La décision de scellage reste humaine (ou MASTER pilote) ; le run ne tague jamais sans
      pré-autorisation explicite.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# dérouler un run --mode auto sur un plan jouet loti : à la frontière, constater l'arrêt-qui-demande ;
# puis avec --seal-versions local / --versions all : plus de demande ; puis sur un plan non loti :
# aucune demande, le run va jusqu'au bout du stock prêt.
```

## Notes / décisions

- **Panel requis** (drapeau `blocked: attend-panel`) : la fiche retouche ADR-0070 (la frontière) et le
  **contrat d'arrêt** du run (ses moments de checkpoint). Décision structurelle, à tenir avec le PO —
  pas à construire en run autonome tant que le panel n'a pas tranché.
- **Sœur du thème « autonomie du run »** livré en v0.15 : filtre d'éligibilité
  ([`20261011091553794`](done/20261011091553794_run-autonome-filtre-eligibilite-avant-deliberer.md)),
  boucle multi-versions
  ([`20261013131852375`](done/20261013131852375_product-build-boucle-multi-versions.md)), auto-tag
  opt-in ([`20261013131852581`](done/20261013131852581_auto-tag-close-local-opt-in.md)).
- **Placement** : aucune version ouverte ne porte ce thème (v0.16 = ranger la maison, v0.17 = board
  cop1). Laissée **sans version** : à affecter par le PO à une future passe « autonomie du run », ou à
  glisser dans une version qui a de la marge. Priorité **P2** par cohérence avec les sœurs — ajustable.
- **Question ouverte (à trancher au panel)** : comportement **par défaut**, sans drapeau — le run auto
  loti **s'arrête-et-demande** à chaque frontière, ou **s'arrête tout court** (statu quo) et ne demande
  que si on passe un futur `--seal …` ? L'un privilégie l'autonomie guidée, l'autre la frugalité.
