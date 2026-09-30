# PLAN — séquence de travail (vectorz)

## En clair

Le backlog a été trié le **2026-09-30** : **46 fiches actives**, chacune rangée par chantier
(`labels:`) et par version cible (`version:`). Ce plan donne l'**ordre** de travail de V0.1 à
V0.4. La priorité (P0→P3) reste l'importance d'une fiche ; ici, c'est « quoi d'abord ». Les
fiches parkées (`milestone: parked`) et les articles sont hors plan. Index : [`BACKLOG.md`](BACKLOG.md).

## 🎯 Product Goal — brouillon du 2026-08-23, à valider/réécrire par le PO

> **Une méthode LLM-native digne de confiance pour voir et piloter ses produits** :
> la carte dit vrai (compilée des fichiers), le backlog dit l'état réel, et chaque
> cérémonie a un responsable clair — humain ou agent.
> *(Premier Product Goal du dépôt — posé par le lot 1 du plan « trois étages » ;
> le Scrum Guide en fait l'engagement du Product Backlog.)*

> Décidé le **2026-07-26** (roadmap PO) ; **mis à jour 2026-07-30** (fiche 0064 —
> liste unique, ids nus, champ `product:`). Ceci est l'**ORDRE**, pas la priorité
> (la priorité `P0→P3` reste le *bucket d'importance* dans chaque fiche ; ici c'est
> *quoi d'abord*, vu les dépendances et la valeur visible).
> **NOW** = les prochaines N cartes (horizon court) — pas une encyclopédie du stock.
> Source de vérité du **statut** = le front-matter des fiches ; ce fichier est **curé**,
> jamais régénéré. Une seule liste : `features/` (produit = champ `product:`).
> Index généré : [`BACKLOG.md`](BACKLOG.md) · guide : [`README.md`](README.md).

## 🚂 Train de versions (décidé le 2026-09-23, recalé au tri du 2026-09-30)

| Version | Nom | Contenu | Statut |
|---|---|---|---|
| **V0.1** | Le socle dit vrai | graphe compilé, verrou de statut, carte qui cite ses sources, un seul modèle de fiche, règle de clarté partout | en cours |
| **V0.2** | On teste vite, en local | lanceur universel, ezk-scout, recette Android | en parallèle, en autonomie |
| **V0.3** | Le backlog dit vrai + on range | ship sûr, versions dans le backlog, commande `ezk`, règles déployées, FAQ, recettes | à faire |
| **V0.4** | La méthode se tient | cycle de vie sprint/session, run transparent, archive allégée, rétro v2, installation ailleurs, fabrique de skills | à faire |
| **V0.5** | Amélioration mesurée | contrat d'améliorabilité, observabilité | ⏸️ parkée (ADR-030) |
| **V1.0** | Ouvrable aux autres | multi-client, distribution, articles | ⏸️ « ne pas publier » (PO) |

## ▶️ Séquence — décidée le 2026-09-30 (tri, mode auto)

### ① V0.1 — le socle dit vrai
- ~~`20260821204737357` — compiler la méthode en un seul graphe que tout le monde lit · en cours · `build`~~ — shipped #265
- `20260823121712652` — valider les statuts des fiches par un schéma (fin des fautes de frappe) · en cours · `build`
- `20260824111001836` — appliquer la règle de clarté à tout ce que la méthode produit · `build`
- `20260821163346493` — chaque élément de la carte montre le fichier d'où il vient · `build`
- `20260821163346490` — corriger la fausse « chaîne de montage » en haut de la carte · `build`
- `20260918114726706` — une seule source pour le modèle de fiche (3 copies divergent aujourd'hui) · `build`
- `20260922160651394` — mettre le code en conformité avec les règles de dev récentes · `build`

### ② V0.2 — tester vite en local (en parallèle, en autonomie)
- ~~`20260910165637000` — ezk-scout : chasser les bugs en tâche de fond, sans corriger · prête · `build`~~ — shipped #266
- `20260917162000501` — une commande pour lancer l'app de n'importe quelle branche ou worktree · `groom` → `build`
- `20260906135450000` — recette : lancer l'émulateur Android pour tester sur mobile · `build`

### ③ Les deux P0 qui font mal (juste après le socle)
- `20260830194601233` — livrer une fiche sans casser les liens ni les vues (ship sûr) · `build`
- `20260830194601376` — décider quelles vues générées ne plus committer (fin des conflits) · `build`
- `20260930123438875` — séparer clairement fiche, sprint et session (ezk-sprint start/close) · `groom` → `build`

### ④ V0.3 — le backlog dit vrai + on range
- `20260824204751403` — découper le backlog en versions et vérifier la cohérence d'un lot · `build`
- `20260903134906920` — une seule commande `ezk` pour tout lancer · `build`
- `20260903134909124` — déployer vraiment les règles chez les agents (aujourd'hui : zéro) · `build`
- `20260824122629925` — une FAQ « comment faire » pour tes questions récurrentes · `build`
- `20260825160456259` — à la fin d'une commande, proposer les 1 à 3 commandes suivantes · `build`
- `20260825182327490` — un modèle standard pour tout texte destiné à un humain · `build`
- `20260825202444647` — ezk-codex répond et ferme tous les fils de revue traités · `build`
- `20260826072532622` — valider fiches et carte depuis le tableau de bord (👍/👎 enregistré) · `build`
- `20260910231201744` — appliquer pour de vrai les fusions et découpages de fiches proposés · `build`
- `20260917123943914` — montrer sur la carte les scripts et commandes de la méthode · `build`
- `20260917143616286` — recette : vendre une app avec Lemon Squeezy et une licence Pro · `build`
- `20260904091853974` — tenir un journal des galères résolues, pendant le dev · `build`
- `20260824141336516` — recette : mettre en place la CI d'un projet type muti · `build`

### ⑤ V0.4 — la méthode se tient
- `20260906122942607` — run autonome transparent : ce qu'il va faire, puis ce qu'il a fait · `build`
- `20260904091853948` — ezk-archive plus léger et plus juste (voie rapide, bon compte, survit au cloud) · `build`
- `0080` — chaque rétro laisse un compte rendu clair et des propositions ciblées · `build`
- `20260905134937885` — mesurer si la revue locale peut remplacer Codex (et sortir la PR du chemin) · `build`
- `20260826173221323` — pouvoir pointer les vues sur un autre projet (muti, samplerz) · `build`
- `20260910152227744` — des règles propres à un projet (ex. « samplerz en hexagonal ») · `build`
- `20260813095351680` — rendre l'installation des skills robuste (3 défauts de lawgiver) · `build`
- `20260816151112162` — installer les slash-commands comme les skills · `build`
- `20260812104022246` — composer des consignes réutilisables dans les skills · `build`
- `0066` — tester un skill pour de vrai avant de le merger · `build`
- `20260920213500176` — réduire le coût d'un sprint qui ne fait qu'éditer un skill (~330k jetons) · `build`
- `20260830114318159` — créer un skill en passant par une fiche du backlog · `build`
- `20260815080414006` — critères de « prête » (DoR) adaptables par projet · `build`
- `20260825161522791` — un grooming guidé : l'agent propose des améliorations, tu choisis · `build`

### 🧹 En continu — petits correctifs (à glisser dans un sprint qui a de la marge)
- `0024` — supprimer le vieux code d'avant le pivot · `build`
- `0117` — corriger les signatures de domain.ts qui ne collent plus au code · `build`
- `0143` — unifier le nom des modes tokens (lean / cap / full) dans la doc · `build`
- `20260813122510737` — ezk-backlog init se trompe de version de format dans un cas · `build`
- `20260823121712844` — empêcher la régénération du backlog de viser le mauvais dossier · `build`
- `20260829132313947` — masquer les forks dans le suivi de consommation CI · `build`

> Historique : les séquences précédentes (itérations d'août et de septembre) sont dans
> l'historique git de ce fichier, avant le 2026-09-30.
