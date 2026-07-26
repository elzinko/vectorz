---
id: 0079
title: Lisibilité des artefacts humains — graver la règle (élargie des restitutions PO à tout artefact lu par un humain)
type: feature
priority: P1
epic:
depends: []
labels: [method]
status: todo
ready: 2026-07-26
pr:
created: 2026-07-18
---

# 0079 — Restitutions PO lisibles, gravées dans la méthode

## Contexte / Problème

Rétro du 2026-07-18 (capture `docs/captures/2026-07-18-retro-cinq-sprints.md`, §6) : la
restitution de la cérémonie au PO était **illisible pour lui** — codes internes (« R1 »,
« DoR », « MUST »), sigles, densité — alors même que la rétro portait sur la clarté des
docs. Le PO a dû demander une réécriture.

La leçon a été consignée… **dans la mémoire de l'agent** (`~/.claude/projects/...`), qui
est **personnelle et hors méthode** : un autre agent, une autre machine, un autre
opérateur ne l'héritent pas. Demande explicite du PO (2026-07-18) : « créer une feature
pour que ce ne soit pas seulement consigné dans la mémoire, mais gravé dans les
skills / agents ».

## Valeur

Tout artefact lu par un humain (description de PR, fiche backlog, capture, compte rendu de
rétro, checkpoint de product-builder, résumé de clôture de sprint) est **compréhensible du
premier coup** — quel que soit l'agent qui le produit. La règle survit aux sessions, aux
machines et aux modèles.

## Proposition

Graver la consigne de restitution dans les artefacts de méthode qui la produisent :

1. **Une règle de communication** `rules/documentation-guidelines/human-facing-lisibility.md`
   (niveau MUST, contrôlée par `ezk-reviewer` comme `pr-before-after-media`), **élargie des
   seules restitutions PO à TOUT artefact lu par un humain** (description de PR, fiche,
   capture, restitution, checkpoint) :
   - ouvre par un bloc « En clair » : l'essentiel en ≤3 phrases, AVANT le détail ;
   - trame : symptôme vécu → proposition en mots simples → effet concret ;
   - codes internes et jargon inventé (R1, DoR, « verrou », « borne anti-veto »…) interdits
     hors annexe/glossaire — jamais porteurs du sens dans l'ouverture ;
   - on écrit À l'humain visé, pas entre agents ; carte courte plutôt que dossier exhaustif.
   Activation composable : ajouter la règle au `bundles/documentation-guidelines.yml`.
2. **Les skills qui parlent au PO** intègrent la consigne à leur étape de restitution :
   `ezk-retro` (temps 5, rangement), `ezk-product-builder` (checkpoints
   suggestions-à-choix), `ezk-sprint` (résumé de clôture ⛳).
