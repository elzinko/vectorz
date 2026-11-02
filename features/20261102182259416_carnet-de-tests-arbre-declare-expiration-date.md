---
id: "20261102182259416"
title: "Un carnet qui note ce qui est testé dans l'app, et quand la preuve expire"
type: feature
priority: P2
product: mega-city
milestone: exploration-app
version: v0.23.0
labels: [test-local, exploration-app]
status: ready
pr:
evidence: none # commande sans écran ; la preuve, ce sont ses tests
created: 2026-11-02
split_from: "20261014113049954"
---

# 20261102182259416 — Un carnet qui note ce qui est testé dans l'app, et quand la preuve expire

**En clair.** Aujourd'hui, personne ne sait ce qui a déjà été testé dans une app : chaque passe du
scout repart de zéro. On crée un carnet. Il liste les fonctionnalités de l'app et note, pour chacune,
ce qui a été testé, avec la preuve et la date. Une commande dit « X sur Y testés » et liste ce qui
reste à tester ou a expiré.

**Si tu arrives frais.** `ezk-scout` est l'agent de la méthode qui teste une app qui tourne et
rapporte des bugs. Le carnet est un outil sans IA : il note et il calcule, il ne teste rien.

## Contexte / Problème

Le 2026-11-02, le PO demande à tester son app à la demande, et à savoir ce qui est couvert,
visuellement et fonctionnellement. `ezk-scout` ne garde aucune trace d'une passe à l'autre. Ses
preuves vivent dans un dossier temporaire et disparaissent. Personne ne peut répondre à « ai-je tout
testé ? ».

