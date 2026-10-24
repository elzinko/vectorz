---
type: retro
date: 2026-10-24
theme: "Run autonome : construire les fiches prêtes des milestones preparation + carte"
scope: "5 fiches construites+livrées en local (close increvable, recâbler en cours, checkpoint de version, jetons par mode, aligner la carte) ; mode light, sans round-robin d'agents (run autonome)"
participants: [dev, po]
actions:
  - proposition: "Au panel/ADR, vérifier qu'une direction d'appel prescrite ne crée pas de cycle d'import AVANT de la graver"
    kind: regle
    target: agent:ezk-architect
    by: [dev]
    status: ⏳
  - proposition: "Quand un changement de modèle rend un statut calculé-non-écrit (famille ADR-0077), auditer les tests qui figeaient l'ancienne surface écrite"
    kind: action
    by: [dev]
    status: ⏳
  - proposition: "Un contrôle pré-ship rapide (typecheck + tests affectés) pour raccourcir la cadence de gate en run multi-fiches"
    kind: feature
    by: [dev]
    status: ⏳
  - proposition: "Changer la forme d'une donnée partagée (ex. TokensSummary) impose d'auditer ses VALIDATEURS, pas seulement ses producteurs/consommateurs"
    kind: action
    by: [dev]
    status: ⏳
  - proposition: "Plusieurs 'lies' de la carte étaient des capacités jamais implémentées : aligner la doc sur le code CONSTATÉ (grep le code), pas sur la doc ancienne"
    kind: action
    by: [dev]
    status: ⏳
---

**En clair :** j'ai construit et livré en local 5 fiches prêtes des milestones `preparation`,
`carte` et `observabilite`, chacune avec sa revue adverse et sa gate verte. Cinq frictions méritent
une décision : un ADR a prescrit un câblage qu'un cycle d'import interdit ; un test et un validateur
figeaient des formes devenues mortes ; la gate complète (~6 min) a tourné une fois par fiche ; et
des « mensonges » de carte étaient des capacités jamais écrites. Rien n'est poussé — à toi de trancher.

## 1 · Les faits de départ

- `ezk-sprint close` se bloquait plus de 2 min en worktree (helper de compte rendu qui pend sur un
  `git fetch` réseau). Corrigé : fiche [close increvable](../../features/done/20261016203544694_sprint-close-ne-bloque-jamais-en-worktree.md).
- `ezk dor health` et le portfolio affichaient toujours « en cours : 0 » : ils lisaient le champ
  `status` écrit, mort depuis ADR-0077. Corrigé : fiche [recâbler en cours](../../features/done/20261015213921062_recabler-surfaces-in-progress-sur-branches.md).
- Le run autonome franchissait les bords d'une version en silence. Corrigé : fiche
  [checkpoint de version](../../features/done/20261015125606808_frontiere-version-checkpoint-run-autonome.md).
- La mesure de jetons ne séparait pas local vs PR+Codex, ni le cache. Corrigé : fiche
  [jetons par mode](../../features/done/20261017110956989_jetons-par-mode-local-vs-pr-codex.md).
- La carte de la méthode mentait sur le code (épic retiré encore routé, DoD « chantier », lifecycle
  `todo`, client `ezk-forge` fantôme). Corrigé : fiche
  [aligner la carte](../../features/done/20261015213921021_aligner-carte-methode-sur-le-code.md).

## 2 · Les frictions rencontrées (tour unique, mode light)

- **ADR vs graphe de modules.** ADR-0080 disait « `closeVersion` délègue à `seal()` ». Impossible
  tel quel : `versions.ts` ne peut importer `run-eligibility` (cycle). Réalisation équivalente —
  partager la DONNÉE (`lot.todo`), pas l'appel — mais l'ADR ne l'avait pas vu. Un panel qui grave une
  direction d'appel devrait la confronter au graphe d'imports d'abord.
- **Un test qui fige une surface morte.** `test-portfolio.sh` exigeait qu'une fiche au statut
  `in-progress` ÉCRIT s'affiche dans une section. ADR-0077 a rendu ce statut calculé-non-écrit : la
  section a changé, le test a cassé. La revue adverse l'a attrapé avant la gate. Quand un modèle
  bascule un statut en calculé, il faut auditer les tests de l'ancienne surface.
