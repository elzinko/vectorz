---
id: "20261128093846682"
title: "La page d'un plugin, et chaque réglage de Configuration montre comment le changer"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, configuration]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128093846682 — La page d'un plugin, et chaque réglage de Configuration montre comment le changer

**En clair.** La page Configuration est en lecture seule : on voit « GitHub : coupé », sans page pour le
plugin ni moyen de savoir comment changer un réglage. La maquette donne une page au plugin GitHub et un
geste à chaque ligne. On construit la page, et chaque réglage montre la commande qui le change.

**Si tu arrives frais.** Un plugin est un module optionnel de la méthode : GitHub en est un, avec trois
réglages (pull requests, tests GitHub, revue Codex). Mission control lit ce que la méthode publie et ne
lance pas ses commandes (ADR-086). `CommandHint` est le composant qui montre une commande à lancer, sans
l'exécuter. La maquette est la référence d'écran du PO : pages « Configuration » et « Un plugin — GitHub ».

## Contexte / Problème

La maquette dessine Configuration « façon réglages » : un geste par ligne. Dans l'app, aucune ligne ne
propose de geste, et la ligne « GitHub » du bloc Plugins ne mène nulle part. La méthode publie les réglages
(`ezk config show --json` : `github.pr`, `github.ci`, `github.codexReview`, `integration`,
`adverseReview`, `releaseGate`, `groomingTechniques`, `agents[]`). Elle a aussi des commandes d'écriture
(`ezk config …`).

## Proposition

1. **Page du plugin GitHub.** En-tête : « GitHub », puce « activé » ou « coupé ». Carte « Réglages » : une
   ligne par réglage publié (« Pull requests », « Tests GitHub », « Revue Codex », « Intégration sans PR »),
   avec sa valeur et son explication derrière le « i ».
2. **Le lien.** Dans Configuration, la ligne « GitHub » du bloc Plugins ouvre cette page. Fil d'Ariane :
   Configuration › Plugins › GitHub.
3. **Un geste par réglage.** Sur la page du plugin et dans Configuration, chaque réglage que la méthode
   sait écrire porte un bouton en mots (« oui », « non », « Activer », « Désactiver », un crayon). Le clic
   montre la commande exacte avec `CommandHint`. Mission control n'exécute rien.
4. **Pas de geste sans commande.** Un réglage que la méthode ne sait pas écrire n'a pas de bouton. Les
   commandes montrées sont vérifiées contre `ezk help --json` : un test échoue si l'une d'elles n'existe
   pas.

Hors périmètre : exécuter la commande depuis l'écran ; ajouter un contrôle de gate ou une technique de
grooming (aucune commande n'existe pour cela).

## Critères d'acceptation

- [ ] La ligne « GitHub » de Configuration ouvre la page du plugin, avec ses réglages publiés.
- [ ] Chaque réglage dont une commande d'écriture existe porte un geste ; le clic montre cette commande,
  sans rien exécuter.
- [ ] Aucun geste n'apparaît pour un réglage sans commande.
- [ ] Un test vérifie que chaque commande montrée existe dans la liste publiée par la méthode.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Configuration : http://localhost:5274 → Configuration
- vue Plugin : http://localhost:5274 → Configuration → GitHub
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — La maquette dessine des champs « Enregistrer ». Tant que mission control n'écrit pas les
  réglages d'un projet, le geste montre la commande. Voir la fiche « Régler un projet ne change que ce
  projet, et le réglage est enregistré ».
