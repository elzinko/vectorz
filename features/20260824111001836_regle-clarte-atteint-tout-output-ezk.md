---
id: "20260824111001836"
title: "Appliquer la règle de clarté à tout ce que la méthode produit"
type: refactor
priority: P1
product: mega-city
labels: [lisibilite]
version: V0.1
epic:
status: idea
pr:
created: 2026-08-24
---

## En clair

La règle « tout ce qu'un humain lit doit être clair » existe déjà. Mais rien ne la branche :
aucun bundle ne la porte, donc aucun projet ne la reçoit. Et elle ne parle pas du chat.
Cette fiche la branche sur le socle `base` et l'étend aux réponses de chat. Elle lui ajoute
deux consignes précises : pas de HTML dans le terminal, et une fiche se cite par son titre
avec un lien.

**Pour toi.** Après cette PR, tout projet lié par `lawgiver bind` reçoit la règle. Sur ton
poste, l'effet passe d'abord par le texte des agents et des skills, déjà vivant dans
`~/.claude`. Le déploiement global des règles reste à faire : c'est la fiche
[Déployer vraiment les règles chez les agents](20260903134909124_loi-non-compilee-chez-l-agent.md).

## Contexte / Problème (mesuré le 2026-10-01)

- La règle
  [human-facing-lisibility](../products/mega-city/rules/documentation-guidelines/human-facing-lisibility.md)
  est MUST, contrôlée par `ezk-reviewer`. Son `Scope:` liste des artefacts écrits. Le chat n'y est pas.
- Son bundle n'existe plus. La PR #190, fiche
  [bundles vs thèmes](done/20260823124042708_bundles-vs-themes-reorganisation.md), a supprimé
  `documentation-guidelines.yml`, resté sans profil. `base` porte trois règles, pas celle-ci.
  (La première version de cette fiche parlait encore de ce bundle.)
- Avant cette PR, le texte atteignait déjà une partie des agents : 4 agents sur 8 et 10 skills
  sur 25 citaient la règle. Les 8 skills de restitution sont figés par un test de contrat.
- `bind-global` n'écrit que les skills et les agents. Aucune règle n'est compilée chez l'agent
  par ce chemin. Le cap projet compile bien les règles dans `.iamthelaw/ENTRY.md` (c'est lui que
  `lawgiver bind <profil> <projet>` applique), mais vectorz n'en a pas.
- Côté chat, les leviers réels sont `CLAUDE.md` et le style de sortie « Explication claire »
  (`~/.claude/output-styles/`, hors dépôt). Ce style demande des « blocs de détail technique »
  sans dire le format. C'est la source probable du `<details>` affiché en brut le 2026-08-30.

## Proposition (périmètre du POC)

Un seul texte de règle, enrichi. Aucune nouvelle règle.

1. **Câbler** : la règle entre dans `bundles/base.yml`, une ligne, comme
   [ADR-0045](../products/mega-city/docs/adr/0045-pr-preuve-avant-apres-outillage-loi.md).
2. **Étendre** : le `Scope:` nomme les sorties de chat. Trois clauses s'ajoutent : canal
   terminal sans HTML, « titre + lien », leviers d'application côté chat.
3. **Faire marcher le chemin qui existe** : `CLAUDE.md`, les 8 agents et les 8 skills de
   restitution reprennent la consigne de canal. Un test de contrat la fige.

Le reste est en « Suite ».

## Critères d'acceptation

Déjà en place, avec preuve :

- [x] La règle est MUST et contrôlée par `ezk-reviewer` (`enforcements: agent-check` dans
      son en-tête).
- [x] Les 8 skills de restitution portent « En clair » et l'id de la règle (test de contrat
      `human-facing-lisibility-contract.test.ts`, bloc « porte la consigne lisibilité »).

Reste à livrer :

- [x] **Câblage.** `bundles/base.yml` porte la règle. `expand(base)` la résout. Les tests
      `catalog`, `expand` et `loi-view` sont à jour. `graph:check` et `fiches:check` sont verts.
      La carte est régénérée (`map:data`).
