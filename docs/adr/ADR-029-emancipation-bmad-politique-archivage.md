# ADR-029 — Émancipation de BMAD & politique d'archivage de l'époque 1

**Statut :** Proposé (2026-07-15) — **à relire par l'humain avant toute exécution.**
Rédigé puis passé au panel adverse (3 lenses + juge, 2026-07-15) : 3 bloquants et 8
majeurs corrigés dans la présente version.
**Déciders :** elzinko (PO — a tranché l'émancipation le 2026-07-15 : « il faut
s'émanciper de BMAD absolument, sinon on va garder des anciennes stories »)
**Révise :** [ADR-026](ADR-026-agent-executor-seam.md) — son non-but « le dossier
`bmad-orchestration/` est gardé » devient « gardé **jusqu'à E4** » ; la fiche 0034
(D2 « généraliser, pas supprimer » → « généraliser, **prouver, puis** retirer
l'adaptateur » ; D6 et D9 → **tranchées**, cf. Décision 1).
**Étend :** [ADR-022](ADR-022-control-plane-ontology.md) (Method/Task port : BMAD devient
une implémentation **en fin de vie**), [ADR-028](ADR-028-lecteur-journal-mode-moniteur.md)
(le mode nominal est déjà BMAD-free).
**Ne révise PAS :** ADR-025 §5 (immuabilité des deux séquences ADR — voir Décision 2 pour
son périmètre exact) ni ADR-027 (clone pour l'historique).

## Contexte

Le pivot (ADR-021→028, capture 2026-07-14) a fait du **mode moniteur** le chemin nominal
de cop1 — un chemin qui n'utilise pas BMAD. Le couplage BMAD survit dans le **mode
pilote** (différé) : **59 fichiers TS prod** mentionnent BMAD, dont **25** dans les
quatre unités BMAD-spécifiques (`bmad-bridge`, `bmad-reader`, `bmad-orchestration`,
`DefaultBMADCommandRunner`) et **34** dans des features survivantes (OrchestratorService,
WorkspaceChanges, iamthelaw, steps workflow…) qui les *référencent*. S'y ajoutent la
garde pré-flight (`orchestrator.ts` jette si `_bmad/` absent — exécutée dans
`resolveRunner`, **pas** au démarrage du daemon), `_bmad/` (27 fichiers de
**customisation projet** commités — une réinstallation `bmad install` ne les régénère
PAS), et `_bmad-output/` — lu au runtime par **plusieurs** consommateurs :
`sprint-status.yaml` (deux lecteurs : `YamlSprintStatusAdapter` **et**
`OrchestratorService` en readFile direct, allowlist du test d'invariant à l'appui),
`SupervisorContextLoader` (planning-artifacts), `WorkspaceChanges` (classement
d'artefacts).

Le PO tranche (2026-07-15) les arbitrages D6/D9 restés ouverts dans la fiche 0034 :
**émancipation**. Motif produit : tant que le Method port lit des epics/stories BMAD, le
backlog vivant du pilote reste l'ancien monde — alors que le format natif existe déjà
(`features/*.md`, front-matter YAML, convention ezk-backlog).

Le PO propose en même temps une **remise à zéro du repo** (supprimer ADR/features
caduques, renuméroter, first commit — « l'histoire restera dans l'ancien projet cop1 »).
Trois faits contraignent cette seconde proposition :

1. **ADR-025 §5 rend immuables les deux séquences ADR existantes** (cop1 `docs/adr/`,
   mega-city) : elles se révisent par bannière, jamais par suppression. NB : les
   « planning-ADRs » ADR-005/ADR-009 ne sont dans **aucune** des deux séquences — ce sont
   des sections de `_bmad-output/planning-artifacts/architecture.md` (corpus artefacts
   méthode, traité en Décision 2).
2. **L'histoire du pivot n'existe que dans vectorz.** Le clone est fait ; le gel formel
   des originaux (ADR-027 AI-3 : tag + README pointeur) est **planifié, non vérifié**
   (fiche 0034). Mais quelle que soit l'issue d'AI-3, les PRs #1→#10, les fiches
   0030→0037 et la présente salve n'existent **que** dans ce repo : un first commit
   effacerait l'histoire *du pivot*, pas celle de BMAD.
3. **Valeur opérationnelle démontrée le jour même** : les panels adverses du 2026-07-15
   n'ont pu vérifier leurs claims qu'en relisant les anciens textes et l'historique
   (`3cb9db2`, `d200f0e`) ; la renumérotation des PRs post-subtree a déjà montré le coût
   des références cassées.

## Décision

### Décision 1 — Émancipation de BMAD (actée, séquencée E1→E4, gated)

BMAD cesse d'être une dépendance du control-plane cop1. **Ordre cardinal : on construit
le remplaçant, on le prouve, puis on retire** — le pilote continue de tourner sur BMAD
jusqu'au switch prouvé ; il n'y a pas de fenêtre d'indisponibilité.

- **E1 — Généraliser les ports** (= lots L5/L6 de 0034, inchangés) : `AgentSessionPort`
  (ADR-026), Method/Task port promu depuis `SprintStatusPort`, StubExecutor (rappel : un
  test double, **pas** un exécuteur fonctionnel de repli).
- **E2 — Sortir `sprint-status.yaml` de `_bmad-output/`** : ownership tranché par la
  fiche 0037 (D7), puis **lot code dédié** (à créer — 0037 ne porte que l'arbitrage) qui
  re-cible les **deux** lecteurs (`YamlSprintStatusAdapter`, `OrchestratorService`) et
  l'invariant de couplage. Fenêtre E2→E4 : les workflows BMAD écriraient dans le vide —
  **gel des runs pilote** sur cette fenêtre (ou pont d'écriture temporaire, à trancher
  dans le lot). E2 est **démo-safe** (le daemon ne lit pas ces chemins au démarrage).
- **E3 — Pilote natif complet** (le gros morceau, volontairement gonflé) :
  - *Stories* : le Method port lit `features/*.md` — avec les **quatre volets** que le
    front-matter seul ne couvre pas : sémantique épic/ordre (remplace
    `extractStoryKeysForEpic`), **écriture** en retour des statuts (`persistStatus`,
    5 sites — port promu lecture-écriture + règle de cohabitation avec l'édition humaine
    du front-matter), table de mapping des statuts BMAD→natifs, sort du checksum.
  - *Méthode* : un **exécuteur générique** remplace `DefaultBMADCommandRunner` (les
    commandes par story ne viennent plus des workflows `_bmad/`) ; destin de
    `SupervisorPlaybookLoader`/`BmadCycle` tranché (format playbook natif ou mort du
    concept avec l'exécuteur BMAD).
  - *Gouvernance* : le sidecar iamthelaw (`FileSidecarAdapter` →
    `_bmad/_memory/iamthelaw-sidecar/`) est re-ciblé vers un emplacement natif
    (`.cop1/`) ou acté mort avec le canal BMAD.
  - *Tests* : les tests d'intégration du pilote (`orchestrator-e2e`,
    `orchestrator-real-run`) migrent sur **fixtures natives**.
  - **Gate de sortie E3 = critère d'entrée E4 : un run pilote de bout en bout vert sur
    fiches natives, zéro lecture BMAD.**
- **E4 — Retrait (post-gate, et strictement post-démo** — la suppression code casserait
  le build du daemon via la chaîne d'import**)**, en trois natures de travail :
  - *(a) Relogement* : l'infra **générique** hébergée physiquement sous
    `bmad-orchestration/` (`AgentSdkSupervisorAdapter`, `DefaultModelTierRouter`,
    `ClaudeAvailability`, `InMemorySupervisorAdapter`, `SupervisorService`…) déménage
    vers sa feature de destination **avant** toute suppression de dossier.
  - *(b) Suppression du BMAD-spécifique* : les 4 unités (~25 fichiers), le flag `useBMAD`
    + agents legacy (D6 tranché), la garde pré-flight, `_bmad/` et `_bmad-output/` du
    working tree (D9 tranché — l'historique git les conserve, retrouvables au tag
    d'ancrage), la surface CLI/env (`init-bmad-bridge`, description de `--runner`,
    `COP1_BMAD_ADAPTER`, `COP1_ALLOW_STUB_RUNNER`).
  - *(c) Purge des références* : les ~34 fichiers de features survivantes sont **édités**
    (pas supprimés) ; les docs vivants BMAD-couplés (GETTING_STARTED,
    running-cop1-on-a-project, supervisor-playbook) réécrits ou archivés.
  - Garde-fou permanent : la règle d'allowlist (L2) gagne « **zéro import/chemin `bmad`**
    dans le graphe de prod cop1 », étendue aux fixtures des features survivantes.
- **Rollback** : tag d'ancrage **`epoch-1-bmad-final`** posé juste avant E4 ; E4 = une PR
  (convention 1 PR/lot) → rollback = revert de la PR ou checkout du tag. La note
  « réinstallable via `bmad install` » de 0034 D9 est **corrigée** : les customisations
  commitées ne se réinstallent pas, seul l'historique les garde.

**Portée** : l'émancipation vaut pour **cop1-le-control-plane** (plus aucune dépendance à
BMAD dans le graphe de prod). BMAD reste légitime **comme sujet supervisé** côté
mega-city (un manager/méthode qui *émet* le contrat de supervisabilité) — les fiches
mega-city 0058/0059 qui s'appuient sur les briques pilotées par cop1 font l'objet d'un
arbitrage explicite (question ouverte 2) **avant** E4.

### Décision 2 — Époque marquée, pas d'effacement (option B)

- **Séquence `docs/adr/` : bannière, jamais de suppression** (périmètre exact
  d'ADR-025 §5). Tout ADR de la séquence rendu caduc reçoit `⚫ Caduc — révisé par
  ADR-029` ; ADR-026 reçoit sa bannière de révision partielle.
- **Corpus `_bmad-output/` (planning-ADRs 001→014 inclus) : politique distincte** — ce
  sont des artefacts méthode, hors séquences immuables. Les décisions **encore
  vivantes** de ce corpus sont extraites vers `docs/adr/` **avant** E4 (à l'analyse : la
  plupart sont déjà supersedées — ADR-005 « LLM Routing & Access Tiers » l'est de facto,
  ADR-009 « sprint-status source de vérité » le sera par E2) ; le reste part en
  historique git, retrouvable au tag d'ancrage. Pas de mécanisme bannière pour des
  fichiers supprimés du tree.
- **Registre de lecture `docs/adr/README.md`** : livrable **explicite de cette décision**
  (nouvelle fiche — il n'existe pas aujourd'hui et n'est PAS porté par 0035) : quoi est
  vivant, consolidé, caduc.
- **Features caduques : archivées, pas supprimées** (`done/` + note « caduque par
  ADR-029 ») ; **numérotation continue** (la redémarrer orphelinerait 0034→0037 et
  toutes les références des PRs/panels).
- **Historique conservé ; époque marquée par deux tags** : `epoch-1-bmad-final` (ancrage,
  juste avant E4) et `epoch-2-post-bmad` (au merge d'E4) + section README « Époques ».
  Le préfixe `epoch-*` est réservé aux marqueurs d'époque, jamais interprété comme
  release (orthogonal au versionnement ADR-025 §2).

## Options considérées (Décision 2)

### Option A — Effacement total (proposition initiale PO)
Supprimer ADR/features caduques, renuméroter à 0, first commit unique.

| Dimension | Évaluation |
|-----------|------------|
| Symbolique « repartir propre » | ✅ forte |
| Conformité ADR-025 §5 (séquences) | ❌ violée |
| Histoire du pivot (PRs #1→#10, fiches 0030→0037) | ❌ **détruite** (n'existe que dans vectorz) |
| Références vivantes (fiches, PRs, panels) | ❌ toutes cassées |
| Vérifiabilité (audit trail) | ❌ perdue — démontrée indispensable le jour même |
| Réversibilité | ❌ nulle (force-push) |

### Option B — Époque marquée (retenue)
Bannières sur la séquence + extraction du vivant de `_bmad-output/` + archivage `done/` +
numérotation continue + double tag d'époque + registre.

| Dimension | Évaluation |
|-----------|------------|
| Symbolique | ✅ deux tags + README « Époques » + ADR fondateur |
| Conformité textes (025 §5, 027) | ✅ totale |
| Histoire & références | ✅ intactes |
| Lisibilité quotidienne | ✅ registre + **graphe de prod cop1 sans BMAD** post-E4 (claim exact, garanti par l'allowlist) |
| Coût | ✅ marginal, porté par les lots existants |

### Option C — Nouveau repo greenfield `vectorz-v2`
Re-clone squashé sous identité neuve. Écartée : refaire la migration qu'ADR-027 vient
d'exécuter, en perdant cette fois l'historique (mêmes arguments que l'option C d'ADR-027).

## Analyse des trade-offs

Le besoin réel derrière « tout supprimer » est **« que le repo dise clairement ce qui est
vivant »**. L'option A l'achète au prix de l'outil de vérification (l'histoire) — dont
l'émancipation elle-même a besoin : chaque suppression E4 devra être justifiable, et
c'est l'ADR + l'historique qui répondent. L'option B fournit la même clarté par la
**surface** (graphe de prod sans BMAD, registre, tags) sans toucher à la **profondeur**.
Sur la Décision 1, le trade-off central est le **séquencement** : supprimer d'abord
(big-bang) aurait laissé le pilote sans exécuteur ; construire-prouver-retirer coûte un
lot E3 gonflé mais supprime le risque d'indisponibilité et donne un rollback trivial.

## Conséquences

- **Plus facile :** backlog unique (fiches natives) pour les deux modes ; fin de
  l'ambiguïté « nettoyer vs émanciper » ; le terminus du chantier L5/L6 est écrit.
- **Plus difficile :** E3 est un vrai chantier (4 volets stories + exécuteur générique +
  gouvernance + tests) — c'est le prix du « pas de big-bang » ; E4 est un **tri +
  relogement + purge** (pas une suppression mécanique) ; ADR-026 et la fiche 0034 doivent
  être amendés ; mega-city 0058/0059 exigent un arbitrage avant E4.
- **À revisiter :** le format natif exact (champ `steps:` ? sémantique épic ?) — instruit
  en E3 ; la politique `_bmad-output/` si des décisions vivantes insoupçonnées émergent à
  l'extraction.

## Non-buts

- **Renommage `cop1` → nom « tour »** : toujours différé (DP8, arbitrage indépendant).
- **Suppression du mode pilote** : il change de carburant *après preuve*, pas d'existence.
- **Réécriture des anciens ADR de la séquence** : bannières uniquement.
- **First commit / squash / renumérotation** : écartés (option A).
- **Émanciper mega-city de BMAD** : hors scope — BMAD y reste un sujet supervisable.

## Questions ouvertes (relecture humaine)

1. **Arbitrage mega-city 0058/0059 (requis avant E4)** : (i) séquencer 0058 avant E4
   (l'expérience utilise l'adaptateur tant qu'il vit), (ii) la déclarer caduque par
   ADR-029, ou (iii) la re-scoper sur un pilotage BMAD externe à cop1.
   *Recommandation : (iii) si 0058 vise l'émission du contrat par la méthode ; sinon (i).*
2. Destination de `sprint-status.yaml` en E2 : `.cop1/` (état piloté) ou `.supervision/`
   (journal) ? — à trancher dans 0037.
3. E2 dès maintenant (amont P1, démo-safe) ou tout post-démo ?
   *Recommandation : 0037 (arbitrage) maintenant, lot code E2 post-démo avec E3.*

## Action items (après relecture humaine)

1. [ ] Statuer le présent ADR (Proposé → Accepté).
2. [ ] Amender la fiche 0034 : D2/D6/D9 tranchées par ADR-029 ; corriger la note D9
       (« réinstallable » trompeur) ; ajouter les lots E (E2-code, E3, E4).
3. [ ] Créer les fiches : lot code E2 (re-ciblage des deux lecteurs + invariant), E3
       (pilote natif, 4 volets + exécuteur + gate), E4 (relogement/suppression/purge),
       registre `docs/adr/README.md`.
4. [ ] Trancher l'arbitrage 0058/0059 côté mega-city (question ouverte 1) avant E4.
5. [ ] Bannières : « révisé par ADR-029 » sur ADR-026 (avec la passe 0035) ; extraction
       des décisions vivantes de `_bmad-output/planning-artifacts/` avant E4.
6. [ ] Tags : `epoch-1-bmad-final` juste avant E4 ; `epoch-2-post-bmad` + section README
       « Époques » + règle allowlist « zéro bmad » au merge d'E4.
