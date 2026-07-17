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
  edit, rm, dup, publish. Stocke un artefact versionné par diagramme dans
  `diagrams/<slug>/` : la prose (source), le diagram-as-code (Mermaid généré),
  l'image (SVG rendue), une explication LECTEUR (« Ce que montre ce diagramme »,
  assemblée dans le README publié), + un meta. Le LLM synthétise le Mermaid depuis la prose
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
| `publish <slug>` | (Re)génère les vues partageables d'un diagramme : `README.md` rendu par GitHub (explication lecteur + mermaid) + liens mermaid.live/ink |

## L'artefact versionné par diagramme — triplet source + vues dérivées

Le **triplet source** reste prose / Mermaid / image ; `explanation.md`, `README.md` et
`meta.yaml` en sont des **vues dérivées** (générées, jamais éditées à la main).

```
diagrams/<slug>/
  description.md   # LA PROSE = source de vérité (ce que l'humain a dit)
  diagram.mmd      # diagram-as-code Mermaid (GÉNÉRÉ depuis la prose — ne pas éditer à la main)
  diagram.svg      # image (RENDUE depuis le .mmd par scripts/render.sh)
  explanation.md   # « Ce que montre ce diagramme » (GÉNÉRÉ depuis la prose : résumé LECTEUR
                   #   rédigé par le LLM, régénéré à chaque publish — jamais édité à la main)
  README.md        # vue partageable (GÉNÉRÉE par scripts/publish.sh depuis le .mmd + explanation.md) :
                   #   explication + bloc mermaid rendus NATIVEMENT par GitHub → ouvrir l'URL du dossier suffit
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
3. **Générer le Mermaid** — écris/actualise `diagram.mmd` en appliquant les **Règles de
   lisibilité** (section dédiée). C'est **ta capacité native** : aucune API, aucun service externe.
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
5. **Écrire la prose, l'explication + le meta** — `description.md` (la prose validée),
   `explanation.md` (le **résumé lecteur** : « Ce que montre ce diagramme » en langage courant,
   rédigé par toi **depuis la prose** — quelques phrases adaptées au lecteur, pas un dump de la
   prose si elle est longue) et `meta.yaml` (titre, date fournie par l'humain ou `git log`, type
   de diagramme, liens éventuels, **et un bloc `share:` avec les liens `edit`/`img` capturés
   en (4)**). **Ne devine jamais la date** : demande-la si inconnue.
6. **Valider** — passe d'abord le diagramme au **test final** des Règles de lisibilité, puis montre le
   Mermaid + (si rendue) l'image, **donne les vues partageables** (l'URL du dossier
   GitHub `diagrams/<slug>/`, qui rend le `README.md` inline, + le lien mermaid.live d'édition), et **demande** :
   « c'est le diagramme voulu, et se comprend-il sans explication ? ». L'humain corrige **verbalement** →
   retour en (1) sur le même slug. On ne fige rien tant que ce n'est pas validé.
7. **Ranger (git)** — quand l'humain valide, **commit** le triplet (délègue à `ezk-commits` : `docs(diagram): <slug> …`).
   Tu ne fais pas de merge/push toi-même.

## Règles de lisibilité — les conditions d'un schéma parlant

Un diagramme juste mais illisible est un diagramme **raté**. Un bon schéma se comprend
**sans le texte autour**. Applique ces conditions en générant (3), revérifie-les avant de
valider (6) ; les règles 4-5 s'appliquent selon le type choisi en (2).

1. **Un concept par diagramme.** Si la prose mêle plusieurs idées (un mécanisme + une
   comparaison + des garde-fous), propose **plusieurs petits diagrammes** plutôt qu'un seul dense.
2. **Le vocabulaire du lecteur.** Pour un lecteur non technique, tout terme technique affiché
   est traduit en langage courant (`cache_hit · « déjà en mémoire »`) ou n'apparaît pas ; pour
   un lecteur technique, les identifiants exacts restent (dans un `classDiagram`, `user_id` EST
   l'information). Dans tous les cas, **jamais de payload brut** (`{champ: valeur, …}`) en étiquette.
3. **Étiquettes courtes, flèches nommées.** ~5 mots par case, un verbe d'action pour les étapes ;
   si la traduction allonge trop, le terme courant va dans la case et le terme technique en note.
   Chaque flèche porte un verbe (`-->|génère|`) : une flèche qu'on ne sait pas nommer est un
   lien qu'on n'a pas compris soi-même.
4. **Qui fait quoi, dans un seul sens de lecture.** Pour un flux ou une séquence : des acteurs
   reconnaissables (l'humain « Toi », l'agent, le fichier/système), une action par case, le
   point d'entrée déclaré en premier, pas de flèche qui remonte le flux sauf boucle
   explicitement nommée (« retour »). En `flowchart` : UNE direction (`TD` ou `LR`) tenue de
   bout en bout. En `sequenceDiagram` : l'ordre des messages EST le sens de lecture — numérote
   avec `autonumber` (`TD`/`LR` n'y existent pas).
5. **Une comparaison = un face-à-face.** Deux `subgraph` jumeaux à structure interne identique
   (mêmes étapes, même ordre) ; Mermaid ne garantit pas l'alignement ligne-à-ligne — s'il compte
   plus que le dessin, un tableau markdown dans le README est un choix assumé.
6. **Peu d'éléments, couleurs qui parlent.** ~5-7 nœuds pour un flux/mécanisme ; pour un type
   structurel (org-chart, `erDiagram`, `gantt`), compte par niveau et **regroupe avant de
   découper** — avec le mécanisme du type (`subgraph` en flowchart, `section` en gantt ; un
   `erDiagram` n'a pas de regroupement : scinde par domaine, cf. règle 1). 2-3 couleurs max,
   chacune porteuse d'un sens constant (une couleur = un acteur/rôle) ; la légende est un petit
   `subgraph` dédié (flowchart), hors budget de nœuds — ou du texte dans le README.
7. **Le test final.** Relis le `.mmd` **étiquette par étiquette**, comme si tu découvrais le
   sujet : s'il faut une explication pour comprendre une case, reformule-la — ou sors-la du
   schéma (l'explication vit dans la prose). Le verdict visuel (densité, croisements) revient à
   l'humain en (6) — c'est pour ça qu'on lui demande « se comprend-il sans explication ? ».
   La section « Ce que montre ce diagramme » du README publié **complète** un schéma déjà
   autoportant — elle n'excuse jamais un schéma illisible.

## Détail des sous-commandes

- **`add "<prose>"`** — dérive un **slug** court en kebab depuis la prose (ex. « la boucle dev↔reviewer » → `boucle-dev-reviewer`) ;
  refuse un slug déjà présent (propose `edit` ou `dup`). Crée `diagrams/<slug>/`, déroule la boucle (1→7).
- **`list`** — lit `diagrams/*/meta.yaml` ; affiche `slug · titre · date`, triés par date. N'ouvre pas les fichiers.
- **`edit <slug>`** — charge la prose + le .mmd existants, applique la **correction verbale**, régénère code + image, revalide (boucle).
- **`rm <slug>`** — **confirme** puis supprime le dossier ; commit `docs(diagram): rm <slug>`.
- **`dup <slug> [<nouveau-slug>]`** — copie le triplet vers un nouveau slug (défaut : `<slug>-copie`) comme base de variante ; ne rend pas tant qu'on n'édite pas.
- **`publish <slug>`** — (re)génère les vues partageables **sans rien changer au diagramme**. D'abord
  **régénère `explanation.md`** depuis `description.md` (toi : résumé lecteur, à réécrire si la prose a
  changé ou si le fichier manque — cas des diagrammes antérieurs à cette section), puis lance
  `scripts/publish.sh diagrams/<slug>` → réécrit `README.md` (explication + rendu GitHub) et te rend les
  liens mermaid.live/ink à surfacer. Repli du script si `explanation.md` manque : la prose telle quelle.
  Utile pour publier un diagramme ancien, ou après un `git pull`.

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
