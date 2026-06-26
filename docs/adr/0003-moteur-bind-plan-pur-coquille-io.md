# ADR-0003 — Moteur `bind` en TS : plan pur (testable sans FS) + coquille I/O fine

- Statut : **proposé**
- Date : 2026-06-26
- Deciders : elzinko

## Contexte

Feature `0001 — lawgiver bind` : matérialiser un profil dans un projet via le cap
claude-code (`.claude/agents`, `.claude/skills`, `.iamthelaw/ENTRY.md`, `.git/hooks`,
réf dans `CLAUDE.md`). ADR-0001 impose un **cœur déterministe, zéro LLM dans le chemin
d'écriture, testé**. `docs/domain.ts` est le contrat (`expand`, `bind`, `Cap`).

Choix TS confirmé (types du domaine). Reste à trancher : outillage, **frontière
pureté/I-O** (la décision clé : tester le résultat de `bind` sans toucher au disque),
branchement du `Cap`, chargement des catalogues, arborescence, garanties de déterminisme.
C'est un POC : on vise la conception la plus simple qui tienne la clean architecture.

## Décision

1. **Outillage minimal, sans build.** Un seul `package.json` racine (monorepo plat,
   ADR-0001), pnpm. **vitest** (runner natif ESM/TS, zéro config, watch rapide — aligné
   sur le besoin TDD du sprint). **tsx** pour exécuter la CLI directement (`bin/lawgiver.ts`),
   pas d'étape de compilation : « exécution directe TS ». `tsc --noEmit` sert de typecheck.
   Lint cohérent avec les rules du repo (conventional-commits déjà enforced par hook).

2. **Frontière pur / I-O — `Cap` retourne un PLAN, il n'écrit pas.** On change la
   signature du contrat : `materialize(resolved, projectDir): WritePlan` au lieu de `void`.
   Un `WritePlan = { files: FileWrite[]; hooks: HookWrite[] }`, `FileWrite = { path; content; mode? }`.
   **Tout le calcul (load → `expand` → `plan`) est pur** : pas de FS, pas de git, pas
   d'horloge. Une **coquille I/O fine** unique (`io/apply.ts`) consomme le plan : crée les
   dossiers, écrit les fichiers triés, pose les hooks (`chmod +x`), `git` éventuel. Le test
   du sprint vérifie le **plan** (assertions sur `files[]`/`hooks[]`) sans écrire un octet.

3. **`Cap` = un module par hôte derrière une interface, registre central.** `caps/registry.ts`
   mappe `HostId → Cap`. `bind` résout l'hôte via le registre (DIP : `bind` dépend de
   l'abstraction `Cap`, pas de claude-code). Ajouter un hôte = un fichier + une entrée, sans
   toucher au cœur. Le cap claude-code est pur (profil résolu → plan).

4. **Loaders en frontière entrante, indexés par `id` du frontmatter.** `gray-matter`
   (markdown+frontmatter : rules, agents, skills) + `yaml` (bundles, profiles). Les loaders
   lisent les dossiers du repo, **indexent par l'`id` du frontmatter** (jamais par nom de
   fichier : `rules/clean-code.md` porte `id: clean-code/no-dead-code`). Défaut
   `kind='disposition'` si absent (ADR-0002, invariant rétro-compat). Un id de skill/competence
   non présent dans `skills/` (ex. `ezk-commits`, `ezk-ci` externes) est **toléré** : référence
   conservée, pas d'échec — le cap décide quoi en faire.

5. **`expand` pur et total.** Résout `extends` (bundles, profiles) et agrège
   rules+agents+skills, **dédup par `id`**, **tri stable par `id`**. Aucun I-O, aucune IA.
   La discrimination `kind` (ADR-0002) reste centralisée dans le resolver/plan, pas éparpillée.

6. **Déterminisme par construction.** (a) tri lexicographique stable sur `id` et sur
   `plan.files[].path` ; (b) dédup par `id` (dernier-gagne documenté) ; (c) **aucun `Date.now()`**
   dans load/expand/plan — toute date (journal) est un **paramètre** (déjà prévu :
   `LearningEntry.date`) ; (d) contenu des fichiers généré par concaténation ordonnée.
   Mêmes entrées ⇒ même plan, byte-for-byte.

### Arborescence retenue (sous `bin/` + `src/`, dépendances vers le domaine)

```
docs/domain.ts                 # contrat (types) — source de vérité, ajuste signature Cap → WritePlan
bin/lawgiver.ts                # CLI (tsx) : parse args → bind() → io/apply  [SEUL point I/O+args]
src/
  domain/plan.ts               # types WritePlan/FileWrite/HookWrite (pur)
  core/expand.ts               # expand(profile): ResolvedProfile  (pur)
  core/bind.ts                 # bind = load → expand → cap.materialize → WritePlan  (pur)
  loaders/catalog.ts           # gray-matter + yaml → Rule/Agent/Skill/Bundle/Profile, index par id
  caps/registry.ts             # HostId → Cap
  caps/claude-code.ts          # materialize(resolved, dir): WritePlan  (pur)
  io/apply.ts                  # applyPlan(plan): void  — SEULE coquille I/O (fs, chmod, git)
  __tests__/                   # *.test.ts (vitest), surtout expand + plan claude-code (sans FS)
```

Sens des dépendances : `loaders/`, `caps/`, `core/` → `domain/` ; `io/` et `bin/` →
`core/`. Le domaine et le calcul ne dépendent jamais du FS ni du framework (clean arch).

## Conséquences

- **Plus facile** : tester le cœur sans disque (assert sur le plan) ; ajouter un hôte
  (un cap + une entrée registre) ; auditer le déterminisme (un seul point d'I/O isolé).
- **Coûts** : la signature `Cap.materialize` du `domain.ts` passe de `void` → `WritePlan`
  (et `bind` idem) — petit écart au contrat actuel, assumé et tracé ici. Discipline : aucun
  appel FS/git/horloge hors `io/apply.ts`.
- **À revisiter quand** : (a) un cap a besoin de lire l'état du projet avant de planifier
  (ex. merge `CLAUDE.md` existant) → le plan gagnera une notion de patch/merge ; (b) `capture`
  arrive → réutilise la même coquille I/O + git ; (c) 3ᵉ hôte non-Claude → nouveau cap.

## Alternatives écartées

- **`Cap.materialize` écrit directement sur le FS (signature `void` d'origine)** — le test
  devrait monter un FS jouet / temp dir à chaque assertion. Plus lourd, moins déterministe
  à vérifier. Le plan rend le cœur pur et testable sans disque. Rejeté.
- **Build TS (tsc → dist) avant exécution** — étape inutile pour un POC CLI ; tsx exécute le TS
  directement, `tsc --noEmit` suffit au typecheck. Rejeté (YAGNI).
- **jest** — config plus lourde pour ESM/TS que vitest, plus lent. Rejeté.
- **`packages/` séparés (cœur / cap / cli)** — sur-découpage : ADR-0001 dit monorepo plat,
  les dossiers `src/*` suffisent à porter les frontières. Rejeté (YAGNI).
- **Indexer les catalogues par nom de fichier** — casse dès qu'`id` ≠ chemin
  (`clean-code.md` → `clean-code/no-dead-code`). L'`id` frontmatter est le contrat. Rejeté.
