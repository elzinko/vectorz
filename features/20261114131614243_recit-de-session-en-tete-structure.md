---
id: "20261114131614243"
title: "Le récit de session porte un en-tête structuré que `board show` publie"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [sprint, contrat, theme:mission-control]
status: idea
blocked:
pr:
evidence: none # un en-tête de récit et un contrat, aucun écran modifié
created: 2026-11-14
---

# 20261114131614243 — Le récit de session porte un en-tête structuré que `board show` publie

**En clair.** Les pages Sessions et Session de mission control veulent, pour chaque session close,
sa branche, sa période et les sprints qu'elle a joués. Le récit de session contient souvent ces
données, mais en prose : la méthode n'en publie que la date, le titre et les fiches. On écrit un
en-tête structuré en tête de chaque nouveau récit et on le publie : l'écran lit la session sans
deviner.

**Si tu arrives frais.** Un récit de session est le fichier que la compétence (skill) `ezk-archive`
écrit dans `docs/sessions/` quand une session se ferme. `ezk board show --json` publie déjà la
liste de ces récits (`sessions[]`) à mission control (ADR-086).

## Contexte / Problème

Ce que l'écran attend. Les pages Sessions et Session veulent, par session close : la branche, la
période (début, fin, durée), les numéros des sprints joués et les comptes rendus de ces sprints.

Ce que le code publie le 14 novembre.

- Le chargeur des récits lit la date dans le nom du fichier, le titre dans le premier `# H1`, la
  ligne `fiches:` et les numéros de PR par expressions régulières
  (`products/mega-city/src/loaders/runs.ts:31-56`).
- `board show --json` publie `sessions[]` avec `date`, `title`, `file`, `fiches`, `prs`
  (`src/core/board-contract.ts:106-112`). Ni durée, ni branche, ni sprints.
- Sur vectorz : 28 récits publiés. 13 portent une ligne `fiches:`, 4 une ligne `Branche:`, 5 une
  ligne `- Sprint N —`, aucun une durée, aucun un front-matter YAML (compté le 14 novembre).

Pourquoi rien n'est structuré. `ezk-archive` copie le journal de sprint de la branche vers
`docs/sessions/` (`skills/ezk-archive/SKILL.md:237-262`). L'en-tête de ce journal porte
`# Sprint N — <but du sprint>`, `Statut… Ouvert: … Clos: …` et `Branche:`
(`skills/ezk-sprint/scripts/sprint.sh:249-251` ; `Clos:` est posé à la clôture, `:399`). Mais le
récit n'a pas de format : `docs/sessions/README.md` dit « format léger, pas un gabarit rigide ».
Rien de structuré, donc rien de publié.

Un besoin déclaré trois fois, jamais livré.

- [Vue « sprints réalisés » dans ezk:map](done/20260826072532452_vue-sprints-realises-ezk-map.md)
  (26 août) — critère « front-matter structuré » écrit par `ezk-archive` (l. 66-69) ; la vue a été
  retirée par l'[ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md),
  le critère n'a jamais été réalisé.
- [ezk-archive émet un compte-rendu de session structuré](done/20260826121429274_ezk-archive-compte-rendu-structure.md)
  — le producteur, absorbé sans livraison par
  [Journal des difficultés — artefact indépendant](done/20260904091853974_journal-difficultes-artefact-independant.md)
  (4 septembre), qui range l'en-tête structuré en « Suite (hors POC) » (l. 134).
- [« Labo de cuisine »](done/20260829123707100_labo-de-cuisine-journal-difficultes.md) a posé la
  ligne `fiches:` ; [Les récits reviennent sur main](done/20261003201035260_recits-de-session-de-retour-sur-main.md)
  les a rendus lisibles ; [Mission control montre le pilotage](done/20261102123552182_mission-control-montre-le-pilotage.md)
  publie `sessions[]` tel quel.

## Proposition

1. **Un en-tête structuré à l'écriture.** `ezk-archive` écrit en tête de chaque nouveau récit un
   front-matter YAML : `fiches`, `branche`, `debut`, `fin`, `sprints` (les numéros continus de
   [Le sprint se publie avec son numéro continu](20261114131612204_sprint-publie-numero-but-branche.md)),
   `comptesRendus` (les chemins `docs/sprints/…` des sprints de la session). La ligne `fiches:` des
   anciens récits reste lue.
2. **Le trio lisible.** Le récit devient une instance de la règle
   [`readable-deliverable-trio`](../products/mega-city/rules/documentation-guidelines/readable-deliverable-trio.md) :
   un gabarit dans `products/mega-city/skills/ezk-archive/references/`, un extracteur qui sort les
   faits (branche, période, sprints, comptes rendus) depuis le journal de branche et `docs/sprints/`,
   le rendu par la compétence. Le nom de l'extracteur se fixe au grooming.
