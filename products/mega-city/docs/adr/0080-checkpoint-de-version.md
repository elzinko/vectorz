# 0080 — Checkpoint de version : deux gates calculées, surface par STOP de boucle, tag honnête par report-hors

- Statut : **proposé** — panel adverse du 2026-10-16 (architecte, dev implémenteur, scrum-juge) : **GO
  unanime avec amendements** ; modèle tranché par le PO, arbitrages ratifiés le 2026-10-16.
- Date : 2026-10-16
- Déciders : PO (Thomas) + panel adverse
- Compose / précise : [0070](0070-le-tirage-reste-dans-la-version-en-cours.md) (le tirage reste dans la
  version), [0069](0069-etape-process-calculee-par-jointure.md) (l'étape se calcule, zéro objet
  persistant), [0065](0065-contrat-du-bus-des-moments.md) (contrat du bus), [0001](0001-monorepo-composable-coeur-deterministe.md)
  (le script range, le LLM juge). Garde-fou ADR-0013 (anti-surproduction de méta-outillage). DoR : ADR-0016.
- Fiche : [La version est un checkpoint du run](../../../../features/done/20261015125606808_frontiere-version-checkpoint-run-autonome.md).

## En clair

Une version est un **checkpoint** du run, à deux bords. À l'**entrée**, on ne lance les sprints que si
le lot est **lançable** (toutes les fiches prêtes, ou groomables au fil de l'eau). À la **sortie**, on
ne **scelle** (pose l'étiquette) que si chaque fiche est **livrée ou sortie du lot**. Les deux verdicts
se **calculent** sur les fiches existantes : aucun objet neuf, aucun nouveau canal de bus, aucun graphe
de dépendances. Une fiche bloquée à la frontière **sort** de la version — on lui propose une autre
version si possible, sinon on la parke — pour que le tag ne couvre que le **livré**.

## Contexte

Le run autonome (`ezk-product-build --mode auto`) franchit aujourd'hui les deux bords d'une version **en
silence** : il démarre sans vérifier que le lot est prêt, et il s'arrête **muet** à la frontière quand
il a construit tout le constructible (ADR-0070 bloque la version suivante tant que la courante n'est pas
scellée). Le PO a tranché le **modèle** (une version = un checkpoint à deux gates, le sceau reste un
geste de release) ; ce document grave le **mécanisme**, validé en panel.

Briques existantes, à composer : `buildVersions` (état par lot : shipped/todo/ready/blocked/intruders),
`runDisposition` (disposition par fiche : build/groom/escalate/defer), `blockedType` (raison typée de
blocage), `closeVersion` (refuse si todo>0), `versionScope` (version en cours), `park` (sort une fiche
de sa version, réversible).

## Décision

1. **Une brique pure neuve `src/backlog/version-checkpoint.ts`** (ADR-0003/0069 : pur, tout se calcule,
   zéro objet persistant), deux verdicts lecture seule dérivés de `buildVersions` :
   - `launch(lot, scope)` — agrège `runDisposition` sur le lot → « lançable : N prêtes, M à groomer,
     K à escalader ». Un **verdict**, pas un barrage.
   - `seal(lot)` — partitionne les fiches **non livrées** par leur **raison typée de blocage** → la
     table « fiche → raison → décision attendue ». `closeVersion` **délègue** sa question « scellable ? »
     à `seal()` : une seule source de vérité.
2. **Un verbe neuf `ezk backlog version ready <v>`** pour l'entrée ; `check` et `close` restent intacts
   (trois verbes, trois responsabilités : *bien formé* / *lançable* / *scellable + tag*). On n'étend pas
   `check` : lui souder « lançable » ferait refuser `closeVersion` sur une idée-en-lot (effet de bord).
3. **Faire surface = un STOP dans la boucle** `ezk-product-build` (le checkpoint existant : en manuel →
   STOP humain ; en auto → `ezk-pm` ou pré-autorisation `--seal-versions`/`--versions`). Le **bus
   observe** : on émet les **événements existants** `gate.reached` (entrée) et `version.closed` (sceau,
   qui gagne son premier émetteur). **Aucun moment neuf** : un événement annonce et continue, il n'attend
   pas (ADR-0065) ; « la méthode possède le quand ».
4. **Tag honnête = report-hors.** Une fiche bloquée à la frontière **sort** de la version : on lui
   **propose une autre version** si une cible existe, **sinon on la parke** (réversible, journalisée). On
   **rejette** le drapeau « différée, en place » : il ferait mentir le tag et imposerait un sous-état que
   chaque vue dérivée devrait apprendre à exclure (anti-ADR-0069). Le tag ne couvre que le livré.
5. **Dépendances = un signal, pas un graphe.** Il n'existe aucun champ de dépendance inter-fiches. « Sans
   casser le plan » se vérifie par l'**ordre du plan + la borne de version** (ADR-0070) et le `milestone:`
   (fiches couplées) : un report est « propre » si, après lui, `check` reste vert **et** aucune sœur de
   même `milestone` ne reste dans la version. Au-delà → on **surface** au PO, on ne cascade pas en silence.
6. **Défaut sans drapeau = s'arrêter-et-demander** (jamais muet) : réutiliser la forme du message
   fin-de-scope d'ADR-0070, enrichie de la table raison/décision.
7. **Anti-Goodhart.** Seule la raison « concurrence / budget » se résout seule (retry). **Toute autre
   raison escalade** (humain / `ezk-pm`). Le **push reste un des 4 STOP**. Le bilan de sceau est **à
   compte honnête** : « livré N / reporté M / parké K », M et K itemisés — jamais « N, propre ».
8. **Anti-waterfall.** La gate d'entrée reste **verdict + groom progressif**, jamais un gel « 100 % prêt
   avant le premier sprint » (ADR-0016 : on groome au tirage ; flux kanban).
9. **Pas d'extension du modèle de process ni du graphe maintenant** (ADR-0069 tranche 2 close, garde
   ADR-0013). Seule concession : un `gate_id` stable (`version.launch` / `version.seal`), une valeur dans
   un champ existant. Suite non bloquante : au ship, ajouter l'élément « checkpoint de version » à
   `method/ceremonies.yml` (il n'a aucun élément « version » — sinon la carte ment un cran de plus).

## Conséquences

- (+) Mécanisme par **composition** : rayon de souffle minuscule (une brique pure, un verbe, un point
  d'insertion ; un bin + un test touchés). Le tag honnête **tombe gratis** du cœur existant (report-hors
  retire la fiche du lot). Modèle propre : un seul axe `version:`, aucun sous-état parallèle.
- (−) En auto, la gate de sortie **écrit** (le report-hors via `park` déclenche regen + commit) : à
  cadrer avec les 4 STOP — ce n'est plus strictement lecture seule à cet instant.
- (−) Le verdict d'entrée dépend de `versionScope.current`, qui lit des **étiquettes locales** : une
  version dé-taguée en local redevient « lançable » (voir Points ouverts).

## Points ouverts (à trancher à l'implémentation, non bloquants)

- **`current` sur tags locaux.** Un tag retiré en local rouvre une version « lançable » (déjà « à
  confirmer PO » dans ADR-0070). Faut-il une confirmation explicite avant de re-lancer une version
  taguée-puis-dé-taguée ?
- **But de version (release goal).** Une version porte-t-elle un objectif explicite ? Le modèle n'a ni
  Product Goal ni Sprint Goal réels. Décision **produit**, séparée du mécanisme, différée.

## Alternatives écartées

- **Un moment de bus « décision » (commande/avis)** pour la frontière — casse ADR-0065 (un événement
  n'attend pas) ; la décision est un STOP de boucle, le bus n'en est que l'écho.
- **Garder une fiche bloquée dans la version scellée** (drapeau « différée, en place ») — fait mentir le
  tag, réintroduit un état parallèle à `version:` (anti-ADR-0069), fragile à chaque vue dérivée.
- **Étendre `check` pour refuser une idée-en-lot** — `closeVersion` tire les erreurs de `check`, donc ça
  le ferait refuser à tort.
- **Un vrai graphe de dépendances inter-fiches** — sur-construction sans preuve d'usage (ADR-0013) ;
  fiche dédiée si le besoin se prouve.
