# Sprint — carte-loi : ouvrir LA LOI dans ezk:map (fiche 20260821172716537)

Périmètre: 1 feature POC, mode lean.
Branche: `feat/20260821172716537-carte-loi` (base origin/main `5b6e950`).
Statut: PR #179 OUVERTE (non mergée) — en attente de revue PO

## Backlog  (1 ligne = 1 feature = 1 PR)
- [~] feat: carte-loi — règles/bundles/profils + « qui active quoi » lus du graphe compilé — **PR #179 ouverte, non mergée** (décision PO : relire d'abord)

## Definition of Done  (critères fiche 20260821172716537)
- [ ] Chercher « composition »/« règles » sur la carte aboutit — le concept se voit
- [ ] règles/bundles/profils affichés comme nœuds, lus du graphe compilé (pas des `.yml`)
- [ ] liens bundle→règle, profil→bundle, profil→agent/skill, règle→agent visibles + sourcés (provenance fichier)
- [ ] « qui active quoi ? » pour un profil sans ouvrir un `.yml`
- [ ] Sabotage : ajouter un bundle → `graph:compile` → apparaît sans éditer la carte
- [ ] la carte LIT l'objet compilé, ne recompile pas au bord (doctrine D5)
- [ ] gate hôte verte (build + test + lint) ; E2E navigateur vert ; revue GO

## Notes / décisions
- **Intake / reconcile (2026-08-26)** : local était **14 commits derrière origin/main** →
  mergé (le « reconcile » demandé par le PO était déjà fait sur origin : #177/#178, grooming,
  fiche carte-loi passée ready + mise en tête du plan). Base du sprint = origin/main frais.
- **Portier `check` = ALERT points=2,3** : 5 worktrees frères + 5 fiches in-progress
  (0030/0088/0164/357/652). **Override PO journalisé** : aucune ne concerne la fiche
  20260821172716537 (elle est todo+ready, pas in-progress) ; aucun worktree ne construit
  carte-loi. ALERT = état ambiant / dette héritée, pas un conflit de ce sprint → proceed.
- **Source de données** = `.ezk/graph.compiled.json` (107 nœuds, 187 liens), généré par
  `graph:compile` (ADR-0040 D5 : la carte lit, ne recompile pas au bord).
- **Archi TRANCHÉE (ezk-architect, ADR-0041)** — `docs/adr/0041-carte-la-loi-lecteur-runtime-graphe-compile.md` :
  - D1 : carte **dédiée** `diagrams/la-loi/`, on n'étend PAS `methode-mega-city` (elle est alimentée au build → fragile).
  - D2 : la page **`fetch('/.ezk/graph.compiled.json')`** au runtime (D5 honoré) ; `compileGraph` reste le dériveur unique ; `map-data.ts` inchangé (convergence = chantier séparé).
  - D3 : provenance par **convention `(kind,id)→chemin`**, **gardée par un test** (chaque chemin dérivé existe, sinon CI rouge) ; vrai `sourcePath` stampé = amendement ADR-0040 ultérieur.
  - Découverte : `bin/ezk-map.ts` sert déjà tout le dépôt (`.ezk/…` accessible) → POC quasi tout front, sabotage passe seul.
  - Ne PAS toucher : `bin/ezk-map.ts`, `src/core/compiled-graph.ts`, `src/core/map-data.ts`, `carte-interactive.html`.
- **BDD livré (ezk-qa)** : `src/core/__tests__/loi-carte.feature` (6 scénarios = les 6 critères).
- **Revue adverse (ezk-reviewer) = NO-GO puis corrigé.** P0 = `whoActivates` ignorait
  l'héritage (`profile-extends`/`bundle-extends`) → réponse fausse pour 5 profils/6.
  Correctif : logique extraite dans `loi-view.ts` (pure, testée, fermeture transitive) +
  `enforcingAgents` (rule→agent, AC3) + `textContent` (anti-XSS) + synonymes FR de recherche
  (AC1). ADR-0041 aligné (`carte-la-loi`, limite péremption). Re-revue envoyée.
- **Gate + E2E (revalidés)** : `typecheck` vert · `loi-view.test.ts` **9/9** verts · carte
  servie sur :4188, profil `mobile` → bundles=[base, mobile], règles héritées, skill
  `ezk-archive` hérité ; clic règle → agent `enforces` ; recherche « règles »→59, « composition »→18.
- **Pré-existant hors périmètre** : `avancement-board`/`plan-view-board` rouges (drift
  `board.html` sur origin/main) — à traiter séparément.
- Supervision : run absorbé (ouvert par ezk-product-build) ; gate du checkpoint = dans ce run.
