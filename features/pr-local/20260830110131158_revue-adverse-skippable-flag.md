> 🗎 Rendu de la fiche [features/20260830110131158_revue-adverse-skippable-flag.md](../20260830110131158_revue-adverse-skippable-flag.md)

# 20260830110131158 — Revue adverse skippable par un flag

## En clair

La revue adverse est **déjà obligatoire** à chaque sprint (étape 7 d'`ezk-sprint`, déléguée à
`ezk-reviewer`, verdict GO/NO-GO bloquant). On veut pouvoir la **sauter en mode POC** — quand on
bricole du jetable — par un réglage **explicite et tracé** dans la config du projet, jamais en
silence. Le plancher reste la règle ; le POC est la seule dérogation.

## Contexte / Problème

Aujourd'hui le skip de la revue est un **jugement implicite** : `ezk-sprint` autorise de
sauter une étape « pour le trivial », revue comprise. Rien ne l'expose comme un **choix
explicite et traçable** au niveau du product-build. Résultat : on ne peut pas dire « ce run,
pas de revue » proprement, ni retrouver dans le journal que la revue a été sautée.

À ne pas confondre : la revue adverse **interne** (`ezk-reviewer`, locale, dans la méthode)
n'est pas la revue **Codex** (plugin GitHub, cloud, automatique, hors méthode). Ce flag ne
concerne que la première. Codex reste géré par composition (`ezk-codex`), hors de ce skill.

## Proposition

**POC (premier morceau) : sauter la revue adverse en mode POC, piloté par la config.** On déclare le
mode POC dans `.vectorz/config.yml` (un réglage du cluster `methode-configurable`, p. ex.
`review.adverse: skip`) ; en mode POC, `ezk-sprint` saute l'étape 7 (reviewer) **mais garde la gate
locale** (tests / lint / build, étape 5). On troque une seconde opinion contre de la vitesse, jamais
la sécurité de base.

Garde-fous :
- **Plancher préservé** — hors POC, la revue adverse reste bloquante (ADR-0059). Le mode POC en est
  la **seule dérogation explicite** ; il **amende** l'ADR-0059, et l'amendement s'écrit au build.
- **Explicite et tracé** — le skip est journalisé dans `SPRINT.md` et signalé au checkpoint
  (« revue adverse SKIPPÉE — mode POC »).
- **Jamais en silence ni en auto tout seul** — en `--mode auto`, `ezk-pm` ne saute pas la revue de
  lui-même ; il faut le réglage POC **explicite** dans la config.
- **La collision `--review` disparaît** — on passe par la **config**, pas par un nouveau flag
  `--review` : plus de conflit avec le `--review` du ready-gate (ADR-0053).

Distinction inchangée : ça ne concerne que la revue adverse **interne** (`ezk-reviewer`), pas Codex
(géré hors méthode par `ezk-codex`).

## Critères d'acceptation

- [x] **Skip en POC** — avec `review.adverse: skip` dans `.vectorz/config.yml`, un sprint saute
      l'étape reviewer **mais garde la gate locale verte** (tests / lint / build).
- [x] **Tracé** — le skip apparaît dans `SPRINT.md` (`## Notes / décisions`) et au résumé de
      checkpoint (« revue adverse SKIPPÉE — mode POC »).
- [x] **Plancher par défaut** — sans le réglage POC, la revue adverse tourne et bloque (GO/NO-GO).
- [x] **Jamais en auto tout seul** — en `--mode auto`, le skip n'est pris **que** si le réglage POC
      est explicitement posé ; `ezk-pm` ne le décide jamais seul.
- [x] **Garde — le POC ne retire QUE le reviewer** — un sprint POC dont la gate locale échoue (tests
      rouges) est **bloqué quand même**. Sans ce critère, « POC » deviendrait « aucune sécurité ».

## Plan de build (grooming du 2026-11-03, run autonome)

Lu dans le code ; la décision du PO du 2026-10-09 est déjà écrite plus bas.

1. **La config** : `src/core/project-config.ts` gagne un résolveur pur. `review: { adverse: skip }`
   donne `skip` ; toute autre valeur, ou rien, donne `run`. On ne saute jamais par accident.
2. **La méthode le publie** : `ezk config show` affiche une ligne `review.adverse` ; `--json` gagne le
   champ `adverseReview` (`run` ou `skip`), ajouté sans changer `schema_version`.
3. **Les skills l'appliquent** : `ezk-sprint`, à l'étape de la revue, lit ce réglage. En `skip`, il saute
   `ezk-reviewer`, garde la gate locale, journalise « revue adverse SKIPPÉE — mode POC » dans
   `SPRINT.md` et au checkpoint. `ezk-product-build` dit qu'`ezk-pm` ne saute jamais la revue seul.
4. **L'ADR-0059 est amendé** : une section datée dit que le mode POC est la seule dérogation au
   plancher, et comment revenir en arrière.
5. **Tests** : le résolveur, la sortie de `ezk config show` (texte et JSON), le contrat régénéré, et le
   test du plancher (`review-floor-contract.test.ts`) qui garde la dérogation et la gate locale.

## Comment vérifier

À rejouer une fois construit :
- Poser `review.adverse: skip` dans `.vectorz/config.yml`, lancer un sprint POC → l'étape reviewer
  est sautée, la gate locale (tests / lint / build) tourne, et le skip est tracé (`SPRINT.md` +
  checkpoint).
