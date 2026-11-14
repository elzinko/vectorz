---
id: "20261114131612204"
title: "Le sprint se publie avec son numéro continu, son but et sa branche"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [sprint, contrat, theme:mission-control]
status: idea
blocked:
pr:
evidence: none # une commande et un contrat, aucun écran modifié
created: 2026-11-14
---

# 20261114131612204 — Le sprint se publie avec son numéro continu, son but et sa branche

**En clair.** Mission control veut montrer chaque sprint avec son numéro, son but et la branche
qui l'a joué. Aujourd'hui la méthode ne publie que les cinq derniers comptes rendus, sans numéro,
sans but complet et sans branche : le premier sprint du 4 novembre a déjà disparu de l'écran. On
écrit ces trois champs dans le compte rendu à la clôture et on publie la liste complète : l'écran
peut alors raconter tous les sprints.

**Si tu arrives frais.** Un sprint se clôt par `close`, sous-commande de la compétence (skill)
`ezk-sprint`, qui écrit un compte rendu dans `docs/sprints/`. Mission control lit le JSON de
`ezk board show --json` (ADR-086) ; un « contrat » est le schéma versionné de ce JSON, daté par
son `schema_version`.

## Contexte / Problème

Ce que l'écran attend. Six pages de la maquette (Sprints, Sprint, Session, Accueil, Vue d'ensemble,
Version « Qui l'a livrée ») réclament la liste des sprints, chacun avec son numéro, son but, son
début et sa branche. La page Sprint veut en plus le compte rendu en JSON, section par section.

Ce que le code publie le 14 novembre.

- `derniersSprints[]` publie les 5 derniers comptes rendus. La limite est codée en dur
  (`limit = 5`, `products/mega-city/src/core/sprint-report-summary.ts:96-107`) et jamais passée
  par l'appelant (`products/mega-city/src/io/board-show.ts:52`). Chaque entrée porte slug, fichier,
  jour, fin, durée, jetons, livrées, blocages (`contracts/board-show/v1/schema.json:456-532`).
- Sur vectorz, `historique.sprints` vaut 55 et `derniersSprints` en montre 5. Le 4 novembre a vu
  six sprints ; le premier (fenêtre 09:07 → 09:28 UTC) n'est plus publié.
- Le compte rendu n'a ni numéro, ni but complet, ni branche. Son titre est le slug coupé à
  48 caractères (`skills/ezk-sprint/scripts/sprint.sh:434`). Ces trois données vivent hors dépôt,
  dans le journal de branche `<git-common-dir>/ezk/sprints/<branche>.md` (`sprint.sh:145`, en-tête
  `sprint.sh:249-251`) ; seul le numéro passe aussi dans le sujet du commit (`sprint.sh:456`).
- Le début du sprint est écrit dans le compte rendu (ligne « Fenêtre : début → fin »,
  `src/sprint-metrics/domain/render.ts:63`) mais seule la fin est relue
  (`sprint-report-summary.ts:45-48`).
- Le collecteur `ezk sprint report <slug>` produit un `.json` (`sprint-report@0.1`) et un `.md`
  (`bin/sprint-report.ts:96-104`). `close` ne range que le `.md` et jette le `.json` avec le dossier
  temporaire (`sprint.sh:437-446,473`) : 0 fichier `.json` pour 55 `.md`. `board show` relit le
  markdown par expressions régulières (`sprint-report-summary.ts:38-77`). Aucune commande de
  lecture `--json` n'existe ; `sprint report` est `root: none` (`ezk-manifest.yml:348-352`).
- Piège de numérotation. Le journal de branche repart à 1 par branche (`sprint.sh:369-374`). Le
  journal de la branche de ce chantier dit « Sprint 6 », celui de `main` dit « Sprint 26 », quand
  `features/PLAN.md:20-24` compte les sprints 27, 28 et 29.

Fiches livrées qui couvrent le besoin en partie :

