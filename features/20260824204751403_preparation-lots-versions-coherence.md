---
id: "20260824204751403"
title: "Découper le backlog en versions et vérifier la cohérence d'un lot"
type: feature
priority: P1
product: mega-city
version: V0.3
labels: [backlog]
epic:
status: idea
pr:
created: 2026-08-24
---

# 20260824204751403 — Lotir les features en versions (milestones) & cohérence de lot

## En clair

Le champ `version:` existe déjà dans les fiches, mais personne ne le lit : c'est une étiquette
morte. Le « train de versions » vit à la main dans `PLAN.md`, où il peut dériver sans bruit.

Cette fiche rend le niveau **version** actif. Une sous-commande, `ezk-backlog version`, dit où en
est chaque version, vérifie qu'un lot tient debout, et sait la **clore** quand toutes ses fiches
sont livrées. Aucun nouvel objet, aucun nouveau skill : tout se calcule depuis le front-matter,
comme le board.

## Contexte

Trois échelles se confondent dans la méthode : la **fiche** (outillée : gate `ready`, groom), le
**sprint** (outillé : lot court, `0065`, `0090`), la **version** (le lot de livraison). Pour la
version, il n'y avait que le champ `version:` passif et `PLAN.md`. Aucun contrôle de cohérence du
lot : ce lot forme-t-il une version livrable ? une fiche n'a-t-elle rien à y faire ?