3. **Là où la PR naît** — le cas « corps de PR », ajouté le 2026-07-26 (cf. Notes).
   La voix ne suffit pas ici : il manque un **squelette**, un **lien vers la fiche** et un
   **plan de test**. Aucun endroit du repo ne compose un corps de PR aujourd'hui (`gh pr
   create` n'apparaît nulle part) — il est écrit librement à l'étape PR d'`ezk-sprint`.
   Cibles précises :

   | Cible | Ce qu'on y ajoute | Pourquoi elle |
   |---|---|---|
   | `skills/ezk-sprint/SKILL.md` — **étape PR** (§8) | les 3 blocs + le **chemin de la fiche** (l'id est déjà connu : nom de branche `feat/<id>-<slug>`) | seul endroit où un corps de PR est produit ; n'exige aujourd'hui que le titre conventional-commit + le before/after |
   | `skills/ezk-sprint/SKILL.md` — **DoD de la boucle** | « PR ouverte » → « PR ouverte **avec un corps relisable seul** » | sinon la DoD reste satisfaite par une PR opaque |
   | `skills/ezk-pr-pilot/SKILL.md` — **`init`** | matérialiser le « squelette mince », aujourd'hui **décrit en prose seulement**, en asset réel `assets/PULL_REQUEST_TEMPLATE.thin.md` | symétrique de `assets/PR_VALIDATION.template.md`, qui existe déjà pour le fond |
   | la règle du point 1 | y nommer le **cas corps de PR** ; même forme de front-matter que `development/pr-before-after-media` (`kind: disposition`, `level: MUST`, `enforcements: agent-check → ezk-reviewer`) | `catalog.test.ts` indexe les règles par front-matter : la forme est contrainte |
   | un test de contrat (nouveau) | croiser SKILL.md ↔ règle ↔ asset template, sur le modèle de `src/supervision/__tests__/skill-emission-contract.test.ts` | **aucun test n'assure aujourd'hui le contenu d'une SKILL.md** — c'est exactement le trou de mc-0095 |
   | `ezk-commits` | **hors périmètre** — 0 occurrence de « PR » dans son texte ; il fournit le **titre** par délégation. Au plus une ligne de frontière « je ne fais pas les corps de PR ». | garder la responsabilité là où elle est |

   **Reste projet-local, jamais dans les skills** : `.github/PULL_REQUEST_TEMPLATE.md` (le
   squelette) et `docs/PR_VALIDATION.md` (la matrice, adaptée aux modalités qui existent
   vraiment dans le repo). **Aucun des deux n'existe dans vectorz** — `ezk-pr-pilot init`
   n'y a jamais été lancé, alors que le repo publie la convention dans son propre
   catalogue. Le garde-fou existant est conservé mot pour mot : template `.github/`
   **absent** → créer un squelette mince ; **présent** → **ne JAMAIS l'écraser**, seulement
   agréger une section-lien en fin de fichier.
4. S'articule avec la fiche 0080 (compte rendu markdown standard d'ezk-retro) — 0079
   porte la **voix**, 0080 porte le **support**.

## Critères d'acceptation

- [ ] La règle existe dans `rules/` (symptôme + critère de retrait mesurable inclus).
- [ ] Les 3 skills cités portent la consigne à leur étape de restitution (diff visible).
- [ ] Test de lisibilité : la restitution type ne contient aucun code interne non défini
      (vérifiable en revue sur les 3 prochaines restitutions réelles).
- [ ] La note de mémoire d'agent est marquée comme doublée par la méthode (la méthode
      devient la source de vérité).

### Spécifiques aux descriptions de PR (ajoutés le 2026-07-26)

- [ ] **Test « #317 »** — sur les **3 prochaines PR ouvertes**, un tiers qui lit
      **uniquement la description** (diff fermé) reformule le besoin **en une phrase** :
      3/3. Sinon la description est insuffisante, la PR n'est pas relisable.
- [ ] **Les trois blocs présents** — toute PR ouverte par `ezk-sprint` contient (i) un
      résumé **user-facing** de ≤ 5 lignes : ce que ça change et pourquoi, (ii) un **lien
      vers le chemin de la fiche** (`features/<id>-*.md`,
      `products/<produit>/features/<id>-*.md`, ou l'équivalent du projet — un `.feature`
      chez samplerz), (iii) un bloc **« Comment tester »** en commandes littérales.
      Contrôlable sans jugement : `gh pr view <n> --json body`.
- [ ] **La fiche reste la source de vérité** — le corps de PR **ne duplique pas** les
      scénarios / le Gherkin : il oriente et renvoie. Corps ≤ ~2 000 caractères hors
      annexes — repère, pas couperet : la médiane vectorz mesurée est à 3 510, et #317
      réécrite (l'exemple à viser) tient en 1 868.
- [ ] **Non-récidive mécanique** — retirer la consigne de l'étape PR d'`ezk-sprint` **fait
      rougir** un test de contrat sur le texte des skills (leçon mc-0095 : un oubli est
      resté vert neuf jours).

## Notes

- **2026-07-26 — le cas « description de PR », vu en vrai : samplerz #317.**
  La PR [elzinko/samplerz#317](https://github.com/elzinko/samplerz/pull/317) n'était pas
  compréhensible en la lisant seule. Le PO a demandé une **réécriture du corps avant de
  pouvoir l'arbitrer** ; après réécriture, la décision (fermer sans merge — prémisse
  invalidée par #316 / #189) a pu être prise **sans ouvrir le diff**.
  Le contraste tient en deux phrases. Le **titre**, inchangé, dit :
  « feat(export): garde-fou avant extraction vidéo coûteuse » — on ne sait ni qui souffre,
  ni de quoi. Le corps réécrit ouvre par : « Avant de cliquer sur 🎬 « Extraire la vidéo »,
  Samplerz devait prévenir l'utilisateur si le téléchargement risquait d'être long /
  lourd » — un utilisateur, un geste, une gêne.
  **Honnêteté** : la rédaction d'origine du corps n'est **pas citable** — GitHub ne conserve
  pas l'historique du corps d'une PR. C'est le titre qui sert de témoin.
  **Le corps réécrit est l'exemple positif à viser**, même si la PR est close :
  `## Summary` user-facing · pourquoi c'est en question · les deux options · `## Lien fiche`
  (avec le **chemin** `features/backlog/video_export_size_guard.feature`) ·
  `## How to test` avec la commande à rejouer.