3. **La lecture et la publication.** `loaders/runs.ts` lit le front-matter ; `board show --json`
   publie dans `sessions[]` les champs `branche`, `debut`, `fin`, `dureeMs`, `sprints`,
   `comptesRendus`. Des champs ajoutés : le contrat `board-show` ne change pas de version
   (`src/core/board-contract.ts:11-12`). Un récit ancien donne `null` ou `[]` : mode dégradé.
4. **La source de la période**, à trancher : le journal de branche (`Ouvert:` et `Clos:`, au jour
   près, `sprint.sh:250` et `:399`) ou le journal de supervision (`run.started` / `run.finished`, horodatés,
   une fois la session nommée par
   [L'émetteur nomme la session](20261114131612388_session-nommee-cle-de-chantier-derivee.md)).
   POC : le journal de branche, déjà copié par `ezk-archive`.
5. **Un garde.** Le portier d'`ezk-archive` (`skills/ezk-archive/scripts/check.sh`) signale un
   récit neuf sans en-tête ; les 28 récits existants passent sans erreur.

Hors périmètre : la page Session elle-même (côté mission control), la commande
[`ezk board session`](20261114131614424_ezk-board-session-json.md) qui consommera cet en-tête, et
le numéro continu des sprints (fiche liée au point 1).

## Critères d'acceptation

- [ ] Chaque nouveau récit commence par un front-matter YAML avec `fiches`, `branche`, `debut`,
  `fin`, `sprints` et `comptesRendus` ; la ligne `fiches:` des anciens récits reste lue.
- [ ] `ezk board show --json` publie dans `sessions[]` `branche`, `debut`, `fin`, `dureeMs`,
  `sprints` et `comptesRendus` ; le contrat `board-show` décrit ces champs ajoutés sans changer de
  version ; un récit sans en-tête donne `null` ou `[]`.
- [ ] `dureeMs` vient de `debut` et `fin` ; sans les deux il vaut `null`, jamais 0.
- [ ] Les 28 récits existants passent en mode dégradé sans erreur ; un récit neuf sans en-tête est
  signalé par le portier de clôture.
- [ ] Le gabarit du récit vit dans `products/mega-city/skills/ezk-archive/references/` et figure,
  avec son extracteur, dans la table « Instances connues » de la règle `readable-deliverable-trio`.
- [ ] Les numéros de `sprints` sont les numéros continus publiés par `board show` ; chaque chemin de
  `comptesRendus` existe dans `docs/sprints/`.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
head -12 "$(ls -t "$ROOT"/docs/sessions/2*.md | head -1)"                      # le front-matter du dernier récit
ezk --root "$ROOT" board show --json | jq '.sessions[0] | {date, branche, debut, fin, dureeMs, sprints, comptesRendus}'
ezk --root "$ROOT" board show --json | jq '[.sessions[] | select(.branche == null)] | length'   # 28 anciens, en mode dégradé
ezk --root "$ROOT" board show --json | jq '[.sessions[] | select(.dureeMs == 0)] | length'      # 0 : jamais un faux zéro
pnpm --dir products/mega-city test -- src/__tests__/board-contract.test.ts \
  src/__tests__/readable-deliverable-trio.test.ts src/loaders/__tests__
bash products/mega-city/skills/ezk-archive/scripts/check.sh --gate   # le portier (mode par défaut) : CLEAN, ou DIRTY avec le récit sans en-tête nommé
```

Le chargeur n'a pas de test aujourd'hui : en ajouter un sous `src/loaders/__tests__/runs.test.ts`
(un récit avec en-tête, un sans). Preuve d'écran : aucune (`evidence: none`).

## Glossaire

- `récit de session` — le fichier `docs/sessions/AAAA-MM-JJ-<slug>.md` écrit par `ezk-archive`.
- `journal de branche` — le suivi du sprint en cours, hors dépôt, copié dans le récit à la clôture.
- `front-matter` — le bloc YAML entre deux `---` en tête d'un fichier markdown ; la source de vérité.
- `mode dégradé` — un ancien récit sans en-tête reste publié, avec des champs `null` ou vides.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart A5.
- Reprise d'un besoin déclaré le 26 août et le 4 septembre 2026, jamais livré (fiches citées dans
  le Contexte). La vue qui le portait a disparu avec l'ADR-086 ; le besoin, lui, revient par
  mission control.
- Dépend de : [Le sprint se publie avec son numéro continu](20261114131612204_sprint-publie-numero-but-branche.md)
  pour les numéros de `sprints`. Nourrit : [`ezk board session`](20261114131614424_ezk-board-session-json.md).
- Décisions attendues au grooming : la source de `debut` et `fin` (journal de branche ou journal de
  supervision) ; le nom de l'extracteur du trio.
- Risques : un récit écrit à la main hors `ezk-archive` n'aura pas d'en-tête (le portier le
  signale, il ne le bloque pas) ; `Ouvert:` et `Clos:` sont des jours, la durée qui en sort est
  grossière ; deux sessions sur la même branche se partagent un journal de branche.
