# PLAN — séquence de travail (vectorz)

> Décidé le **2026-07-26** (roadmap PO) ; **mis à jour 2026-07-30** (fiche 0064 —
> liste unique, ids nus, champ `product:`). Ceci est l'**ORDRE**, pas la priorité
> (la priorité `P0→P3` reste le *bucket d'importance* dans chaque fiche ; ici c'est
> *quoi d'abord*, vu les dépendances et la valeur visible).
> **NOW** = les prochaines N cartes (horizon court) — pas une encyclopédie du stock.
> Source de vérité du **statut** = le front-matter des fiches ; ce fichier est **curé**,
> jamais régénéré. Une seule liste : `features/` (produit = champ `product:`).
> Index généré : [`BACKLOG.md`](BACKLOG.md) · guide : [`README.md`](README.md).

## 🧹 Hygiène préalable (rapide)

- ~~**P0** `build` **0181** — méthode ezk : Opus 4.8 (+ spare sonnet) + restitutions
  « En clair »~~ — shipped #92.
- ~~**P0** `build` **0176** — interdit `git config --global user.*` pour l’identité
  agent ; commits cop1 = local / one-shot only ([#86](https://github.com/elzinko/vectorz/issues/86))~~ — shipped #89.
- ~~`ship` **0059** · **0061** (vectorz)~~ — fait (vérifié au `reconcile` du 2026-07-26).
- ~~`ship` **0094** · **0095** (mega-city)~~ — fait au `reconcile` 2026-07-30 (#54, #55).
- `audit` **0030** (MVP démo Desktop, in-progress) — le circuit démo tourne depuis le
  2026-07-25, probablement à clore ou re-scoper.
- **0182** — E4 bis : docs vivants post-BMAD (hygiène P3, complément 0039) · `build`

## ▶️ NOW — voir et gérer ses projets

0. ~~**0064** — une seule liste de features (champ `product:`)~~ — shipped #66 / #68
1. ~~**0094** — brancher l'émetteur sur vectorz~~ — shipped #54
2. ~~**0095** — faire émettre `ezk-product-builder`~~ — shipped #55
3. ~~**0082** — registre {projet · méthode}~~ — shipped #70
4. ~~**0168** — run orphelin = verrou sans clé (bouton abandon siège + erreur actionnable)~~ — shipped #76
5. ~~**0181** — Opus 4.8 + restitutions lisibles~~ — shipped #92
6. ~~**0062** — onglet « Projets » : liste par projet, cliquable → activité · `ship`~~ — shipped #95
7. ~~**0063** — « ajouter un projet » depuis le Moniteur (dossier + install, 2 modes) · `ship`~~ — shipped #97

## ⏭️ NEXT — la méthode se tient + confort

8. ~~**0090** — cohérence de sprint : garde-fou d'ouverture `ezk-start` (tâche 1 POC) · `ship`~~ — shipped #99
9. ~~**0079** — graver « tout artefact lu par un humain est lisible »~~ — shipped #74
10. **0091** — mise à plat + glossaire du jargon du backlog · `build`
11. **0022** — Moniteur : afficher heure/durée/historique déjà collectés · `build`
12. **0060** — réparer les deux docs d'install périmés (checklist + guide web UI) · `build`
13. **0041** — cobaye : banc de test rapide pour sécuriser les devs · `build`
14. **0089** — finir l'ordonnancement (brancher PLAN sur l'intake — amorcé par ce fichier) · `build`
15. **0149** — `composes:` : rendre la composition inter-skills mécanique (remontée P2→P1
    le 2026-07-26) · `build` *(à faire avant 0102, sinon ses liens naissent en prose)*
16. **0102** — `ezk-testbed` : brique « démarrer un env de test » (PR · branche · local)
    + ADR-0020 · `build` *(attend le dogfood samplerz `make preview-pr`, son repo)*

## ⏳ LATER — pas maintenant

- ⚠️ **Distribution / publication** — 0087 · 0050 · 0078 · 0096 · 0134.
  **NE PAS PUBLIER : pas prêt (décision PO 2026-07-26).** L'ADR de versionnage et la
  question « méthode dans le projet, façon BMAD » s'instruiront quand *le PO* décidera
  d'ouvrir à d'autres.
- **Observabilité qualité** (epic 0051) — 0052/0053/0054/0055/0056/0058 : mesurer la qualité par PR.
- **Articles & promo** — 0043/0049 · 0156/0053/0069/0073/0074/0062 · epic 0163.
- **Méthode avancée** — 0065→0068 / 0077 / 0080 / 0088 / 0092 / 0100 (dont le seuil de lot ready, voir ci-dessous).
- **2ᵉ méthode / BMAD** — 0162.
- **Archi historique** — epic 0034 · 0024 · 0038 (bloqué) ; **0039 E4 shippé** (#81) + périphérie P3 (réserve).

## 🚦 Note — lancement autonome (autre session)

Pour qu'`ezk-product-builder` / `ezk-sprint` **tire** une fiche, elle doit être **`ready`**
(gate DoR). **Tête NOW** : **0091** (glossaire backlog) — **0090** tâche 1 (`ezk-start`) shipped #99 ; tâche 2 (claim/heartbeat) reste dans la fiche pour une passe ultérieure.

Comportement attendu au lancement (déjà en place — checkpoint « aucune fiche ready »,
0100 point 5) : le builder **s'arrête et propose un grooming** au lieu de démarrer à
vide. Le raffinement demandé par le PO le 2026-07-26 — s'arrêter tant que le nombre de
fiches ready est **sous un seuil de lot** (pas seulement zéro) — est capturé dans **0100**
(ex-mc-0064, renumérotée le 2026-07-26 puis migrée dans la liste unique).
