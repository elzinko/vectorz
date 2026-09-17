---
id: "20260916225506858"
title: "GitHub / CI / Codex = modules optionnels, pilotés par la config projet"
type: feature # feature | bug | refactor | chore | epic
priority: P1 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [github-optionnel, plugin]
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr:
evidence: none # concept / archi, pas d'écran
created: 2026-09-17
---

# 20260916225506858 — GitHub / CI / Codex = modules optionnels, activés par config

## En clair

Le cœur de la méthode ne doit dépendre de rien d'externe. GitHub, la CI et la revue Codex
devraient être des **plugins branchables** — installés puis activés par un fichier de config
projet, comme les extensions de VS Code. Par défaut, tout tourne en local ; on branche
GitHub quand on veut la projection (PR, CI, revue cloud).

Deux gestes bien séparés, posés par le PO : **installer** un plugin dans un projet, puis
**l'activer avec ses options fines** — on peut activer `github` mais couper les revues
Codex, par exemple. Direction posée le 2026-09-12, officialisée ici pour un **panel d'archi**.

## Contexte / Problème

Beaucoup de skills parlent GitHub « en dur » : `gh pr …`, `@codex review`, checks CI. Un
projet sans GitHub devrait pouvoir dérouler la méthode **sans** ces morceaux.

La doctrine est déjà à moitié écrite, mais éparpillée :

- ADR-0039 range GitHub / Codex dans les « modules » et dit que `ezk-pr` **quitte** l'étage
  méthode : la PR est un mécanisme GitHub, pas une cérémonie — « on peut demander une revue
  adverse sans PR ».
- ADR-0052 pose « le local décide, GitHub projette ».
- Le pack de revue (ADR-038) écrit déjà en local par défaut, GitHub en option.

Ce qui manque : rien n'unifie ces pièces, et **aucun interrupteur de config** n'existe. Les
plugins GitHub sont installés d'office.

## Proposition

**Compose, ne réimplémente pas.** Fiche-chapeau qui cadre le concept et laisse le build aux
fiches filles. Le PO fixe **deux axes distincts** (à ne pas confondre) :

**Axe 1 — Installation par projet.** Rendre un plugin *disponible* pour un projet donné (ex.
le plugin `github`). C'est le « ce projet connaît-il GitHub du tout ». Mécanisme : le modèle
d'extension déjà livré ([[0170]], contrat plugin mega-city) + la distribution ([[0087]]). Un
projet sans le plugin ne parle jamais GitHub.

**Axe 2 — Activation + options.** Une fois installé, *activer* le plugin et régler ses
**options fines**, capacité par capacité. Exemple concret (PO) : activer `github` **mais**
couper `codex-review`, ou couper `ci`. Mécanisme : un manifeste de config `.vectorz/`
(étendre ADR-0050 + [[20260910152227744]], aujourd'hui pensé pour les règles de codage, à un
déclaratif `plugins:` avec sous-options). C'est le « settings.json de projet ». Le cran
buildable de cet axe pour `github` = la fille [[20260916225506856]].

**Mécanisme de fond (à terme).** Composer les prompts selon ce qui est activé : un skill
n'inclut les étapes/outils d'une capacité que si elle est active — génération / composition
dynamique des prompts (prolonge ADR-0039 aux prompts rendus, pas seulement au câblage).
Marqué « pas mûr » : à explorer en panel.

**Décision d'archi à trancher (panel) :** réconcilier **ADR-037** (« 1 feature = 1 branche =
1 PR = 1 squash-merge », la PR = unité atomique de merge / CI / revert) avec **ADR-0039** (la
PR = module GitHub, revue sans PR possible). Rendre la PR **elle-même** optionnelle rouvre
cet invariant — c'est le nœud à trancher avant tout build large.

**Frontière avec les voisines (anti-doublon) — cette fiche chapeaute, elle ne les refait pas :**

- [[20260916225506856]] — le premier cran **buildable** (axe 2 pour `github` : config + fichier PR local).
- [[20260911213014783]] *(P0 ready)* — le merge local-first.
- [[0170]] *(shippée)* / [[0087]] *(idea)* — le modèle d'extension et la distribution (axe 1).
- [[0171]] *(idea)* — l'adaptateur GitHub Issues config-gated.
- [[20260905134937885]] *(idea)* — sortir la PR / Codex du chemin (mesure revue locale).
- [[20260830110131158]] *(idea)* — flag revue adverse skippable.
- [[20260830110131298]] *(idea)* — supervision comme plugin séparable.
- [[0190]] *(idea)* — tier `composes` / `delegates` optionnel.
- [[20260910152227744]] *(idea)* — la couche règles-projet `.vectorz/` (ADR-0050).
- ADR de fond : ADR-0039, ADR-0029, ADR-038, ADR-0052 ; à réviser : ADR-037.

## Critères d'acceptation

À compléter au grooming / panel (fiche `idea`).

- [ ] Décision d'archi (panel adverse) sur « PR optionnelle vs ADR-037 », capturée dans un ADR.
- [ ] **Axe 1** — un plugin (ex. `github`) s'installe / se retire par projet ; projet sans le
      plugin = zéro appel sortant.
- [ ] **Axe 2** — le manifeste `.vectorz/` active un plugin **et ses options fines**
      indépendamment (ex. `github` on, `codex-review` off, `ci` off).
- [ ] Inventaire des skills « parlant GitHub en dur » + plan de bascule vers plugins.
- [ ] Le cran buildable [[20260916225506856]] livré comme première preuve de l'axe 2.

## Comment vérifier

À définir après le panel — fiche de concept, non buildable en l'état.

## Notes / décisions

- **Direction PO** (Thomas, 2026-09-12, re-confirmée + précisée le 2026-09-17). Mémoire
  projet `vectorz-github-ci-plugins-optionnels`.
- **Deux axes posés par le PO** (2026-09-17) : (1) installer le plugin par projet, (2)
  l'activer avec ses options fines (ex. `github` sans `codex-review`). L'axe 2 pour `github`
  est la fille [[20260916225506856]].
- **Priorité P1** (chapeau structurant, pas le luxe immédiat — le luxe P0 vit dans la fille
  [[20260916225506856]]). À ajuster par le PO.
- **Distinct de** [[0190]] (brique skill) et [[0087]] (distribution en plugin Claude Code) :
  ici c'est le **concept produit** (capacités branchables + prompts composés).
- **À passer en panel d'archi** avant tout build large (ADR-037 à réconcilier).
