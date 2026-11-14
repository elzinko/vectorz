---
id: "20261114131612388"
title: "L'émetteur nomme la session et dérive la clé de chantier de la milestone"
type: bug
priority: P1
product: mega-city
milestone: board
version:
labels: [supervision, contrat, theme:mission-control]
status: idea
blocked:
pr:
evidence: none # journal de supervision et contrat, aucun écran modifié
created: 2026-11-14
---

# 20261114131612388 — L'émetteur nomme la session et dérive la clé de chantier de la milestone

**En clair.** Sur les pages Sessions, Sprint et Session de mission control, une session s'affiche
comme un identifiant illisible, et 69 lancements sur 72 n'apparaissent pas du tout. La méthode
connaît pourtant la branche et l'objectif de chaque lancement ; elle ne les écrit pas dans le
journal que l'écran lit. On les écrit : l'écran montre le nom de la branche et retrouve tous les
lancements.

**Si tu arrives frais.** Le journal de supervision est le fichier d'évènements qu'un lancement
(`run`) de la méthode écrit sous `.supervision/runs/` ; l'émetteur est le code qui l'écrit. La clé
de chantier est l'étiquette qui regroupe les lancements d'un même travail : un objectif
(`milestone`) ou une version. Mission control lit ce journal par le lecteur de cop1 (ADR-079).

## Contexte / Problème

Ce que l'écran attend. La maquette nomme une session par sa branche et range chaque lancement sous
son chantier. C'est le modèle décidé par
[Board : runs et sessions concurrents](done/20261014122044421_board-runs-concurrents-identite-lisible.md)
et par l'[ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D1 : une session
est attachée à un worktree et à une branche.

Ce que l'écran montre aujourd'hui : un UUID à la place du nom de la session, et une chronologie
vide pour 69 lancements sur 72. Il devrait montrer le nom de la branche, et tous les lancements.

Symptôme 1 : la session n'a pas de nom dans le journal.

- L'émetteur n'écrit jamais `session.started`. `runStart` n'émet que `run.started` (method, seat,
  chantier, params) : `products/mega-city/src/supervision/runtime.ts:313-319`. Aucun `session.*`
  n'existe dans `products/mega-city/src/supervision` (grep du 14 novembre).
- La branche est pourtant résolue (`resolveSessionIdentity`, `src/supervision/session-identity.ts:62-80`),
  mais seulement rangée dans `.supervision/session.json`, jamais dans le journal.
- Le lecteur est prêt. Dans cop1, `packages/journal-validator/src/reduceState.ts:19-24` connaît les
  types `session.*`, `projectChantier.ts:77-80` lit `payload.branch` de `session.started`, et
  `packages/app/src/features/board/chantierAdapter.ts:185-189` retombe sur l'UUID (`s.branch ?? s.sessionId`).
- Compté le 14 novembre sur les 72 journaux du checkout principal : 0 `session.started`.

Symptôme 2 : la clé de chantier ne se dérive pas de la milestone seule.

- `run_start` accepte `version` et `milestone` (`src/supervision/mcp-server.ts:70-71`) ; l'émetteur
  dérive `chantier` et le pose dans `run.started` (`runtime.ts:124-129`, `311-316`). Les compétences
  émettrices ont la consigne de les passer (`skills/ezk-sprint/SKILL.md:333-338`, `skills/ezk-product-build/SKILL.md:546-549`).
- Mais `deriveChantierKey` rend `undefined` dès que `version` est vide (`runtime.ts:126-127`) : la
  milestone seule est ignorée. Depuis l'[ADR-0083](../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md),
  les fiches n'ont plus de `version:` à la préparation : un lancement par milestone n'a plus de clé.
- Compté : 72 `run.started`, 3 avec `chantier` (`exploration-app:v0.23.0`, `board:v0.23.0`,
  `board:v0.24.0`), 69 sans.
- Le lecteur cop1 écarte tout lancement sans clé (`projectChantier.ts:66-68` rend `undefined`) :
  ces 69 lancements sont invisibles, pas seulement anonymes.

Piège lourd. Sans `SUPERVISION_MULTI_SESSION`, `src/supervision/project-root.ts:166-182` normalise
la racine vers le checkout principal. Les 72 journaux y sont ; aucun worktree n'a de `.supervision/`
(vérifié le 14 novembre). `resolveSessionIdentity` lit alors le HEAD du principal : son `session.json`
dit `branch: main`, un seul `session_id` pour tous. Un `session.started{branch}` tel quel dirait « main » partout.

La branche est déjà publiée ailleurs : `ezk board process --json` donne `session {path, branch}` par
fiche active (`contracts/board-process/v1/schema.json:76-98`, `src/core/process-data.ts:80-81`).

Fiches livrées dont cette fiche est le reliquat :

- [Émetteur T2 : l'identité de session](done/20261015133600314_emetteur-identite-de-session.md)
  — proposait `session.started` best-effort (l. 38) ; les critères ne le couvrent pas.
- [Émetteur T1 : contrat @0.2 + journal par worktree](done/20261015133600298_emetteur-contrat-v02-journal-par-worktree.md)
  et la [fiche découpée](done/20261015082118340_emetteur-identite-session-cle-chantier-contrat-v02.md) (l. 48) — le contrat et le lecteur acceptent le type ; l'émetteur ne l'écrit pas.
- [Émetteur T3 : la clé de chantier](done/20261015133600328_emetteur-cle-de-chantier.md) et
  [Les skills émetteurs tamponnent la clé de chantier](done/20261026095125469_skills-tamponnent-cle-chantier-run-start.md) — la clé existe, seulement quand une version existe.
- [Board : read-model chantier → sessions → évènements](done/20261015082118353_board-read-model-chantier-sessions-evenements.md)
  — l'exclusion des lancements sans clé y est une règle (ADR-079 §D8) ; [Board web : les runs réels](done/20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md) l'assume (l. 54).

## Proposition

1. **Nommer la session.** Au premier `run_start` d'une session (`session.json` créé, ou relu sans
   `session.started` déjà écrit), l'émetteur ajoute `session.started{branch}` juste après
   `run.started`, qui reste la première ligne. Aucun `session.*` pendant un jalon ouvert.
   `session.finished` reste hors périmètre : le board infère la fin (ADR-079 §D6). Aucun changement
   de contrat : `cop1/supervisability@0.2` porte déjà le type (ADR-079 §D7).
