---
id: 0087
title: Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage)
type: feature
priority: P1
epic:
status: idea
ready:
pr:
created: 2026-07-20
---

# 0087 — Le catalogue vectorz distribué comme plugin Claude Code

## Contexte / Problème

### Ce que vectorz expose aujourd'hui, et comment c'est distribué

| Brique | Où, dans le repo | Volume |
|---|---|---|
| Skills | `products/mega-city/skills/<id>/SKILL.md` | 20 dossiers, dont **18 dans `profiles/global.yml`** |
| Agents | `products/mega-city/agents/*.md` | **7** (ezk-architect, ezk-archive, ezk-pm, ezk-qa, ezk-reviewer, ezk-steward, ezk-tdd) |
| Rules / bundles | `rules/` + `bundles/*.yml` | 10 familles de règles, 12 bundles |
| Hooks **git** | `hooks/{commit-msg,pre-commit,pre-push}.sh` | 3 |
| Serveur MCP | `bin/supervision-mcp.ts` + `src/supervision/mcp-server.ts` | 1 (émetteur de supervisabilité, fiche 0050 shippée) |
| Commands (slash) | — | **aucune** : les skills sont invoquées `/ezk-*` |

**Distribution actuelle = le moteur `bind` (ADR-0005, mode primaire « export statique ») :**

- **global** — `pnpm lawgiver bind-global global --link` matérialise `~/.claude/{skills,agents}`
  en **symlinks** vers les sources mega-city (cap `claude-code-global`, ADR-0018 mode link) ;
- **par projet** — `lawgiver bind <profile> <projet> claude-code` écrit
  `.claude/{agents,skills}` + `.iamthelaw/ENTRY.md` + les hooks dans `.git/hooks`
  (cap `claude-code`) — **capacité existante mais non exercée** : vectorz n'a ni
  `.iamthelaw/`, ni `CLAUDE.md`, ni hook git installé (vérifié 2026-07-20) ;
- **Claude Desktop** — cap `claude-desktop` (ADR-0014) : dossiers de skills importables.

Trois caps existent (`src/caps/registry.ts`) ; ajouter un hôte = un module + une entrée.

### Les limites que ça pose

1. **Prérequis lourds pour un consommateur.** Installer = cloner un repo **privé**
   (`elzinko/vectorz`, vérifié), `pnpm install`, lancer un CLI TypeScript. Aucun de ces
   trois gestes n'a de sens pour quelqu'un qui veut juste « avoir l'équipe ezk ».
2. **Aucune version.** `products/mega-city/package.json` est en `version: 0.0.0`, jamais
   bumpée. Les tags du repo (`v0.1.0`, `v0.2.0`) sont des **releases cop1** (cf. messages de
   tag). Une machine tourne donc sur « le HEAD que j'ai pull la dernière fois » — non
   identifiable, non reproductible, non rollback-able.
3. **Le mode `--link` propage en continu.** C'est un **confort d'auteur** (j'édite un skill,
   il est live partout) qui devient un **risque de consommateur** : pas de figeage, pas de
   fenêtre de MAJ, une modif en cours de rédaction est immédiatement active ailleurs.
   C'est exactement la tension que 0029 avait repérée côté *données* ; ici c'est le *code*.
4. **Pas d'activation/désactivation du bloc.** Le bind global est tout-ou-rien dans `~/.claude` ;
   il n'y a pas de « ce projet-ci n'utilise pas l'équipe ezk ».

### Ce qu'un plugin Claude Code apporterait

Un plugin est un dossier versionné, publié via un **marketplace** (un repo git portant
`.claude-plugin/marketplace.json`), installé par `/plugin install <plugin>@<marketplace>`
et mis à jour par `/plugin update`. Seul fichier obligatoire côté plugin :
`.claude-plugin/plugin.json` (`name`, `description`, `author`). Slots optionnels :
`skills/<nom>/SKILL.md`, `commands/*.md`, `agents/*.md`, `hooks/hooks.json`, `.mcp.json`.
Un repo peut être son propre marketplace. Le plugin officiel `plugin-dev`
(marketplace `claude-plugins-official`) fournit `/create-plugin`, un agent `plugin-validator`
et un agent `skill-reviewer`.

