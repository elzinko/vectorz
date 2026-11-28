---
id: "20261114131614424"
title: "`ezk board session <branche> --json` : une session avec ses sprints, ses lancements et ses fiches"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [contrat, theme:mission-control]
status: idea
blocked:
pr:
evidence: none # une commande et un contrat, aucun écran modifié
created: 2026-11-14
---

# 20261114131614424 — `ezk board session <branche> --json` : une session avec ses sprints, ses lancements et ses fiches

**En clair.** La page Session de mission control veut raconter une session entière : sa branche,
son état, les sprints qu'elle a joués, ses lancements et les fiches qu'elle a touchées. Ces données
existent déjà, mais dans quatre endroits que rien ne réunit. Une commande les assemble par branche
et les publie en JSON : la page se lit d'un coup.

**Si tu arrives frais.** Une session est une branche et son dossier de travail, le worktree
(ADR-079 §D1). Mission control lit le JSON des commandes `ezk board … --json` (ADR-086) ; un
lancement (`run`) est une exécution de la méthode, tracée dans le journal de supervision.

## Contexte / Problème

Ce que l'écran attend. Une seule page de la maquette, Session : la branche, son état (active ou
dormante), les sprints joués avec leur numéro, leur but, leur lot et leur compte rendu, les
lancements avec leur clé de chantier, et les fiches citées.

Ce que le code publie le 14 novembre.

- Aucune commande `ezk board session`. Le domaine `board` a `check`, `show`, `maps`, `process`
  (`products/mega-city/ezk-manifest.yml:66-87`, `ezk help board`).
- `ezk sessions` existe (`state` ou `map`, `bin/ezk-sessions.ts:109-123`) : un tableau texte ou
  une page HTML live, sans `--json`.
- Les briques sont dispersées. `board process --json` donne la session `{path, branch}` de chaque
  fiche active (`contracts/board-process/v1/schema.json:76-98`). `board show --json` donne les
  sessions closes lues des récits : date, titre, fichier, fiches, PR
  (`src/core/board-contract.ts:106-112`). Le journal de sprint par branche,
  `<git-common-dir>/ezk/sprints/<branche>.md` (`skills/ezk-sprint/scripts/sprint.sh:145`), porte
  les sprints joués. Le journal de supervision, `.supervision/runs/*/events.jsonl`, porte les
  lancements. Rien ne les réunit par branche.
- L'état d'une session est déjà calculé : `collectWorktrees` (`src/io/sessions-collect.ts:26`) lit
  les worktrees, `buildSessionsData` (`src/core/sessions-data.ts:137`) en déduit actif ou dormant.

Fiches qui couvrent le besoin en partie :

- [ezk-sessions — cockpit de pilotage des sessions](done/20260825141012293_ezk-sessions-cockpit.md)
  et [ezk-sessions — vue navigateur live](done/20260829214131713_ezk-sessions-vue-navigateur-live.md)
  — l'état par worktree, en texte et en HTML, sans JSON.
- [Voir les fiches posées sur le process, avec leur session](done/20261002115451315_fiches-sur-le-process-avec-session.md)
  — publie déjà la session de chaque fiche active.
- [Mission control montre le pilotage](done/20261102123552182_mission-control-montre-le-pilotage.md)
  — l'historique des sessions closes, tel que les récits le donnent.
- [Board : runs et sessions concurrents](done/20261014122044421_board-runs-concurrents-identite-lisible.md)
  — le modèle « une session = une branche » et la chronologie sont décidés.
