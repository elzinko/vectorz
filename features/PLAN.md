# PLAN — séquence de travail (vectorz)

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

## ▶️ NOW — post-ADR-0040 (réaligné le 2026-08-26)

> Réalignement PO du **2026-08-26** : l'ancienne tête « vue d'avancement »
> (`20260823124042842`) est **livrée** → retirée. **ADR-0040** (modèle de fichiers
> compilé + validé) est acté comme la **fondation** du moment. Tête décidée : la
> **carte-loi** (prête, et elle consomme le graphe compilé).

**🔩 Fondation — en cours (session « moteur »), à finir / coordonner :**
- **20260821204737357** — câbler la méthode par un modèle compilé (le graphe) · in-progress
- **20260823121712652** — statut validé par schéma (le validateur) · in-progress
  *(items d'ADR-0040, arrêtés au budget — ne pas les reprendre sans coordination)*

> **Réalignement PO du 2026-09-03** : la carte-loi et le cockpit de sessions sont **livrés**
> → barrés. Nouvelle tête : **la preuve avant/après dans les PR** (fiche `ready`, P1) — la
> règle `pr-before-after-media` existe depuis juillet mais 0 PR sur 90 la respecte (mesure du
> 2026-09-03, fiche 20260902224608715).

**Séquence à tirer :**
1. **20260902224608715** — preuve avant/après dans les PR : outiller la règle existante
   (champ `evidence:` sur la fiche, script `pr-evidence.sh` main ↔ branche, étape 8
   d'ezk-sprint, lentille ezk-reviewer + check-pr-body) · **ready** · **P1** · `build`.
2. **20260824061247344** — reliquat de la refonte « trois étages » (lot 4b · vocab DoD ·
   compétences agents) · `groom` → `build`.
- ~~**20260821172716537** — carte-loi : ouvrir LA LOI (règles / bundles / profils + « qui
  active quoi ») en lisant le graphe compilé · `build`~~ — shipped #179.
- ~~**20260825141012293** — ezk-sessions : cockpit de pilotage des sessions (onglet
  `ezk:map sessions` ; colonne supprimable) · **P1**~~ — shipped #188.

⚠️ **En cours ailleurs — ne pas doublonner** : **20260812104022240** (ezk-backlog
aggregate, readyé via #177) — probablement pris par une autre session.

### ↪️ NEXT — après la séquence NOW

- **0067 + 0066** — gate de structure à la génération : `ezk-ezk` ne sort pas un objet du
  domaine hors **DoR/DoD de skill** (option A actée PO 2026-08-25) · `groom` → `build`
- **20260812104022246** — composition comportementale des skills (directive `ezk-archive`
  session-only + idée map « règles composées par skill ») · `groom` (archi)
- **20260825182327490** — pattern « livrable lisible » : template + extracteur + rendu · `groom`
- **20260824163426298** — consolider preview/device/testbed, épic (surface unifiée +
  compétences composables d'agents) · `groom` (archi)

## 🧹 Hygiène préalable (rapide)

- ~~**P0** `build` **0181** — méthode ezk : Opus 4.8 (+ spare sonnet) + restitutions
  « En clair »~~ — shipped #92.
- ~~**P0** `build` **0176** — interdit `git config --global user.*` pour l’identité
  agent ; commits cop1 = local / one-shot only ([#86](https://github.com/elzinko/vectorz/issues/86))~~ — shipped #89.
- ~~`ship` **0059** · **0061** (vectorz)~~ — fait (vérifié au `reconcile` du 2026-07-26).
- ~~`ship` **0094** · **0095** (mega-city)~~ — fait au `reconcile` 2026-07-30 (#54, #55).
- `audit` **0030** (MVP démo Desktop, in-progress) — le circuit démo tourne depuis le
  2026-07-25, probablement à clore ou re-scoper.
- ~~**0182** — E4 bis : docs vivants post-BMAD (hygiène P3, complément 0039) · `ship`~~ — shipped #101

## ▶️ NOW — voir et gérer ses projets

0. ~~**0064** — une seule liste de features (champ `product:`)~~ — shipped #66 / #68
1. ~~**0094** — brancher l'émetteur sur vectorz~~ — shipped #54
2. ~~**0095** — faire émettre `ezk-product-build`~~ — shipped #55
3. ~~**0082** — registre {projet · méthode}~~ — shipped #70
4. ~~**0168** — run orphelin = verrou sans clé (bouton abandon siège + erreur actionnable)~~ — shipped #76
5. ~~**0181** — Opus 4.8 + restitutions lisibles~~ — shipped #92
6. ~~**0062** — onglet « Projets » : liste par projet, cliquable → activité · `ship`~~ — shipped #95
7. ~~**0063** — « ajouter un projet » depuis le Moniteur (dossier + install, 2 modes) · `ship`~~ — shipped #97

## ⏭️ NEXT — la méthode se tient + confort

8. ~~**0090** — cohérence de sprint : garde-fou d'ouverture `ezk-sprint:check` (ex-ezk-start) (tâche 1 POC) · `ship`~~ — shipped #99
9. ~~**0079** — graver « tout artefact lu par un humain est lisible »~~ — shipped #74
10. ~~**0091** — mise à plat + glossaire du jargon du backlog · `ship`~~ — shipped #103
11. ~~**0022** — Moniteur : afficher heure/durée/historique déjà collectés · `ship`~~ — shipped #105
12. ~~**0060** — réparer les deux docs d'install périmés (checklist + guide web UI) · `ship`~~ — shipped #107
13. ~~0041~~ — cobaye : banc de test rapide pour sécuriser les devs · ship #113
14. ~~**0089** — finir l'ordonnancement (brancher PLAN sur l'intake)~~ — shipped #52 (constat réconciliation 2026-08-24 : la ligne n'avait jamais été rayée)
15. ~~**0149** — `composes:` : rendre la composition inter-skills mécanique~~ — shipped #121
    *(suite : tier optionnel `delegates:` = fiche 0190)*
16. **0102** — `ezk-testbed` : brique « démarrer un env de test » (PR · branche · local)
    + ADR-0020 · `build` *(attend le dogfood samplerz `make preview-pr`, son repo)*
17. ~~**0183** — pack de review markdown-first~~ — shipped (main c45102b, sprint 0044)
18. ~~**0184** — webapp reporting de run (lot 1)~~ — shipped (main 51d8bf0 ; lot 2 boutons gated 0102)
19. ~~0185~~ — ezk-archive croise branches RÉELLES ↔ PRs ouvertes · ship #117
    *(P1 mega-city — filet anti « ouvrir une PR déjà ouverte », cas #116)*

## ⏳ LATER — pas maintenant

- ⚠️ **Distribution / publication** — 0087 · 0050 · 0078 · 0096 · 0186.
  **NE PAS PUBLIER : pas prêt (décision PO 2026-07-26).** L'ADR de versionnage et la
  question « méthode dans le projet, façon BMAD » s'instruiront quand *le PO* décidera
  d'ouvrir à d'autres.
- **Observabilité qualité** (epic 0051) — 0052/0053/0054/0055/0056/0058 : mesurer la qualité par PR.
- **Rationalisation & cohérence de la méthode** (épic `20260813131737959`) — audit 2026-08-13
  → nommage/catalogue (rename `ezk-pr-pilot`→`ezk-pr`), assainir les refs, carte des rôles
  (retro/steward/0057, dans `method-map.md`) ; regroupe 0066/0101/0161/0113. *Séquence & prio à arbitrer PO.*
  *(vz-product-builder = 0164, décision overlay déjà prise — hors épic.)*
- **Articles & promo** — 0043/0049 · 0156/0053/0069/0073/0074/0062 · epic 0163.
- **Méthode avancée** — 0065→0068 / 0077 / 0080 / 0088 / 0092 / 0100 (dont le seuil de lot ready, voir ci-dessous).
- **2ᵉ méthode / BMAD** — 0162.
- **Archi historique** — epic 0034 · 0024 · 0038 (bloqué) ; **0039 E4 shippé** (#81) + périphérie P3 (réserve).

## 🚦 Note — lancement autonome (autre session)

Pour qu'`ezk-product-build` / `ezk-sprint` **tire** une fiche, elle doit être **`ready`**
(gate DoR). **Tête NOW (2026-08-24)** : **20260824061247344** (reliquat refonte, ready) puis **20260823124042842** (board lot 0, ready). ~~0022~~ shipped #105 ; tâche 2 (claim/heartbeat) de 0090 reste dans sa fiche pour une passe ultérieure.

Comportement attendu au lancement (déjà en place — checkpoint « aucune fiche ready »,
0100 point 5) : le builder **s'arrête et propose un grooming** au lieu de démarrer à
vide. Le raffinement demandé par le PO le 2026-07-26 — s'arrêter tant que le nombre de
fiches ready est **sous un seuil de lot** (pas seulement zéro) — est capturé dans **0100**
(ex-mc-0064, renumérotée le 2026-07-26 puis migrée dans la liste unique).
