# PLAN — séquence de travail (vectorz)

## En clair

Le backlog a été trié le **2026-09-30** : **46 fiches actives**, chacune rangée par chantier
(`labels:`) et par version cible (`version:`). Ce plan donne l'**ordre** de travail de v0.1.0 à
v0.23.0. La priorité (P0→P3) reste l'importance d'une fiche ; ici, c'est « quoi d'abord ». Les
fiches parkées (`milestone: parked`) et les articles sont hors plan. Index (généré en local, non committé) : `BACKLOG.md`.

## 🧭 Ordre de marche (horizon proche — décidé le 2026-10-16, train tourné le 2026-10-17)

Raffine le train ci-dessous pour les prochaines cartes. **Règle de version (intérimaire)** : le numéro
se pose **à la construction, dans l'ordre — jamais de saut**. Les numéros ≥ v0.19 d'aujourd'hui sont
des étiquettes **provisoires**. Ça tient jusqu'au modèle milestones/itérations, différé (voir
[ADR-0081](../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md)).

> **Rotation du 2026-10-17.** Le board multi-session, déjà prêt et ratifié en panel (ADR-079), prend
> **v0.18** et passe devant le nettoyage CLI. La gate garde **v0.19** (elle paye tôt : chaque version
> qui suit se livre plus propre). CLI, flux, backlog et cartographie reculent d'un cran. 33 fiches
> rebadgées, aucun fichier déplacé.

1. **Board v0.17** — livré, taggé **v0.17.0**.
2. **Board multi-session** — **v0.18** (section ⑲), prêt : 7 fiches tirables. Prochaine version à
   construire. Ses écrans étendent v0.17 (activité, chronologie) : il vient juste après.
3. **La gate** — **v0.19** (section ⑳) : montée devant le polish CLI, car elle compose — chaque version suivante se livre plus propre.
4. **Les thèmes** (CLI, flux, backlog, cartographie) — encore des idées, à groomer avant de construire ; numéros posés à leur tour.

**À part, sans version** :
[`20261016114857813`](20261016114857813_lire-depends-et-desambiguiser-en-cours.md) (lire `depends:` en
avertissement + désambiguïser « en cours ») — autonome, à glisser dans un sprint qui a de la marge.

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
> Index généré en local (non committé) : `BACKLOG.md` · guide : [`README.md`](README.md).

## 🚂 Train de versions (décidé le 2026-09-23, recalé au tri du 2026-09-30, puis le 2026-10-02)

| Version | Nom | Contenu | Statut |
|---|---|---|---|
| **v0.1.0** | Le socle dit vrai | graphe compilé, verrou de statut, carte qui cite ses sources, un seul modèle de fiche, règle de clarté partout | ✅ livrée le 2026-10-01 |
| **v0.2.0** | On teste vite, en local | lanceur universel, ezk-scout, recette Android | ✅ livrée le 2026-10-01 |
| **v0.3.0** | Le backlog dit vrai + on range | ship sûr, versions dans le backlog, commande `ezk`, règles déployées, FAQ, recettes | ✅ livrée le 2026-10-01 |
| **v0.4.0** | La méthode se tient | cycle de vie sprint/session, run transparent, archive allégée, rétro v2, installation ailleurs, fabrique de skills | ✅ livrée le 2026-10-01 |
| **v0.5.0** | Le sprint au lot | le lot de stories choisi dans ezk-backlog, la fiche rangée avec son merge, product-build qui enchaîne les sprints | ✅ livrée le 2026-10-04 |
| **v0.6.0** | Le cockpit : voir où en est chaque projet | un tableau de bord pour tous les projets, les fiches posées sur le process | ✅ livrée (`v0.6.0`), 2026-10-07 |
| **v0.7.0** | Voir sous le capot | observabilité : voir ce qui s'est passé par version / sprint / fiche | ✅ livrée (local) |
| **v0.8.0** | Amélioration mesurée | système de règles composable : citer un bundle, prouver la divergence dev/reviewer, DoD/DoR en listes partagées | ✅ livrée (local) |
| **v0.9.0** | Ranger la maison (1er jet) | rationalisation : `docs/` redevient de la doc, config cop1 chez son produit, `CLAUDE.md` proxy vers la loi | ✅ livrée (local) |
| **v0.10.0** | Portabilité multi-IDE | une source de règles → `.claude/` + `.cursor/` + `AGENTS.md`, la CLI comme moteur portable | ✅ livrée (`v0.10.0`) |
| **v0.11.0** | La qualité tient | passe qualité avant de versionner (release-gate), dépendances à jour, gate locale unique, critères prouvés | ✅ livrée (`v0.11.0`) |
| **v0.12.0** | Le flux local sans friction | les outils `ezk` marchent depuis un projet hôte, `github: false` respecté de bout en bout | ✅ livrée (`v0.12.0`) |
| **v0.13.0** | La transaction ship, d'un bloc | ship/backlog/PLAN et réconciliation worktree en une seule surface cohérente | 📋 groomée (prête à construire, 2026-10-13) |
| **v0.14.0** | Les portiers robustes | archive, journal de sprint et worktree : des gardes qui ne crient plus au loup | 📋 groomée (prête, 2026-10-13) |
| **v0.15.0** | Voir les runs | observabilité des runs autonomes : éligibilité, multi-versions, inventaire des lancements | 📋 groomée (prête, 2026-10-13) |
| **v0.16.0** | Ranger la maison (2e jet) | déménagement `scrum/` sous revue, nettoyage cockpit, discipline de grooming, décision ADR | 📋 groomée (prête ; 1 fiche ADR en attente de panel) |
| **v0.17.0** | Le board unifié (cop1) | un seul tableau de bord : runs → moments → fiches, deux portées de config — conçu par maquette (ADR-074) | 📋 groomée (prête) — APRÈS le socle |
| **v0.18.0** | Superviser plusieurs LLM | run (chantier) ≠ session (ouvrier), un journal par worktree, chronologie à 3 niveaux, accueil « Tous les projets » — conçu par maquette, ratifié en panel (ADR-079) | 🔵 prête (7 fiches tirables) — construite juste après v0.17 |
| **v0.19.0** | La gate ne laisse plus rien passer | la gate attrape ce que la revue rattrapait : forme des vues, confinement, lint mega-city, recals de liens, santé des dépendances | 📝 proposée (2026-10-14), à valider |
| **v0.20.0** | La CLI se tient | surface de commande cohérente et ergonomique : audit DSL, `--root` uniforme, bug `--help`, secrets par projet | 📝 proposée (2026-10-14), à valider |
| **v0.21.0** | Le flux se lit et s'allège | cérémonies légères + restitutions lisibles : capture de rétro vérifiée, chemin lite du sprint, checkpoint en clair, rétro light | 📝 proposée (2026-10-14), à valider |
| **v0.22.0** | Le backlog se discipline | modèle backlog / PR / grooming : deux formes de PR, voir les PR avant un lot, règles de découpe au grooming | 📝 proposée (2026-10-14), à valider |
| **v0.23.0** | L'app se cartographie | exploration-app : index statique des routes (cache Pas 1) + l'explorateur de features, sur ezk-scout déjà livré | 📝 proposée (2026-10-14), à valider |
| **v1.0.0** | Ouvrable aux autres | multi-client, distribution, articles | ⏸️ « ne pas publier » (PO) |

