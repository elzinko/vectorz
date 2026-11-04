---
type: retro
date: 2026-11-04
theme: "Run autonome du 2026-11-04, sprints 27 et 28 : mission control lisible"
scope: "sprints 27 et 28 du run lancé par le PO via /goal (ezk-product-build --mode auto --retro every:2), clos le 2026-11-04 ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve n'est proposée ; le choix des propositions à appliquer revient à ezk-pm (mode auto)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Le compte rendu de sprint écrit « non mesuré » quand ses jetons retombent au grain de la session, au lieu d'un « 0 tokens » qui ment. Au sprint 27, le compte rendu a affiché « consommé 0 tokens » alors que le sprint en a dépensé."
    kind: feature
    by: [qualite, produit]
    status: ⏳
  - proposition: "La gate complète tourne dans un dossier de travail jetable, posé sur le commit testé, pour que le pilote continue d'écrire dans le sien. Aux sprints 27 et 28, le run a attendu environ 8 minutes par gate sans rien pouvoir écrire."
    kind: action
    by: [dev, architecture]
    status: ⏳
  - proposition: "Le test « pose le hook depuis un worktree » (apply.test.ts) reçoit un délai à sa mesure. Au sprint 28, il a dépassé 5 s sous la charge de la gate, puis passé seul (8 sur 8)."
    kind: feature
    by: [qualite]
    status: ⏳
---

**En clair :** les sprints 27 et 28 ont livré quatre fiches en une quarantaine de minutes. Mission
control range les parkées à part, montre le workflow en schéma, résume le dernier sprint, et la méthode
publie ses recettes en JSON. Trois propositions sortent de la rétro ; `ezk-pm` choisit celles qu'on
applique. Aucune règle neuve : le seul faux pas du run est déjà couvert par une règle existante.

## 1 · Les faits de départ

- Quatre stories livrées en local : `51e3e5d3` (parkées à part), `d192a386` (workflow en schéma),
  `3525caf4` (`ezk recipes --json`), `d6ea3df8` (dernier sprint et indicateurs). Revues adverses : GO
  sur les quatre.
- `ezk-pm` a refusé une première version de la fiche des parkées : elle faisait deviner l'état par
  mission control, contre l'ADR-086. Réécrite, elle a fait publier l'état par la méthode, et trois
  copies de la même règle sont devenues une seule.
- Le compte rendu du sprint 27 affiche « 0 tokens » : la fenêtre du sprint ne mesurait rien, et le
  rapport est retombé au grain de la session sans le dire en tête. C'est un faux zéro.
- Au sprint 28, un commit est parti avec une erreur de types : un enchaînement `( … ; echo )` a avalé
  le code de sortie. La règle `agent-ops/pipe-garde-le-code-de-sortie` couvre déjà ce cas.
- La gate complète dure environ 8 minutes. Le run ne peut pas écrire pendant ce temps : la gate tourne
  dans son dossier, et le garde-fou de session refuse l'écriture dans un autre dossier.
- Un test a dépassé son délai de 5 s sous la charge, puis passé seul : une lenteur, pas une régression.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : round-robin dégradé, sans
sous-agent par lentille (mode léger).

- **Qualité** : P1, le compte rendu dit « non mesuré » au lieu d'un faux zéro ; P3, le délai du test.
- **Produit** : P1 ; mission control affiche maintenant les comptes rendus, un faux zéro s'y verrait.
- **Dev** : P2, la gate dans un dossier jetable ; le run attend 8 minutes par sprint.
- **Architecture** : P2 ; le dossier jetable lit le commit, il n'écrit rien dans le dossier du pilote.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée en fiche : elle touche le rapport de sprint de la méthode, pas mission control.
- P2 est gardée en action : elle change le geste du pilote, pas le code.
- P3 est gardée en fiche : un délai de test se règle dans le test.
- Le code de sortie avalé ne donne pas de règle neuve : la règle existe, on la rappelle.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochains comptes rendus non mesurés, 0 « 0 tokens » affiché.
- P2 : sur les 5 prochains sprints, le pilote écrit pendant la gate, et 0 gate perturbée par une
  écriture.
- P3 : sur les 5 prochaines gates complètes, 0 dépassement de délai de ce test.

## 6 · Décisions

En mode auto, `ezk-pm` choisit les propositions à appliquer tout de suite ; le reste attend le PO.