Voisines, à ne pas refaire : `0100` (sprint planning, santé du backlog), `20260812104022240`
(rationaliser le stock), `0055` (KPI jusqu'à la version), `20260823124042842` (vue du process).

## Décisions de cadrage (les « questions à méditer » tranchées)

- **Un objet « milestone » de premier ordre ?** Non. `version:` actif plus une sous-commande
  suffisent (ADR-0013 : pas de quatrième système scrum).
- **Commande dédiée ou extension de `review` ?** Une sous-commande dédiée, `version` : un script
  déterministe (ADR-0001). `review` l'appelle pour son bras mécanique, comme il appelle `reconcile`.
- **Même mécanique que le lot de sprint (`0065`) ?** Non. Le lot de sprint se **tire** ; le lot de
  version se **contrôle** puis se **clôt**. On réutilise la lecture des fiches, pas le mécanisme.
- **Qui porte « livrée » ?** L'étiquette git `vX.Y` : standard et réversible. L'état d'une version est
  **calculé** (fiches plus étiquette). Rien à tenir à la main, donc rien qui dérive.
- **Dans le POC ?** Le champ actif, le contrôle de lot, la clôture, l'écart avec `PLAN.md`. Le reste
  de la fiche absorbée (fusionner PLAN dans BACKLOG, historiser les itérations) va en « Suite ».

## Proposition : le POC en trois gestes

Un cœur pur `src/backlog/versions.ts` (déterministe, n'écrit rien) et un bord I/O
`bin/backlog-version.ts`, câblé `backlog:version` et `ezk backlog version`.

1. **`version`** (liste). Par version : fiches, livrées, à faire, prêtes, bloquées, intrus, **état**
   (`en cours`, `à clore`, `livrée`, `rouverte`). Un **intrus** est une fiche parkée qui porte
   pourtant une version : elle n'est pas dans le lot, mais elle est signalée. Les fiches **sans**
   version sont comptées et dites : rien n'est passé sous silence.
2. **`version check [<X>]`**. Erreurs (code 1) : `version:` illisible ; fiche **parkée** rangée dans une
   version ; version déjà livrée mais **rouverte** ; fiche que `PLAN.md` range dans une autre version ;
   section de `PLAN.md` qui cite deux versions. Alertes : fiche **bloquée** ; lot trop gros (plus de 15
   fiches à faire, calibrage provisoire, réglable par `--max`) ; fiche de la version absente de sa
   section du plan. Le rapport dit aussi ce qu'il **ne** contrôle **pas** : le séquencement, car le
   champ `depends:` n'est pas encore lu.
3. **`version close <X>`**. Refuse en listant ce qui reste (fiches à faire, erreurs du contrôle).
   Sinon déclare la version livrée et **propose** `git tag -a vX.Y` puis `git push origin vX.Y`, sans
   les exécuter. `--tag` crée l'étiquette **en local seulement** (réversible : `git tag -d`).

## Critères d'acceptation

- [x] Le loader lit `version:` (`Fiche.version`). Le format attendu est `V<n>.<n>`.
- [x] `version` liste les versions dans l'ordre naturel (V0.2 avant V0.10), avec compteurs et état, et
      dit combien de fiches actives n'ont pas de version (dont combien de parkées).
- [x] `version check` : chaque règle ci-dessus produit sa ligne, avec son **code** (`format`, `parkee`,
      `rouverte`, `bloquee`, `taille`, `plan-ecart`, `plan-absente`, `plan-ambigue`), la version et l'id.
      Code de sortie 1 s'il y a une erreur, 0 sinon.
- [x] Aucune fiche n'est perdue : chaque fiche lue tombe dans une catégorie (lot, parkée, terminale,
      sans version, illisible). Un test de conservation le prouve.
- [x] `version close <X>` refuse (code 1) tant qu'une fiche reste à livrer ou qu'une erreur de lot
      subsiste. Sinon il propose les deux commandes git sans rien exécuter ; `--tag` crée l'étiquette
      locale et ne pousse jamais.
- [x] `SKILL.md` d'`ezk-backlog` : sous-commande `version` (usage et détail), contrôle n°7 de `review`,
      `argument-hint` à jour. Manifeste `ezk` et script pnpm ajoutés.

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/backlog/__tests__/versions.test.ts
pnpm --dir products/mega-city backlog:version               # la liste : versions, états, fiches sans version
pnpm --dir products/mega-city backlog:version check V0.1    # vrai backlog : fiches parkées rangées en V0.1
pnpm --dir products/mega-city backlog:version close V0.3    # refus : la liste de ce qui reste
```

## Suite (hors POC)

- **Fusionner PLAN dans BACKLOG pour de bon** : produire le « train de versions » de `PLAN.md` depuis
  les fiches, puis retirer PLAN (volet A de la fiche absorbée).
- **Historiser les itérations** (sprint plus rétro) : volet B de la fiche absorbée, déjà porté par
  `20260930123438875` (cycle de vie sprint et session).
- **Séquencement** : lire `depends:`, puis vérifier qu'une version ne dépend pas d'une version plus tardive.
- **Fail-loud du parseur de PLAN lui-même** (`parsePlanOrder`, `parsePlanSections`) sur une section non
  tirable non déclarée (incident du 2026-09-24). Le POC ne le fait que pour le niveau version.
- Nom lisible des versions et message d'étiquette, lus depuis une déclaration unique.
- Afficher la version dans le board (colonne ou filtre, preuve avant/après).
- `review` : jugement LLM sur la complétude (manque-t-il une fiche ?).

## Notes / décisions

- Capturée en `idea` à la demande du PO (2026-08-24). `priority: P1` confirmée PO : structurante, au même
  titre que la rationalisation `20260812104022240`. Fiche-chapeau **autonome** (arbitré le 2026-08-24).
- **Cas daté du 2026-09-24** (rétro « versions plus config github »). En posant le niveau version à la
  main dans `PLAN.md`, `parsePlanOrder` et `parsePlanSections` ont **dégradé en silence** : un id est
  resté hors de la séquence tirable, une lane du board a été rendue à moitié. Leçon : l'intégration
  machine du niveau version doit **échouer franchement** sur l'ambigu. Le POC y répond par `format`,
  `plan-ecart`, `plan-absente` et `plan-ambigue`.
- Absorbe [`20260912180313727`](done/20260912180313727_repenser-backlog-plan-vs-backlog-iterations.md)
  (tri du 2026-09-30). Ses critères encore utiles : « la version d'une fiche est visible dans le
  BACKLOG » (déjà vrai : colonne `Version` de `regen-backlog.sh`), « plus de convention qui dérive »
  (gardes `plan-*`), « historique par itération » (en Suite).
- **Groom du 2026-10-01** : POC borné ci-dessus, le reste en Suite.
- **Livré le 2026-10-01** : `src/backlog/versions.ts` et `versions-render.ts` (cœur pur), `bin/backlog-version.ts`
  (`list`, `check`, `close`), loader (`Fiche.version`), `SKILL.md`, manifeste `ezk`. Sur le vrai backlog,
  `check` signale 4 fiches parkées rangées en V0.1 ; `close V0.1` refuse, `close V0.2` propose l'étiquette.