**Le pari** : le plugin est **un cap de plus** (`caps/claude-code-plugin/`), pas un canal
parallèle. Il consomme le même `ResolvedProfile`, il produit une autre forme native. Le cœur
reste host-agnostique (invariant ADR-0001/0005).

## Valeur

- **Un consommateur installe en une commande**, sans cloner, sans pnpm, sans CLI.
- **Une version identifiable** remplace « le HEAD d'un checkout » — donc du figeage, des
  updates explicites, et un rollback possible. C'est le maillon qui manque pour que le
  catalogue soit *partageable* et pas seulement *dogfoodable par son auteur*.
- **Multi-machines / multi-devs** : la même version, prouvable, sur chaque poste.
- **Activation par projet** du bloc entier, ce que le bind global ne sait pas faire.

## Périmètre / Proposition (esquisse — à trancher au grooming)

**La cible, en une phrase (PO, 2026-07-20)** : *une personne qui souhaite développer un produit*
installe **un plugin `vectorz` versionné** = la méthode mega-city (skills, agents, commandes ezk)
**+** le serveur MCP de journalisation. Un artefact, un geste.

1. **Un cap `claude-code-plugin`** : `materialize(resolved, dir)` pur et déterministe (ADR-0003),
   produisant `.claude-plugin/plugin.json` + `skills/` + `agents/` + `.mcp.json`. Entrée dans
   `src/caps/registry.ts`, `HostId` étendu. Symétrique de ce qu'a fait 0003/ADR-0014 pour desktop.
2. **Un marketplace public** — emplacement à trancher (§Incertitude 2), la publicité étant
   imposée par la cible « consommateur externe ».
3. **Une commande de build/publish** dans `bin/`, au même rang que `bind-global`, réutilisant
   le bundling esbuild déjà produit par 0078 pour le serveur MCP.
