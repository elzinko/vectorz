# ADR 0040 — Le modèle de fichiers ezk : liens compilés, schéma validé, versionné

- Statut : **accepté** (ratifié PO le 2026-08-26 ; panel `ezk-architect` unanime *GO-avec-amendements* le 2026-08-26)
- Date : 2026-08-26 (panel + ratification le 2026-08-26)
- Décideur : **PO** (ratifié le 2026-08-26), sur la base du panel `ezk-architect` (architecte + reviewer adverse + dev)
- Cadré par : fiche-chapeau P0 `20260826122532943`
- Capture du panel : `docs/captures/2026-08-26-panel-ezk-architect-adr-0040.md`
- Consomme : fiches `20260821204737357` (357), `0186`, `20260823121712652` (652),
  `20260826112620281` (281) ; benchmark `docs/benchmarks/2026-08-25-bmad-vs-ezk.md`
- **Ne rouvre pas** : [ADR-0001](0001-monorepo-composable-coeur-deterministe.md) (cœur
  déterministe), [ADR-0039](0039-trois-etages-moteur-methode-branchements-plugin.md) (trois étages)

## En clair

La méthode ezk est faite de **fichiers markdown** : skills, agents, règles, fiches, bientôt
recettes. On sait déjà les **ranger** (ADR-0039) et on a un **schéma typé** (`domain.ts`). Mais
trois choses manquent, et elles se tiennent : le **graphe** des liens n'est **jamais compilé** en
un objet ; **rien ne refuse** un fichier mal formé ; le **versionnement** du format ne couvre
qu'une seule skill.

Cet ADR tranche **comment** on **modélise, lie, valide et versionne** ces fichiers — pour un
format **évolutif** et **vérifiable**, à l'ère des LLM.

Le fil rouge tient en une phrase : **on garde la déclaration à côté de la chose (co-localisée),
et on COMPILE.** On ne quitte pas le markdown ; on lui ajoute une couche de build qui en fait un
objet unique, typé, validé, versionné. Le LLM continue de rédiger et de juger aux bords ; le
modèle et le validateur, eux, sont **déterministes** (ADR-0001).

## Verdict du panel `ezk-architect` (2026-08-26)

**Unanime : GO-avec-amendements.** Trois lentilles indépendantes (architecte · reviewer adverse ·
dev) confirment la direction — compiler l'instance qui manque à `domain.ts` — et imposent **cinq
amendements**. Les décisions D1–D4 ci-dessous restent le dossier d'analyse ; **elles sont amendées
par cette section**, et une décision **D5** est ajoutée (l'angle mort relevé par deux lentilles sur
trois).

- **D1 — compiler, mais NE RIEN renommer.** Fondre les 5 mots de lien en un seul viole le typage
  (chaque champ a un couple source→cible distinct). Rename mesuré : **~35 frontmatter + 162
  références code + 9 tests qui comparent les noms de champ** → un rename silencieux **vide le
  graphe** sans faire rougir un test. **Décision : l'unification vit dans le COMPILATEUR** (le loader
  normalise N clés → un modèle interne, jeu **fermé et typé de ~4 verbes** : *compose · convoque ·
  applique · est-vérifié-par*). **Zéro rename sur disque.** Et on **livre le graphe compilé SEUL
  d'abord**, découplé de tout travail de vocabulaire.
- **D2 — le schéma est DÉRIVÉ de `domain.ts`, et « rapporte avant de bloquer ».** Pas de schéma
  maintenu en parallèle (sinon deux sources de vérité qui dérivent — DIP). Chaque règle est livrée
  **en warning**, passée **bloquante seulement quand sa migration est écrite** et son taux de faux
  positifs mesuré à zéro (champs conditionnels `product:` en monorepo ; cas legacy `blocked`+`ready`).
