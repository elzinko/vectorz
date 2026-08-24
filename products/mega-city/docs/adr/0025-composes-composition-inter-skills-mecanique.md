# ADR-0025 — Composition inter-skills mécanique (`composes:`)

- **Statut** : accepté (2026-08-09, sprint fiche 0149)
- **Contexte** : ADR-0012 (le modèle `Skill {id, content}` ne porte pas les dépendances)

## Problème

La doctrine « compose, ne réinvente pas » vit en **prose**. Les dépendances
inter-skills sont **invisibles** à `expand`/`bind` : `expand.ts` (`resolve()`) **ignore
silencieusement** toute référence absente du catalogue. Un profil peut donc binder
`ezk-product-build` **sans** `ezk-sprint` sans qu'aucun signal ne tombe — exactement
les 4 « intégrations fantômes » constatées à l'audit.

## Décision

1. **Domaine** — `Skill` gagne deux champs optionnels (source de vérité
   `docs/domain.ts`, ré-exporté par `src/domain/model.ts`) :
   - `composes?: string[]` — ids de skills **internes** requis (doivent être présents à
     la résolution du profil) ;
   - `composesExternal?: string[]` — refs **externes** (`skill-creator`,
     `product-brainstorming`…) **documentées mais jamais warnées**.

2. **Loader** — `readSkill` parse le frontmatter `composes:` et `composes-external:`
   (kebab en YAML → camelCase en TS) dans ces champs. Absent ⇒ `undefined` (tolérant,
   rétro-compat : un skill sans `composes` se charge comme avant).

3. **Checker pur** — nouveau module `src/core/composition.ts` :
   `checkComposition(resolved: ResolvedProfile, catalog: Catalog): CompositionWarning[]`.
   - Ferme **transitivement** le graphe `composes` (parcours sur le catalogue, pour
     atteindre les deps de skills eux-mêmes absents du profil).
   - Pour chaque id requis **non présent** dans les skills **résolus du profil** et
     **non listé** en `composesExternal` → un warning `{ from, missing, via? }`.
   - `composesExternal` n'émet **jamais** de warning (critère 2).
   - **Pur** (aucun I/O, aucune horloge, aucune IA), trié stablement → déterministe
     (ADR-0003). Non bloquant : c'est un diagnostic, pas une exception.

4. **Bord (CLI)** — `bin/lawgiver.ts` appelle `checkComposition` après l'expand et
   **imprime les warnings sur stderr** (non bloquant : le bind réussit). `bind()` reste
   **pur et inchangé** (il retourne toujours un `WritePlan` — on ne pollue pas le plan
   avec des diagnostics). Le cœur calcule des données ; le **bord** les rend visibles —
   miroir de `bind` (pur) → `io/apply.ts` (I/O).

5. **Diagramme (script déterministe)** — `bin/regen-composes-graph.ts` (+ script npm
   `composes:graph`) régénère un **bloc managé** Mermaid du graphe `composes` dans
   `skills/README.md`, délimité par `<!-- composes-graph:begin -->` /
   `<!-- composes-graph:end -->` (le reste du fichier préservé à 100 %). Le LLM ne range
   jamais (fiche 0149 §3). Un test (`composes-graph.test.ts`) vérifie que le bloc est à
   jour — invariant CI, même filet que `catalog-readme.test.ts`.

## Portée — ce que ce POC ne fait PAS (différé, journalisé)

Le remodelage **« Skill = dossier (SKILL.md + assets) + `scripts/` »** (proposition §2,
seconde moitié de la fiche 0149) **n'est pas requis** par les 3 critères d'acceptation et
**impacte les caps** (signalé au gate de la fiche 0121). Il est **hors POC**, déféré. Ce
sprint rend la composition **mécanique** (détection + graphe) sans toucher à la
représentation « Skill = {id, content} » au-delà de l'ajout des deux champs.

## Conséquences

- **+** Un profil qui oublie une dépendance composée est **signalé** (direct ou
  transitif), les refs externes restent silencieuses, le graphe de composition est
  **généré** et versionné → la doctrine cesse de vivre en prose seule.
- **+** `bind()` reste pur ; rétro-compatibilité totale (champs optionnels).
- **−** Les annotations `composes:` réelles sur les orchestrateurs peuvent **révéler**
  de vrais trous du profil `global` : c'est le **but** (finding, pas régression).
- Suite : annoter progressivement tous les orchestrateurs ; remodel « Skill = dossier »
  quand la fiche 0121 l'exigera.