4. **Décision de versionnage documentée en ADR** (cf. §Incertitude n°1 — c'est la vraie fiche).

### Correspondance brique vectorz → slot plugin

| Brique vectorz | Slot plugin | État |
|---|---|---|
| Skills | `skills/<id>/SKILL.md` | ✅ **déjà la forme native** — le cap `claude-code-global` écrit exactement ça |
| Agents | `agents/*.md` | ✅ direct (cf. 0043 : model/effort/isolation déjà sérialisés) |
| Serveur MCP supervision | `.mcp.json` | ✅ **embarqué** (décision PO, cf. §Incertitude 5) |
| Commands | `commands/*.md` | — rien à migrer (vectorz n'en a pas) |
| Rules / `.iamthelaw/ENTRY.md` | — | 💤 **aucun slot, mais catalogue dormant** (voir ci-dessous) |
| Hooks git (`commit-msg`, `pre-commit`, `pre-push`) | — | 💤 idem — et **faux ami** : `hooks/hooks.json` d'un plugin = hooks du **harness** (événements de session), pas des hooks **git** |

**Le gap rules/hooks n'est pas bloquant — constaté le 2026-07-20 :** vectorz n'a **ni**
`.iamthelaw/`, **ni** `CLAUDE.md`, **ni** hook git installé (`.git/hooks` = samples seuls), et
`~/.claude/` ne contient que `skills/` + `agents/` en symlinks. Le cap qui produit `ENTRY.md`
(`claude-code`, par projet) **n'a jamais été passé sur vectorz** ; le cap réellement en usage
est `claude-code-global`, qui matérialise **skills + agents uniquement**.

`rules/` et `bundles/` sont donc un **catalogue construit mais non consommé**. La méthode
effectivement en usage est **ezk-backlog + `features/`** — du markdown versionné qui vit dans
le **projet cible**, pas dans le catalogue distribué : ça ne s'installe pas, ça se scaffolde
(`/ezk-backlog init`).

Conséquence pour cette fiche : le plugin couvre **tout ce qui est réellement distribué
aujourd'hui**. Le format plugin n'a pas de case pour les rules — mais rien n'attend cette case.
À rouvrir **si et seulement si** on décide de réactiver le chemin `bind` par projet (ce qui
serait une fiche à part, pas un prérequis de 0087).

## Zones d'incertitude (à ne pas combler par hypothèse)

### 1. Versionnage — **le point de conception le plus structurant**

Trois référentiels de version coexistent ou vont coexister :

- le **tag umbrella** (`v0.2.0`), qui aujourd'hui désigne une release **cop1** ;
- `products/mega-city/package.json` (`0.0.0`), conservé par **ADR-025 §2** précisément comme
  « garde-fou qui permet de re-versionner et publier indépendamment le jour venu » ;
- le futur `version` de `plugin.json`.

ADR-025 §2 a tranché « **versionnement d'ensemble** : une release = un tag du monorepo, le
tuple `(cop1, mega-city)` **est** le SHA ». ADR-023 garde l'**option D** (publication
indépendante) en réserve, avec un déclencheur nommé : *« quand mega-city taguera de vraies
releases »*.

**Cette fiche est ce déclencheur.** La question est donc franche, et elle n'est pas tranchée :

- **(a) version alignée** sur le tag umbrella — cohérent avec ADR-025, mais chaque release cop1
  pousse une MAJ de plugin sans changement de catalogue (bruit chez les consommateurs) ;
- **(b) version mega-city indépendante** — bascule assumée vers l'option D d'ADR-023, mais il
  faut alors définir ce qui la bump, et le tuple `(cop1, mega-city)` cesse d'être « le SHA ».

**À arbitrer par ADR avant de coder** (l'ADR sera probablement une révision d'ADR-025 §2).
Interaction directe avec **cop1 0050** (canal de release + pastille de MAJ), qui introduit
« une version figée par squash-merge CI-verte » : si 0050 définit *la* version de vectorz,
0087 doit s'y brancher plutôt que d'en inventer une troisième.

### 2. Où vit le marketplace ? — *cadre fixé par le PO, emplacement encore ouvert*

**Réponse PO (2026-07-20) à « qui installe quoi » :** *une personne qui souhaite développer un
produit* installe **un plugin `vectorz` versionné**, contenant **la méthode (mega-city)
versionnée** — commandes / agents / skills ezk — **et** le serveur MCP de journalisation.
Un seul artefact, un seul geste, pour un **consommateur externe**.

Ce que ça tranche :

- **La cible est externe** ⇒ le marketplace doit être **publiquement clonable**. L'option
  « marketplace dans le repo privé » tombe : elle exigerait un accès git de chaque installeur.
- **Le plugin s'appelle `vectorz`** et porte la méthode — le nom de l'umbrella devient le nom
  du produit distribué (ce qui justifie a posteriori l'umbrella neutre d'ADR-027).
- **Le MCP est dedans**, pas à côté (cf. §5).

Ce qui reste ouvert — désormais **mécanique**, plus produit :

- (a) **rendre `elzinko/vectorz` public** — simple, mais publie aussi cop1 et tout l'historique ;
- (b) **repo public dédié**, alimenté par un **export déterministe** (le cap produit
  l'arborescence, un job la pousse) — le repo de dev reste privé, seul l'artefact est public.
  Cohérent avec « le script range » (ADR-0001) ; coût : un job de publication.

(b) tient probablement mieux — on ne publie pas un monorepo de travail pour distribuer un
catalogue — mais ça n'a pas été instruit. **À trancher avec le versionnage (§1) : c'est le
même geste de release.**

### 3. Deux sources pour les mêmes skills sur la machine de l'auteur

**Le fait :** `~/.claude/skills/ezk-apk` est aujourd'hui un **symlink** vers
`products/mega-city/skills/ezk-apk`. Le fichier que Claude lit **est** le fichier du repo.
Éditer un skill le rend actif partout, immédiatement, sans réinstaller — c'est la boucle
d'itération de l'auteur, et c'est un actif réel.

**Le plugin fonctionne à l'inverse** : il est **copié** à l'installation et ne bouge qu'au
`/plugin update`. C'est exactement ce qu'on veut pour un consommateur (version figée,
identifiable, MAJ explicite) et exactement ce qu'on ne veut pas pour l'auteur.

**Le risque :** si l'auteur installe aussi le plugin, `~/.claude` porte **deux fois** les
mêmes skills — un symlink vivant et une copie figée. Qui gagne ? Le comportement de Claude
Code en cas de collision de nom entre skill globale et skill de plugin **n'a pas été vérifié**.

Hypothèse de travail : les deux chemins coexistent (`--link` pour développer le catalogue,
plugin pour le consommer) et l'auteur n'installe pas son propre plugin — sauf pour tester,
et alors il faut savoir désinstaller proprement. **À vérifier expérimentalement**, c'est
cheap : installer le plugin sur une machine bindée et regarder.

### 4. Un plugin, ou un plugin par profil ?

`profiles/` est le keystone (ADR-0001) : `global`, `base`, `mobile`, `desktop`, `cop1-target`.
Un plugin s'installe en bloc. Faut-il un plugin par profil (`vectorz-global`, `vectorz-mobile`…),
un seul plugin exhaustif, ou un plugin + une sélection côté utilisateur ? Non tranché.

### 5. Articulation avec 0078 — *tranchée : un serveur, deux emballages*

**Décision PO (2026-07-20) :** le plugin **embarque** le MCP de journalisation. Ce n'est pas
un plugin de catalogue pur.

Nuance à ne pas confondre — **`.mcpb` n'est pas le format du plugin** :

| | Claude **Code** | Claude **Desktop** |
|---|---|---|
| Emballage | slot `.mcp.json` **du plugin `vectorz`** (fiche 0087) | bundle **`.mcpb`** autonome (fiche 0078) |
| Geste utilisateur | `/plugin install` — le MCP vient avec | double-clic sur le `.mcpb` |
| Config projet | à déterminer (le plugin est global, `SUPERVISION_PROJECT_ROOT` est par projet) | champ `directory` de la carte d'install |

**Un seul serveur** (`src/supervision/mcp-server.ts`), **deux emballages**, et une seule
chaîne de build à écrire une fois. 0078 a déjà produit le bundling (esbuild → fichier ESM
unique, deps inlinées) : 0087 **réutilise ce travail**, il ne le refait pas.

**Point non résolu, hérité :** `SUPERVISION_PROJECT_ROOT`. Le `.mcpb` le demande à
l'installation via un sélecteur de dossier ; un plugin s'installe globalement et n'a pas cette
carte. Comment le serveur sait-il quel projet superviser quand il arrive par le plugin ?
(cwd de la session ? config par projet ? détection de racine git ?) — **à instruire**, c'est
la seule vraie inconnue technique de l'intégration MCP.

### 6. La méthode DANS le projet (`.vectorz/`, façon BMAD) — 3ᵉ voie de distribution (question PO 2026-07-26)

**La question PO :** la méthode peut-elle vivre dans un **sous-dossier du projet**
(`.vectorz/`, `.mega-city/`…), **installée par projet**, comme **BMAD** l'est dans son
dossier `_bmad/` — *sans tout remettre en question* ? Intuition : l'indépendance de la
méthode implique qu'elle peut être **installée dans le projet** et **exister sans le
superviseur** ; elle n'est pas obligée de parler au MCP.

**Réponse courte : oui, et c'est une 3ᵉ voie, complémentaire du plugin global — pas une
refonte.** Le moteur le permet **déjà à moitié** : le cap `claude-code` (par projet) écrit
`.claude/{agents,skills}` dans le projet — *« capacité existante mais non exercée »*
(cf. §Distribution). Le cœur host-agnostique (`materialize` pur, ADR-0003) ne bouge pas ;
c'est une **bascule de mode** (global `--link` → par-projet copié + versionné), pas une
remise en cause.

**Précédent BMAD** (constaté 2026-07-26) : `npx bmad-method install` déroule un flow
interactif — dossier cible, modules, **release stable vs `@next`**, **IDE** (claude-code,
cursor…) — et pose un dossier `_bmad/` dans le projet **+ génère** l'intégration `.claude/`
et `.cursor/` (command stubs). Installeur par projet, **versionné**, IDE-integration
générée, MCP non requis. C'est exactement le modèle « méthode contenue par projet ».

**Ce que cette voie débloque — elle résout 3 incertitudes d'un coup :**

- **Version par projet native (axe 1)** : le dossier du projet **épingle sa version** —
  projet A en v1 pendant que B passe en v2, sans conflit. Répond au « chacun sa méthode »
  et à *où vit la version* (§1).
- **`SUPERVISION_PROJECT_ROOT` trivial (résout §5)** : si le MCP est posé **dans** le projet,
  la racine supervisée **est** le projet courant — l'inconnue technique de §5 disparaît.
- **Plus de collision auteur (§3)** : chaque projet a **sa copie** figée, au lieu d'un
  symlink global partagé.
- **Mode « méthode seule » (axe 3)** : la méthode dans `.vectorz/` **existe sans le MCP** —
  l'indépendance que le PO pointe. Déjà supporté : les skills portent la clause « si les
  outils MCP dispo — sinon saute sans bruit ».

**Tension à trancher à l'ADR (pas exclusive)** : *plugin global* (une install, tous les
projets, marketplace) **vs** *méthode-par-projet* (`.vectorz/`, version par projet, façon
BMAD). BMAD fait **les deux** : un installeur global qui **pose** la méthode versionnée par
projet. Piste vectorz : le plugin fournit **l'installeur + les commandes globales**, et un
`vectorz init` (façon `npx bmad-method install` / `/ezk-backlog init`) matérialise la
méthode **versionnée** dans le projet. Convention de dossier à arbitrer : `.claude/` (ce que
Claude Code lit nativement) porte un marqueur de version, **ou** un `.vectorz/` source bindé
vers `.claude/`.

### 7. Configurateur par type de projet (Go / Node / OS) — probable YAGNI (axe 2, à confirmer à l'ADR)

Question PO : l'install doit-elle différer selon le **langage** (Go, Node…) ou l'**OS** ?
**Analyse (2026-07-26) : la supervision est agnostique au langage du projet supervisé.**
Le serveur MCP tourne **côté superviseur** (Node) et **n'installe rien** dans le projet
Go/Node/Python — il l'observe. Un projet Go et un projet Node se branchent **à l'identique**.
Ce qui varie réellement : l'**hôte** (Claude Code / Desktop) et l'**OS** (chemins), **pas**
le langage. Un configurateur par langage ne se justifierait que si on installait des outils
**spécifiques au langage** (lint Go vs Node) — or la méthode ezk orchestre des agents, pas ça.
⇒ Pari **YAGNI** ; à **trancher formellement à l'ADR** (`engineering:architecture`) plutôt
qu'à supposer.

## Critères d'acceptation (première esquisse — à retravailler au grooming)

- [ ] **Décision de versionnage actée en ADR** (aligné umbrella vs mega-city indépendant),
      cohérente avec ADR-025 §2 / ADR-023 option D et avec cop1 0050. *Bloquant : rien ne se
      code avant.*
- [ ] **Emplacement du marketplace public acté** (vectorz public vs repo dédié alimenté par
      export), tranché **avec** le versionnage — c'est le même geste de release.
- [ ] Cap `claude-code-plugin` : `materialize` **pur**, testé unitairement sur le `WritePlan`
      (méthode ADR-0014), entrée dans `registry.ts`.
- [ ] Le plugin produit passe l'agent **`plugin-validator`** (marketplace `claude-plugins-official`).
- [ ] Sur une machine **vierge de tout `bind`** : `/plugin install …` puis les 18 skills, les
      7 agents **et** les outils MCP de supervision sont disponibles — constaté, pas déduit.
- [ ] Une modification de catalogue mergée sur `main` → nouvelle version → `/plugin update`
      la ramène ; la version installée est **lisible** côté consommateur.
- [ ] **`SUPERVISION_PROJECT_ROOT` résolu** quand le MCP arrive par le plugin (pas de carte
      d'install à sélecteur de dossier, contrairement au `.mcpb`) — mécanisme choisi et prouvé.
- [ ] **Collision auteur vérifiée** : sur une machine déjà bindée `--link`, installer le plugin
      et constater le comportement (qui gagne, comment désinstaller proprement).
- [ ] Doc utilisateur : installation, MAJ, et **ce que le plugin ne couvre pas**.
- [ ] **ADR : plugin global vs méthode-par-projet (`.vectorz/`, façon BMAD) — ou les deux**
      (§6). Tranche *où vit la version* (par projet ?) et *comment le project_root est résolu*.
- [ ] **ADR : install agnostique au langage** confirmée, ou configurateur par langage justifié
      par un besoin réel (§7) — pas d'ajout spéculatif.
- [ ] **Deux modes exposés** : « méthode seule » (skills, pas de MCP) et « supervisé »
      (+ MCP + watch) — cf. fiche racine 0063.

## Notes

- **P1 (PO, 2026-07-20)** — capturée en `status: idea` : la direction est claire, le point de
  conception n°1 (versionnage) ne l'est pas. `ready:` volontairement vide → gate DoR (ADR-0016).
- **Décisions PO du 2026-07-20** (2ᵉ passe, après vérification du repo) :
  1. **Cible = consommateur externe** — « une personne qui souhaite développer un produit ».
     Le plugin s'appelle **`vectorz`** et porte la méthode mega-city versionnée. ⇒ marketplace
     **public** (§2).
  2. **Le plugin embarque le MCP** de journalisation ⇒ un serveur, deux emballages avec 0078 (§5).
  3. **Le gap rules/hooks est déclassé** : `.iamthelaw/` n'existe nulle part, les rules sont un
     catalogue dormant, la méthode en usage est ezk-backlog + `features/`. Ce n'était pas un
     prérequis — correction d'une erreur d'analyse de la 1ʳᵉ passe.
- **Anti-doublon vérifié (2026-07-20)** : aucune fiche des deux backlogs ne porte le sujet
  « plugin Claude Code / marketplace ». Les seules occurrences de « plugin » sont incidentes
  (0069 : *« pas de plugin exotique »* ; 0052 : postiz).
- **Fiches liées** :
  - **[0078](done/0078-mcpb-install-un-clic-supervision.md)** — l'autre volet packaging (`.mcpb`,
    Claude Desktop). Même question ouverte de distribution ; cf. §Incertitude 5.
  - **[0029](0029-propagation-maj-skills.md)** — propagation des MAJ *breaking* : traite les
    **données/schéma** là où 0087 traite le **code + la version**. Un plugin versionné donne
    à 0029 le `VERSION` qu'elle postule.
  - **cop1 [0050](../../../features/0050-release-pastille-dogfooding.md)** — canal de release +
    pastille de MAJ au niveau vectorz. **Dépendance de conception** : si 0050 définit la version
    figée de vectorz, 0087 s'y branche.
  - **racine 0062 / 0063** — le **front** de la distribution côté Moniteur : lister les projets
    avec leur version installée (0062), ancrer un projet + choisir le mode d'install (0063).
    0087 décide la *doctrine* (emballages, versionnage, dossier projet) ; 0062/0063 en sont l'UI.
- **Axes explorés le 2026-07-26 (PO)** — versionnage par projet (§6, axe 1), install agnostique
  au langage (§7, axe 2), deux modes méthode-seule/supervisé (§6+0063, axe 3), précédent BMAD
  (`_bmad/` + installeur versionné + intégration IDE générée).
- **ADR de référence** : ADR-0001 (catalogues host-agnostiques + `caps/<host>/`),
  ADR-0003 (`materialize` pur), ADR-0005 (export statique primaire, MCP différé),
  ADR-0014 (précédent cap desktop), ADR-0018 (link vs copy) ; côté umbrella
  ADR-023 (option D en réserve), ADR-025 §2 (versionnement d'ensemble).
- **Outillage disponible** : plugin officiel `plugin-dev` (`/create-plugin`, agents
  `plugin-validator` et `skill-reviewer`) — à composer, pas à réimplémenter.
- **Branche parquée — guide d'onboarding utilisateur (décision PO 2026-07-27).** La branche
  `docs/guide-supervision-claude-desktop` (PR #37 CLOSED le 2026-07-25, « en attente :
  vocabulaire + topologie ») porte un guide utilisateur « Connecter une méthode au contrat
  de supervision (Claude Desktop) » — 2 fichiers non présents dans `main`
  (`products/mega-city/docs/brancher-supervision-claude-desktop.md`,
  `products/mega-city/src/supervision/README.md`). **PARQUÉE, pas publiée** : un guide
  d'onboarding vers d'autres relève de cette famille distribution = LATER. **Condition de
  reprise** : (a) le PO décide d'ouvrir la distribution à d'autres, ET (b) le socle amont
  vocabulaire + topologie (motif de fermeture de #37) est stabilisé. La branche reste sur
  `origin/` : aucune suppression, reprise = rouvrir/rebaser la PR le moment venu.
