# Convention « Validation » des PRs

> Référencée par `.github/PULL_REQUEST_TEMPLATE.md` (le template ne porte que le
> squelette ; le fond vit ici et peut évoluer sans toucher le template).
> Installée par `ezk-pr-pilot init` — **adapter la matrice aux modalités qui
> existent vraiment dans ce repo** (supprimer les lignes sans objet).

**Le principe : une PR doit être testable par quelqu'un qui n'a pas le contexte.**
Pas « testé ✅ », mais *quoi* a été testé, *comment* le rejouer, *quoi* reste,
et *quel signal observable* dit pass/fail.

## 1. La matrice de modalités

Chaque PR déclare où elle en est sur **chaque** modalité — `✅ fait` (avec la
méthode), `⏳ reste` (avec le plan), ou `N.A.` (avec la raison) :

| Modalité | Quoi |
|---|---|
| **CI** | le pipeline du repo (lien du run) |
| **Tests unitaires** | logique pure — nouveaux tests listés |
| **E2E navigateur** | parcours réel + **commande pour rejouer** |
| **Before / after (UI)** | **liens** dans le body de la PR : capture (ou courte vidéo) **avant** + **après** · ou **N.A.** si aucun changement UI visible (chore/docs/infra) — règle `development/pr-before-after-media` |
| **Preview de déploiement** | URL **dans le body** + chemins à vérifier · ou **N.A. : ne montre pas cette feature** (préciser ce que la preview déploie) |
| **Émulateur / simulateur** | pré-validation sans device (captures) |
| **Device réel** | si le repo l'exige avant merge : checklist exécutable |

## 2. Le bloc « Comment tester » — copy-pastable

Des **commandes littérales**, dans l'ordre, depuis un clone frais : builds
préalables (libs partagées d'abord), services à démarrer, URL à ouvrir, données
à saisir. Le testeur ne doit **rien déduire**. S'il faut un pair (un sender,
un client, un 2ᵉ onglet), le dire et dire comment l'obtenir.

## 3. Signaux observables pass/fail

Chaque critère d'acceptation a son signal : payload attendu d'une commande,
requête à voir dans l'onglet Network, message d'erreur exact côté UI, ligne de
log à guetter. « Ça marche » n'est pas un signal.

## 4. Spécifique natif/mobile (si le repo en a)

- **`Rebuild du binaire requis : oui/non`** — TOUJOURS déclaré. Changement
  natif (module, dépendance, config native) → **oui** : un vieux build
  validerait à tort un chemin dégradé silencieux. Code interprété pur → non.
- **Signal que le nouveau code tourne** (ligne de log, marqueur de bundle).
- **Remise à zéro** si la feature persiste de l'état (désinstallation, clear
  data) : scénario premier-lancement.
- Comment **simuler la panne** si un scénario en a besoin (tuer tel service).

## 5. Quand une lib partagée change

Lister les **consommateurs impactés** et, pour chacun, l'argument de
non-régression — en distinguant **« testé »** de **« raisonné »** (un
raisonnement = un risque résiduel à déclarer).

## 6. Artefacts régénérés (index, lockfiles, snapshots)

En cas de conflit au rebase : **ne jamais résoudre à la main** — régénérer
avec l'outil qui les produit.

## 7. PRs docs-only

CI verte = mergeable. Ajouter une ligne « **comment relire** » (le point de
cohérence à vérifier).