- [Une page d'accueil : une ligne par projet](20261002115451451_page-une-ligne-par-projet.md)
  — idée différée, voisine.

Réserve. Tant que le journal de supervision est normalisé vers le checkout principal
(`src/supervision/project-root.ts:166-182`), aucun lancement ne peut être rattaché à une branche,
même une fois la session nommée. Le vrai prérequis est le journal par worktree
([ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D5), que la variable
`SUPERVISION_MULTI_SESSION` active (`project-root.ts:157-158`) ; ce n'est pas le défaut aujourd'hui.

## Proposition

1. **La commande.** `ezk board session <branche> --json`, à créer au manifeste du domaine `board`
   (`project: true`, lecture seule), sort un contrat `contracts/board-session/v1` (nouveau) avec
   `schema_version`.
2. **La sortie.** Une session = une branche. Le JSON porte : `branche`, `dossier` (le worktree),
   `etat` (active ou dormante, repris de `buildSessionsData`), `sprints[]` (numéro, but, lot,
   compte rendu, depuis les comptes rendus publiés par
   [Le sprint se publie avec son numéro continu](20261114131612204_sprint-publie-numero-but-branche.md)
   et le journal de branche), `lancements[]` (`run.started` / `run.finished` du journal, avec la
   clé de chantier posée par
   [L'émetteur nomme la session](20261114131612388_session-nommee-cle-de-chantier-derivee.md)),
   `fiches[]` (le lot des sprints et l'en-tête du récit de
   [Le récit de session porte un en-tête structuré](20261114131614243_recit-de-session-en-tete-structure.md)).
3. **Rien à recoder.** La commande assemble `collectWorktrees` et `buildSessionsData` (l'état),
   `board process` (les fiches en cours), les comptes rendus (les sprints) et le journal (les
   lancements). Elle n'interprète rien de neuf.
4. **Les bords.** Une branche inconnue rend le code 1 et une phrase. Un champ non mesuré vaut
   `null`, jamais un faux zéro. Une session close (branche fusionnée, worktree retiré) se lit
   depuis son récit et ses comptes rendus.

Hors périmètre : la page Session elle-même (fiche sœur côté mission control, servie par le
daemon) ; un `--json` sur `ezk sessions state`, qui pourrait suivre si l'écran Sessions le réclame.

## Critères d'acceptation

- [ ] `board session` figure au manifeste (`project: true`) ; `--json` sort un contrat
  `contracts/board-session/v1` avec `schema_version`, décrit et exemplifié dans `contracts/`.
- [ ] La sortie porte la branche, le dossier de travail, l'état (active ou dormante), les sprints
  joués (numéro, but, lot, compte rendu), les lancements (avec leur clé de chantier) et les fiches
  citées.
- [ ] Une branche inconnue rend le code 1 et une phrase ; un champ non mesuré vaut `null`, jamais 0.
- [ ] `board show --json` et `board session` lisent les mêmes comptes rendus : une fiche livrée
  apparaît dans les deux avec le même id.
- [ ] Sur vectorz, la session de la branche courante montre ses sprints et ses lancements ; une
  session close du dépôt se lit depuis son récit.

**Mesure de suivi** — la page Session de mission control consomme ce JSON par le daemon, sans
relire les fichiers (fiche sœur cop1).

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
B="$(git branch --show-current)"
ezk --root "$ROOT" board session "$B" --json \
  | jq '{schema_version, branche, etat, sprints: (.sprints | length), lancements: (.lancements | length), fiches: (.fiches | length)}'
ezk --root "$ROOT" board session branche-inconnue --json ; echo "EXIT=$?"     # 1 et une phrase
# chaque fiche livrée vue par board session l'est aussi par board show (sortie vide attendue)
comm -23 <(ezk --root "$ROOT" board session "$B" --json | jq -r '.sprints[].livrees[].id' | sort -u) \
         <(ezk --root "$ROOT" board show --json | jq -r '.sprints[].livrees[].id' | sort -u)
pnpm --dir products/mega-city test -- src/core/__tests__/sessions-data.test.ts src/__tests__/board-contract.test.ts
```

Un test du nouveau contrat (`board-session`) est à ajouter sous `src/__tests__/`, sur le modèle de
`board-contract.test.ts`. Preuve d'écran : aucune (`evidence: none`).

## Glossaire

- `worktree` — un dossier de travail git sur une branche ; une session en occupe un.
- `lancement` (`run`) — une exécution de la méthode, tracée dans `.supervision/runs/`.
- `clé de chantier` — l'étiquette qui regroupe les lancements d'un même travail (milestone, version).
- `daemon` — le service local qui sert les JSON de la méthode à mission control.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart A4. Une seule page en dépend : la fiche vient en dernier du lot.
- Dépend de trois fiches du lot, liées dans la Proposition : le numéro et le but des sprints ; la
  branche et la clé de chantier dans le journal ; l'en-tête structuré du récit. Et du journal par
  worktree (ADR-079 §D5), sans lequel aucun lancement ne se rattache à une branche.
- Nommage : `ezk sessions` (l'outil, texte et HTML) et `ezk board session` (le contrat publié)
  coexistent. À dire dans `ezk help`, ou à fondre plus tard : décision au grooming.
- Risques : `collectWorktrees` lance `git worktree list` et rend `[]` sans git (dégradation déjà
  codée) ; une branche vue par deux worktrees ou un HEAD détaché n'a pas un nom unique ; le journal
  par worktree n'est pas encore le défaut.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : NO-GO. Le critère sur les lancements rattachés à une branche n'est pas vérifiable tant que le journal n'est pas par dossier de travail. La fiche reste une idée ; aucun écran de ce lot n'en dépend.
