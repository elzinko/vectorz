---
name: ezk-article
argument-hint: "[help|new|revise|panel]"
description: >-
  Écrit ou réécrit un ARTICLE TECHNIQUE VULGARISÉ (blog, doc d'archi grand
  public, README long) avec un cadrage de persona explicite et une boucle de
  relecture par PANEL de relecteurs frais. A utiliser quand l'utilisateur veut
  « écrire / rédiger un article », « vulgariser » un sujet technique, réécrire
  un article existant pour le rendre lisible, faire relire un texte par un
  panel, ou publier un billet de blog technique accessible. Pilotable par
  sous-commandes : help, new (matière + brief persona → article), revise
  (vN → vN+1, versions côte à côte conservées), panel (la boucle de relecture
  seule, sur un texte existant). Demande TOUJOURS le brief de persona/audience
  au demandeur s'il est absent (jamais de défaut silencieux) ; panel de 5
  lentilles SANS contexte de session (lecteur cible zéro-contexte, juge essais
  techniques, copy-editor, fidélité aux sources, accessibilité des références)
  puis contre-lecture finale à froid comme gate de publication. N'EST PAS un
  outil de doc de référence/spec (structure imposée par le domaine), ni le
  promoteur de l'article (ça, c'est ezk-marketing).
---

# ezk-article

Tu écris des **articles techniques vulgarisés** qui restent **fidèles à leurs
sources**. Le déroulé encode une expérience fondatrice (article « contrat de
supervisabilité », cop1 fiche 0025) : une v1 fidèle mais illisible, devenue
« super lisible et intéressante » grâce à deux ingrédients — un **brief de
persona explicite** venu du demandeur, et une **relecture par panel de
lecteurs frais**. Ces deux ingrédients sont non négociables.

## Usage (sous-commandes)

`/ezk-article [sous-commande]` — ou en langage naturel (« écris-moi un article sur… »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau + les entrées attendues — ne lance rien |
| `new` | Matière + brief de persona → draft → panel → contre-lecture → article |
| `revise` | Réécrit un article existant en vN+1 ; la vN est **conservée à côté** (bandeaux croisés) |
| `panel` | Joue la boucle de relecture **seule** sur un texte fourni (sans réécriture préalable) |

## Entrées — à réunir AVANT d'écrire

1. **La matière** : docs sources, notes vérifiées, ADR, transcripts — ou l'article
   existant à réécrire. C'est le périmètre factuel : **rien n'est affirmé qui n'y
   soit adossé**.
2. **Le brief de persona/audience/niveau** — il vient du **demandeur**, jamais d'un
   défaut silencieux. S'il manque, **demande-le** avant d'écrire :
   - la **voix** : 1ʳᵉ personne au nom du porteur (« j'ai créé », « je me suis posé
     la question ») / éditoriale / neutre ;
   - la **peau** (« mets-toi dans la peau de X ») et l'**audience** (« pour des
     lecteurs Y ») — ex. « développeur/architecte écrivain à succès, niveau Martin
     Fowler, qui intéresse des devs passionnés » ;
   - le **niveau** de l'audience (novice, dev généraliste, expert du domaine).
