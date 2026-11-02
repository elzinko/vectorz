---
id: "20261102182259592"
title: "Tenir le carnet de tests de mission control, et mesurer s'il sert"
type: feature
priority: P2
product: mega-city
milestone: exploration-app
version: v0.23.0
depends: ["20261102182259505"]
labels: [test-local, exploration-app]
status: idea
pr:
evidence: none # aucun écran modifié ; les captures vont au carnet
created: 2026-11-02
split_from: "20261014113049954"
---

# 20261102182259592 — Tenir le carnet de tests de mission control, et mesurer s'il sert

**En clair.** C'est le premier vrai usage du carnet, sur mission control, l'app que le PO utilise
tous les jours. On écrit l'arbre de ses 9 vues et de leurs actions. Le scout y fait des passes avec
navigateur, et ses captures vont au carnet. Après trois passes, on décide sur des chiffres si l'outil
reste.

**Si tu arrives frais.** Mission control est l'interface web de cop1
(`products/cop1/packages/web`). Le carnet note ce qui est testé :
[20261102182259416](done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md). Le scout s'en
sert : [20261102182259505](20261102182259505_scout-lit-et-remplit-le-carnet.md).

## Contexte / Problème

Mission control n'a pas de routeur. Ses 9 vues sont une liste dans le code
(`products/cop1/packages/web/src/board/Board.tsx:34-43`). L'arbre doit donc s'écrire à la main, et il
peut dériver quand une vue s'ajoute. La passe du scout du 2026-11-02 n'utilisait que des requêtes
HTTP (`docs/sessions/2026-11-02-scout-sprint5-mission-control.md:13`) : l'axe visuel n'a jamais été
testé.

Le panel du 2026-11-02 a demandé une preuve de valeur avant d'aller plus loin. Cette fiche la produit.

## Proposition

- **L'arbre de mission control** : ses 9 vues, et les actions visibles de chacune.
- **Un garde-fou de dérive** : un test compare l'arbre déclaré aux vues de `ViewId`.
- **Des passes avec navigateur**, par l'option `--ui` du scout. Cette option vaut l'accord du PO
  qu'exige la règle `development/playwright-mcp-usage`. Les captures sont copiées au carnet.
- **La mesure de valeur**, écrite dans cette fiche après chaque passe.

## Critères d'acceptation

- [ ] L'arbre de mission control déclare ses 9 vues et les actions visibles de chacune.
- [ ] Un test échoue si une vue de `ViewId` manque à l'arbre déclaré.
- [ ] Une passe `--ui` du scout remplit l'axe visuel d'au moins une vue, avec sa capture copiée au
      carnet.
- [ ] La première passe est notée dans cette fiche : « X sur Y » avant et après, et les défauts
      trouvés sur des nœuds jamais testés.

**Mesure de suivi** — sur les 3 premières passes du scout sur mission control :

- chaque passe part de la liste « à tester » du carnet ;
- « X sur Y testés » monte à chaque passe ;
- au moins un défaut est trouvé sur un nœud jamais testé ;
- quand le PO consulte, moins de la moitié des nœuds sont expirés.

Deux échecs sur ces quatre points, et on retire l'outil. La décision « on garde » ou « on retire »
s'écrit dans cette fiche.

## Comment vérifier

1. `ezk carto status --todo` sur mission control liste ses 9 vues.
2. Retirer une vue de l'arbre déclaré : le test de dérive échoue.
3. Lancer `/ezk-scout run mission-control --ui`, puis `ezk carto status` : au moins une vue a un état
   visuel avec sa capture.

```bash
pnpm --dir products/cop1/packages/web test
```

## Notes / décisions

- **Née du découpage** de
  [Carte de l'app et suivi de ce qui est testé](done/20261014113049954_cache-cartographie-app.md), le
  2026-11-02.
- **Choix de l'app** (décision PO du 2026-11-02) : le PO s'en sert chaque jour, et une passe y a
  trouvé six défauts le 2026-11-02.
- **Estimation du panel** : environ 200 000 à 250 000 jetons. La passe avec navigateur coûte cher.
