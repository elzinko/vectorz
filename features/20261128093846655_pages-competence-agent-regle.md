---
id: "20261128093846655"
title: "Chaque compétence, agent et règle a sa page dans mission control"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, annuaire]
status: ready
blocked:
depends: ["20261128093846629"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128093846655 — Chaque compétence, agent et règle a sa page dans mission control

**En clair.** Dans la Loi et dans l'Annuaire, le nom d'une règle, d'un agent ou d'une compétence ne mène
nulle part. La maquette donne une page à chacun. On construit ces trois pages avec ce que la méthode publie,
et on y branche les liens.

**Si tu arrives frais.** Une compétence est une commande de chat de la méthode (`/ezk-sprint`). Un agent est
un rôle convoqué par une compétence (`ezk-reviewer`). Une règle est un texte de la loi. Mission control lit
ce que la méthode publie et n'invente rien (ADR-086). La maquette est la référence d'écran du PO : pages
« Un skill », « Un agent », « Une règle ».

## Contexte / Problème

La maquette pose un principe : une page par objet. L'app n'a de page que pour le sprint, la session, la
version, l'objectif et la rétro. Les objets de la loi n'en ont pas. La méthode publie pourtant l'essentiel :
`ezk law show --json` (règles : titre, niveau, catégorie, portée, paquets, profils, appliquée par, vérifiée
par ; objets : règles appliquées) et `ezk help --json` (description des compétences et des agents, modèle
et effort des agents).

## Proposition

1. **Page d'une compétence.** En-tête : nom en `/commande`, puce « compétence · commande de chat ». Cartes :
   « Carte d'identité » (ce qu'elle fait), « Sa rangée du process », « Convoque · compose · lance »,
   « Règles appliquées » (titre, portée, niveau ; chaque règle mène à sa page).
2. **Page d'un agent.** En-tête : nom, puce « agent ». Cartes : « Carte d'identité » (rôle, modèle et effort
   dans ce projet), « Où il intervient dans le process », « Règles qu'il applique », « Règles qu'il
   vérifie ».
3. **Page d'une règle.** En-tête : niveau, titre, identifiant. Cartes : « En-tête » (portée, lois qui la
   portent, paquets, profils), « Le texte », « Appliquée par », « Vérifiée par », « Où elle joue dans le
   process ».
4. **Les liens.** Dans la Loi et dans l'Annuaire, un nom de règle, d'agent ou de compétence ouvre sa page.
   Les pages se lient entre elles. Le fil d'Ariane ramène à la page d'où l'on vient.
5. **Jamais de valeur inventée.** Une carte dont la méthode ne publie pas la donnée dit « non publié » :
   le texte d'une règle, la rangée du process, « convoque · compose · lance » tant que le graphe ne les
   donne pas.

Hors périmètre : la publication par la méthode de la carte d'identité complète et du texte de chaque règle
(fiche « `ezk law show` sert chaque objet de la loi »).

## Critères d'acceptation

- [ ] Depuis l'Annuaire et depuis la Loi, un clic sur une règle ouvre la page de cette règle.
- [ ] Depuis l'Annuaire, un clic sur une compétence ou un agent ouvre sa page.
- [ ] La page d'une règle montre son niveau, sa portée, ses paquets, ses profils, qui l'applique et qui la
  vérifie, tels que publiés.
- [ ] La page d'un agent montre son rôle, son modèle, les règles qu'il applique et celles qu'il vérifie.
- [ ] La page d'une compétence montre ce qu'elle fait et les règles qu'elle applique.
- [ ] Les pages se lient entre elles : une règle mène à ses compétences et agents, et inversement.
- [ ] Une donnée non publiée s'affiche « non publié ».
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Annuaire : http://localhost:5274 → Annuaire de la méthode → un clic sur un nom
- vue Loi : http://localhost:5274 → Loi → un clic sur une règle
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
