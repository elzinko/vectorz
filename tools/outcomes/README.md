# tools/outcomes — mesureur d'outcomes nu (fiche 0044, MVP A)

Mesureur zéro-LLM, déterministe, hors de `products/mega-city` (transverse au
repo, hors de portée de la boucle capture qui modifie le catalogue).

## Modules

- `sources.ts` — port `RepoSource` + `GhGitSource` (adaptateur réel, `gh`/`git`
  via `execFileSync`, jamais de shell string concaténé) + `StubSource`
  (mémoire, zéro I/O — c'est celui que les tests utilisent).
- `metrics.ts` — fonctions **pures** : `tempsDeCycle`, `prSansRetouche`,
  `reprisePostMerge`. Aucune I/O.
- `ledger.ts` — writer unique, append-only, vers `.improvement/outcomes.jsonl`.
  Chemin **codé en dur**, jamais paramétrable → aucune écriture ne peut cibler
  `.supervision/`.
- `inventory.ts` — AC1, inventaire des données disponibles (lecture seule).
- `measure.ts` — orchestrateur : source → metrics → ledger + inventaire.

## Définitions opérationnelles — PROVISOIRES tant qu'ADR-030 n'est pas ratifié

Ces définitions sont des **seuils PO provisoires**, pas des invariants gelés.
Toute modification ultérieure passe par le panel + le PO (ADR-030).

- **« PR d'agent »** (`AGENT_BRANCH_PATTERN` dans `sources.ts`) : toute PR
  mergée dont la branche matche `^(claude|feat|fix|docs|chore|refactor)/`.
  Proxy faute de mieux — dans ce repo tout est produit par agents.
- **Point de handoff** (`findHandoffIndex` dans `metrics.ts`) : le dernier
  commit d'auteur `agent` dans la liste des commits d'une PR.
- **Classification auteur** (`classifyCommitMessage` dans `sources.ts`) : un
  commit est `agent` s'il porte le trailer `Co-authored-by: Claude …`, sinon
  **`unknown`** — **jamais `human`**. L'absence de trailer ne prouve PAS un auteur
  humain : dans ce repo tout est produit par agents, l'identité git est unique
  (`Thomas Couderc`, test boundary 0176) et le trailer n'est pas systématique
  (des commits d'agent en sont dépourvus). Il n'existe **aucun signal git natif**
  fiable ; c'est un **constat d'inventaire** (AC1), pas une lacune corrigeable ici.
- **« PR sans retouche »** (`prSansRetouche`) → `boolean | null`, **jamais `false`** :
  - `true` = rien de substantiel après le dernier commit agent (rebase, formatage
    et merge exclus) ;
  - `null` = **indéterminable** — aucun commit agent identifié, OU des commits
    substantiels d'auteur `unknown` suivent le handoff (on ne peut pas confirmer
    une retouche *humaine* faute de signal). Renvoyer `false` serait mentir.
- **N — taille de la baseline** (`DEFAULT_BASELINE_SIZE` dans `measure.ts`) :
  **30** PRs d'agents mergées les plus récentes. Seuil PO provisoire.
- **X — fenêtre de reprise post-merge** (`REPRISE_WINDOW_DAYS` dans
  `metrics.ts`) : **3 jours**. Un correctif sur les mêmes fichiers OU la même
  fiche sous cette fenêtre requalifie le cas comme reproduit
  (`reprisePostMerge`). Seuil PO provisoire.
- **`temps_de_cycle`** (`tempsDeCycle`) : jours entre le front-matter `created`
  d'une fiche et son **ship**, ce dernier approché **côté git** par la date du
  commit qui a **ajouté** la fiche à `features/done/` (`git log --diff-filter=A`),
  et NON le dernier commit qui l'a touchée — une édition post-ship (refactor de
  layout, correction de doc) gonflerait le cycle. `ficheMergedAt` dans `sources.ts`,
  aucun appel réseau. Proxy provisoire.
- **Reclassification persistée** (`eventKey` dans `ledger.ts`) : la clé de dédup
  inclut la **valeur des métriques** (hors `ts`). Une re-mesure à état constant
  reste idempotente (AC6), mais un changement d'outcome (ex. `reprise` `false→true`
  quand un correctif merge après coup) s'append — le **dernier** event d'un sujet
  fait foi. **Limite connue** : l'émission ne couvre que les N derniers ; une PR
  sortie de la fenêtre avant que son correctif soit mesuré n'est pas reclassée
  (suivi persistant = chien de garde déporté, fiche gated ADR-030).
- **id de fiche depuis la branche** (`ficheIdFromBranch` dans `sources.ts`) :
  extrait de `headRefName` selon la convention `feat/<id>-<slug>` (ADR-0018 ;
  id 4 ou 17 chiffres). Alimente la requalification `reprisePostMerge` par
  « même fiche », pas seulement « mêmes fichiers ».
- **Ordre de baseline** : le port `RepoSource` **ne garantit aucun tri**
  (`StubSource` et `gh pr list` ordonnent à l'inverse) ; `measure()` est
  ordre-**indépendant** — il compare chaque PR à toutes les autres et laisse
  `reprisePostMerge` filtrer la direction (`deltaDays >= 0`).
- **Conformité des runs `.supervision`** (`listSupervisionRuns`) : **placeholder
  assumé** — présence détectée en lecture seule, `conforms: true` non vérifié.
  La validation réelle du schéma relève d'une surface gelée (fiche gated ADR-030).
- **Transport `.improvement/outcomes.jsonl`** : format d'event et dossier
  **PROVISOIRES** (ADR-030 Décision A2 non tranchée) — ne jamais les présenter
  comme gelés. Le fichier est **gitignoré** (donnée runtime régénérable).

## Hors scope de ce sprint (déporté, gated ADR-030)

Script d'append validateur noyau, miroir tamper-évident hors arbre, chien de
garde calendaire, verdicts `verified|retired` mécaniques, second fichier
`lifecycle.jsonl`, mécanisme de preuve externe. Voir la fiche
`20260813131259846_ameliorabilite-surfaces-gelees-gated-adr030.md`.

## Usage

Point d'entrée exécutable (`cli.ts`, résout la racine via `git rev-parse`) :

```bash
pnpm outcomes:measure
```

Produit l'inventaire (AC1) puis la baseline `.improvement/outcomes.jsonl` (AC2,
append-only, idempotent) et imprime `{ inventory, ledger }`. La baseline **sur-scanne**
puis filtre les PRs d'agents avant de tronquer à N (`DEFAULT_BASELINE_SIZE`), pour
renvoyer réellement « les N dernières PRs d'agents » même quand des PRs non-agent
s'intercalent.

En bibliothèque : `measure(new GhGitSource(root), root, { baselineSize })`.
