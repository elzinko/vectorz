> 🗎 Rendu de la fiche [features/20261102182259592_carnet-mission-control-premiere-app-mesure.md](../done/20261102182259592_carnet-mission-control-premiere-app-mesure.md)

# 20261102182259592 — Tenir le carnet de tests de mission control, et mesurer s'il sert

**En clair.** C'est le premier vrai usage du carnet, sur mission control, l'app que le PO utilise
tous les jours. On écrit l'arbre de ses 12 vues et de leurs actions. Le scout y fait des passes avec
navigateur, et ses captures vont au carnet. Après trois passes, on décide sur des chiffres si l'outil
reste.

**Si tu arrives frais.** Mission control est l'interface web de cop1
(`products/cop1/packages/web`). Le carnet note ce qui est testé :
[20261102182259416](../done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md). Le scout s'en
sert : [20261102182259505](../done/20261102182259505_scout-lit-et-remplit-le-carnet.md).

## Contexte / Problème

Mission control n'a pas de routeur. Ses vues sont une liste dans le code
(`products/cop1/packages/web/src/board/Board.tsx:34-43`). L'arbre doit donc s'écrire à la main, et il
peut dériver quand une vue s'ajoute. La passe du scout du 2026-11-02 n'utilisait que des requêtes
HTTP (`docs/sessions/2026-11-02-scout-sprint5-mission-control.md:13`) : l'axe visuel n'a jamais été
testé.

Le panel du 2026-11-02 a demandé une preuve de valeur avant d'aller plus loin. Cette fiche la produit.

## Proposition

- **L'arbre de mission control** : ses 12 vues, et les actions visibles de chacune.
- **Un garde-fou de dérive** : un test compare l'arbre déclaré aux vues de `ViewId`.
- **Des passes avec navigateur**, par l'option `--ui` du scout. Cette option vaut l'accord du PO
  qu'exige la règle `development/playwright-mcp-usage`. Les captures sont copiées au carnet.
- **La mesure de valeur**, écrite dans cette fiche après chaque passe.

## Critères d'acceptation

- [x] L'arbre de mission control déclare ses 12 vues et les actions visibles de chacune.
- [x] Un test échoue si une vue de `ViewId` manque à l'arbre déclaré.
- [x] Une passe `--ui` du scout remplit l'axe visuel d'au moins une vue, avec sa capture copiée au
      carnet.
- [x] La première passe est notée dans cette fiche : « X sur Y » avant et après, et les défauts
      trouvés sur des nœuds jamais testés.

**Mesure de suivi** — sur les 3 premières passes du scout sur mission control :

- chaque passe part de la liste « à tester » du carnet ;
- « X sur Y testés » monte à chaque passe ;
- au moins un défaut est trouvé sur un nœud jamais testé ;
- quand le PO consulte, moins de la moitié des nœuds sont expirés.

Deux échecs sur ces quatre points, et on retire l'outil. La décision « on garde » ou « on retire »
s'écrit dans cette fiche.

## Comment vérifier

1. `ezk carto status --todo` sur mission control liste ses 12 vues.
2. Retirer une vue de l'arbre déclaré : le test de dérive échoue.
3. Lancer `/ezk-scout run mission-control --ui`, puis `ezk carto status` : au moins une vue a un état
   visuel avec sa capture.

```bash
pnpm --dir products/cop1/packages/web test
```

## Première passe — 2026-11-03

En clair : la passe a ouvert les 12 vues et joué 10 actions sans écriture. Tout marche, sans erreur
console. Elle a trouvé un défaut mineur sur un nœud jamais testé, et elle en a écarté un faux.

- **Avant** : 0 sur 70 testés. **Après** : 19 sur 70 testés.
- **Notés** : les 12 vues sur l'axe visuel, 7 actions sur l'axe fonctionnel, sur le SHA de la branche.
- **Défaut trouvé** en ouvrant la vue d'ensemble, jamais testée : l'en-tête, commun à tous les écrans,
  s'appelle encore « board v0.17.0 », pas « mission control ». La vue elle-même s'affiche bien. Brouillon B1 du rapport, proposé pour enrichir
  [Réécrire les guides de l'ancien écran de supervision](../done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md).
- **Faux défaut écarté** : la Chronologie semblait vide. Le banc lisait la branche, qui n'a pas de
  dossier de runs ; sur le dépôt principal, le même code trouve 3 chantiers. La note d'échec a été
  retirée du carnet.
- **Non sondé** : poser un pouce, lancer une session, changer un réglage. Ces actions écrivent dans le
  dépôt.
- **Preuves** : [avant](../../docs/pr-evidence/20261102182259592/carnet-avant.txt),
  [après](../../docs/pr-evidence/20261102182259592/carnet-apres.txt),
  [planche des 12 vues](../../docs/pr-evidence/20261102182259592/planche-12-vues.jpg),
  [rapport du scout](../../docs/pr-evidence/20261102182259592/rapport-scout.md).

**Leçon pour les passes suivantes** : le banc doit lire un dépôt qui a des runs. Sinon la
Chronologie et le Développement paraissent vides à tort.

## Notes / décisions

- **Née du découpage** de
  [Carte de l'app et suivi de ce qui est testé](../done/20261014113049954_cache-cartographie-app.md), le
  2026-11-02.
- **Choix de l'app** (décision PO du 2026-11-02) : le PO s'en sert chaque jour, et une passe y a
  trouvé six défauts le 2026-11-02.
- **Estimation du panel** : environ 200 000 à 250 000 jetons. La passe avec navigateur coûte cher.
- **Groom du 2026-11-03 (run autonome)** : mission control a désormais 12 vues (`ViewId` de
  `products/cop1/packages/web/src/board/Board.tsx`) : tous les projets, vue d'ensemble, pilotage,
  cadrage, développement, fiches, chronologie, configuration, process, loi, cartes, réglages de
  l'outil. L'arbre se déclare dans `.vectorz/carto/mission-control.yml`, rangé sous `carto.trees` de
  `.vectorz/config.yml` ; le test de dérive vit dans la suite web et lit ce fichier. La première passe
  `--ui` se fait avec le navigateur de la session, sur une copie de mission control lancée depuis la
  branche ; ses captures vont au carnet par `ezk carto record --proof`.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO sous deux conditions : la
  fiche du scout livrée avant ; l'accord pour la passe avec navigateur vient de la décision PO du
  2026-11-02, citée au journal). La mesure de suivi sur trois passes reste hors des critères de la
  story. Coupe si le build déborde : l'arbre et le test de dérive d'abord, la passe `--ui` ensuite.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2261 tests 198 suites |
| Tests web mission control | ✅ 151 tests dont le test de dérive |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | N.A. — aucun changement visible ; planche des 12 vues dans docs/pr-evidence/20261102182259592 |
