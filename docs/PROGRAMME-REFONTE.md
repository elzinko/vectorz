# Programme — Refonte époque 2 (méthode Vectorz / mega-city)

**Objectif :** rendre la méthode **fonctionnelle** pour un throughput solo :
boucles LLM allégées, transition époque 1→2 **soldée**, identité et docs alignées
sur le Moniteur + `products/`.

**Audit source :** [`docs/audits/2026-07-27-transition-epoch-2.md`](audits/2026-07-27-transition-epoch-2.md)  
**Branche / PR :** [`refactor/epoch-2-harden-method`](https://github.com/elzinko/vectorz/pull/62)

Légende checklist : `[ ]` à faire · `[~]` en cours · `[x]` fait

---

## Chemin nominal (dogfood) — sans BMAD

Aujourd'hui on avance **ce** repo uniquement avec :

1. **Backlog** — `features/` + skill `ezk-backlog` (front-matter = statut)
2. **Build** — `ezk-product-builder` → `ezk-sprint` (chemins trivial / standard / lourd)
3. **Supervision** — émetteur mega-city → `.supervision/runs/` + **Moniteur** (ADR-028)
4. **Clôture** — `ezk-archive` (défaut `check`)

**BMAD n'est pas** la méthode d'avancement de vectorz/mega-city.  
BMAD comme *méthode émettrice supervisée sur un autre projet* (hooks, sidecar,
fiche [2058](../features/2058-bmad-contrat-supervisabilite.md), [ADR-032](adr/ADR-032-emission-adaptateur-separable.md))
reste une **feature future inachevée** — on conserve les *adaptateurs / interfaces*
(`bmad-bridge`, ports), pas les artefacts `_bmad*` de self-hosting époque 1.

---

## Phase 0 — Cadre & identité

**Done when :** audit + programme vivants ; README / identité Vectorz époque 2 ;
CI mentionnée correctement.

- [x] Livrable audit `docs/audits/2026-07-27-transition-epoch-2.md`
- [x] Ce programme vivant
- [x] README racine réécrit (Moniteur + `products/`, plus « No CI »)
- [x] `package.json` name → `vectorz` (workspace inchangé)

---

## Phase 1 — Alléger `ezk-sprint` (ROI #1)

**Done when :** le skill documente **3 chemins** (trivial / standard / lourd) avec
règles de skip explicites (sous-agents, `act`+Docker) **sans casser** le contrat
existant (gates locales / E2E UI / checkpoint).

- [x] Section « Trois chemins » dans `products/mega-city/skills/ezk-sprint/SKILL.md`
- [ ] Mesure tokens : 1 sprint trivial vs standard (noter dans Journal)
- [ ] Optionnel : flag / consigne product-builder pour forcer un chemin

---

## Phase 2 — Profil daily curated (ROI #4)

**Done when :** un profil `daily` léger existe ; doc `profiles/README` le recommande
pour `bind-global` ; `global` reste l'exhaustif.

- [x] Créer `products/mega-city/profiles/daily.yml` (sans apk/device/preview/article/pr-pilot)
- [x] Documenter dans `profiles/README.md`
- [ ] Switchover opérateur : `pnpm --filter mega-city lawgiver bind-global daily --link` (manuel)
- [ ] Steward : vérifier catalogue / sync après usage réel

---

## Phase 3 — Archive défaut `check` (ROI #3)

**Done when :** sans argument / « on archive ? » → **`check`** (dry-run) ; `run` seulement
sur DIRTY + accord ; cible mesure ≤28k tokens sur CLEAN.

- [x] Défaut documenté / changé vers `check` dans `ezk-archive/SKILL.md`
- [ ] Mesure tokens clôture CLEAN (cible ≤28k) — noter dans Journal *(park 2088)*
- [x] Si DIRTY : protocole « check → résumé → run » rappelé dans product-builder

---

## Phase 4 — Fusion backlogs (ROI #2)

**Done when :** une seule liste `features/` + champ `product:` ; 0 collision d'ids ;
fiche **0064** shipped ; outillage `mc-` / `plan:head` simplifié ou retiré.

- [x] Mapping + erratum ADR-0017 A13
- [x] Migration mécanique mega-city → racine (`product: mega-city`, ids +2000)
- [x] Update `ezk-backlog` / PLAN / regen / plan:head / portfolio / archive
- [x] Ship fiche 0064 — AC verts ; scan liens prose ; regen/portfolio OK ; shipped PR #62

---

## Phase 5 — Ship or kill 0094 / 0095 (ROI #5)

**Done when :** preuve runtime ≤1h **ou** kill/park explicite avec motif dans la fiche.

- [x] **2094** (ex-mc-0094) — PARK `blocked` : dev livré, AC dogfood Moniteur en attente
- [x] **2095** (ex-mc-0095) — PARK `blocked` : consignes livrées, observation dépend de 2094
- [x] **2088** (ex-mc-0088) — PARK `blocked` : portier livré, mesure ≤28k en attente

---

## Phase 6 — BMAD isoler / purger (ROI #6)

**Done when :** mode moniteur 100 % BMAD-free prouvé ; artefacts `_bmad*` hors arbre
tracké ; défaut `useBMAD: false` ; design « BMAD émetteur » documenté comme futur
(pas comme runtime dogfood).

- [x] Inventaire lecteurs runtime `_bmad*` (`docs/audits/2026-07-28-bmad-runtime-inventory.md`)
- [x] Isoler : test moniteur BMAD-free ; docs flag `useBMAD`
- [x] Purge artefacts trackés `_bmad/` + `_bmad-output/` (+ gitignore) — commit
  `578729d` ; dogfood mega-city ne les lit pas ; historique au tag `epoch-1-bmad-final`
- [x] Défaut `workflow.useBMAD` → `false` (`ConfigSchema`)
- [x] Tamponner ADR-028 (Accepté) / ADR-022 (Accepté ontologie)
- [x] **E4 code pilote cop1** (fiche 0039) : backend pilote retiré — `bmad-reader`,
  `bmad-orchestration`, `orchestrator/`, routes `POST /api/orchestrator/*` et
  `GET /api/sprint/status` ; CLI `orchestrator` / `sprint` / `transcript` stubbés
  vers mega-city ; `bmad-bridge` conservé (2058)
- [x] Feature future 2058 : BMAD = émetteur sur projet cobaye (adapters
  `bmad-bridge` + `init-bmad-bridge`, ports — pas de réintroduction `_bmad*` trackés)

---

## Phase 7 — Hygiene ADRs & onboarding

**Done when :** GETTING_STARTED / index pointent époque 2 ; ADR tamponnés.

- [x] Réécrire `docs/GETTING_STARTED.md` (Vectorz, pas BMAD-first)
- [x] Pointer `docs/index.md` vers programme + audit
- [x] ADR-028 → Accepté (erratum statut)
- [x] ADR-022 → Accepté (ontologie de référence)

---

## Journal

| Date | Commit / PR | Note |
| --- | --- | --- |
| 2026-07-27 | [PR #62](https://github.com/elzinko/vectorz/pull/62) | Ouverture programme + phases 0–3 |
| 2026-07-28 | `76b9439` | P4 data — liste unique + offset +2000 |
| 2026-07-28 | `5462e89` | P4 outillage — regen/plan/portfolio/archive |
| 2026-07-28 | `55b0e73` | P5 park 2094/2095/2088 |
| 2026-07-28 | `dc8ca5f` | P6 isolation BMAD |
| 2026-07-28 | `c2bffe8` | P7 docs/ADR + programme |
| 2026-07-28 | `9824b4c` | Scan liens prose 0064 + hygiene useBMAD + rappel archive DIRTY |
| 2026-07-28 | `578729d` | Purge artefacts `_bmad*` ; dogfood = mega-city only ; `useBMAD` défaut false |
| 2026-07-28 | `3dba7ba`–`291fb59` | Cleanup : E4 pilote vs purge ; docs pilot ; useBMAD exemple ; DEPRECATED |
| 2026-07-28 | `c05689f`–`c683ff0` | Purge UI BMAD-in-monitor + audit dead-path ; `bmad-bridge` marqué 2058 |
| 2026-07-28 | `edea755` | Messages deprecation epoch-2 (PipelineStepFactory + HTTP pilote) |
| 2026-07-28 | `a52b63c` | ADR registre + E4 progress (029, 025/027 layout) |
| 2026-07-28 | E4 | Backend pilote cop1 retiré ; allowlist zéro-bmad ; tag `epoch-2-post-bmad` |

### Reste vraiment ouvert

- Mesures tokens (sprint trivial vs standard, archive CLEAN ≤28k) — dogfood manuel (2088)
- Switchover `pnpm --filter mega-city lawgiver bind-global daily --link` — manuel opérateur
- **E4 backend pilote cop1** — ✅ fait (0039 shipped PR #62)
- Tag `epoch-2-post-bmad` — ✅ posé
