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
- **Classification auteur agent/humain** (`classifyCommitMessage` dans
  `sources.ts`) : un commit est `agent` s'il porte le trailer
  `Co-authored-by: Claude …` (convention effective des commits de ce repo).
  Limite connue et documentée : tous les commits locaux de ce repo partagent
  la même identité git (`Thomas Couderc`, cf. test boundary 0176) — il n'existe
  **aucun signal git natif** distinguant auteur agent/humain ; le trailer est
  le seul proxy disponible.
- **« PR sans retouche »** (`prSansRetouche`) : aucun commit post-handoff
  substantiel, où *substantiel* exclut explicitement les commits de **rebase**,
  de **formatage**, et les **commits de merge**.
- **N — taille de la baseline** (`DEFAULT_BASELINE_SIZE` dans `measure.ts`) :
  **30** PRs d'agents mergées les plus récentes. Seuil PO provisoire.
- **X — fenêtre de reprise post-merge** (`REPRISE_WINDOW_DAYS` dans
  `metrics.ts`) : **3 jours**. Un correctif sur les mêmes fichiers OU la même
  fiche sous cette fenêtre requalifie le cas comme reproduit
  (`reprisePostMerge`). Seuil PO provisoire.
- **Transport `.improvement/outcomes.jsonl`** : format d'event et dossier
  **PROVISOIRES** (ADR-030 Décision A2 non tranchée) — ne jamais les présenter
  comme gelés.

## Hors scope de ce sprint (déporté, gated ADR-030)

Script d'append validateur noyau, miroir tamper-évident hors arbre, chien de
garde calendaire, verdicts `verified|retired` mécaniques, second fichier
`lifecycle.jsonl`, mécanisme de preuve externe. Voir la fiche
`20260813131259846_ameliorabilite-surfaces-gelees-gated-adr030.md`.

## Usage (POC)

```ts
import { GhGitSource } from './sources.js';
import { measure } from './measure.js';

const source = new GhGitSource(process.cwd());
const result = measure(source, process.cwd());
console.log(result.inventory);
console.log(`${result.ledger.written} events écrits, ${result.ledger.skippedDuplicates} doublons ignorés`);
```