- **D3 — `schema_version` par fiche pour le TRANSITOIRE de migration.** Défaut dossier conservé,
  MAIS une migration crée par nature une **coexistence** (fiches migrées + non-migrées dans le même
  dossier). Sans surcharge par fiche, le validateur **rougit à tort** les non-migrées, ou la version
  du dossier ment. **Décision : dossier par défaut + surcharge `schema_version` par fiche là où la
  migration est incrémentale.** Et `ahead` (rollback d'**un** artefact) ne doit **pas geler toutes**
  les commandes `ezk-*` du projet.
- **D4 — les 4 métas sont OPTIONNELLES.** Les rendre obligatoires = un breaking qui exige de
  backfiller ~toutes les fiches ; `generated_by` n'est **pas backfillable**. **Décision : modèle des
  4 métas adopté, mais optionnel ; `generated_by` sur les fiches neuves seulement (exemption legacy
  baseline).**
- **D5 (NOUVEAU) — où vit le graphe compilé, et le préflight ne recompile JAMAIS.** Deux lentilles
  sur trois : committé → on rejoue la saga `board.html` (regens concurrents inter-sessions) à
  l'échelle de la méthode ; gitignoré → la CI à quota le rebuild. **Décision : le graphe est un
  ARTEFACT DE BUILD non-versionné, régénéré à la demande / en CI ; le préflight par commande LIT
  l'objet déjà compilé, jamais ne recompile** (sinon on recrée un runtime interprété au bord CLI —
  le vrai piège « OS BMAD »). Fraîcheur garantie par un check cheap (CI / étape de `ship`). ⚠ Sur
  les ids : on troque un échec *attrapé* (chemin manquant, vu par `check-links`) contre un **id typo
  silencieux** — le validateur **DOIT vérifier l'existence** de chaque id référencé.

**Ordre de construction (dev)** : 1) graphe compilé seul · 2) schéma + validateur en **warning** ·
3) bascule bloquante quand faux positifs = 0 · 4) migration des refs de prose → id (après graphe
stable) · 5) Skema généralisé (dernier) · 6) rationalisation du vocabulaire (découplée, en alias).

## Contexte

Diagnostic, chiffré (fiche 357 + benchmark BMAD 2026-08-25) :

- **Cinq mots** différents encodent « X est lié à Y » : `composes` (11 fichiers),
  `enforcements` (14), `competences` (3), `roles` (2), `interactions` (2). Plus **~600 liens de
  prose** (libellé + chemin `.md`) qui **cassent à chaque `ship`** (toute la saga `check-links.sh`).
- **`domain.ts`** (187 lignes) type proprement Rule / Bundle / Skill / Agent / Profile, **mais
  aucune instance compilée** n'est produite : le graphe est **redérivé à la volée**, et n'émet
  qu'un bloc Mermaid, jamais un objet interrogeable. La webapp n'a **rien** de fiable à lire.
- **Aucune validation qui échoue** : un `status` hors-enum, un `id` dupliqué, un champ requis
  manquant ne produisent qu'un **warning** sur `stderr` de `regen-backlog.sh`. Rien ne devient rouge.
- **Skema** (versioning + migrations de format) **n'existe que pour `ezk-backlog`** (layout v1→v2).
  Les 21 autres skills et 7 agents ne portent ni `VERSION` ni `migrations/`.
- **Référence externe** : BMAD **compile** ses manifests (`agent-manifest.csv`, `bmad-help.csv`,
  empreintes SHA-256) en une couche de build séparée. C'est le **seul** point où BMAD gagne côté
  modèle — ezk a le schéma, pas l'instance.