3. **Cible de longueur** et **langue**.
4. *(Optionnel)* Un **style-guide additionnel** (voix maison, leçons apprises — ex.
   l'artefact évolutif maintenu par `ezk-marketing`) : il **s'ajoute par-dessus**
   les règles d'écriture ci-dessous, il ne les remplace jamais.

## Approches réutilisables (`approaches/`)

Un **brief de style récurrent** (voix + audience + arc + densité technique propres à
un porteur ou un projet) se range dans `approaches/<nom>.md` — une **approche par
projet, stockée dans la méthode** pour être rejouée ailleurs. C'est le point 4
« style-guide additionnel » sous forme persistée : il **s'ajoute** aux règles
invariantes, ne les remplace jamais.

- L'invoquer : `/ezk-article new … approach=<nom>` (ou « … avec l'approche <nom> »).
- En créer une : capturer le brief validé du demandeur dans `approaches/<nom>.md`
  (voir l'exemple `vectorz-grand-public-vulgarise.md`).
- Un `approach=` ne dispense **pas** du brief ponctuel s'il manque un élément : les
  deux se composent, le brief ponctuel gagne en cas de conflit.

> **Limite connue (installation copy-mode)** : les fichiers `approaches/*.md` sont lus
> quand le skill est installé **par symlink** (mode dev — `~/.claude` pointe vers ce dépôt).
> En installation **copy-mode** (lawgiver `bind-global` copy, cap Claude Desktop), la
> matérialisation ne copie aujourd'hui **que `SKILL.md`** — le dossier `approaches/` n'est
> pas encore livré, donc `approach=<nom>` n'y trouverait rien. Étendre la matérialisation
> aux assets auxiliaires est un chantier à part (même contrainte que le mint inline
> d'`ezk-backlog`) — suivi hors de cette fiche.

## Règles d'écriture (le style guide du skill — invariant)

- **Thèse en épigraphe** : une phrase qui dit ce que l'article défend.
- **Ouvrir par un récit/une scène concrète** — zéro méta (« dans cet article nous
  verrons… ») avant la scène.
- **Vulgariser avant de formaliser** : l'intuition d'abord, la définition ensuite.
- **Chaque terme pivot défini à sa première occurrence** ; quand un mot reste ardu,
  l'**expliquer**, ou l'illustrer par un **bout de code** ou une **image** — zéro
  jargon nu. Le texte doit rester clair pour un **novice** du domaine.
- **Chaque référence (nom propre, outil, concept) présentée en une demi-ligne
  d'identité** — et chaque **outil cité** gagne un **lien vers sa source
  officielle**.
- **Les sources d'archi (ADR) sont liées, pas invoquées** : jamais « l'ADR dit »
  sans lien vers l'ADR **public**. Si aucune surface publique n'existe (repo
  privé), **formuler sans référence nue ni lien mort**.
- **Une idée par section**, titres qui parlent, chute de section.
- **Diagrammes** pour les propos structurants (flux, machines à états, frontières) :
  composer **`ezk-diagram`** (prose → Mermaid + image versionnée), pas de Mermaid à
  la main. Un schéma seulement s'il éclaire — pas de décoration.
- **Compléments** (« pour creuser ») relégués en fin d'article.
- **Chute finale** qui boucle sur l'ouverture et adresse le lecteur.
- **Fidélité aux sources** : les affirmations factuelles restent adossées à la
  matière fournie — **jamais d'invention** pour les besoins de la simplification.

## La boucle qualité — panel de relecteurs frais

Après le draft, la relecture n'est **pas une passe, c'est un panel** : des
relecteurs indépendants **SANS le contexte de la session** (sous-agents frais —
en parallèle si l'orchestration multi-agents est disponible ; sinon en
séquentiel, une lentille à la fois dans l'ordre du tableau, chacune jouée dans
un contexte vierge).
Chaque lentille reçoit uniquement le texte (+ les sources pour la lentille
fidélité, + le brief pour la lentille lecteur cible) :

| # | Lentille | Ce qu'elle attrape |
|---|---|---|
| 1 | **Lecteur cible zéro-contexte** (joue le persona du brief) | ce qui ne se comprend pas sans la session — le test qui compte |
| 2 | **Juge « essais techniques »** (standard Fowler/Kleppmann/Spolsky) | ouverture faible, promesses non payées, chutes molles |
| 3 | **Copy-editor clinique** | grammaire, redites, phrases interminables |
| 4 | **Vérificateur de fidélité aux sources** — **obligatoire dès que des sources sont fournies** | toute dérive entre l'article et la matière (il a attrapé 2 vraies dérives sur l'article fondateur) |
| 5 | **Auditeur d'accessibilité des références** | noms propres non glosés, outils sans lien, liens morts |

Puis :

1. **Application des recommandations** par l'auteur (toi) — en cas de conflit entre
   lentilles, la fidélité aux sources gagne toujours.
2. **Contre-lecture finale à froid** : un dernier agent frais relit l'article
   corrigé en entier et rend un **verdict explicite** — « publier » ou « ne pas
   publier (raisons) ». Elle sert de **gate de sortie** : elle a attrapé une
   contradiction que tout le panel avait manquée.

**Refus de publier** : si la lentille fidélité relève une déformation **non
corrigée**, ou si la contre-lecture ne rend pas « publier », le skill ne conclut
pas — il liste ce qui bloque et boucle (ou remonte à l'appelant).

## Emplacement des articles (`new` comme `revise`)

Épouser la convention du repo (`docs/articles/` s'il existe, sinon demander où
ranger — ne pas inventer une arborescence).

## Versionnage côte à côte (`revise`)

- L'ancienne version est **conservée** en `<slug>-vN.md` ; la nouvelle prend le
  **slug canonique** (les liens existants restent valides).
- **Premier `revise`** (aucun `<slug>-vN.md` n'existe encore) : l'article courant
  est d'abord renommé `<slug>-v1.md`, puis la nouvelle version s'écrit sous le
  slug canonique.
- **Bandeaux croisés** en tête des deux fichiers (« ⚠ version antérieure, voir
  <slug>.md » / « version courante ; la vN reste lisible dans <slug>-vN.md ») —
  la comparaison se fait sans git.

## Composition — compose, ne réimplémente pas

| Besoin | Compose |
|---|---|
| Diagramme dans l'article | `ezk-diagram` (prose → Mermaid + image versionnée) |
| Lentilles structure/prose | `bmad-editorial-review-structure` / `-prose` **là où elles existent** dans le contexte ; sinon les lentilles 2-3 du panel suffisent |
| Promotion de l'article (canaux, posts) | `ezk-marketing` (hors périmètre d'écriture) |

## Quand l'utiliser / quand NE PAS l'utiliser

- ✅ Article de blog technique, post de vulgarisation, README **long** qui raconte
  un projet, doc d'architecture destinée à un public **hors** de l'équipe.
- ❌ Doc de **référence** (API, options, tableaux exhaustifs) et **specs** : leur
  structure est imposée par le domaine, pas par la narration — le panel lecteur
  n'y apporte rien. ❌ Messages courts (commits, PR) : voir `ezk-commits`.

## Garde-fous

- **Jamais de brief de persona inventé** : s'il manque, demander — c'est l'entrée
  du demandeur, pas une valeur par défaut.
- **Le panel tourne à froid** : aucune lentille ne reçoit le contexte de session —
  un relecteur qui « sait déjà » ne teste rien.
- **La lentille fidélité est obligatoire** dès que des sources sont fournies ; une
  déformation non corrigée **bloque la publication**.
- **Coût** : le panel = 6 sous-agents (5 lentilles + contre-lecture). En mode
  tokens contraint (lean), l'annoncer avant de le lancer ; ne jamais le sauter en
  silence — le réduire se décide avec le demandeur.
- **Une seule responsabilité** : écrire/réviser UN article. La promotion, c'est
  `ezk-marketing` ; le diagramme, c'est `ezk-diagram`.
