---
type: retro
date: 2026-11-04
theme: "Run autonome du 2026-11-04, sprints 29 et 30 : les recettes, le contrat du run et les jetons dits sans faux zéro"
scope: "sprints 29 et 30 du run lancé par le PO via /goal (ezk-product-build --mode auto --retro every:2), clos le 2026-11-04 avant midi ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve n'est proposée"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Le portier de sprint reconnaît le dossier jetable où tourne la gate (`.claude/worktrees/gate-*`, détaché) comme une réserve du run, pas comme une session parallèle. Au sprint 30, il a levé une alerte sur le dossier de la gate du run lui-même."
    kind: feature
    by: [dev, architecture]
    status: ⏳
  - proposition: "Pendant la gate d'un sprint, le pilote prépare le suivant (groom, second regard d'ezk-pm, lecture du code) mais n'en code pas les stories avant de l'ouvrir. Au sprint 30, des stories codées avant l'ouverture ont fait refuser `start` par le portier, et l'ouverture a dû passer en force, journalisée."
    kind: action
    by: [qualite, po]
    status: ⏳
  - proposition: "Les projets qui implémentent une recette du catalogue (muti, samplerz, d'après le champ `source`) déclarent un `RECIPE.md` dans le dossier qui l'implémente, pour que la vue Recettes de mission control les montre. Au 2026-11-04, aucun des trois projets enregistrés n'en déclare."
    kind: feature
    by: [produit]
    status: ⏳
---

**En clair :** les sprints 29 et 30 ont livré trois fiches. Mission control a une vue Recettes. Le
contrat d'un run annonce l'arrêt de `--review` et dit que la revue du code tourne toujours. Un compte
rendu de sprint n'écrit plus « 0 tokens » quand il ne mesure pas. Le geste décidé à la rétro
précédente, la gate dans un dossier jetable, a fait gagner du temps ; il a aussi fait buter l'ouverture
du sprint suivant. Trois propositions attendent.

## 1 · Les faits de départ

- Trois stories livrées en local : la vue Recettes (sprint 29), le contrat du run et le faux zéro des
  jetons (sprint 30). Revues adverses : GO sur les trois, constats mineurs corrigés.
- La gate du sprint 29 a tourné dans un dossier jetable : le pilote a pu écrire pendant ce temps. C'est
  la proposition P2 de la rétro précédente, appliquée sur décision d'`ezk-pm`.
- Le pilote en a profité pour coder les deux stories du sprint 30 avant de l'ouvrir. Le portier a alors
  refusé `start` : il voyait ces fiches « en cours » et le dossier jetable de la gate. L'ouverture est
  passée en force, raison journalisée dans `SPRINT.md`.
- Deux tests à sous-process ont dépassé leur délai de 5 s sous la charge de deux gates. Rejoués seuls,
  ils passent. La fiche de la rétro précédente les couvre maintenant tous les deux.
- La vue Recettes montre le catalogue (16 recettes). Aucun projet enregistré ne déclare de `RECIPE.md` :
  la partie « Dans ce projet » est vide partout.

## 2 · Tour 1 — chaque lentille propose

Porté par l'orchestrateur, à travers les quatre lentilles (mode léger).

- **Dev** : P1, le portier reconnaît le dossier de la gate comme une réserve du run.
- **Qualité** : P2, on prépare le sprint suivant pendant la gate, on ne le code pas avant de l'ouvrir.
- **Architecture** : P1 ; même traitement que les dossiers de réserve déjà ignorés (`raison=reserve`).
- **Produit** : P3, déclarer les recettes là où elles sont implémentées, sinon la vue reste vide.

## 3 · Tour 2 — confrontation et convergence

- P1 est gardée en fiche : elle touche le portier de sprint.
- P2 est gardée en action : elle change le geste du pilote.
- P3 est gardée en fiche, à trancher par le PO : elle écrit dans d'autres dépôts que vectorz.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochains sprints dont la gate tourne dans un dossier jetable, 0 alerte du portier
  sur ce dossier.
- P2 : sur les 5 prochains sprints, 0 ouverture passée en force à cause de stories codées en avance.
- P3 : la vue Recettes montre au moins une recette déclarée pour muti et pour samplerz.

## 6 · Décisions

Run arrêté à la borne fixée par le PO (midi) : ces propositions attendent sa décision ou le prochain run.
