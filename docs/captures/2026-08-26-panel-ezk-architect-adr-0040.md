# Panel `ezk-architect` — ADR-0040 (modèle de fichiers ezk)

- Date : 2026-08-26
- Sujet : [ADR-0040](../../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md)
  — le modèle de fichiers ezk (liens compilés, schéma validé, versionné)
- Format : panel **adverse**, 3 lentilles indépendantes, lancées en parallèle
- Verdict : **unanime GO-avec-amendements** — aucun NO-GO ; **5 amendements** + **1 décision ajoutée (D5)**
- Cadre : fiche-chapeau P0 `20260826122532943`

## En clair

Les trois relecteurs **valident la direction** (compiler l'instance qui manque à `domain.ts`) et
imposent **cinq garde-fous**. Aucune décision rejetée ; toutes amendées. Un **angle mort majeur**,
relevé par **deux lentilles sur trois** : *où vit le graphe compilé, et le préflight ne doit jamais
recompiler.*

## Les trois lentilles

### Architecte — frontières & LLM-native — *GO-avec-amendements*
- **D1 amend** : ne pas fondre les 5 liens en un mot (le typage source→cible est perdu) → un jeu
  **fermé et typé de ~4 verbes**, un seul mécanisme de résolution (arêtes par id).
- **D2 amend** : le schéma est **dérivé de `domain.ts`**, jamais maintenu en parallèle (DIP).
- **D3 / D4** : GO (YAGNI correct ; 4 dimensions orthogonales, SRP respecté).
- **Angle mort** : où vit le graphe (committé = saga `board.html` ; gitignoré = rebuild CI). Le
  préflight **lit**, ne recompile jamais (sinon runtime interprété au bord CLI).

### Reviewer adverse — casser la décision — *GO-avec-amendements*
- **D1 amend** : unifier = **rename en masse** — mesuré **~35 frontmatter + 162 refs code + 9 tests**
  qui comparent les noms de champ → normaliser dans le **compilateur** (alias), **zéro rename disque**.
- **D2 amend** : 652 a 2 décisions ouvertes (`blocked`+`ready`, `generated_by`) → **warning d'abord**,
  bloquant quand la migration est écrite ; **jamais exiger `generated_by`** sur le legacy.
- **D3 amend** : le dossier casse **pendant** la migration (coexistence transitoire) ; `ahead` gèle
  tout le projet → `schema_version` **par fiche** pour le transitoire.
- **D4 amend** : 4 métas obligatoires = breaking **non-backfillable** → optionnelles.
- **Angle mort** : le préflight = **point de panne unique** devant chaque `ezk-*` ; un **id typo
  silencieux** remplace un chemin cassé *attrapé* par `check-links`.

### Dev — évolutivité & construction incrémentale — *GO-avec-amendements*
- **D1** : livrer le **graphe seul** d'abord, découplé du vocabulaire.
- **D2** : « rapporte avant de bloquer » ; tester les champs conditionnels (`product:` monorepo).
- **D3** : dossier **réversible** vers par-fiche ; critère = migrer **une** fiche sans regen des voisines.
- **D4** : GO.
- **Ordre** : graphe → schéma/validateur (warning) → bascule bloquante → migration refs→id → Skema
  → vocabulaire (alias).
- **Angle mort** : qui recompile, et quand ? (fraîcheur du graphe).

## Synthèse (tranchée)

Les cinq amendements sont **inscrits dans l'ADR-0040** (§ « Verdict du panel » + Action items) :
D1 = normaliser dans le compilateur, zéro rename · D2 = schéma dérivé de `domain.ts`, warning
d'abord · D3 = dossier + surcharge par fiche pour le transitoire · D4 = métas optionnelles ·
**D5 (nouveau)** = graphe = artefact de build non-versionné, préflight en lecture seule, ids vérifiés.

**Contradiction relevée et tranchée** — sur **D3**, l'architecte disait « GO / YAGNI » ; le reviewer
et le dev « par-fiche nécessaire pour le transitoire ». Tranché côté panel (**2 voix sur 3**,
argument concret du transitoire de migration) : **dossier par défaut + surcharge par fiche pour le
transitoire**. Motif inscrit dans l'ADR (D3). *(Règle projet : une contradiction entre relecteurs
est un signal d'arrêt — on tranche et on inscrit le motif.)*

## Suite

**Ratification PO** → statut *accepté* → construction dans l'ordre du dev. **Aucune décision produit
à arbitrer** : tout est technique / archi (pas d'irréversible sortant, pas de budget, pas d'idée
produit, pas d'exigences contradictoires côté PO).