> **Train rouvert le 2026-10-11.** Les 10 premières versions sont livrées. Après un grand tri du backlog
> (3 fusions de doublons, 1 split, 1 fiche supersedée), les fiches vivantes ont été loties en 6 nouvelles
> versions, validées par le PO après une revue adverse. Séquence détaillée en sections ⑫→⑰ ci-dessous.

## ▶️ Séquence — décidée le 2026-09-30 (tri, mode auto)

### ① v0.1.0 — le socle dit vrai
- ~~`20260821204737357` — compiler la méthode en un seul graphe que tout le monde lit · en cours · `build`~~ — shipped #265
- ~~`20260823121712652` — valider les statuts des fiches par un schéma (fin des fautes de frappe) · en cours · `build`~~ — shipped #267
- ~~`20260824111001836` — appliquer la règle de clarté à tout ce que la méthode produit · `build`~~ — shipped #273
- ~~`20260821163346493` — chaque élément de la carte montre le fichier d'où il vient · `build`~~ — shipped #269
- ~~`20260821163346490` — corriger la fausse « chaîne de montage » en haut de la carte · `build`~~ — shipped #271
- ~~`20260918114726706` — une seule source pour le modèle de fiche (3 copies divergent aujourd'hui) · `build`~~ — shipped #268
- ~~`20260922160651394` — mettre le code en conformité avec les règles de dev récentes · `build`~~ — shipped #270

### ② v0.2.0 — tester vite en local (en parallèle, en autonomie)
- ~~`20260910165637000` — ezk-scout : chasser les bugs en tâche de fond, sans corriger · prête · `build`~~ — shipped #266
- ~~`20260917162000501` — une commande pour lancer l'app de n'importe quelle branche ou worktree · `groom` → `build`~~ — shipped #274
- ~~`20260906135450000` — recette : lancer l'émulateur Android pour tester sur mobile · `build`~~ — shipped #276

### ③ Les deux P0 qui font mal (juste après le socle)
- ~~`20260830194601233` — livrer une fiche sans casser les liens ni les vues (ship sûr) · `build`~~ — shipped #282
- ~~`20260830194601376` — décider quelles vues générées ne plus committer (fin des conflits) · `build`~~ — shipped #279
- ~~`20260930123438875` — séparer clairement fiche, sprint et session (ezk-sprint start/close) · `groom` → `build`~~ — shipped #275

### ④ v0.3.0 — le backlog dit vrai + on range
- ~~`20260824204751403` — découper le backlog en versions et vérifier la cohérence d'un lot · `build`~~ — shipped #286
- ~~`20260903134906920` — une seule commande `ezk` pour tout lancer · `build`~~ — shipped #281
- ~~`20260903134909124` — déployer vraiment les règles chez les agents (aujourd'hui : zéro) · `build`~~ — shipped #284
- ~~`20260824122629925` — une FAQ « comment faire » pour tes questions récurrentes · `build`~~ — shipped #278
- ~~`20260825160456259` — à la fin d'une commande, proposer les 1 à 3 commandes suivantes · `build`~~ — shipped #280
- ~~`20260825182327490` — un modèle standard pour tout texte destiné à un humain · `build`~~ — shipped #283
- ~~`20260825202444647` — ezk-codex répond et ferme tous les fils de revue traités · `build`~~ — shipped #288
- ~~`20260826072532622` — valider fiches et carte depuis le tableau de bord (👍/👎 enregistré) · `build`~~ — shipped #287
- ~~`20260910231201744` — appliquer pour de vrai les fusions et découpages de fiches proposés · `build`~~ — shipped #292
- ~~`20260917123943914` — montrer sur la carte les scripts et commandes de la méthode · `build`~~ — shipped #293
- ~~`20260917143616286` — recette : vendre une app avec Lemon Squeezy et une licence Pro · `build`~~ — shipped #289
- ~~`20260904091853974` — tenir un journal des galères résolues, pendant le dev · `build`~~ — shipped #290
- ~~`20260824141336516` — recette : mettre en place la CI d'un projet type muti · `build`~~ — shipped #291

### ⑤ v0.4.0 — la méthode se tient
- ~~`20260906122942607` — run autonome transparent : ce qu'il va faire, puis ce qu'il a fait · `build`~~ — shipped #312
- ~~`20260904091853948` — ezk-archive plus léger et plus juste (voie rapide, bon compte, survit au cloud) · `build`~~ — shipped #311
- ~~`0080` — chaque rétro laisse un compte rendu clair et des propositions ciblées · `build`~~ — shipped #310
- ~~`20260905134937885` — mesurer si la revue locale peut remplacer Codex (et sortir la PR du chemin) · `build`~~ — shipped #308
- ~~`20260826173221323` — pouvoir pointer les vues sur un autre projet (muti, samplerz) · `build`~~ — shipped #299
- ~~`20260910152227744` — des règles propres à un projet (ex. « samplerz en hexagonal ») · `build`~~ — shipped #303
- ~~`20260813095351680` — rendre l'installation des skills robuste (3 défauts de lawgiver) · `build`~~ — shipped #304
- ~~`20260816151112162` — installer les slash-commands comme les skills · `build`~~ — shipped #305
- ~~`20260812104022246` — composer des consignes réutilisables dans les skills · `build`~~ — shipped #298
- ~~`0066` — tester un skill pour de vrai avant de le merger · `build`~~ — shipped #302
- ~~`20260920213500176` — réduire le coût d'un sprint qui ne fait qu'éditer un skill (~330k jetons) · `build`~~ — shipped #300
- ~~`20260830114318159` — créer un skill en passant par une fiche du backlog · `build`~~ — shipped #301
- ~~`20260815080414006` — critères de « prête » (DoR) adaptables par projet · `build`~~ — shipped #307
- ~~`20260825161522791` — un grooming guidé : l'agent propose des améliorations, tu choisis · `build`~~ — shipped #309
- ~~`20260930123438875` — séparer clairement fiche, sprint et session · `groom` → `build` — déjà planifiée en ③ (P0 juste après le socle), elle appartient aussi au lot v0.4.0~~ — shipped #275

### ⑥ v0.5.0 — le sprint au lot (P0)
- ~~`20260930194219046` — ezk-backlog choisit et fige le lot du sprint, que `start --lot` consomme · `build`~~ — shipped #324
- ~~`20260930194219068` — ezk-product-build enchaîne les sprints, un checkpoint entre deux incréments · `groom` → `build`~~ — shipped #325
- ~~`20261002114435782` — la fiche d'une story arrive en done avec son merge, quel que soit le canal : ship avant merge, décidé mais jamais construit · prête le 2026-10-02 · `build`~~ — shipped #333
- ~~`20261002155911250` — le portier d'ezk-archive compare à origin/main à la clôture (le squash est déjà reconnu) · P1, issue de la rétro muti (#331) · prête le 2026-10-03 · `build`~~ — shipped #345
- ~~`20261002155911257` — les skills ezk retrouvent mega-city depuis un projet hôte, en passant par `ezk --root` · P1, issue de la rétro muti (#331) · prête le 2026-10-03 · `build`~~ — shipped #343
- ~~`20261003072823731` — sans `--root`, `ezk backlog ship` et `regen` visent le dépôt du dossier où on tape la commande · P2, complète la précédente (décision PO du 2026-10-03) · prête le 2026-10-03 · `build`~~ — shipped #344
- ~~`20261003200945204` — le mode local de la méthode marche depuis un projet hôte, sans contournement (4 défauts trouvés au test sur cop1-cobaye) · P0, décision PO du 2026-10-03 · prête le 2026-10-03 · `build`~~ — shipped
- ~~`20261004074008211` — le merge local ne supprime jamais main, et dit chaque branche qu'il supprime · P0, décision PO du 2026-10-04 · prête le 2026-10-04 · `build`~~ — shipped
- ~~`20261003105820077` — la note de passation et le carnet de rétro survivent à la suppression d'un worktree de l'app · P1, issue de la rétro muti du 2026-10-03 (#340) · prête le 2026-10-03 · `build`~~ — shipped
> Sortie de la v0.5.0 le 2026-10-03 : la fiche « regrouper les artefacts de méthode hors de docs/ » (P2, hors thème, décisions lourdes). Elle reste au jalon rationalisation, sans version.

### ⑦ v0.6.0 — le cockpit : voir où en est chaque projet (décidé le 2026-10-02)
> Le tableau de bord d'abord : son ADR dit dans quelle page vivra la vue du process.
- ~~`20260904080827072` — un seul tableau de bord pour tous tes projets : choisir le projet, voir sa config · prête le 2026-10-03 · `build`~~ — split
- ~~`20261004192802828` — cockpit, socle : l'ADR, `ezk config show` lisible depuis un autre projet, un seul registre · découpé le 2026-10-04 (décision PO) · prête le 2026-10-04 · `build`~~ — shipped
- ~~`20261004192802897` — cockpit : le menu des projets et les fiches du projet choisi, pouces dans le bon projet · découpé le 2026-10-04 · prête le 2026-10-04 · `build`~~ — shipped
- ~~`20261004192802964` — cockpit : la page « config » du projet choisi, en sections · découpé le 2026-10-04 · prête le 2026-10-04 · `build`~~ — shipped
- ~~`20261003011750521` — les portiers d'ezk-sprint et d'ezk-archive laissent tranquilles les copies de réserve propres · P1 depuis la rétro du run cockpit (2026-10-04) · `groom` → `build`~~ — shipped
- ~~`20261005100026946` — la clôture de session committe l'archive qu'elle écrit · P1, décision PO du 2026-10-05 · `groom` → `build`~~ — shipped
> **Triage du 2026-10-07** : le cockpit est **livré** (les 5 fiches ci-dessus + le split). Sa queue
> était mal étiquetée, re-rangée hors v0.6.0 :
> `20261002115451315` (voir fiches sur le process) et `20261005100027029` (compte rendu de sprint) →
> **v0.7.0** (observabilité) · `20261002205205417` (modèle/effort des agents) → **parked** (décalée) ·
> `20261003105820099` (ménage archive auto) + 4 autres correctifs de méthode → **sans version**
> (dispo, futur lot hygiène). v0.6.0 est **à clore** : `ezk backlog version close v0.6.0 --tag` + push de l'étiquette.

### ⑧ v0.7.0 — voir sous le capot (socle d'abord — décidé le 2026-10-07)
> La clé de voûte (le contrat du bus / catalogue des moments) et le socle « runs » sont livrés ; reste le garde-fou de séquence (P0, décidé le 2026-10-10), le compte rendu de sprint et ce que la rétro/l'archive en lisent ; l'**interface** attend la maquette. **Réaligné le 2026-10-10.**
- ~~`20261010215345931` — le tirage reste dans la version en cours (garde-fou de séquence) · P0 · **ready** → `build` (groomée 2026-10-11, ADR-0070)~~ — shipped (local v0.7)
- ~~`20261008072305169` — au close, le sprint écrit et committe son compte rendu · P1 · **ready** → `build`~~ — shipped
- ~~`20261008072306360` — la rétro et l'archive lisent les comptes rendus de sprint · P1 · `idea` → `groom`~~ — shipped
> Parkées hors séquence le 2026-10-11 (ne figurent plus dans le plan, pour ne pas fausser `plan-head`) :
> la recopie GitHub du local — issues, PR, labels, versions — (plugin GitHub non autorisé + dépend de 0170),
> et la refonte de la vue de supervision du Moniteur (maquette PO requise). Leur statut vit dans les fiches.
- ~~`20261004101755756` — écrire le contrat du bus : le catalogue des moments de la méthode · P1 · `build`~~ — shipped local (2e395663)
- ~~`20261002133125444` — fermer un run de supervision ne doit fermer que le sien · P2 · `build`~~ — shipped local
- ~~`20261003201035260` — les récits de session reviennent sur main (historique des runs figé au 30 août) · P2 · `build`~~ — shipped local
- ~~`20261002115451315` — voir les fiches posées sur le process, avec leur session~~ — shipped local (bc8a0316) ; livrée avec version, filtres et le fix détail cross-projet (fiche 20261010100030780)
- ~~`20261005100027029` — chaque sprint laisse un compte rendu committé, lu par la rétro · `idea` → `groom`~~ — split
> Hors lot socle, après maquette / décision PO : les hooks d'émission (`0077`, optionnel).

### ⑨ v0.8.0 — amélioration mesurée : système de règles composable (décidé le 2026-10-08, réaligné le 2026-10-09)
> Le système de règles devient composable : citer un bundle (la brique) et prouver la divergence dev/reviewer (spike), puis la DoD/DoR en listes partagées, puis la vue de projection. Avis ezk-architect / ezk-pm / product-brainstorming intégrés.
- ~~`20261008154803440` — un consommateur (agent/skill) peut citer un bundle · P0 · **ready** → `build` ; amende ADR-0040 (double-write sorti en Suite)~~ — shipped local (58357fb6)
- ~~`20261008183238365` — spike : dev et reviewer divergent-ils vraiment ? · P0 · **ready** → `build` ; conditionne F2~~ — shipped local (constat 2026-10-10 : divergence PROUVÉE → F2 à tirer)
- ~~`20261008154804532` — DoD/DoR en listes de règles/bundles (contrat partagé) · P0 · `idea` → `groom` ; conditionnée au spike + dépend de F1~~ — shipped local (c44c236f ; ADR-0071, DoD = bundle `dod`)
- `20261008154805639` — vue de projection par projet (agent + ses règles) · P2 · `idea` → différée (déclencheur F1/F2)

### ⑩ v0.9.0 — ranger la maison (rationalisation)
> Rationalisation de la surface : fichiers (docs/, scrum/, config cop1, CLAUDE.md proxy) et CLI. Lot **entièrement prêt** (8 fiches ready) — complété au réalignement du 2026-10-10 ; à tirer après la v0.7 puis la v0.8.
- ~~`20261009104436287` — `next` nu montre la suite (pas la liste) ; `plan-head` démoté · P1~~ — parkée, sortie de v0.9 (prémisse périmée : pas de verbe `next`/`list` au CLI, migré vers `plan-head`/`plan-lot` ; résidu = décision nommage PO ; run 2026-10-11)
- ~~`20261001192624192` — chemins des artefacts de méthode configurables (`scrum:`) — la fondation · P2 · **ready** → `build`~~ — shipped
- ~~`20261007154842506` — brancher skills/scripts/bins sur le résolveur de chemins · P2 · **ready** → `build`~~ — shipped
- ~~`20261007154842643` — basculer vectorz vers `scrum/` (git mv des 5 dossiers) · P2~~ — parkée, sortie de v0.9 (déménagement à l'échelle du dépôt : 168 .md + loi compilée ; à faire sous revue, pas en run autonome ; run 2026-10-11)
- ~~`20261007154842780` — nettoyer `docs/` : supprimer `archive/`, requalifier `e2e/` · P2 · **ready** → `build`~~ — shipped
- ~~`20261007154842917` — note de migration `scrum/` + bascule d'un consommateur (muti) · P2~~ — parkée, sortie de v0.9 (dépend de la bascule `scrum/` parquée ; run 2026-10-11)
- ~~`20261007115128214` — descendre `cop1.config.example.yaml` vers `products/cop1/` · P2 · **ready** → `build`~~ — shipped
- ~~`20261007115129448` — `CLAUDE.md` = simple proxy vers la loi, bindée par projet · P2 · **ready** → `build`~~ — shipped

### ⑪ v0.10.0 — portabilité multi-IDE (ajouté au plan le 2026-10-10)
> Une source de règles → plusieurs IDE (`.claude/`, `.cursor/`, `AGENTS.md`), la CLI comme moteur portable. Était absent du plan alors que les fiches existaient déjà.
- ~~`20261007151859470` — générateur multi-IDE : une source → `.claude/` + `.cursor/` + `AGENTS.md`, CLI moteur · P1 · **ready** → `build`~~ — shipped
- ~~`20261010091118580` — boussole de session : une commande qui dit quoi faire maintenant · P2 · **ready** → `build`~~ — shipped local (ADR-0072, `ezk now`)
- ~~`20261007151859473` — amorçage brownfield : extraire les règles d'un projet existant → bundles · P2 · **ready** (groomée 2026-10-11 : étendre `ezk-scout`) → `build`~~ — shipped

### ⑫ v0.11.0 — la qualité tient (train rouvert le 2026-10-11)
> Ouvre après le grooming de la P0 (forme retenue : un skill `ezk-release` dédié). La sécurité d'abord (cheap, indépendante).
- ~~`20261004175528673` — corriger les 20 dépendances vulnérables (vitest 4) · P1 · `groom`~~ — shipped
- ~~`20260922175954296` — release-gate : passe qualité avant de versionner (skill `ezk-release`) · P0 · `groom`~~ — shipped
- ~~`20261002230039555` — une seule commande « gate » rejoue la validation locale · P1 · `groom`~~ — shipped
- ~~`20261003075821760` — le relecteur coche les critères, pas le constructeur · P1 · `build`~~ — shipped
> **Deux fiches reportées hors v0.11** (repassées en `idea`, run autonome 2026-10-13), donc retirées de ce lot : « la gate attrape forme/confinement » (critères 1-2 couverts par le correctif `regen --root`, critère 3 = spike « garde de confinement sans test ») et « le lint couvre mega-city » (396 erreurs, résorption massive ou baseline à trancher). Elles vivent dans le backlog, sans version.
- ~~`20261011091552583` — regen n'écrit plus un titre cassé avec `--root` · P2 · `groom`~~ — shipped
- ~~`20261002230039755` — la revue locale rejoue les scripts bash sur entrées hostiles · P2 · `groom`~~ — shipped- ~~`20261011142027748` — `ezk adr new` : prochain id d'ADR libre des deux dossiers · P2 · `groom`~~ — shipped

### ⑬ v0.12.0 — le flux local sans friction
> Les commandes `ezk` doivent travailler depuis un projet hôte, et `github: false` tenir de bout en bout.
- ~~`20261004083344960` — les outils de la méthode marchent depuis un projet hôte · P1 · `groom`~~ — split en ↓
- ~~`20261013073300242` — les commandes ezk de lecture visent le projet hôte · P1 · `build` (ready)~~ — shipped
- ~~`20261013073300256` — les commandes ezk qui écrivent visent le bon dépôt hôte · P1 · `build` (ready)~~ — shipped
- ~~`20261003201034897` — `ezk` dit quand le dossier principal est en retard · P1 · `groom`~~ — shipped
- ~~`20261004083838593` — un seul guichet GitHub (`github: false` respecté) · P2 · `groom`~~ — split en ↓
- ~~`20261013074251752` — le guichet `ezk forge` : une commande, trois états · P2 · `build` (ready)~~ — shipped
- ~~`20261013074251767` — ezk-archive et reconcile passent par le guichet + cliquet · P2 · `build` (ready)~~ — shipped
- ~~`20261004083838687` — sans PR, intégrer par avance rapide · P2 · `build` (ready)~~ — shipped
- ~~`20261011113632532` — `ezk run context/report` visent le projet construit + flux local · P2 · `groom`~~ — shipped
- ~~`20261002230039863` — le rapport de sprint retrouve sa trace de supervision · P3 · `build` (ready)~~ — shipped
- ~~`20261011091556212` — banc jetable E2E du flux local (sans GitHub) · P3 · `groom`~~ — shipped

### ⑭ v0.13.0 — la transaction ship, d'un bloc
> Toute la surface ship/backlog/PLAN et la réconciliation worktree dans une seule version (évite de rééditer deux fois le même point d'entrée). **Groomée 2026-10-13 : tout ready.**
- ~~`20261010114132970` — réconcilier le worktree après un ship local · P1 · `build` (ready)~~ — shipped
- ~~`20261002231845120` — `BACKLOG.md` ne fait plus conflit entre deux PR · P1 · `build` (ready)~~ — shipped
- ~~`20261004211037977` — ship dit ce qu'il touche + lit/barre `PLAN.md` · P2 · `build` (ready)~~ — shipped
- ~~`20261002230039650` — poser le commit ship une seule fois · P2 · `build` (ready)~~ — shipped
- ~~`20261002205428200` — la garde de ship lit la vraie branche de la PR · P2 · `build` (ready)~~ — shipped
> Différée en panel (parkée, hors v0.13) : « une PR ne range que sa fiche » (`20261004083345055`) — renverse les fiches 4/5 livrées + révise l'ADR-0049 §2. Détail : `docs/sprints/2026-10-13-v013-transaction-ship.md`.
- ~~`20261002133125418` — `plan-head` respecte `blocked:` (+ raisons typées) · P2 · `groom`~~ — split en ↓
- ~~`20261013131632277` — la tête du plan respecte le drapeau bloquée · P2 · `build` (ready)~~ — shipped
- ~~`20261013131632484` — raisons typées pour le drapeau bloquée · P2 · `build` (ready)~~ — shipped

### ⑮ v0.14.0 — les portiers robustes
> Archive, journal de sprint et worktree : des gardes qui ne crient plus au loup. **Groomée 2026-10-13 : tout ready.**
- ~~`20261004181110201` — le journal de sprint se range par branche, hors du worktree · P1 · `build` (ready)~~ — shipped
- ~~`20261010213746514` — le portier distingue un worktree vivant d'un abandonné · P2 · `build` (ready)~~ — superseded
- ~~`20261011111526693` — `lawgiver bind` gère un `.git` fichier (worktree) · P2 · `build` (ready)~~ — shipped
- ~~`20261002155911264` — `ezk-archive` reprend proprement un run interrompu · P2 · `build` (ready)~~ — shipped
- ~~`20261003201035168` — le portier `ezk-archive` juge contre `origin/main` · P2 · `build` (ready)~~ — shipped
- ~~`20261003105820099` — le ménage `ezk-archive` en mode auto (spike-correctif) · P3 · `build` (ready)~~ — shipped

### ⑯ v0.15.0 — voir les runs (observabilité)
> Le run autonome sait s'arrêter à la bonne borne, et on voit après coup ce qui a tourné. Le release-gate (v0.11) est un prérequis de l'auto-tag multi-versions. **Groomée 2026-10-13 : tout ready.**
- ~~`20261011091553794` — le run autonome filtre l'éligibilité + borne de version · P2 · `build` (ready)~~ — shipped
- ~~`20261011103839682` — `ezk-product-build` enchaîne plusieurs versions (rétro + tag) · P2 · `groom`~~ — split en ↓
- ~~`20261013131852375` — ezk-product-build enchaîne plusieurs versions (POC boucle) · P2 · `build` (ready)~~ — shipped
- ~~`20261013131852581` — auto-tag/close local en opt-in (+ ADR) · P2 · `build` (ready)~~ — shipped
- ~~`20261013131852779` — l'auto-groom sort une fiche hors version · P2 · `build` (ready)~~ — shipped
- ~~`20261010114133220` — `registry-add` préserve l'en-tête du registre · P2 · `build` (ready)~~ — shipped
- ~~`20260906142654370` — cop1 affiche les itérations lancées · P2 · `build` (ready)~~ — shipped

### ⑰ v0.16.0 — ranger la maison (2e jet)
> Livré en run autonome 2026-10-14 : nettoyage cockpit, discipline de grooming, « en cours » déduit des branches (+ADR-0077), lentille étiquette≠comportement, garde-fous de test. La **décision ADR** (où vivent les ADR) a été tranchée en séance → ADR-078. **Parkées hors v0.16 le 2026-10-15** (réveil au grooming) : le déménagement `scrum/` (`20261007154842643` + `20261007154842917` — sous revue, pas en run autonome) et le tri des sorties de rétro (`20261002155911271` — grooming + panel adverse).
- ~~`20261011142027875` — où vivent les ADR : deux dossiers + règle de routage · P2 · `build` → ADR-078~~ — shipped
- ~~`20261010114133345` — le cockpit ne liste plus le projet deux fois · P2 · `build` (ready)~~ — shipped
- ~~`20261010114133469` — un ajout de comportement en cours de sprint = story · P2 · `build` (ready)~~ — shipped
- ~~`20261002130235353` — « en cours » se déduit des branches · P2 · `groom`~~ — split en ↓
- ~~`20261013131852984` — « en cours » se déduit des branches (portier + vue) · P2 · `build` (ready)~~ — shipped
- ~~`20261013131853182` — trancher le sort de la valeur `in-progress` (ADR court) · P2 · `build` (ready)~~ — shipped
- ~~`20261010235329987` — étiquette ≠ comportement quand on touche les règles d'un agent · P2 · `build` (ready)~~ — shipped
- ~~`20261003201035080` — un contrôle refuse une section en double dans un skill · P2 · `build` (ready)~~ — shipped

### ⑱ v0.17.0 — le board unifié (cop1, après le socle)
> Un seul tableau de bord, conçu par maquette (v17) et validé par le PO le 2026-10-12. Design de référence : fiche `20261007135620590` ; décision : `ADR-074` ; maquette : `docs/maquettes/board-ezk-dashboard.html`. Tranches sœurs (milestone `board`) : 7 vues + 3 tranches du moteur de config (découpé de `20261002205205417` le 2026-10-13). À séquencer APRÈS le socle (catalogue des moments livré ; métriques tokens `0052`/`0055`). **Groomée 2026-10-13 : tout ready.**
- ~~`20261012231419185` — coque + vue d'ensemble · P1 · `build` (ready)~~ — shipped
- ~~`20261012231419211` — activité par run → moments → fiches + modale fiche · P1 · `build` (ready)~~ — shipped
- ~~`20261012231419198` — les deux pipelines : cadrage et développement · P2 · `build` (ready)~~ — shipped
- ~~`20261012231419224` — vue Fiches : filtre par catégorie de version · P2 · `build` (ready)~~ — shipped
- ~~`20261012231419237` — chronologie condensée · P2 · `build` (ready)~~ — shipped
- ~~`20261012231419250` — config projet (lancement/qualité/intégration) + modèle résolu · P2 · `build` (ready)~~ — shipped
- ~~`20261012231419263` — assistant d'ajout de projet · P2 · `build` (ready)~~ — shipped
- ~~`20261002205205417` — config modèle & effort (moteur + mapping outil) · P1 · `découper`~~ — split en ↓
- ~~`20261013132218242` — config modèles : schéma à deux portées + résolveur pur · P1 · `build` (ready)~~ — shipped
- ~~`20261013132218451` — config modèles : pointeurs au bind + commande `ezk config` · P1 · `build` (ready)~~ — shipped
- ~~`20261013132218656` — board : page ⚙ config outil (mapping) + route gardée · P2 · `build` (ready)~~ — shipped

### ⑲ v0.18.0 — superviser plusieurs LLM (multi-sessions, conçu + ratifié en panel)
> Run (chantier) ≠ session (ouvrier) : un journal par worktree, reconstruit par chantier, chronologie à 3 niveaux, accueil « Tous les projets ». Conçu par maquette (8 cas) et **ratifié en panel adverse** (`ADR-079`, modèle B) le 2026-10-14 ; design de référence `20261014122044421` livré (maquette + ADR-079). Affine le board v0.17 ; ses écrans (activité, chronologie) se construisent **sans graver « run = session »** pour étendre au lieu de réécrire. Ordre = dépendances : l'émetteur pose l'identité, le read-model et la découverte l'exploitent, l'écran vient après. **Les 7 tranches sont prêtes — groomées + gate DoR le 2026-10-15 ; prochaine version à construire.**
- ~~`20261015133600298` — émetteur T1 : contrat @0.2 + journal par worktree · P1 · `build`~~ — shipped
- ~~`20261015133600314` — émetteur T2 : identité de session · P1 · `build`~~ — shipped
- ~~`20261015133600328` — émetteur T3 : clé de chantier · P1 · `build`~~ — shipped
- ~~`20261015082118353` — board : read-model chantier → sessions → évènements · P1 · `build`~~ — shipped
- ~~`20261015082118368` — board : découverte worktrees + watch dynamique · P1 · `build`~~ — shipped
- ~~`20261015082118382` — board : chronologie 3 niveaux + accueil « Tous les projets » · P2 · `build`~~ — shipped
- ~~`20261015082118397` — rattachement : étape d'accueil de session · P2 · `build`~~ — shipped

### ⑳ v0.19.0 — la gate ne laisse plus rien passer (proposée le 2026-10-14, à valider)
> Les trous de qualité que la revue a dû rattraper deviennent mécaniques. **Gardée en v0.19 lors de la rotation du 2026-10-17 : elle paye tôt, chaque version qui suit se livre plus propre.**
- ~~`20261011091555006` — la gate attrape forme des vues + confinement · P2~~ — parké hors version (à-découper : critère 3 = spike, hors passe lean)
- ~~`20261001133500750` — le lint couvre le code de mega-city · P2~~ — parké hors version (différée-PO : 396 erreurs + CI off sous github:false)
- ~~`20261013013553044` — ship/close committe les recals de liens hors `features/` · P2 · `groom`~~ — shipped
- ~~`20260816194833618` — santé des dépendances : audit local + place dans le process · P2~~ — parké hors version (à-découper : arbitrage de périmètre non tranché)
- ~~`20261013131625101` — helper `commit-doc-via-worktree` partagé en install copie · P2 · `groom`~~ — shipped

### ㉑ v0.20.0 — la CLI se tient (proposée le 2026-10-14, à valider)
> DX de la ligne de commande, le plus rentable au quotidien. Le brainstorm DSL vient EN PREMIER : il peut recadrer les autres. Fiches encore `idea` → chacune passe par `groom` puis `ready` avant d'être tirable.
- ~~`20261010153046143` — brainstorm : la CLI est-elle un DSL cohérent (ezk / mc, toute la surface) · P2~~ — parké hors version (attend-panel : décisions produit, ezk vs mc, rapatrier lawgiver)
- ~~`20261013143324404` — uniformiser `--root` avant ET après le verbe · P3~~ — parké hors version (à-découper : spike routeur, doit respecter la sûreté flag-only des commandes d'écriture)
- ~~`20261004083838781` — `ezk config --help` lu comme un chemin (faux statut) · P3 · `groom`~~ — shipped
- ~~`20261001104806732` — `ezk-secret sync` : un manifeste de secrets par projet · P2~~ — parké hors version (attend-GitHub : pousse des secrets vers GitHub, désactivé sous github:false)
- ~~`20261001142603963` — `ezk-secret apply` : scope compte/par-app, secrets par recette · P2~~ — parké hors version (attend-dépendance : s'appuie sur ezk-secret sync)
- ~~`20261011113632688` — spike : outiller/documenter l'ajout d'une règle (fichier + bundle + profil + bind) · P2~~ — parké hors version (à-découper : investiguer→décider avant d'outiller)

### ㉒ v0.21.0 — le flux se lit et s'allège (proposée le 2026-10-14, à valider)
> Cérémonies légères pour les petits périmètres, et restitutions lisibles.
- ~~`20261010213353647` — une capture de rétro lisible, et quelque chose qui le vérifie · P1 · `groom`~~ — shipped
- `20261007151859479` — chemin « lite » du sprint pour fiches triviales · P2 · `groom`
- `20261003011750607` — le checkpoint d'ezk-sprint définit ses termes en clair · P2 · `groom`
- `20261013131625303` — ezk-retro : un mode light (cérémonie courte) · P3 · `groom`
- `20261007151859476` — ezk-debugging : skill de débogage systématique (4 phases) · P2 · `groom`

### ㉓ v0.22.0 — le backlog se discipline (proposée le 2026-10-14, à valider)
> Le modèle backlog / PR / grooming se resserre.
- `20261003075821858` — deux formes de PR (dev rend la fiche, backlog la désigne) · P1 · `groom`
- `20261003201034990` — voir les PR ouvertes et les branches avant un lot ou un groom · P1 · `groom`
- `20261013131625202` — une fiche découpée ne porte pas un critère de sa sœur · P2 · `groom`
- `20261013013553179` — le grooming applique la règle de taille (> 2 surfaces → découper) · P3 · `groom`
- `20261007213454366` — spike : voir toute l'histoire d'une feature au même endroit · P3 · `groom`
- `20261011112934507` — `ship-merge --local` tolère un fichier non suivi + mesure du rayon en DoR · P2 · `groom`

### ㉔ v0.23.0 — l'app se cartographie (proposée le 2026-10-14, à valider)
> Exploration-app : la carte d'abord (réduite au Pas 1), l'explorateur ensuite, sur `ezk-scout` déjà livré. Dépend du board v0.17 pour le « où vit le cache » si la version vivante sort un jour.
- `20261014113049954` — cache de cartographie, Pas 1 : index statique des routes + test de valeur · P2 · `groom`
- `20260821210633457` — l'explorateur de features par PR (à dé-parker) · P2 · `groom`
> **Reste à caser** (le PO slotte) : `20261002130917993` (release local-first) et `20261011153019643` (step design-system dans `ezk-release`) — thème release, aiguillage en attente.
> **Rattachées au board v0.17** (pas une version libre) : `20261002115451451` (page une ligne par projet), `20260830110131228` (étapes de skill configurables), `20261013143324505` (borner `sprint:report`).

### 🧹 En continu — petits correctifs (à glisser dans un sprint qui a de la marge)
- `20261016114857813` — lire `depends:` en avertissement + désambiguïser « en cours » · P2, **prête** · `build` (autonome, sans version — le noyau d'ADR-0081)
- ~~`20261004181110120` — ezk ne croit plus un INIT_CWD laissé par un pnpm parent (le test de « ezk retro note » écrivait dans le vrai dépôt) · P1, prête le 2026-10-04 · `build` (avant la rétro du run cockpit, décision PO)~~ — shipped
- ~~`0024` — supprimer le vieux code d'avant le pivot · `build`~~ — shipped #296
- ~~`0117` — corriger les signatures de domain.ts qui ne collent plus au code · `build`~~ — shipped #295
- ~~`0143` — unifier le nom des modes tokens (lean / cap / full) dans la doc · `build`~~ — shipped #295
- ~~`20260813122510737` — ezk-backlog init se trompe de version de format dans un cas · `build`~~ — shipped #295
- ~~`20260823121712844` — empêcher la régénération du backlog de viser le mauvais dossier · `build`~~ — shipped #295
- ~~`20260829132313947` — masquer les forks dans le suivi de consommation CI · `build`~~ — shipped #295

> Historique : les séquences précédentes (itérations d'août et de septembre) sont dans
> l'historique git de ce fichier, avant le 2026-09-30.