2. **Dériver la clé de la milestone.** `deriveChantierKey('', 'board')` rend `board` ; la clé est
   absente seulement sans milestone ni version. Recommandation : la milestone est la clé, la version
   voyage comme attribut de `run.started` ; sinon deux lancements d'une même milestone, l'un avec
   version et l'autre sans, font deux chantiers. La forme finale est une décision du PO (voir Notes).
3. **Les compétences émettrices passent la milestone** du lot, même sans version sur les fiches. Le
   test-garde (`src/supervision/__tests__/skill-emission-contract.test.ts:161-178`) s'étend à ce cas.
4. **La branche est celle du worktree.** Prérequis à discuter, deux voies, non tranchées ici :
   activer le journal par worktree (ADR-079 §D5, `SUPERVISION_MULTI_SESSION`), ou résoudre la
   branche depuis le dossier appelant même quand le journal reste normalisé vers le principal.
5. **Repli.** Une session active sans lancement se nomme par `board process`, déjà publié.

Hors périmètre, fiche sœur côté cop1 à créer au grooming : le lecteur range un lancement sans clé
sous une clé « sans chantier » visible, et affiche la branche à la place de l'UUID
(`chantierAdapter.labelFor`). Les deux volets se construisent dans le même sprint : même `runStart`.

## Critères d'acceptation

- [ ] Au premier `run_start` d'une session, le journal porte `session.started{branch}` juste après
  `run.started`, qui reste la première ligne ; aucun `session.*` n'est écrit pendant un jalon ouvert.
- [ ] La branche émise est celle du worktree de la session : deux worktrees lancés côte à côte
  donnent deux branches et deux `session_id` distincts, jamais « main » pour tous.
- [ ] La clé de chantier se dérive de la milestone seule ; deux lancements d'une même milestone
  portent la même clé, avec ou sans version ; la clé est absente seulement sans milestone ni version.
- [ ] Chaque compétence émettrice passe la milestone du lot à `run_start`, même sans version.
- [ ] Le validateur cop1 ne lève ni notice ni violation sur un journal réel qui porte ces évènements
  (fixture `contrat-0.2-session` étendue).
- [ ] Sur vectorz, le prochain sprint lancé par `ezk-sprint start` écrit un `run.started` avec
  `chantier` et un `session.started` avec la branche du worktree.
- [ ] ADR-079 §D2 et ADR-084 G5 portent une ligne d'amendement : la clé se construit depuis la
  milestone ; la version la précise quand elle existe.

**Mesure de suivi** — sur les cinq lancements suivants, cinq ont une clé et un nom de branche ; la
chronologie de mission control les montre tous.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
pnpm --dir products/mega-city test -- src/supervision/__tests__/runtime.test.ts \
  src/supervision/__tests__/session-identity.test.ts src/supervision/__tests__/project-root.test.ts \
  src/supervision/__tests__/skill-emission-contract.test.ts
pnpm --dir products/cop1/packages/journal-validator test -- src/projectChantier.test.ts src/validateRun.test.ts
J="$(ls -t "$ROOT"/.supervision/runs/*/events.jsonl | head -1)"    # ou <worktree>/.supervision/ en mode par worktree
sed -n '1,2p' "$J" | jq -c '{type, chantier: .payload.chantier, branch: .payload.branch}'
cat "$ROOT"/.supervision/runs/*/events.jsonl | grep -c '"session.started"'    # > 0 ; aujourd'hui 0
```

## Glossaire

- `lancement` (`run`) — une exécution de la méthode qui écrit un journal ; le mot de l'écran.
- `clé de chantier` — l'étiquette posée dans `run.started` qui regroupe les lancements d'un même travail.
- `worktree` — un dossier de travail git sur une branche ; une session en occupe un.
- `jalon` — un point d'arrêt du lancement (`gate_reached`) où la méthode attend un geste.
- `compétence` (`skill`) — un savoir-faire de la méthode joué par un agent ; `ezk-sprint` en est une.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écarts A2 et A3, portés ensemble (même `runStart`, même lecteur, même lancement de preuve).
- Type bug : la donnée existe (branche, milestone), elle n'est pas émise ; le lecteur l'attend déjà.
- Décision attendue du PO : la forme de la clé, milestone seule (recommandée) ou `milestone:version`
  avec règle de fusion ; elle amende l'ADR-079 §D2 et l'[ADR-084](../docs/adr/ADR-084-surface-emission-declaree-et-moments.md) G5.
- Prérequis à discuter : journal par worktree (ADR-079 §D5) ou branche résolue depuis le dossier
  appelant. Les deux voies sont posées dans la Proposition ; aucune n'est tranchée.
- Suite : fiche sœur cop1 (le lecteur), nommée dans la Proposition, à créer au grooming.
- Dépendances : aucune fiche du lot. En dépend : [`ezk board session`](20261114131614424_ezk-board-session-json.md).
- Risques : les 69 journaux existants restent sans clé (le lecteur les montrera sous « sans
  chantier ») ; la fixture `@0.2` du validateur doit évoluer avec l'émetteur.
