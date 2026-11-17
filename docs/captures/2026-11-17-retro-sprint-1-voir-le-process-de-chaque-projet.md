---
type: retro
date: 2026-11-17
theme: "Sprint 1 du 17 novembre « voir le process de chaque projet dans mission control » : la carte zoomable livrée, lisible grâce à la vérification dans le navigateur"
scope: "sprint 1 du journal de branche (une story : le schéma Process zoomable), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé, l'app desktop ne lie pas les agents de rôle), sans juge car aucune règle neuve n'est proposée"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Livrer la fiche « La gate reste verte quand la machine est chargée » : son code est sur main depuis le 15 novembre (1f1456d7, délai de 30 secondes dans les deux configs de vitest) et la gate est passée deux fois depuis, mais la fiche est restée à l'état d'idée. Une fiche non livrée dont le code est livré fausse le backlog."
    kind: action
    by: [produit, qualite]
    status: ✅
    decision: "Retenue par délégation du PO (absent, « si une question est posée par la méthode réponds-y ») : ship local de la fiche 20261115195213739, geste réversible."
    date: 2026-11-17
  - proposition: "Le brief d'ezk-dev demandait d'écrire dans le dossier de travail de la session ; l'outil l'a isolé dans son propre dossier, et le travail a dû être rapatrié par patch. C'est la deuxième fois au moins (mémoire du projet). ezk-sprint devrait prévoir ce cas : le brief dit au développeur qu'il écrit dans son dossier isolé et rend la main sans committer, et l'orchestrateur rapatrie par patch."
    kind: feature
    by: [dev, architecture]
    status: ✅
    decision: "Retenue par délégation du PO comme fiche en idée (réversible) : fiche 20261117114426425 (ezk-sprint prévoit le développeur isolé). Le texte du skill ne change qu'au sprint qui la tirera."
    date: 2026-11-17
  - proposition: "Les tests de la carte passaient, mais l'écran était illisible de loin et il fallait trop zoomer pour voir les étapes. Seule la vérification dans le navigateur l'a montré. Garder la règle actuelle : pour une story d'écran, la validation dans le navigateur passe avant la revue adverse. Aucune règle neuve."
    kind: action
    by: [qualite, produit]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger ; le geste existe déjà (étape 6 d'ezk-sprint)."
    date: 2026-11-17
---

**En clair :** le sprint a livré la carte zoomable du process dans mission control. Chaque projet y voit
le process de la méthode, de la vue d'ensemble au détail d'une étape. Deux garde-fous existants ont
attrapé des erreurs à temps : la vérification dans le navigateur, puis le test de frontière entre
produits. La rétro retient deux gestes et une fiche. Le PO étant absent, les décisions sont prises par
délégation et restent réversibles.

## 1 · Les faits de départ

- Une story livrée en local, en un commit sur main (7c0f350f), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-voir-le-process-de-chaque-projet-dans-mission-co.md).
- Revue adverse GO, neuf critères sur neuf prouvés ; gates vertes (écran 207 tests, cop1 820, méthode 2403
  et les suites de scripts).
- Le développeur délégué a été isolé dans son propre dossier : travail rapatrié par patch.
- Dans le navigateur, la carte était illisible de loin. Seuils de zoom et taille du texte réglés après coup.
- Le test de frontière a refusé un import de fichier de la méthode depuis cop1 : les tests lisent
  désormais le contrat comme une donnée.
- Liens d'images écrits pour l'emplacement final de la fiche, alors que la livraison les recale
  elle-même : la vérification des liens l'a vu.
- Un commit a emporté deux renommages déjà préparés : la vérification de l'index avant commit, prévue à
  l'étape 10 d'ezk-sprint, n'a pas été faite. Rien de perdu.
- Une fiche dont le code est livré depuis le 15 novembre est restée en idée : la gate stable sous charge.

## 2 · Tour 1 — chaque lentille propose

- **Produit** : P1, livrer la fiche dont le code est déjà sur main.
- **Dev** : P2, prévoir le développeur isolé dans le brief d'ezk-sprint.
- **Qualité** : P3, la vérification dans le navigateur a fait son travail ; P1 aussi.
- **Architecture** : P2 ; le test de frontière a joué son rôle, rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient à P1, P2 et P3. Écartées sans proposition : les liens d'images et le
commit qui a emporté des renommages. Les deux sont des erreurs d'exécution déjà couvertes par un
contrôle ou une étape existante, et elles n'ont rien cassé.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

- `20261024124331478` — tests serveur qui échouent sous charge : **traitée**. Le délai de 30 secondes
  (1f1456d7) répond au symptôme ; la fiche correspondante est livrée par P1.
- Les autres notes du carnet ne portent pas sur ce sprint : elles attendent une rétro complète.

## 6 · Ce qui reste au PO

Relire les trois décisions prises par délégation. Toutes sont réversibles : une livraison de fiche, une
fiche en idée, un constat.
