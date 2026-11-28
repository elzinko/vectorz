---
id: "20261128093846696"
title: "Une fiche s'ouvre en page, avec qui l'a livrée et sa revue adverse"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, fiches]
status: ready
blocked:
depends: ["20261128093846710"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128093846696 — Une fiche s'ouvre en page, avec qui l'a livrée et sa revue adverse

**En clair.** Aujourd'hui une fiche s'ouvre dans une fenêtre par-dessus la liste. La maquette lui donne une
vraie page, avec le sprint qui l'a livrée et sa revue adverse. On construit cette page et celle de la revue.

**Si tu arrives frais.** Une fiche est l'unité de travail du backlog. La revue adverse est le contrôle
qu'un agent relecteur rend avant l'intégration : GO ou NO-GO, écrit dans un fichier Markdown par fiche.
Mission control lit ce que la méthode publie et n'invente rien (ADR-086). La maquette est la référence
d'écran du PO : pages « Une fiche » et « Une revue adverse ».

## Contexte / Problème

La maquette pose « une page par objet ». La fiche est le seul objet central sans page : on ne peut ni lui
donner une adresse, ni voir d'où elle vient. Son fil d'Ariane manque aussi. Le contenu existe déjà : la
fenêtre actuelle montre « En clair », le contexte, les critères, « Comment vérifier » et le pouce du PO.

## Proposition

1. **Page d'une fiche.** Fil d'Ariane : Fiches › titre. En-tête : titre, bouton « Ouvrir le fichier »,
   pouces du PO, puis une ligne de puces (étape, priorité, type, objectif, étiquettes, intégration, date,
   identifiant). Cartes, dans l'ordre de la maquette : « Livrée par » (le sprint, la revue adverse),
   « En clair », « Contexte / problème », « Proposition », « Critères d'acceptation » (avec le compte des
   cases cochées), « Comment vérifier », « Notes / décisions », « Gestes selon l'étape ».
2. **Partout, un clic sur une fiche ouvre sa page** : listes de Fiches, d'un sprint, d'une session, d'un
   objectif, d'une version, alertes de la cloche. La fenêtre actuelle disparaît avec ses tests.
3. **Page d'une revue adverse.** Fil d'Ariane : Fiches › la fiche › Revue adverse. En-tête : verdict,
   relecteur, fichier. Corps : le fichier de revue rendu en sections.
4. **Jamais de valeur inventée.** Sans sprint publié pour la fiche, « Livrée par » dit « non publié ».
   Sans fichier de revue, la page dit « aucune revue publiée pour cette fiche ».

Hors périmètre : le verdict de revue structuré et publié par la méthode (fiche « Le verdict de revue adverse
par fiche, structuré et publié ») ; lancer un geste depuis la page.

## Critères d'acceptation

- [ ] Un clic sur une fiche, depuis n'importe quelle liste, ouvre sa page ; le fil d'Ariane ramène à la
  liste des fiches.
- [ ] La page montre les cartes de la maquette dans son ordre ; le contenu est celui que la fenêtre
  montrait, rien n'est perdu (pouces compris).
- [ ] « Livrée par » nomme le sprint quand la méthode le publie, et mène à sa page.
- [ ] Le lien « Revue adverse » ouvre la page de la revue, qui rend le fichier de revue de la fiche.
- [ ] La fenêtre de fiche n'existe plus : son code et ses tests sont supprimés ou repris par la page.
- [ ] Une donnée non publiée s'affiche « non publié ».
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Fiche : http://localhost:5274 → Fiches → un clic sur une fiche
- vue Revue : http://localhost:5274 → Fiches → une fiche livrée → Revue adverse
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