- [La Vue d'ensemble résume le dernier sprint et ses indicateurs](done/20261104090517904_vue-ensemble-dernier-sprint-et-kpi.md)
  — le plafond « au plus 5 » y est un critère coché (l. 50), pas un oubli.
- [Le journal de sprint se range par branche, hors du worktree](done/20261004181110201_sprint-md-par-branche-hors-worktree.md)
  — la source actuelle du numéro, du but et de la branche, hors dépôt et non publiée.
- [La vue d'ensemble compte les vrais sprints et rétros](done/20261102104443762_vue-ensemble-sprints-retros-reels.md)
  — publie le compte (55), pas la liste.
- [Au close, le sprint écrit et committe son compte rendu](done/20261008072305169_close-ecrit-et-committe-le-compte-rendu.md)
  et [Domaine « métriques de sprint »](done/20260826082120062_domaine-metriques-de-sprint-rapport.md)
  — le markdown seul, par choix d'alors, et le JSON `sprint-report@0.1` déjà produit à chaque clôture.

## Proposition

1. **La clôture écrit l'en-tête.** `sprint.sh close` écrit le numéro, le but complet (le texte de
   `--objective`) et la branche dans le compte rendu, dans le `.md` et dans le `.json`. Le `.json`
   est rangé à côté du `.md`, dans le même commit. Le gabarit
   [`sprint-report-template.md`](../products/mega-city/skills/ezk-sprint/references/sprint-report-template.md)
   gagne cet en-tête. Les 55 comptes rendus existants restent lisibles : leurs champs absents
   valent `null`.
2. **Le numéro est continu.** Décision du PO du 14 novembre : le vrai numéro est le compte continu
   depuis le début du projet (…28, 29). La méthode le calcule depuis l'historique des sprints
   scellés et `ezk board show --json` l'émet. Le compteur qui repart à 1 par branche reste un
   artefact local : il ne se publie jamais comme LE numéro. Cette décision est à confirmer par le
   panel adverse avant d'être écrite en ADR, voir
   [Amendements d'ADR du 12 novembre](done/20261114131614058_amendements-adr-du-12-novembre.md).
3. **Une lecture JSON.** Une commande à créer, `ezk sprint show <slug> --json` (`project: true`,
   lecture seule), sort le compte rendu sous un contrat `contracts/sprint-show/v1`, avec
   `schema_version`. Les sections (« En clair », « Lot scellé », « Détail », « Abandon ») sont des
   champs, pas un bloc markdown à redécouper. Un slug inconnu rend le code 1 et une phrase.
4. **La liste complète.** `board show --json` publie un champ `sprints[]` : tous les comptes rendus,
   avec `numero`, `but`, `debut`, `fin`, `branche`, `fichier`, `livrees`. `derniersSprints`
   garde son sens (les 5 derniers) : un champ ajouté ne fait pas monter la version du contrat
   (`src/core/board-contract.ts:11-12`). Lever le plafond de `derniersSprints` à la place changerait
   le sens du champ : le contrat `board-show` passerait en version 2. C'est un changement de contrat.
5. **Une seule source.** `board show` et `sprint show` lisent le `.json` quand il existe. La
   relecture du markdown ne sert plus qu'aux anciens comptes rendus.

Hors périmètre : l'écran (fiche sœur côté mission control), le [récit de session](20261114131614243_recit-de-session-en-tete-structure.md),
la vue par session ([`ezk board session`](20261114131614424_ezk-board-session-json.md)) et la
[rétro par sprints nommés](20261114131614801_retro-relit-une-liste-de-sprints-nommes.md).

## Critères d'acceptation

- [ ] À la clôture, le compte rendu porte le numéro continu, le but complet et la branche, dans le
  `.md` et dans le `.json` ; le `.json` est committé à côté du `.md` ; les 55 comptes rendus
  existants restent lisibles, leurs champs absents valent `null`, jamais une valeur devinée.
- [ ] Le numéro publié est le compte continu depuis le début du projet, calculé depuis l'historique
  des sprints scellés ; le compteur par branche n'apparaît jamais sous le nom `numero` ; deux
  branches qui clôturent chacune un sprint reçoivent deux numéros différents.
- [ ] `ezk board show --json` publie `sprints[]`, la liste complète, sans changer le sens de
  `derniersSprints` ; le contrat `board-show` et son exemple décrivent le champ ajouté. Si le PO
  choisit de lever le plafond à la place, le contrat passe en version 2 et le dit.
- [ ] `ezk sprint show <slug> --json` figure au manifeste (`project: true`), sort le compte rendu
  avec `schema_version` sous le contrat `contracts/sprint-show/v1`, ses sections en champs ; un
  slug inconnu rend le code 1 et une phrase.
- [ ] `board show` et `sprint show` lisent la même source ; la relecture par expressions régulières
  ne sert plus qu'aux anciens comptes rendus.
- [ ] Sur vectorz, `sprints[]` compte 55 entrées ; chacune a un `numero` et, quand la ligne
  « Fenêtre » existe, un `debut` ; le premier sprint clos après la livraison porte `numero`,
  `but`, `debut` et `branche` non nuls.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" board show --json | jq '.sprints | length'                 # 55, puis 56 après un close
ezk --root "$ROOT" board show --json | jq '.sprints[0] | {numero, but, debut, fin, branche}'
ezk --root "$ROOT" board show --json | jq '.derniersSprints | length'         # reste 5
ezk --root "$ROOT" sprint show <slug> --json | jq '{schema_version, sprint, sections: (.sections | keys)}'
ezk --root "$ROOT" sprint show slug-inconnu --json ; echo "EXIT=$?"          # 1 et une phrase
ls "$ROOT"/docs/sprints/*.json | wc -l                                        # ≥ 1 après le premier close
pnpm --dir products/mega-city board:contract --write                          # régénère contracts/board-show
pnpm --dir products/mega-city test -- src/core/__tests__/sprint-report-summary.test.ts src/__tests__/board-contract.test.ts
pnpm --dir products/mega-city test:scripts     # test-sprint-lifecycle.sh : start / close sur un dépôt jouet, à étendre à deux branches
```

## Glossaire

- `compte rendu de sprint` — le fichier `docs/sprints/<jour>-sprint-<slug>.md` écrit par `close`.
- `journal de branche` — le fichier de suivi du sprint en cours, hors dépôt, un par branche.
- `slug` — le nom court d'un sprint, tiré de son but, coupé à 48 caractères.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écarts A1 et H1, fusionnés : même en-tête de compte rendu, même `close`, même source pour
  `board show`.
- Décision du PO du 14 novembre (n° 1) : numéro continu calculé depuis l'historique des sprints
  scellés, émis par `board show` ; le compteur par branche n'est jamais LE numéro. À confirmer par
  le panel adverse avant l'ADR (fiche des amendements, liée dans la Proposition).
- Le plafond à 5 est un critère coché d'une fiche livrée et un texte du contrat : le lever est un
  changement de contrat (version 2), pas la correction d'un bug. D'où le champ `sprints[]`.
- À trancher au grooming : la source de la branche. L'en-tête du compte rendu (recommandé, dans le
  dépôt) ou le journal de branche (hors dépôt, perdu avec le dossier git commun).
- Dépendances : aucune fiche du lot. En dépendent : le récit de session, `ezk board session` et la
  rétro par sprints nommés (liens dans la Proposition).
- Risques : deux sprints clos le même jour avec le même slug se disputent un nom de fichier ; deux
  branches qui clôturent en parallèle peuvent se donner le même numéro (le recalcul depuis
  l'historique à la lecture tranche) ; le `.json` committé double le volume de `docs/sprints/`.
