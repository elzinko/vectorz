# ADR 0020 — une capacité partagée devient une brique autonome, jamais un chapitre d'orchestrateur (amende ADR-0009 §2)

- Statut : **proposé**
- Date : 2026-07-26
- Amende : [ADR-0009 §2](0009-ezk-pr-pilot-orchestrateur-validation-prs.md) · Fiche : [0099](../features/0099-ezk-testbed-brique-boot-env-test.md)

## Contexte

Le besoin « démarrer un environnement de test isolé, avec un état de départ maîtrisé » est
arrivé par une demande **PR-centrée** (samplerz, fiche P0 `pr_local_stack_testable`), et sa
recommandation de grooming était d'**étendre `ezk-pr-pilot`**. L'inventaire du 2026-07-26
montre autre chose :

1. **Quatre rôles** de la méthode ont ce besoin, pas un : `ezk-pr-pilot run` (« démarre les
   bancs »), `ezk-preview` cas B (qui **devine** le port : 3000 / 5173 / 8080 / 4321 / 8000),
   `ezk-sprint` étape 6 via `ezk-qa`, et `verify`/`run`.
2. **Le terrain a déjà généralisé** : city-guided a écrit `scripts/preview-pr.sh` pour les
   PRs, puis l'a étendu aux branches de lui-même (`PREVIEW_ENTRY=pr|branch` ×
   `PREVIEW_MODE=node|docker`). Deux axes — **cible** et **recette** — sans guidance.
3. **`ezk-pr-pilot` est un orchestrateur de stock, et c'est gravé mécaniquement** :
   `src/__tests__/profiles-sync.test.ts:44` l'exclut de `cop1-target` au titre des
   orchestrateurs (doctrine « deux chefs dans la même session »). Y loger la capacité
   signifie que « démarre l'env de cette branche » — sans aucune PR — oblige à charger un
   chef de stock.
4. **Doctrine PO (2026-07-26)** : les skills sont des **briques autonomes composables**,
   utilisables **hors** de la méthode mega-city. Une capacité accessible uniquement via un
   orchestrateur n'est pas une brique : c'est un bundle déguisé.

ADR-0009 §2 avait tranché « **un seul** nouveau skill pour la consommation » — arbitrage
juste **à son échelle** (écrire vs consommer des PRs), qui ne couvrait pas une capacité
partagée par quatre rôles.

## Décision

1. **Règle de découpage.** Une **capacité** sollicitée par **≥ 2 rôles** ne vit pas dans un
   orchestrateur : elle devient une **brique autonome** que les rôles **composent**. Un
   orchestrateur peut posséder une **convention** (ADR-0009 : la convention « Validation »
   reste à `ezk-pr-pilot`) ; il ne possède pas une capacité que d'autres consomment.
2. **Test d'autonomie (critère d'acceptation, pas intention).** Une brique doit fonctionner
   dans un repo où **aucun autre skill ezk n'est installé**. Si sa valeur exige un
   orchestrateur, ce n'est pas une brique.
3. **Application immédiate** : `ezk-testbed` (fiche 0099) — `init` / `check` / `start` /
   `stop` / `list`, cibles `pr <n>` · `branch <nom>` · `local`, recette choisie **par le
   projet**. `ezk-pr-pilot` gagne **une ligne** de délégation et **aucune** logique de boot ;
   `ezk-preview` **retire** son heuristique de port et délègue.
4. **Le projet déclare, la méthode lit** — 4 slots (`start`, `stop`, état de départ,
   périmètre d'isolation). La politique d'état de départ est **projet-locale** ; la méthode
   n'impose que l'obligation de la déclarer (« sans objet » explicite est une réponse
   valide). Aucun nouveau format de config : la déclaration épouse l'interface de commandes
   existante (règle **MUST** `development/use-project-scripts`).

## Options considérées

- **A. Renommer `ezk-pr-pilot` → `ezk-pr` et y loger le contrat** — rejetée : ~12 fichiers
  plus une liste figée (`expand.test.ts`) pour zéro changement de comportement, et la
  capacité reste captive d'un orchestrateur (viole §2 du test d'autonomie).
- **B′. Split en deux temps** (contrat hébergé provisoirement par `ezk-pr-pilot`, extraction
  ultérieure sur preuve) — rejetée : construit délibérément la mauvaise forme pour la
  défaire ensuite, et coûte **plus** de prose dans l'orchestrateur que la délégation directe.
- **C. Statu quo** — rejetée : deux projets sur trois ont écrit l'adaptateur à la main,
  séparément ; le besoin est de méthode, pas de projet.
- **D. Loger la capacité dans `ezk-docker` ou `ezk-preview`** — rejetée : docker n'est
  **qu'une recette** (un projet en mode node n'a pas à le charger) ; `ezk-preview` a un
  autre métier (exposer vers l'extérieur, avec ses règles de sécurité sur les credentials)
  et deviendrait une brique grasse.

## Conséquences

**Plus facile** — utiliser une brique seule, hors méthode ; retirer de la prose qui devine
(`ezk-preview`) ; décrire un banc de test dans n'importe quel repo sans imposer sa stack.

**Plus dur** — un skill de plus au catalogue (19) et au profil `global` ; la discipline de
frontière doit être re-tenue à chaque ajout (le test d'autonomie §2 est là pour ça).

**À surveiller** — la composition `ezk-pr-pilot → ezk-testbed` reste **en prose** tant que
`composes:` (ADR-0012, **proposé** ; fiche 0044 `todo`) n'est pas implémenté : un profil peut
binder l'un sans l'autre sans erreur. La doctrine « briques autonomes **composables** » rend
0044 nettement plus utile — c'est son déclencheur naturel.