Forces en présence : **ne pas perdre la co-localisation** (le lien vit à côté de la chose, on ne
l'oublie pas quand on l'édite) ; **pouvoir interroger** le graphe en un endroit ; **faire échouer**
ce qui est cassé ; **faire évoluer** le format sans balayage manuel ; rester **LLM-native** (rien
de load-bearing dans un prompt) et **frugal** (pas d'« OS » rechargé à chaque tour, cf. BMAD).

## Décision

Quatre décisions **couplées** (elles décrivent un seul objet). Recommandations = **propositions**
à valider en panel.

> **Amendées par le « Verdict du panel `ezk-architect` » ci-dessus (2026-08-26).** Les tables
> d'options restent le dossier d'analyse ; les propositions sont **mises à jour** par les amendements
> D1–D5, et une décision **D5** (où vit le graphe compilé) a été **ajoutée** par le panel.

### D1 — Les liens structurels : compiler la déclaration co-localisée

| Option | Complexité | Dérive | Interrogeable | Verdict |
|---|---|---|---|---|
| **A. Statu quo** (5 champs + chemins de prose, dérivé à la volée) | faible | — | non | rejeté (c'est la panne) |
| **B. Manifeste central** (un seul fichier graphe édité à la main) | moyenne | **forte** (on édite le skill, on oublie le manifeste) | oui | rejeté |
| **C. Modèle compilé** (co-localisé **+** build → objet typé) | moyenne (build à demi-existant) | nulle | oui | **recommandé** |

**Proposition** : **C**. On garde la déclaration en frontmatter (localité), un script la **compile
en UN graphe typé** (l'instance qui manque à `domain.ts`), et **tout le lit** (webapp,
validateurs, diagrammes). Deux corollaires :
- **Unifier les 5 vocabulaires** en un jeu cohérent (ex. *compose une brique* / *convoque un rôle*
  / *applique une règle* / *est vérifié par*) — ou justifier explicitement qu'ils restent distincts.
- **Les références structurelles deviennent des `id` résolus par le modèle**, plus des chemins
  markdown fragiles. La prose garde ses liens de lecture ; la structure passe par id → fin du
  `check-links` rot pour la partie structurelle.

### D2 — La validation de conformité : un schéma déclaré qui ÉCHOUE

| Option | Ce qu'elle attrape | Coût | Verdict |
|---|---|---|---|
| **A. Statu quo** (warnings `regen` non bloquants) | rien (informe) | nul | insuffisant |
| **B. Schéma déclaré + validateur bloquant** (préflight + CI) | enum hors-liste, `id` dupliqué, champ requis manquant | faible (réutilise `check-layout-version.sh`) | **recommandé** |

**Proposition** : **B**. Un **schéma déclaré par famille** (feature, adr, recipe, skill…) + un
**validateur** qui **refuse** (sortie machine `ok/behind/…`, branché en **préflight `ezk-*`** et en
**gate `ezk-ci`**). Absorbe la fiche **281** et la validation de statut de **652**. Piège à traiter
(déjà repéré 0186) : les **champs conditionnels** — `product:` n'est requis **que** dans un
monorepo ; le validateur doit **conditionner** l'obligation au layout, sinon il rejette à tort les
projets autonomes.

### D3 — L'évolution du format : granularité du versionnement (Skema)

| Option | Granularité | Schémas coexistants | Coût |
|---|---|---|---|
| **A. `layout_version` par dossier** (Skema aujourd'hui) | dossier | non (tout le dossier partage un schéma) | faible |
| **B. `schema_version` par fiche** | fiche | **oui** (migration fiche-par-fiche) | +1 champ, +1 axe |

**Proposition** : **généraliser Skema (0186)** avec le **défaut A** (dossier), et **B seulement**
là où des schémas évolutifs doivent **coexister**. Émission (migration `NNN-slug.md` ordonnée au
changement *breaking*), **registre de bind** (`{artefact: version}` posé par projet), consommation
(préflight par commande, `pull` jamais `push`, jamais de mutation sans OK). Rollback = `git revert`.

### D4 — Les quatre « métas » du front-matter (ne pas les fondre)

De la fiche **652** (nommage validé PO 2026-08-25) :
- **`schema`** — version du **format** de la fiche (ce qu'elle doit contenir).
- **`generated_by`** — le **producteur** (`{ skill, skill_version, model, effort }`).
- **`version`** — la **version/tag** cible visée.
- **sprint / milestone** — la **boîte de temps** (dimension séparée de la version).

**Proposition** : adopter les 4 comme **méta-modèle** du front-matter. Piège : `schema` (format)
≠ `generated_by` (producteur) — une fiche `schema v2` peut être produite par n'importe quel skill.

## Analyse des trade-offs

- **Co-localisation vs interrogeable** : le faux dilemme classique. **Compiler** (D1-C) donne les
  deux — au prix d'une **étape de build**, qui existe déjà à moitié (`bind`, `regen-*`).
- **LLM-native** : le LLM **rédige** la prose et **juge** ; le **graphe compilé** et le
  **validateur** sont déterministes. On reste du bon côté d'ADR-0001, et on évite le piège BMAD
  (justesse suspendue à « NEVER skip a step » dans un prompt).
- **Évolutivité** : un **schéma déclaré + migrations** = on change le format par un **diff + une
  migration**, plus par un balayage manuel des N fichiers. C'est exactement la demande PO
  « faire évoluer le format sans rien casser ».
- **Frugalité** : fichiers plats + build + scripts. Aucun « OS » rechargé à chaque tour.

## Conséquences

**Plus facile**
- La **webapp devient fiable** (elle lit le graphe compilé, tout est sourcé — résout le problème
  fondateur de l'épic carte).
- **Interroger** la méthode sans grep ; les incohérences sautent aux yeux.
- **Faire évoluer** un format (diff + migration) ; **corriger un lien** = éditer un frontmatter +
  recompiler.
- Les **recettes se branchent** : schéma de recette = une famille du validateur ; liens de recette
  = des ids du graphe. Plus de 4ᵉ instanciation à la main.

**Plus difficile**
- Une **étape de build** à maintenir (mais elle existe à demi).
- **Figer un vocabulaire de lien** unique = un arbitrage **éditorial** (pas mécanique).
- **Migrer** les liens de prose structurels → ids (chantier one-shot, outillable).

**À revisiter**
- **Couplage [0087](0087-plugin-claude-code-distribution.md)** : d'où vient `VERSION` (tag umbrella
  vs version mega-city) — Skema porte les migrations de **données**, 0087 tranche le **code**.
- `schema_version` **par fiche** (D3-B) si le besoin de schémas coexistants se matérialise.

## Action items (post-panel — ordre de construction)

Panel `ezk-architect` **tenu** le 2026-08-26 (GO-avec-amendements) ; **ratifié PO le 2026-08-26**.

> **Avancement 2026-08-26 (session product-build)** : items **2, 3, 4 livrés** — graphe compilé
> (`graph:compile` / `graph:query`, un id inconnu = échec) ; validateur `fiches:check` (warning par
> défaut · `--strict` bloquant · détection d'ids dupliqués · **gate corpus** dans la suite de tests).
> Tout en **local** (main **non poussé**). Restent : **5** (migration refs prose→id), **6** (Skema
> généralisé), **7** (vocabulaire en alias), **8** (frontière recettes).

1. [x] **Ratification PO** de cet ADR amendé → statut *accepté* (2026-08-26).
2. [ ] **Graphe compilé SEUL** (357) : un `pnpm` lit les frontmatter **existants** (aucun rename) et
      émet une **instance typée** ; **artefact non-versionné**, régénéré à la demande / CI ; la webapp
      lit l'objet. Valeur seule.
3. [ ] **Schéma dérivé de `domain.ts` + validateur en WARNING** (281 + 652), sur le graphe de
      l'étape 2 ; vérifie l'**existence de chaque id** référencé.
4. [ ] **Bascule bloquante** règle par règle, quand la migration de la règle est écrite ET faux
      positifs = 0 (champs conditionnels ; cas legacy `blocked`+`ready` ; `generated_by` exempté).
5. [ ] **Migration des refs de prose → id** (chantier one-shot outillable), APRÈS graphe stable.
6. [ ] **Skema généralisé** (0186) en dernier : émission / registre de bind / consommation ;
      `schema_version` par fiche pour le transitoire ; `ahead` ne gèle pas tout le projet.
7. [ ] **Vocabulaire** rationalisé en **couche d'alias dans le compilateur** (~4 verbes typés),
      découplé, **jamais un rename** sur disque.
8. [ ] Écrire la **frontière « les recettes consomment le modèle »** (débloque `ezk-chef`).

**Nouveaux critères d'acceptation (panel 2026-08-26)**
- [ ] **Migrer UNE seule fiche** d'un dossier vers un schéma différent **sans** regen/rejet des
      voisines (preuve du transitoire — D3).
- [ ] Le **préflight LIT** l'objet compilé, **ne recompile jamais** (borne de coût — D5).
- [ ] Un **id référencé inexistant** fait **échouer** le validateur (fin du chemin silencieux — D5).