- [x] **Preuve d'effet.** Un test compile le profil `base` réel avec le cap projet. Le
      `.iamthelaw/ENTRY.md` obtenu contient la règle et ses clauses de chat.
- [x] **Portée.** Le `Scope:` nomme les sorties de chat : réponse de fin de tour, résumé de
      session.
- [x] **Canal terminal** *(absorbe la fiche du `<details>`)*. La règle impose Markdown seul dans
      le chat : ni `<details>`, ni `<summary>`, ni HTML brut. Le détail technique va en bas,
      sous un titre Markdown ou en liste. `<details>` reste permis dans les livrables `.md`
      committés, où GitHub le rend.
- [x] **Titre + lien.** La règle exige qu'une fiche (ou une PR, un ADR) soit citée par son titre
      en lien cliquable. L'id peut suivre le titre, jamais le remplacer. La clause reste
      compatible avec la règle existante des listes (lien sur l'id, titre à côté).
- [x] **Leviers côté chat.** La règle nomme ses leviers : `CLAUDE.md`, style « Explication
      claire », texte des agents et des skills, loi compilée. Elle dit qu'aucun contrôle
      automatique ne couvre le chat.
- [x] **Texte qui marche déjà.** `CLAUDE.md` reprend les deux clauses de chat. Les 8 agents
      citent la règle et portent la clause de canal, soit 4 de plus qu'aujourd'hui. Les 8
      skills de restitution portent la clause de canal. Un test de contrat fige les trois.
- [x] **Zéro nouvelle règle.** Une seule règle porte la clarté. Aucun fichier de règle ajouté.
- [x] Gate locale verte. Revue adverse sans bloquant.

## Comment vérifier

```bash
grep -n "human-facing-lisibility" products/mega-city/bundles/base.yml   # doit matcher
pnpm --dir products/mega-city test         # contrat : règle, CLAUDE.md, agents, skills, ENTRY compilé
pnpm --dir products/mega-city graph:check  # 0 lien cassé
pnpm --dir products/mega-city fiches:check # la fiche reste valide
```

Signal humain, à constater dans le terminal : une réponse longue avec détail technique ne
montre aucune balise `<details>` ni `<summary>`. Les fiches y sont citées par leur titre en lien.

## Suite (hors POC)

- **Dépendance.** La fiche
  [Déployer vraiment les règles chez les agents](20260903134909124_loi-non-compilee-chez-l-agent.md)
  doit aboutir pour que `base` atteigne un agent lancé hors d'un projet lié par `lawgiver bind`.
  Tant que `bind-global` ne compile aucune règle, le câblage attend. Il est livré pour être
  prêt ce jour-là. D'ici là, l'effet passe par le texte des agents et des skills.
- **À faire par toi, hors dépôt.** Ajouter les deux clauses de chat à `~/.claude/CLAUDE.md`.
  Préciser le format dans `~/.claude/output-styles/explication-claire.md` : détail en bas sous
  un titre, jamais de `<details>`. Ce sont tes fichiers personnels, je n'y touche pas.
- Livrer le style « Explication claire » dans le dépôt pour qu'il se déploie avec la méthode :
  idée à mettre en fiche.
- Les 17 autres skills ne sont pas touchés. Leur restitution relève du style et de `CLAUDE.md`.
- Mesure d'efficacité, à observer : 0 balise `<details>` visible sur les 5 prochaines réponses
  longues en terminal.

## Notes

Fiche née du `/ezk-backlog add` du 2026-08-24, pendant la refonte de la méthode. La clause
« titre + lien » vient de la décision PO du 2026-08-26 : l'inscrire dans le texte de la règle
**et** dans `CLAUDE.md`. Lignée : ADR-0029 « la fiche est le document », style de sortie
« Explication claire », épic dérive-communication-lisibilité (0079, livrée).

Absorbe, depuis le tri du 2026-09-30 :
[La règle de clarté pousse vers `<details>` HTML qui fuit en texte brut](done/20260830113054036_style-clair-details-html-brut-terminal.md).
Ses critères encore utiles sont repris dans « Canal terminal » ci-dessus.
