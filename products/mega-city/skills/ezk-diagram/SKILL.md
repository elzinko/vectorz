---
name: ezk-diagram
argument-hint: "[help|add|list|edit|rm|dup|publish]"
description: >-
  Transforme une DESCRIPTION EN PROSE en un diagramme VERSIONNÉ (Mermaid +
  image), itéré VERBALEMENT — sans jamais écrire de Mermaid à la main. A utiliser
  quand l'utilisateur veut « faire un schéma / un diagramme », « visualiser une
  archi / un flux / un organigramme / une machine à états », décrire une
  structure avec ses mots et obtenir un diagramme, réviser/corriger un diagramme
  existant en langage naturel, ou versionner / retrouver / dupliquer / supprimer
  un diagramme entre sessions. Pilotable par sous-commandes : help, add, list,
  edit, rm, dup. Stocke un TRIPLET versionné par diagramme dans
  `diagrams/<slug>/` : la prose (source), le diagram-as-code (Mermaid généré),
  l'image (SVG rendue), + un meta. Le LLM synthétise le Mermaid depuis la prose
  (capacité native, ZÉRO service externe) ; le rendu image est LOCAL
  (mermaid-cli/`mmdc`). Descriptif d'abord : le diagramme EST l'artefact
  (comprendre/documenter). N'EST PAS un éditeur Mermaid manuel, ni un service de
  dessin en ligne, ni un moteur d'exécution — juste « je décris, ça se dessine,
  je valide, ça se versionne ».
---

# ezk-diagram

Tu tiens la boucle **prose → diagramme → image**, versionnée et révisable. L'humain
**décrit avec ses mots** ; **toi (LLM)** tu synthétises le **Mermaid** ; un **script**
rend l'**image**. L'humain valide/corrige **verbalement**, tu régénères. Git versionne
le tout. **L'humain n'écrit jamais de Mermaid ni de YAML.**

## Usage (sous-commandes)

