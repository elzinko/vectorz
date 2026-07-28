# ADR-027 — Vectorz : umbrella neutre, cop1 & mega-city produits co-égaux (option E′)

**Statut :** Proposé (2026-07-14) — **exécuté en layout** (2026-07-28) : clone vectorz,
`products/cop1/` + `products/mega-city/`, `package.json` name `vectorz`, workspace
`products/cop1/packages/*`. Tag gel des originaux = planifié (ADR-027 AI-3) ; à relire PO
pour tampon **Accepté** formel.
**Déciders :** elzinko
**Révise :** [ADR-025](ADR-025-monorepo-codev-cop1-megacity.md) — remplace sa Décision §1
(« mega-city = workspace package du repo cop1, `mega-city/` à la racine ») par **E′ : umbrella
neutre `Vectorz`, deux produits co-égaux sous `products/`**. Le reste d'ADR-025 (versionnement
d'ensemble §2, garde-fous CI §3, backlog partagé §4, ADRs immuables §5, re-bind §6) **tient**.
**Étend :** [ADR-021](ADR-021-megacity-integration-boundary.md) (frontière, zéro import runtime,
host-agnosticité), [ADR-023](ADR-023-cop1-megacity-packaging-lifecycle.md) (build-time couple /
runtime indépendant, migrations réversibles, option D en réserve), [ADR-022](ADR-022-control-plane-ontology.md)
(ontologie 7 briques / 3 ports — dont ce layout est la projection en dossiers).

## Contexte

ADR-025 a acté le co-développement en un seul repo (option E) mais a **explicitement différé**
l'umbrella neutre E′ (« plus juste symboliquement, mais migration ×2 — écartée pour l'instant,
compatible plus tard ») en nommant son déclencheur : *« l'emplacement `mega-city/` vs un éventuel
umbrella si un 3ᵉ produit apparaît »* et le besoin de **non-subordination réelle**.