Le panel adverse du 2026-11-02 a cadré la réponse. Il a écarté l'arbre tiré d'un routeur, car aucune
app cible n'en a. Il a écarté l'expiration par les imports, car elle se trompe dans les deux sens.
Détail dans la fiche d'origine,
[Carte de l'app et suivi de ce qui est testé](done/20261014113049954_cache-cartographie-app.md).

## Proposition

C'est un carnet d'entretien : on y note chaque contrôle, avec sa date, et on voit ce qui est à refaire.

```
arbre déclaré (fichier du projet)       journal (hors dépôt, on ne fait qu'ajouter)
  vue « fiches »                          02/11 · fiches/filtrer · fonctionnel · valide · SHA abc
    └── action « filtrer »   ──────▶      03/11 · fiches/filtrer · visuel      · échec  · SHA def
                                                       │
ezk carto status --todo   ◀── calculé à la lecture ────┘
  « 1 sur 9 testés — 8 jamais testés, 0 expiré »
```

- **L'arbre** est un fichier YAML par app, que le projet déclare : les écrans, puis leurs actions. Le
  projet nomme ses fichiers d'arbre dans `.vectorz/config.yml`. L'arbre est versionné avec le projet.
- **Le journal** vit dans le dossier git commun du dépôt, `<git-common-dir>/ezk/carto/`, là où vivent
  déjà la note de passation et les sprints. Il est donc partagé entre tous les worktrees, hors de
  l'arbre de travail, et jamais committé. Chaque résultat y ajoute une ligne : le nœud, l'axe
  (visuel ou fonctionnel), le verdict, la date, le SHA testé et la preuve. On n'y efface ni n'y
  réécrit jamais une ligne. Deux sessions peuvent donc écrire en même temps sans conflit.
- **La preuve est copiée** dans ce même dossier, rangée par empreinte de son contenu. Elle survit au
  dossier temporaire du scout.
- **L'expiration se calcule à la lecture.** Une preuve vaut **14 jours** par défaut, pour le visuel
  comme pour le fonctionnel. La durée se règle dans `.vectorz/config.yml`. Au-delà, la preuve est
  « expirée ». La sortie montre aussi son âge et le nombre de commits depuis.
- **Deux commandes.** `ezk carto record` écrit une ligne. `ezk carto status [--todo] [--json]` lit.
  La méthode calcule et publie du JSON, comme le pose l'ADR-086.
- **Un module de mega-city**, avec un cœur pur testé et un bord dans `bin/`. Il ne dépend pas du
  scout.

## Critères d'acceptation

- [ ] Un projet déclare l'arbre de son app, écrans puis actions, dans un fichier. Un arbre mal formé
      est refusé avec un message qui nomme la ligne fautive.
- [ ] `ezk carto record` ajoute une ligne au journal, dans le dossier git commun : nœud, axe, verdict,
      date, SHA et copie de la preuve. Un nœud inconnu ou une preuve absente est refusé.
- [ ] `ezk carto status` affiche chaque nœud avec son état sur les deux axes : jamais testé, valide,
      en échec ou expiré.
- [ ] Une preuve plus vieille que sa durée de validité, 14 jours par défaut et réglable, ressort
      « expirée » sans intervention. La sortie montre son âge et le nombre de commits depuis.
- [ ] `status --todo` ne liste que les nœuds jamais testés ou expirés. Son en-tête dit « X sur Y
      testés », calculé depuis le même arbre, et précise qu'il ne compte que les passes
      d'exploration.
- [ ] `--json` rend le même contenu avec un numéro de format. Le tout est testé sur l'app jouet du
      scout, et la gate locale est verte.

## Comment vérifier

Le scénario de bout en bout, sans IA ni navigateur (noms de commandes à confirmer au `ready`) :

1. Déclarer l'arbre de l'app jouet du scout (`products/mega-city/skills/ezk-scout/examples/demo-app.mjs`) :
   4 nœuds, axe fonctionnel.
2. Enregistrer avec `ezk carto record` des résultats de sondes `curl` : 3 échecs et 1 valide.
3. `ezk carto status --json` rend « 4 sur 4 testés », 3 en échec et 1 valide.
4. Avancer l'horloge au-delà de la durée de validité, horloge injectée dans les tests : les 4 nœuds
   passent « expirés ».
5. La suite passe :

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city typecheck
```

## Glossaire

- `nœud` — une case de l'arbre : un écran, ou une action dans un écran.
- `axe` — ce qu'on a testé : le visuel (l'écran s'affiche bien) ou le fonctionnel (l'action marche).
- `preuve` — ce qui montre qu'un test a eu lieu : une capture, ou une sonde qu'on peut rejouer.
- `expiration` — le moment où une preuve cesse de compter, ici quand sa durée de validité est passée.
- `journal` — le fichier du carnet où l'on ne fait qu'ajouter des lignes, une par résultat.

## Notes / décisions

- **Née du découpage** de
  [Carte de l'app et suivi de ce qui est testé](done/20261014113049954_cache-cartographie-app.md), le
  2026-11-02, après le panel adverse et la décision du PO.
- **Tranché au `ready` (PO, 2026-11-02)** :
  - la durée de validité est de 14 jours par défaut, la même pour les deux axes, réglable dans
    `.vectorz/config.yml` ;
  - l'arbre est un fichier YAML par app, que le projet déclare dans `.vectorz/config.yml` ;
  - le journal et les preuves vivent dans `<git-common-dir>/ezk/carto/`, comme la note de passation
    et les sprints : partagés entre worktrees, hors de l'arbre de travail, jamais committés.
- **Passée « prête » le 2026-11-02.** Socle complet : problème daté, valeur, 6 critères vérifiables,
  aucune dépendance externe. Une seule surface touchée, la commande `ezk`.
- **Hors périmètre** : le câblage du scout
  ([20261102182259505](20261102182259505_scout-lit-et-remplit-le-carnet.md)), mission control
  ([20261102182259592](20261102182259592_carnet-mission-control-premiere-app-mesure.md)),
  l'expiration quand le code change
  ([20261102182259680](20261102182259680_carnet-expiration-quand-le-code-change.md)).
- **Estimation du panel** : environ 150 000 à 200 000 jetons.