`/ezk-diagram [sous-commande] [args]` — ou en langage naturel (« fais-moi un schéma de… »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau + la liste des diagrammes existants |
| `add "<prose>"` | Crée un diagramme depuis une description : slug + triplet + rendu, puis boucle de validation |
| `list` | Liste les diagrammes (`diagrams/*/`) : slug · titre · date |
| `edit <slug>` | Reprend un diagramme : tu appliques une correction **verbale** → prose + code + image régénérés |
| `rm <slug>` | Supprime `diagrams/<slug>/` (demande confirmation) |
| `dup <slug> [<nouveau-slug>]` | Duplique un diagramme comme point de départ d'une variante |
| `publish <slug>` | (Re)génère les vues partageables d'un diagramme : `README.md` rendu par GitHub + liens mermaid.live/ink |

## L'artefact — un triplet versionné par diagramme

```
diagrams/<slug>/
  description.md   # LA PROSE = source de vérité (ce que l'humain a dit)
  diagram.mmd      # diagram-as-code Mermaid (GÉNÉRÉ depuis la prose — ne pas éditer à la main)
  diagram.svg      # image (RENDUE depuis le .mmd par scripts/render.sh)
  README.md        # vue partageable (GÉNÉRÉE depuis le .mmd par scripts/publish.sh) : bloc
                   #   mermaid rendu NATIVEMENT par GitHub → ouvrir l'URL du dossier suffit à voir le schéma
  meta.yaml        # titre, date, type, liens + share: (liens mermaid.live/ink) — géré par l'outil
```

**Trois couches, chacune générée depuis celle du dessus** (Model → View-as-code → View-as-image) :
la **prose** est la source ; le **Mermaid** en est le rendu-texte ; l'**image** est le rendu-visuel,
produit **à la demande** (quand le .mmd change). L'humain lit l'image ; toi tu lis/écris la prose et
le Mermaid ; **tu ne fais jamais interpréter l'image** — tout le sens vit dans la prose + le .mmd.

## La boucle (le cœur du skill)

Pour `add` comme pour `edit`, déroule **toujours** :

1. **Comprendre** — pars de la prose (nouvelle description, ou correction verbale sur un diagramme existant).
2. **Choisir le type Mermaid** adapté au sens : `flowchart` (flux/archi), `sequenceDiagram` (échanges),
   `stateDiagram-v2` (états), `classDiagram` (structures), `erDiagram`, `mindmap`, `gantt`… Ne force pas un flowchart si un autre type dit mieux la chose.
3. **Générer le Mermaid** — écris/actualise `diagram.mmd`. C'est **ta capacité native** : aucune API, aucun service externe.
4. **Rendre l'image, puis publier les vues** — lance les scripts déterministes :
   ```bash
   bash <skill>/scripts/render.sh  diagrams/<slug>/diagram.mmd   # → diagram.svg
   bash <skill>/scripts/publish.sh diagrams/<slug>               # → README.md (GitHub) + liens mermaid.live/ink
   ```
   `render.sh` produit `diagram.svg`. `publish.sh` produit `README.md` (bloc mermaid rendu **NATIVEMENT
   par GitHub** — la vue « ouvrir & visualiser » recommandée) et imprime sur stdout les lignes
   `edit`/`view`/`img` (mermaid.live / mermaid.ink) — **capture-les** pour le meta (5) et la validation (6).
   **Fallback gracieux** : si `mmdc`/`npx` sont absents, `render.sh` garde le `.mmd` et te le dit
   (propose alors un **MCP mermaid** / l'outil **visualize**, ou livre le `.mmd`) ; si `node` est absent,
   `publish.sh` écrit quand même le `README.md` (bloc mermaid seul) et saute les liens B.
5. **Écrire la prose + le meta** — `description.md` (la prose validée) et `meta.yaml` (titre, date fournie
   par l'humain ou `git log`, type de diagramme, liens éventuels, **et un bloc `share:` avec les liens
   `edit`/`img` capturés en (4)**). **Ne devine jamais la date** : demande-la si inconnue.
6. **Valider** — montre le Mermaid + (si rendue) l'image, **donne les vues partageables** (l'URL du dossier
   GitHub `diagrams/<slug>/`, qui rend le `README.md` inline, + le lien mermaid.live d'édition), et **demande** :
   « c'est le diagramme voulu ? ». L'humain corrige **verbalement** → retour en (1) sur le même slug.
   On ne fige rien tant que ce n'est pas validé.
7. **Ranger (git)** — quand l'humain valide, **commit** le triplet (délègue à `ezk-commits` : `docs(diagram): <slug> …`).
   Tu ne fais pas de merge/push toi-même.

## Détail des sous-commandes

- **`add "<prose>"`** — dérive un **slug** court en kebab depuis la prose (ex. « la boucle dev↔reviewer » → `boucle-dev-reviewer`) ;
  refuse un slug déjà présent (propose `edit` ou `dup`). Crée `diagrams/<slug>/`, déroule la boucle (1→7).
- **`list`** — lit `diagrams/*/meta.yaml` ; affiche `slug · titre · date`, triés par date. N'ouvre pas les fichiers.
- **`edit <slug>`** — charge la prose + le .mmd existants, applique la **correction verbale**, régénère code + image, revalide (boucle).
- **`rm <slug>`** — **confirme** puis supprime le dossier ; commit `docs(diagram): rm <slug>`.
- **`dup <slug> [<nouveau-slug>]`** — copie le triplet vers un nouveau slug (défaut : `<slug>-copie`) comme base de variante ; ne rend pas tant qu'on n'édite pas.
- **`publish <slug>`** — (re)génère les vues partageables **sans rien changer au diagramme** : lance `scripts/publish.sh diagrams/<slug>` → réécrit `README.md` (rendu GitHub) et te rend les liens mermaid.live/ink à surfacer. Utile pour publier un diagramme ancien, ou après un `git pull`.

## Garde-fous

- **L'humain n'écrit jamais de Mermaid/YAML** : il décrit, tu synthétises. `diagram.mmd` est **généré** — jamais édité à la main (il serait écrasé au prochain rendu).
- **La prose est la source de vérité** : si prose et .mmd divergent, la prose gagne — régénère le .mmd depuis elle.
- **Descriptif d'abord** : le diagramme **documente/aide à comprendre** ; il ne *pilote* aucun comportement (pas de moteur d'exécution ici).
- **Le LLM génère, le script rend** (ADR-0001) : la synthèse prose→Mermaid = toi ; Mermaid→image = `scripts/render.sh`. Ne réimplémente pas mmdc.
- **Reste dans l'écosystème par défaut** : la synthèse (prose→Mermaid) et le rendu image sont **locaux**,
  aucune donnée ne sort. **Exception opt-in assumée** — la vue B (`publish.sh` → liens mermaid.live / mermaid.ink)
  encode le diagramme dans une URL de **service externe** : pratique pour partager/éditer vite, mais le
  diagramme y voyage. La vue **sans service tiers reste le `README.md` rendu par GitHub** (vue A, recommandée) :
  privilégie-la, et ne propose B que si l'humain veut éditer/partager en ligne.
- **Ne devine ni date ni titre** : demande si inconnu (`meta.yaml`).
- **Une seule responsabilité** : autorat de diagrammes versionnés. Pas le backlog (`ezk-backlog`), pas les commits (`ezk-commits`).

## Note — rampe d'accès vers un modèle typé (hors MVP)

Ce skill est **descriptif** : la prose → Mermaid → image. Le jour où l'on voudra que le diagramme
*pilote* du comportement (rôles/interactions/autorité exécutables — cf. mega-city fiche 0033),
la même commande `add` pourra émettre **en plus** un 4e fichier — un **modèle typé** (YAML) compilé
depuis la prose — dont le Mermaid deviendrait une simple vue. **L'humain ne rédigerait toujours pas de YAML.**
C'est une **évolution notée**, pas construite ici.

## Premier usage réel visé

Générer l'**org-chart des rôles ezk-*** (mega-city fiche 0028) **depuis la prose**, au lieu de le dessiner
à la main — d'une pierre deux coups : on prouve le skill et on remplit une fiche existante.
