---
id: 0083
title: Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage)
type: feature
priority: P1
epic:
status: idea
ready:
pr:
created: 2026-07-20
---

# 0083 — Le catalogue vectorz distribué comme plugin Claude Code

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
  (cap `claude-code`) ;
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

1. **Un cap `claude-code-plugin`** : `materialize(resolved, dir)` pur et déterministe (ADR-0003),
   produisant `.claude-plugin/plugin.json` + `skills/` + `agents/`. Entrée dans
   `src/caps/registry.ts`, `HostId` étendu. Symétrique de ce qu'a fait 0003/ADR-0014 pour desktop.
2. **Le repo comme son propre marketplace** : `.claude-plugin/marketplace.json` à la racine
   vectorz — *sous réserve des incertitudes ci-dessous*.
3. **Une commande de build/publish** dans `bin/`, au même rang que `bind-global`.
4. **Décision de versionnage documentée en ADR** (cf. §Incertitude n°1 — c'est la vraie fiche).

### Correspondance brique vectorz → slot plugin

| Brique vectorz | Slot plugin | État |
|---|---|---|
| Skills | `skills/<id>/SKILL.md` | ✅ **déjà la forme native** — le cap `claude-code-global` écrit exactement ça |
| Agents | `agents/*.md` | ✅ direct (cf. 0043 : model/effort/isolation déjà sérialisés) |
| Serveur MCP supervision | `.mcp.json` | ⚠️ **recoupe 0078** (même serveur, autre canal de packaging) |
| Rules / `.iamthelaw/ENTRY.md` | — | ❌ **aucun slot** dans le format plugin |
| Hooks git (`commit-msg`, `pre-commit`, `pre-push`) | — | ❌ **faux ami** : `hooks/hooks.json` d'un plugin = hooks du **harness** (événements de session), pas des hooks **git**. Un plugin n'installe pas de `.git/hooks` |
| Commands | `commands/*.md` | — rien à migrer (vectorz n'en a pas) |

Autrement dit : le plugin couvre **proprement la moitié « catalogue 2 » (l'équipe)** et
**pas la moitié « catalogue 1 » (la loi)**. Le `bind` par projet reste probablement nécessaire
pour les rules + hooks git. Ce n'est pas un remplacement, c'est un **second canal** — et il
faut l'assumer explicitement plutôt que le découvrir à l'implémentation.

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
0083 doit s'y brancher plutôt que d'en inventer une troisième.

### 2. Le repo peut-il être son propre marketplace ?

Techniquement oui — un repo peut porter son `marketplace.json`. **Deux obstacles constatés,
non résolus :**

- **`elzinko/vectorz` est privé** (vérifié le 2026-07-20). Un marketplace est un repo que le
  client **clone** : chaque consommateur aurait besoin d'un accès git au repo. Acceptable pour
  l'auteur seul, ça annule le bénéfice « multi-devs ».
- **C'est un monorepo à deux produits.** Un marketplace à la racine expose vectorz — dont cop1,
  qui n'a rien à faire dans un plugin de catalogue.

Options non départagées : (a) marketplace à la racine du repo privé, accès git requis ;
(b) **repo public dédié** alimenté par un export déterministe (le cap produit l'arborescence,
un job la pousse) ; (c) repo public dédié tenu à la main. Le choix dépend de la réponse à
« qui doit pouvoir installer ? » — question **produit, pour le PO**, pas technique.

### 3. Le mode `--link` survit-il ?

Le symlink live-update est un actif réel pour l'auteur (boucle d'édition immédiate). Un plugin
installé est une copie figée. Hypothèse de travail à valider : **les deux coexistent**
(`bind-global --link` pour l'auteur, plugin pour les consommateurs) — mais alors deux chemins
d'installation cohabitent sur la même machine et peuvent se marcher dessus dans `~/.claude`.
Non instruit.

### 4. Un plugin, ou un plugin par profil ?

`profiles/` est le keystone (ADR-0001) : `global`, `base`, `mobile`, `desktop`, `cop1-target`.
Un plugin s'installe en bloc. Faut-il un plugin par profil (`vectorz-global`, `vectorz-mobile`…),
un seul plugin exhaustif, ou un plugin + une sélection côté utilisateur ? Non tranché.

### 5. Recoupement avec 0078 (`.mcpb`)

0078 packagera l'émetteur de supervisabilité en `.mcpb` pour **Claude Desktop**. Le slot
`.mcp.json` d'un plugin ferait la même chose pour **Claude Code**. Même serveur, deux canaux.
À arbitrer : le plugin embarque-t-il le serveur MCP, ou reste-t-il un plugin de catalogue pur ?
Sa AC « Distribution : où vit le `.mcpb` téléchargeable » est ouverte et **peut se résoudre
au même endroit** que celle de cette fiche.

## Critères d'acceptation (première esquisse — à retravailler au grooming)

- [ ] **Décision de versionnage actée en ADR** (aligné umbrella vs mega-city indépendant),
      cohérente avec ADR-025 §2 / ADR-023 option D et avec cop1 0050. *Bloquant : rien ne se
      code avant.*
- [ ] **Décision de marketplace actée** (repo privé auto-marketplace vs repo public dédié),
      avec la réponse explicite à « qui doit pouvoir installer ».
- [ ] Cap `claude-code-plugin` : `materialize` **pur**, testé unitairement sur le `WritePlan`
      (méthode ADR-0014), entrée dans `registry.ts`.
- [ ] Le plugin produit passe l'agent **`plugin-validator`** (marketplace `claude-plugins-official`).
- [ ] Sur une machine **vierge de tout `bind`** : `/plugin install …` puis les 18 skills et
      7 agents sont disponibles — constaté, pas déduit.
- [ ] Une modification de catalogue mergée sur `main` → nouvelle version → `/plugin update`
      la ramène ; la version installée est **lisible** côté consommateur.
- [ ] Le sort des rules + hooks git est **écrit** (le plugin ne les porte pas) : soit `bind`
      par projet reste requis et documenté, soit une alternative est tranchée.
- [ ] Doc utilisateur : installation, MAJ, et **ce que le plugin ne couvre pas**.

## Notes

- **P1 (PO, 2026-07-20)** — capturée en `status: idea` : la direction est claire, le point de
  conception n°1 (versionnage) ne l'est pas. `ready:` volontairement vide → gate DoR (ADR-0016).
- **Anti-doublon vérifié (2026-07-20)** : aucune fiche des deux backlogs ne porte le sujet
  « plugin Claude Code / marketplace ». Les seules occurrences de « plugin » sont incidentes
  (0069 : *« pas de plugin exotique »* ; 0052 : postiz).
- **Fiches liées** :
  - **[0078](0078-mcpb-install-un-clic-supervision.md)** — l'autre volet packaging (`.mcpb`,
    Claude Desktop). Même question ouverte de distribution ; cf. §Incertitude 5.
  - **[0029](0029-propagation-maj-skills.md)** — propagation des MAJ *breaking* : traite les
    **données/schéma** là où 0083 traite le **code + la version**. Un plugin versionné donne
    à 0029 le `VERSION` qu'elle postule.
  - **cop1 [0050](../../../features/0050-release-pastille-dogfooding.md)** — canal de release +
    pastille de MAJ au niveau vectorz. **Dépendance de conception** : si 0050 définit la version
    figée de vectorz, 0083 s'y branche.
- **ADR de référence** : ADR-0001 (catalogues host-agnostiques + `caps/<host>/`),
  ADR-0003 (`materialize` pur), ADR-0005 (export statique primaire, MCP différé),
  ADR-0014 (précédent cap desktop), ADR-0018 (link vs copy) ; côté umbrella
  ADR-023 (option D en réserve), ADR-025 §2 (versionnement d'ensemble).
- **Outillage disponible** : plugin officiel `plugin-dev` (`/create-plugin`, agents
  `plugin-validator` et `skill-reviewer`) — à composer, pas à réimplémenter.