- Retirer le réglage → la revue adverse bloque sur un défaut injecté (plancher).
- En `--mode auto` sans le réglage → la revue tourne (jamais d'auto-skip).
- Casser la gate locale sur un sprint POC → bloqué quand même (le POC ne retire **que** le reviewer).

## Suite (plus tard)

- un **flag de lancement** one-shot pour sauter la revue hors mode POC (dépannage ponctuel), avec un
  nom non ambigu (p. ex. `--skip-adverse-review`) — au-delà du POC piloté par config ;
- le **contrôle générique** de n'importe quelle étape (activer / sauter), via le mécanisme « étapes
  configurables » ([228](../20260830110131228_schema-etapes-skill-configurables.md)).

## Notes / décisions

- **Instance concrète** d'une idée plus large : rendre les **étapes d'un skill configurables**
  (cf. fiche « schéma d'étapes de skill », même session). Ce flag est le cas particulier
  buildable tout de suite ; le schéma généralisera.
- Touche **deux skills** (`ezk-product-build` + `ezk-sprint`). Origine : revue de conception
  de la bascule du défaut `--mode auto` (session 2026-08-30).
- **Collision de nom `--review` — RÉSOLUE par le choix config (grooming 2026-10-09).** Le POC passe
  par la **config** (`review.adverse: skip` en mode POC), **pas** par un nouveau flag `--review` : la
  collision avec le `--review` du ready-gate (ADR-0053) disparaît. *Historique* : l'ADR-0053 avait
  renommé `--check-ready` → `--review` sur `ezk-product-build`, rendant un `--review skip` ambigu —
  c'est ce qui bloquait la fiche. Le flag one-shot éventuel (Suite) prendra un nom non ambigu
  (`--skip-adverse-review`).


## 🔄 Rescope — 2026-09-30 (audit de rationalisation du backlog)

> **Fiche EVOLVE** : partiellement livrée ou cadrage périmé — à rescoper au reliquat réel avant de la tirer.
>
> **Constat de l'audit** : Flag skip revue adverse ; collision de nom avec --review (ADR-0053) à trancher.
>
> **Action** : au moment de groomer, réécrire l'« En clair » et les critères sur ce qui RESTE ;
> ne pas reconstruire ce qui est déjà livré. Note issue de la passe du 2026-09-30 (PR #263).

## ✅ Tranché par le PO — 2026-10-09 (recadrée, sortie du parking)

Le PO tranche : **on recadre, on ne clôt pas**. On doit pouvoir **overrider** le fonctionnement,
revue adverse comprise — en **mode POC**, par un geste explicite et tracé (jamais en silence, jamais
en auto sans flag). Ça **amende l'ADR-0059** : la revue locale reste le plancher *sauf* dérogation
POC explicite. L'amendement lui-même s'écrit **au build**, par l'architecte, pour ne pas retirer le
plancher par accident.

Cette fiche est le cas précis ; elle s'inscrit dans la capacité plus large
[Configurer les étapes et les choix de la méthode via le fichier de config](../20261009104401282_config-etapes-et-choix-methode.md).
Reste à trancher au grooming : la **collision de nom `--review`** (voir la note du 2026-09-20) et la
porte POC (flag au lancement ? valeur de config ?).

> Note historique (2026-10-02) : la fiche avait été laissée au parking car elle contredisait
> l'ADR-0059 ; le PO lève ce blocage le 2026-10-09 en amendant l'ADR.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO). Conditions : le réglage n'est
  posé que par un humain, jamais écrit ni déduit par un agent ; la gate locale n'est jamais sautée ; chaque
  saut est tracé ; l'amendement d'ADR-0059 part avec le code ; le run qui la construit garde sa revue.
- **Preuves du build (2026-11-03).**
  - Sur un projet jetable, `ezk config show --root <projet>` dit `review.adverse skip` avec
    `review: { adverse: skip }`, et `run` avec `adverse: Skip` ou sans clé ; `--json` porte `adverseReview`.
  - Le résolveur garde `run` pour toute autre forme (9 cas testés).
  - `ezk-sprint` porte la règle du mode POC : sauter `ezk-reviewer`, jamais la gate locale, tracer le
    saut, réglage posé par un humain seul ; `ezk-product-build` dit qu'aucun agent ne saute la revue
    d'office. Le test du plancher (`review-floor-contract.test.ts`) garde ces phrases et l'amendement
    d'ADR-0059.
  - Limite : le comportement d'un vrai sprint POC est porté par le texte du skill, que l'agent suit. Il
    n'a pas été rejoué de bout en bout ; le réglage n'est posé dans aucun projet.
- **Après la revue (NO-GO, 2026-11-03).** L'étape 10 d'`ezk-sprint` exigeait encore la revue avant toute
  fusion, en contradiction avec l'étape 7. Elle dit maintenant : en mode POC, la revue est sautée et
  tracée, la validation verte reste exigée, le checkpoint redit le saut. Un test garde l'accord des deux
  étapes, un autre la ligne `review.adverse skip` de `ezk config show`. La preuve des critères « skip »
  et « tracé » reste le texte du skill, cohérent à chaque point de décision et gardé par des tests.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2300 tests 47 suites |
| Suite cop1 | ✅ app 359 |
| Revue ezk-reviewer | ✅ GO après un NO-GO corrigé |
| Before / after (UI) | N.A. — config et texte de skills sans écran |
