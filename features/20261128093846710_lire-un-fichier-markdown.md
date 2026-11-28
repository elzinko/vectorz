---
id: "20261128093846710"
title: "Un fichier Markdown du projet ou de la méthode se lit dans mission control"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, fichiers]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128093846710 — Un fichier Markdown du projet ou de la méthode se lit dans mission control

**En clair.** Mission control cite des fichiers sans pouvoir les montrer : le compte rendu d'un sprint, la
capture d'une rétro, le récit d'une session, le fichier d'une compétence. La maquette a une page « Un
fichier Markdown » qui les rend lisibles. On la construit, avec une lecture gardée côté daemon.

**Si tu arrives frais.** Le daemon est le petit serveur local de mission control : il lit le dépôt et
répond à l'écran. Mission control n'invente aucune donnée (ADR-086). La maquette est la référence d'écran
du PO : page « Un fichier Markdown — SKILL.md ».

## Contexte / Problème

Plusieurs pages affichent un chemin de fichier en texte : « Fichier docs/sprints/… » sur un sprint,
« Capture » sur une rétro, « Le récit : non publié » sur une session. Le lecteur doit quitter l'écran et
ouvrir le fichier à la main. La maquette prévoit un bouton « Afficher » qui ouvre le fichier rendu.

## Proposition

1. **Une route de lecture au daemon** rend le texte d'un fichier Markdown d'un projet connu. Elle est
   gardée : seuls les fichiers `.md` situés sous la racine du projet ou sous le dossier de la méthode se
   lisent. Un chemin qui en sort, un autre type de fichier ou un fichier absent rendent une erreur claire,
   jamais un contenu.
2. **La page « Un fichier Markdown ».** En-tête : nom du fichier, chemin, bouton « Ouvrir dans l'éditeur »
   qui montre la commande sans l'exécuter. Corps : le Markdown rendu (titres, listes, tableaux, code,
   liens), jamais le texte brut.
3. **Les boutons « Afficher ».** Le compte rendu d'un sprint, la capture d'une rétro, le récit d'une
   session et le fichier d'une compétence ou d'un agent ouvrent cette page. Le fil d'Ariane ramène à la
   page d'où l'on vient.

Hors périmètre : modifier un fichier depuis l'écran ; laisser un retour sur le fichier.

## Critères d'acceptation

- [ ] Depuis un sprint, « Afficher » ouvre le compte rendu rendu en Markdown ; de même pour la capture
  d'une rétro et le récit d'une session.
- [ ] Le fil d'Ariane ramène à la page d'où l'on vient.
- [ ] La route refuse un chemin hors du projet et de la méthode, un fichier qui n'est pas en `.md` et un
  fichier absent ; un test couvre chaque refus, dont la remontée par `..` et par lien symbolique.
- [ ] Un fichier illisible affiche une phrase claire, jamais une page vide.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Fichier : http://localhost:5274 → Sprints → un sprint → Compte rendu → Afficher
- `pnpm --dir products/cop1/packages/app exec vitest run`
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — La lecture est gardée parce qu'une route qui lit un chemin reçu de l'écran est une frontière
  de confinement : elle est testée à sa frontière réelle (règle du paquet `dod`).
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Un bouton « Afficher » n'apparaît que si la méthode publie le chemin du fichier ; sinon la ligne dit « non publié ».
