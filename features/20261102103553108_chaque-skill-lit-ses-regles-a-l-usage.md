---
id: "20261102103553108"
title: "Chaque skill et chaque agent lit ses règles au démarrage, sans alourdir la loi globale"
type: feature
priority: P2
product: mega-city
milestone: qualite
version:
depends: ["20261101215342537"]
labels: [loi, regles, jetons]
status: ready
pr:
evidence: none # commande et textes de skills, sans écran
created: 2026-11-02
---

## En clair

Tes skills et tes agents citent 17 règles que la loi installée ne contient pas : ils ne les lisent
donc jamais. Les ajouter à la loi globale coûterait environ 7 500 jetons à chaque session, sur tous tes
projets. Cette fiche fait autrement : chaque skill et chaque agent lit ses propres règles au moment où
il démarre, par une commande `ezk`. Une session qui ne lance pas ce skill ne paie rien.

## Contexte / Problème

- Le 2026-11-02, `ezk law show` a compté 17 règles « citées sans être installées ». Exemple :
  `ezk-sprint` applique la règle du worktree dédié, mais la loi installée ne la contient pas.
- La cause tient en trois faits :
  - Le profil `global` ne compile que le bundle `base` dans `~/.claude/rules/iamthelaw.md`. C'est la
    décision d'[ADR-0056](../products/mega-city/docs/adr/0056-loi-du-socle-par-le-global.md), pour
    garder chaque session légère.
  - Les 17 règles vivent dans cinq autres bundles : `development`, `testing`, `token-economy`, `dod`
    et `clean-code`. Seul le profil `cop1-target` les déploie.
  - La loi du projet vectorz (`.iamthelaw/ENTRY.md`) est liée avec le profil `base`
    ([ADR-0064](../products/mega-city/docs/adr/0064-loi-bindee-par-projet-cap-law-only.md)). Elle porte
    donc les mêmes 10 règles que la loi globale.
- 13 des 17 règles sont nommées dans le texte du skill ou de l'agent qui les cite. Le nom ne suffit
  pas : l'agent voit un identifiant, pas la règle.
- Quatre règles de la définition de « fini » (bundle `dod`) sont citées par `ezk-dev` et
  `ezk-reviewer`. `ezk-dev` n'en nomme aucune dans son texte, `ezk-reviewer` en nomme deux.

Mesure du 2026-11-02, avec le repère d'ADR-0056 (16 Ko font environ 4 000 jetons) :

| Ce qui serait chargé | Taille | Jetons par session |
|---|---|---|
| La loi globale d'aujourd'hui (10 règles) | 23 Ko | environ 5 800 |
| Les 17 règles citées, en plus | 30 Ko | environ 7 500 de plus |

## Valeur

- Une règle qu'un skill déclare appliquer arrive vraiment dans la session où il travaille.
- La loi globale reste au socle : une session qui ne lance pas la méthode ne paie rien de plus.
- La carte de la loi dit vrai : plus aucune règle n'est citée sans être lue, et un test le garde.

## Proposition

1. **Une commande sert les règles d'un objet.** `ezk law show skill:ezk-sprint` affiche le texte
   complet des règles que ce skill applique et que la loi installée ne contient pas. Une règle déjà
   installée tient sur une ligne : son texte est déjà dans la session. C'est le pendant de
   `ezk backlog show <id>` pour une fiche.
2. **Chaque skill et chaque agent la lance en premier.** Onze objets déclarent des règles : sept skills
   et quatre agents. Chacun ouvre par une ligne : « Avant d'agir, lis tes règles :
   `ezk law show <objet>` ».
3. **Un test garde la ligne.** Un skill ou un agent qui déclare des règles sans cette ligne fait
   échouer la gate. C'est le même principe que le cliquet d'ADR-0056 pour les règles contrôlées par un
   agent.
4. **La carte compte juste.** Une règle citée par un objet qui porte la ligne n'est plus « citée sans
   être installée ». Elle devient « lue au démarrage du skill qui la cite ». Le contrat `law-show` dit
   cette portée.