- **Cadence de gate.** La gate complète (~6 min, 2223 tests + 44 suites de scripts) a tourné une fois
  par fiche. Sûr, mais lent pour un run autonome. Un contrôle pré-ship rapide (typecheck + tests
  affectés) donnerait un premier verdict en secondes, la gate complète restant le juge avant merge.
- **Changer une forme partagée casse son VALIDATEUR, pas que ses lecteurs.** En ajoutant le cache à
  `TokensSummary`, le total est passé de `in+out` à `in+out+cache`. La revue a trouvé que le validateur
  `tokens.sum_mismatch` contrôlait encore `in+out == total` → tout run caché aurait été jugé invalide.
  Corrigé avant merge. Leçon : une forme de donnée partagée a aussi des validateurs à aligner.
- **Des « mensonges » de carte étaient des capacités jamais écrites.** En purgeant l'épic, constat :
  `aggregate --scope epic:` et le clustering par épic n'ont JAMAIS existé dans le code. Aligner la doc
  sur le code **constaté** (grep) — pas sur la doc ancienne — a souvent voulu dire retirer un mensonge,
  pas changer le code.

## 3 · Confrontation et convergence

Mode light : pas de round-robin d'agents (run autonome, budget jetons). Les 5 frictions ci-dessus
sont les seules retenues ; chacune est un symptôme vécu ce jour, pas une idée en l'air.

## 4 · Le juge de cohérence

Non joué (mode light). Aucune des 5 propositions ne contredit une règle existante à ma
connaissance ; la 1re viserait `ezk-architect` (interactions), la 3e serait une feature de backlog,
les autres sont des gestes/vigilances de revue.

## 5 · Ce qui est proposé au PO

| Fait vécu | Proposition | Mesure |
|---|---|---|
| ADR-0080 a prescrit un câblage qu'un cycle d'import interdit | Au panel, confronter une direction d'appel au graphe d'imports avant de la graver | 0 ADR livré avec un câblage irréalisable sur les 5 prochains |
| `test-portfolio` figeait une surface morte (statut écrit) | Auditer les tests de l'ancienne surface quand un statut bascule en calculé | 0 test figeant un statut écrit mort après un prochain ADR « calculé » |
| Gate ~6 min, une par fiche dans un run | Contrôle pré-ship rapide (typecheck + tests affectés) | 1er verdict en < 30 s, gate complète toujours avant merge |
| Le validateur `sum_mismatch` oubliait le cache ajouté | Changer une forme partagée → auditer ses VALIDATEURS, pas que producteurs/consommateurs | 0 validateur laissé sur l'ancienne forme après un prochain ajout de champ |
| `aggregate --scope epic:` documenté mais jamais implémenté | Aligner la doc sur le code CONSTATÉ (grep), pas sur la doc ancienne | sur la prochaine purge de doc, chaque capacité citée est vérifiée dans le code |

## 6 · Suivi des décisions de la rétro précédente

Rétro light du matin ([capture](2026-10-24-retro-run-preparation-light.md)) : la flakiness de gate
devait être résolue (collect-absorbed + project-root-bins). Tenu : la gate a tourné verte 4 fois ce
run, sans flake. Décision tenue.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| Direction d'appel confrontée au graphe d'imports au panel | ⏳ | |
| Auditer les tests d'ancienne surface quand un statut bascule en calculé | ⏳ | |
| Contrôle pré-ship rapide (typecheck + tests affectés) | ⏳ | |
| Changer une forme partagée → auditer ses validateurs | ⏳ | |
| Aligner la doc sur le code constaté (grep), pas la doc ancienne | ⏳ | |

## 8 · Glossaire

- **gate** : `pnpm gate` = typecheck + vitest + tests de scripts bash ; le juge avant un merge.
- **branche absorbée** : une branche dont le contenu est déjà dans `main` (squash passé) ; une
  branche fraîche sans commit l'est aussi (elle pointe sur `main`), donc pas « en cours » tant qu'il
  n'y a aucun commit — cohérent avec la vue web process.
- **checkpoint de version** : une version a deux gates calculées — `ready` (lançable à l'entrée) et
  `close`/`seal` (scellable à la sortie) ; ADR-0080.