- **2026-07-26 — ce que ça donne mesuré sur vectorz** (12 dernières PR mergées), pour ne pas
  s'en tenir à une impression :

  | Mesure | Constat |
  |---|---|
  | chemin de fiche dans le corps | **1 / 12** (seule #44 pointe un `features/…md`) |
  | bloc « comment tester » rejouable | **0 / 12** — les sections présentes (`Preuves`, `Gate`, `DoD`) sont la preuve **déjà faite par l'auteur**, au passé, pas un plan qu'un tiers peut rejouer |
  | squelette stable | **aucun** — 10 PR, 10 jeux de titres (`Le problème` / `Pourquoi` / `Ce que ça livre` / `Quoi` / `En clair`) |
  | longueur médiane du corps | **3 510** caractères, contre **1 868** pour #317 réécrite |

  Cause racine : l'étape PR d'`ezk-sprint` n'exige que le titre conventional-commit et le
  before/after. Le lien fiche↔PR ne vit que dans le **nom de branche**. Et l'ADR-0009
  affirme déjà que la convention « Validation » « s'applique là où la PR naît (ezk-sprint,
  étape PR) » — `ezk-sprint` ne la référence jamais : **lien documenté, jamais câblé**.
- **Justification métier de la P1**, déjà posée côté PO : la clarté est son critère n°1
  (enjeu de churn, mis à l'épreuve jusqu'au **2026-08-11**).
- **Voisins, à ne pas confondre** (le volet PR ne les double pas) : fiche **0091** (carte +
  glossaire, `depends: [0079]`) est le premier dogfood du format ; fiche racine **0058**
  (`idea`, épic 0051, parkée LATER) est un commentaire **automatique** de métriques, là où
  0079 porte le corps **écrit à la main** ; la règle `development/pr-before-after-media`
  (MUST, déjà en place) couvre les **médias** — le volet PR en est le frère structurel.
- **Dépendance externe — `elzinko/samplerz` : accès constaté le 2026-07-26**
  (`gh pr view 317 --repo elzinko/samplerz` répond, corps récupéré). C'est une **citation,
  pas une dépendance de build** : le volet PR se construit entièrement dans ce monorepo. Si
  la PR devenait inaccessible, le corps réécrit est déjà résumé ci-dessus.
- **Priorité P1** (montée de P2 par le PO le 2026-07-25 — dérive activement ressentie).
- **Portée élargie** le 2026-07-25 : des seules restitutions PO à tout artefact lu par un
  humain (PR, fiches, captures) — cf. commentaire du PR #37 (« borne anti-veto », « verrous »)
  qui a rendu la dérive tangible.
- Origine : rétro 2026-07-18, demande directe du PO au rangement.
- Mesure de succès (retirabilité) : 0 réclamation « pas compris » du PO sur une
  restitution pendant 5 sprints consécutifs.