Ce déclencheur est là. La salve ADR-021→025 a reposé cop1 comme **plan de contrôle de couche 2**
(ADR-022 : ontologie 7 briques / 3 ports) avec **contrat de supervisabilité** v0.1, et acté le
co-dev cop1 + mega-city (ADR-025, option E). Le PO veut aller au bout : un umbrella **neutre**
où le plan de contrôle et les Règles/gouvernance vivent comme **produits co-égaux, clairement
séparés** — pas mega-city subordonné à cop1 (ce que l'asymétrie « cop1 dans `packages/`,
mega-city à la racine » d'ADR-025 laisse encore transparaître).

Nom retenu : **`Vectorz`** (métaphore tour de contrôle ATC ; `z` = signature produit).

**Contraintes dures du PO : temps minimal ET ne pas toucher aux repos existants** (2026-07-14,
révision : la tolérance au risque prime — cop1 et mega-city restent intacts). Le **clone** concilie
les deux — cop1 est déjà un monorepo pnpm outillé (biome, vitest, CI biome+tsc+vitest), et un clone
emporte **outillage + historique gratuitement**. Fait vérifié qui rend la restructuration peu
coûteuse : **les imports résolvent par nom de package (`@cop1/*`), `tsconfig.base.json` n'a aucun
path-mapping.** Déplacer les dossiers de package **ne casse aucun import** ; seuls la chaîne
`tsc -b` du build racine, les globs pnpm/vitest/biome et les `tsconfig` `references` (chemins
relatifs) sont à mettre à jour. La migration E→E′ reste **un déplacement mécanique réversible** —
simplement exécuté **dans le clone**, pas dans les repos de prod.

## Décision

1. **Umbrella neutre `Vectorz`, obtenu par clone-puis-gel (option B′, révision PO 2026-07-14).**
   Le repo Vectorz naît comme **clone de cop1** (historique + outillage + CI emportés — le grief
   « re-dresser l'outillage » de l'option B ne s'applique pas à un clone) ; la restructuration
   (`products/*`, subtree mega-city) se fait **dans le clone** ; les originaux **cop1 ET mega-city
   sont gelés au moment du clone** (tag + README pointeur, précédent claude-skills / mega-city
   ADR-0006). Zéro divergence (gel immédiat), zéro risque pour les produits existants, comparaison
   ancienne/nouvelle approche par simple checkout des repos gelés. Séquencement : exécution
   **après merge du sprint 0027** (validateur) — Vectorz naît complet.

2. **Layout cible** — produits co-égaux sous `products/` (précédent `muti`), tooling & décisions
   à la racine neutre, **aucun package runtime partagé** (ADR-021 : zéro import croisé, donc le
   seul « partagé » est la config d'outillage) :

   ```
   Vectorz/                         # umbrella neutre — racine pnpm, tooling & ADR partagés
     products/
       cop1/                        # PRODUIT control-plane / superviseur
         packages/
           app  sprint-core  ceremony-engine  llm-intelligence
           observability  quality-intelligence  shared-kernel  web
       mega-city/                   # PRODUIT Règles/gouvernance (git subtree, historique préservé)
     docs/adr/                      # séquence de décision unique de l'umbrella (immuable, ADR-025 §5)
     features/                      # backlog partagé, front-matter product: (ADR-025 §4)
     pnpm-workspace.yaml  biome.json  vitest.config.ts  tsconfig.base.json  .github/  (repris tels quels)
   ```

   **Mapping ontologie ADR-022 → dossier** (le layout *est* la projection des 7 briques) :

   | # Brique (ADR-022) | Produit / dossier |
   |---|---|
   | (1) Superviseur · (2) AgentSessionPort/executor · (3) Method/Task port · (5) Cadre · (7) Profile | `products/cop1/packages/*` |
   | (4) Rules / Governance | `products/mega-city` |
   | (6) Rôles | *nommés/séquencés* par (3) → `products/cop1` ; agents/skills fournis par → `products/mega-city` |

   Il n'y a **pas** de `shared/` runtime : `@cop1/shared-kernel` est le partagé **interne à cop1**,
   pas de l'umbrella ; mega-city n'importe rien de cop1 au runtime (ADR-021). Le seul partage
   inter-produits est le tooling racine. Un `packages/` ou `shared/` d'umbrella sera créé **si et
   seulement si** un 3ᵉ produit ou un vrai besoin de code commun apparaît (YAGNI).

3. **Nom du produit control-plane : `cop1` conservé** (dossier `products/cop1`, scope `@cop1/*`
   inchangé → churn nul). Un renommage « tour » (`tower` / `atc` / `vector`) est **cosmétique et
   différé** au même titre que les tirades de modules (non-but §6). *→ arbitrage humain ouvert.*

4. **Outillage OSS, repris de l'existant, zéro ajout non justifié** : pnpm workspaces (glob
   `products/*/packages/*` + `products/mega-city`), **biome** (lint/format), **vitest** (test),
   **CI existante** (biome + `tsc` + vitest). **Turbo/nx : différés** — cop1 n'en a aucun
   aujourd'hui (le build est une chaîne `tsc -b` manuelle qui suffit encore). On n'introduira
   **turbo** (léger, pnpm-natif, précédent `muti`) que quand la chaîne manuelle deviendra
   douloureuse (cache/parallélisme) ; **nx écarté** (sur-outillage pour 2 produits). *→ arbitrage
   humain ouvert.*

5. **Garde-fous de séparation, APPLIQUÉS en CI (contrainte 3)** :
   - **Interdiction d'import croisé dans les deux sens** via **dependency-cruiser** (OSS,
     TS/JS-natif, sans eslint) : une règle `forbidden` `products/cop1 ⇸ products/mega-city` et sa
     symétrique, en `error`, exécutée en CI. Choisi contre : *eslint-boundaries* (imposerait une
     toolchain eslint alors que le repo est sous biome — rejeté) ; *biome* (pas de règle de
     frontière inter-dossiers aujourd'hui) ; un simple **test vitest de scan d'imports** reste le
     **repli zéro-dépendance** si le PO refuse toute nouvelle devDep.
   - **Chaque produit builde/teste seul** : jobs CI `pnpm --filter ./products/cop1... build|test`
     et `pnpm --filter ./products/mega-city... build|test`, chacun vert **isolément** →
     host-agnosticité de mega-city prouvée mécaniquement (ADR-021), pas seulement affirmée.

6. **Versionnement d'ensemble** (ADR-025 §2 inchangé) : une release = un tag umbrella, le tuple
   `(cop1, mega-city)` **est** le SHA. mega-city conserve son `package.json` — bascule vers le
   versionnement indépendant = option D d'ADR-023, **en réserve** (non-but §6).

## Options considérées

| Option | Neutralité / non-subordination | Coût temps (contrainte 1) | Risque repos existants | Verdict |
|---|---|---|---|---|
| **A — évoluer cop1 en place → Vectorz** | ✅ (`products/*` symétrique) | **Faible** : déplacement mécanique, outillage repris | ⚠️ la restructuration se fait **dans** le repo de prod | Écartée (révision 2026-07-14) — le PO refuse de toucher cop1/mega-city |
| **B — nouveau repo vierge + migration incrémentale** | ✅ | Élevé : re-dresser CI/lint/test/lock, ré-importer 2 historiques | Faible | Écartée — repaye l'outillage déjà en place |
| **B′ — clone de cop1 → Vectorz, puis gel des originaux** | ✅ | **Faible** : le clone emporte outillage + historique ; même déplacement mécanique que A, dans le clone | **Nul** (bac à sable ; originaux gelés intacts) | **Retenue (PO, 2026-07-14)** |
| **C — greenfield rewrite sous nom neutre** | ✅ | Très élevé | Faible | Écartée (contrainte de temps) |
| Rappel **E** (ADR-025, statu quo) | ⚠️ asymétrie cop1/`packages` vs mega-city racine | nul | — | **Révisée** : le pivot demande la symétrie E′ |

B′ domine : même coût que A (le clone rend le « re-dressage » de B caduc), mais le travail se fait
dans un repo dont la casse ne coûte rien, et les originaux restent la référence de comparaison
intacte. Condition de cohérence : **gel des originaux au moment du clone** — sinon on recrée la
divergence deux-repos qu'ADR-025 avait diagnostiquée.

## Conséquences

- **Plus facile :** non-subordination *structurelle* (deux `products/*` pairs) et non plus une
  simple phrase d'ADR ; ajout d'un 3ᵉ produit trivial ; garde-fous ADR-021 devenus **exécutables**.
- **Plus difficile / coût :** un déplacement de dossiers touche `tsc -b` racine, globs
  pnpm/vitest/biome, `references` tsconfig et chemins CI (mécanique, un commit, `L`-borné) ;
  la discipline de frontière repose **entièrement sur la CI** — à câbler dans la migration, pas après.
- **Inchangé :** ADR-021 (frontière/zéro import), ADR-023 (couplage build-time / indépendance
  runtime, réversibilité, option D en réserve), la fiche 0020 / executor-seam (ADR-026) qui
  **continue à l'intérieur de Vectorz**.

## Non-buts / différés

- **Versionnement indépendant** des produits (= bascule ADR-023 option D) — en réserve.
- **Renommage des modules internes** : les tirades de films (`iamthelaw`…) **survivent comme noms
  de modules** (mega-city ADR-0010) ; migration cosmétique différée.
- **Renommage du produit `cop1`** en nom « tour » — différé (churn de scope inutile maintenant).
- **turbo/nx**, `shared/` d'umbrella — introduits seulement quand un besoin réel se matérialise.
- **Aucun rewrite greenfield.**

## Questions ouvertes (relecture humaine)

1. **Nom du produit control-plane** : garder `cop1` (churn nul) ou basculer sur un nom « tour »
   (`tower`/`atc`/`vector`) dès maintenant ?
2. **`products/*` vs racine à la `muti`** : produits sous `products/` (retenu, explicite) ou à la
   racine de l'umbrella (`cop1/`, `mega-city/`) ? — `products/` préféré pour la lisibilité.
3. **Orchestration** : confirmer le report de **turbo** (l'introduire avec la migration tant qu'on
   y est, ou attendre la douleur ?).
4. **Garde-fou d'imports** : **dependency-cruiser** (devDep OSS) vs **test vitest de scan** maison
   (zéro dep) — trancher selon l'appétit pour une dépendance de plus.

## Action items (séquence B′ — non exécutée, go PO requis)

1. [ ] Merger le sprint 0027 (validateur) dans cop1 — Vectorz naît complet.
2. [ ] **Clone** de cop1 → nouveau repo `Vectorz` (remote GitHub neuf) ; purge des branches legacy.
3. [ ] **Gel des originaux** : cop1 (tag `cop1-pre-vectorz` + README pointeur) puis mega-city
       (idem, après le subtree en 4) — plus rien n'entre dans les repos gelés.
4. [ ] Dans Vectorz : création `products/cop1/` (déplacement des `packages/*`) +
       `git subtree add products/mega-city` (historique préservé).
5. [ ] Globs pnpm + chaîne `tsc -b` + vitest/biome + CI recâblés ; build/test filtrés au vert.
6. [ ] Garde-fous CI : règle d'import croisé (deux sens) + jobs `--filter` autonomes par produit.
7. [ ] `re-bind --global` des consommateurs (symlinks `~/.claude` → `Vectorz/products/mega-city`,
       `deploy.sh` d'ezk-ezk).