Schéma du chemin d'une règle :

```
aujourd'hui   règle → bundle hors du profil global → nulle part dans la session
après         règle → ezk-sprint démarre → ezk law show skill:ezk-sprint → texte lu
```

### Options écartées

- **Élargir la loi globale aux 17 règles.** C'est le plus simple : le compilateur ajoute les règles
  citées par les skills installés. Mais chaque session paie environ 7 500 jetons de plus, sur tous les
  projets, y compris hors développement. ADR-0056 laisse ce coût à la décision du PO. C'est l'option à
  prendre si tu préfères la simplicité au coût.
- **Ajouter les cinq bundles au profil global.** Ils contiennent 47 règles, dont 30 que personne ne
  cite.
- **Lier une loi plus large au seul projet vectorz.** Un projet hôte qui lance `ezk-sprint` n'aurait
  toujours pas ses règles.
- **Exiger seulement que le skill nomme ses règles.** C'est déjà le cas pour 13 règles sur 17, et le
  nom ne donne pas le texte.

## Critères d'acceptation

- [ ] **Les règles d'un objet, par commande.** `ezk law show skill:ezk-sprint` affiche le texte complet
      des règles absentes de la loi installée, dont `development/story-dans-un-worktree-dedie`. Chaque
      règle déjà installée tient sur une ligne. `--json` rend la même liste, conforme au contrat.
- [ ] **Objet inconnu.** `ezk law show skill:inconnu` dit que l'objet est inconnu et sort en erreur,
      sans rien afficher d'autre.
- [ ] **Les onze objets lisent leurs règles.** Les sept skills et les quatre agents qui déclarent des
      règles ouvrent par la ligne qui lance la commande.
- [ ] **Un test garde la ligne.** Retirer la ligne d'un skill qui déclare des règles fait échouer la
      gate.
- [ ] **La carte compte juste.** `ezk law show` compte 0 règle « citée sans être installée ». Les 17
      apparaissent comme lues au démarrage de leur skill ou de leur agent.
- [ ] **La loi globale ne grossit pas.** Après `ezk law bind-global global --link`,
      `~/.claude/rules/iamthelaw.md` garde ses 10 règles.
- [ ] **Le coût est mesuré.** La taille de la sortie de `ezk law show` pour l'objet le plus lourd est
      écrite dans cette fiche, en octets et en jetons (repère d'ADR-0056). Si elle dépasse le coût de
      l'option écartée, on revient à « élargir la loi globale ».

## Comment vérifier

```bash
ezk law show skill:ezk-sprint
ezk law show --json | jq .comptes
ezk law doctor global
```

Signal observable : la première commande affiche le texte de la règle du worktree dédié. La deuxième
compte 0 règle citée sans être installée. La troisième ne signale aucun écart sur la loi.

## Notes

- Suite de [La méthode publie sa loi en JSON](done/20261101215342537_ezk-law-show-portee-des-regles.md),
  qui a mesuré le trou. Priorité P2, reprise de la fiche mère.
- Amende ADR-0056 : une troisième voie pour la loi, en plus du socle global et de la loi par projet.
  Le build écrit un ADR court.
- La [vue « Loi » de mission control](done/20260826222044335_carte-la-loi-graphe-visuel.md) devra montrer
  cette nouvelle portée : un compteur de plus.
- Hors de cette fiche : les règles de la couche projet (`.vectorz/rules/`, ADR-0050).
- **Taille.** Six critères : une commande, onze textes, un test et la portée du contrat. La fiche
  tient dans un sprint.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO sous trois conditions).
  1. Le coût de la sortie la plus lourde est mesuré et écrit ici (7e critère).
  2. La revue adverse vérifie que seule la ligne d'ouverture change dans les 11 textes, et que le
     test couvre les 11 objets.
  3. L'ADR d'amendement d'ADR-0056 dit comment revenir en arrière : retirer les 11 lignes et le verbe.
  Construite après la fiche « La gate ne dépend ni de l'index généré ni du retard sur GitHub ».
