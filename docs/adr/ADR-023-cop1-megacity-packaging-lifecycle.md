# ADR-023 — Packaging & cycle de vie cop1 ↔ mega-city (monorepo vendoré, migrations réversibles)

**Statut :** Proposé (2026-07-12) — **Décision §1 révisée par [ADR-025](ADR-025-monorepo-codev-cop1-megacity.md)**
(2026-07-13 : le « monorepo vendoré » devient un co-développement dans un seul repo ; le reste tient)
**Déciders :** elzinko
**Étend :** [ADR-021](ADR-021-megacity-integration-boundary.md) (frontière d'intégration — inchangée)
**Dépend de :** merge d'ADR-021 + statut ADR-022 (cf. [fiche 0024](../../features/0024-resorber-peripherie-pre-pivot.md))

## Contexte

ADR-021 a tranché **la couture** cop1 ↔ mega-city : le contrat est le *format de
config native de cop1* ; mega-city l'écrit (cap cop1), cop1 le lit ; dépendance
vendorée + pin de version ; **aucun import de la lib mega-city au runtime**
(anti-décision #4). ADR-021 supposait implicitement **deux repos séparés**.

De nouvelles forces produit apparaissent, non couvertes par ADR-021 :

1. **Déploiement versionné.** Une instance déployée de cop1 = un tuple figé
   `(cop1@version, mega-city@version)`. Il faut que ce tuple soit non-ambigu et reproductible.
2. **MAJ in-app des deux.** cop1 doit pouvoir se mettre à jour depuis l'app (vignette/toast,
   comme le prompt de MAJ de Claude Code) **et** faire évoluer mega-city (depuis les plugins cop1
   ou autrement).
3. **Migrations séquentielles + rollback.** Toute bascule de version doit s'appliquer dans
   l'ordre, sans état intermédiaire cassé, et **autoriser le retour arrière**.
4. **Entrechocs de sessions concurrentes.** Deux sessions Claude Code / worktrees en parallèle
   sur des repos liés par des contrats se marchent dessus (skew de version cross-repo). L'utilisateur
   penche pour un **monorepo dans un premier temps**.

Tension apparente soulevée : « cop1 *importe* une version de mega-city » **et** « cop1 doit
être *indépendant* de mega-city ». Elle se lève en distinguant **build-time** (vendoring + pin)
de **runtime** (aucun import) — cf. Décision §2.

**Précédent interne (référence).** `job-app` vendore `my-resume`
(`thomas-couderc-resume` v1.1.0) comme *workspace package* `resume/` : copie committée in-tree,
pinnée à une version, développée en amont dans son repo standalone
(`~/git/elzinko/my-resume`), lancée avec le reste via `pnpm --filter`. Pas de submodule,
pas de symlink. C'est le modèle vendoré d'ADR-021 étendu du « config générée » au « package entier ».

## Décision

1. **Monorepo vendoré (premier pas).** mega-city est vendoré dans le repo cop1 comme
   *workspace package* pinné (p.ex. `vendor/mega-city/`), **source de vérité restant le repo
   mega-city standalone**, synchronisé par bump de version (modèle job-app/resume). L'étape
   build/gouvernance de cop1 lance `mega-city bind … cop1` et **commite la config générée**.
2. **Build-time couple, runtime indépendant.** cop1 *vendore + pinne* mega-city (build-time :
   « importe une version ») mais son **runtime lit uniquement la config native committée** et
   n'`import`e jamais la lib mega-city (honore ADR-021 anti-décision #4). mega-city absent/cassé
   ⇒ cop1 tourne.
3. **Le tuple de version est le commit du monorepo.** `(cop1@sha, mega-city@vX.Y)` est capturé
   par construction (le vendoré est in-tree). Un manifeste lisible `governance/megacity.pin`
   (version + tag/SHA + hash de la config générée) double le SHA pour humains et CI.
4. **Migration = un commit atomique, rollback = son revert.** Chaque bump : re-`bind` →
   diff de config générée → **un seul** commit `chore(governance): sync mega-city@vX.Y`
   embarquant *à la fois* le moteur vendoré et sa config générée. Séquentiel par ordre de commit.
   **Rollback = `git revert` de ce commit** → restaure atomiquement la paire (moteur, config).
   Le **check CI de drift** d'ADR-021 (re-`bind` contre la version pinnée) garantit le read-only.
5. **Canaux de MAJ = même machinerie.** MAJ cop1 (vignette, release cop1) et bump mega-city
   (plugin cop1) se réduisent tous deux à « appliquer une migration, proposer un rollback ».
6. **mega-city reste host-agnostic et releasable seul.** `caps/cop1/` vit **côté mega-city** ;
   le cœur mega-city n'importe jamais cop1. Le monorepo est un confort de dev/versioning,
   **pas** une subordination — mega-city sert toujours claude-code, cursor, … et se `build`/publie
   seul (`pnpm --filter mega-city`).

## Options considérées

### Option A — Copie vendorée in-tree (monorepo, précédent job-app) — **RETENUE**
| Dimension | Évaluation |
|-----------|------------|
| Complexité | Faible (déjà pratiqué sur job-app) |
| Rollback | **Atomique** (`git revert` d'un commit couvre moteur + config) |
| Skew cross-repo | Éliminé (un seul tuple = un SHA) |
| Offline / reproductible | Oui (rien à résoudre au build) |
| Risque | Drift entre la copie et le repo amont → mitigé par drift-check CI (ADR-021) |

**Pour :** zéro version-skew, rollback atomique, muscle memory existant, préserve l'indépendance
runtime. **Contre :** deux « homes » pour mega-city (repo amont + copie vendorée) → discipline de sync.

### Option B — Git submodule (pin par SHA)
**Pour :** un seul home, pin explicite. **Contre :** ergonomie submodule douloureuse ; rollback
non-atomique (revert du pointeur ≠ revert de la config générée) ; l'utilisateur a déjà écarté le symlink pour raisons voisines.

### Option C — Fusion totale (mega-city devient `packages/mega-city` de cop1)
**Pour :** un seul arbre, atomique. **Contre :** **tue la raison d'être host-agnostic de mega-city**
(ne servirait plus claude-code/cursor seul) — contredit ADR-021 et l'exigence « cop1 indépendant de
mega-city ». **Écartée.**

### Option D — Dépendance publiée + lockfile (cible à terme)
`mega-city` publié sur un registry ; cop1 dépend via `package.json` ; le lockfile = le pin ;
rollback = revert du lockfile. **Pour :** outillage standard, un seul home. **Contre :** exige une
infra de publication et des **releases stables** — or mega-city est un POC (~10 commits, pas de
release taguée). **Tenue en réserve** : bascule A → D quand mega-city aura de vraies releases.

## Analyse des trade-offs

Le choix se joue entre **A (vendoré)** et **D (publié)**. D est plus propre mais prématuré
(mega-city n'a pas de release). C est disqualifié car il sacrifie l'host-agnosticité — le seul
actif qu'ADR-021 protège. B hérite des douleurs de couplage sans le bénéfice de rollback atomique.
A donne *aujourd'hui* le bénéfice décisif — **rollback atomique de la paire (moteur, config) en un
`git revert`** — tout en gardant le seam (fichiers de config) identique à ADR-021, donc **la bascule
A → D plus tard ne change pas le contrat**, seulement le mécanisme de livraison du vendoré.

## Conséquences

- **Plus facile :** déploiement reproductible (tuple = SHA) ; rollback en une commande ;
  migrations séquentielles triviales ; fin du version-skew cross-repo (les « entrechocs »).
- **Plus difficile :** maintenir la copie vendorée alignée sur le repo amont (drift-check CI
  obligatoire, sinon deux vérités divergent) ; discipline read-only sur la config générée.
- **À revisiter :** bascule A → D quand mega-city taguera des releases (fiche mega-city 0005) ;
  format de matérialisation des agents/skills (Phase 2 d'ADR-021) ; besoin éventuel d'un MCP
  (différé, ADR-021 §6).
- **Décision symétrique attendue côté mega-city :** une fiche actant `caps/cop1/` + le fait que
  mega-city se `build`/release seul (garantie d'host-agnosticité). À créer dans le repo mega-city.

## Action Items

1. [ ] Prérequis : merger ADR-021 + statuer ADR-022 (fiche 0024).
2. [ ] Choisir l'emplacement du vendoré (`vendor/mega-city/` vs `packages/`) et l'ajouter au `pnpm-workspace.yaml`.
3. [ ] Écrire `governance/megacity.pin` (version + tag/SHA + hash config générée).
4. [ ] Script de sync `chore(governance): sync mega-city@vX.Y` (re-`bind` → commit atomique moteur+config).
5. [ ] Check CI de drift (re-`bind` contre le pin, échoue si diff) — cf. ADR-021.
6. [ ] Câbler les deux canaux de MAJ (vignette cop1 ; bump mega-city depuis plugin) sur « migration + rollback ».
7. [ ] Fiche symétrique côté mega-city (`caps/cop1` + garantie standalone-releasable).
