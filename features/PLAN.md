# PLAN — séquence de travail (vectorz)

> Décidé le **2026-07-26** (roadmap PO) ; **mis à jour 2026-07-30** (fiche 0064 —
> liste unique, ids nus, champ `product:`). Ceci est l'**ORDRE**, pas la priorité
> (la priorité `P0→P3` reste le *bucket d'importance* dans chaque fiche ; ici c'est
> *quoi d'abord*, vu les dépendances et la valeur visible).
> Source de vérité du **statut** = le front-matter des fiches ; ce fichier est **curé**,
> jamais régénéré. Une seule liste : `features/` (produit = champ `product:`).

## 🧹 Hygiène préalable (rapide)

- ~~`ship` **0059** · **0061** (vectorz)~~ — fait (vérifié au `reconcile` du 2026-07-26).
- ~~`ship` **0094** · **0095** (mega-city)~~ — fait au `reconcile` 2026-07-30 (#54, #55).
- `audit` **0030** (MVP démo Desktop, in-progress) — le circuit démo tourne depuis le
  2026-07-25, probablement à clore ou re-scoper.

## ▶️ NOW — voir et gérer ses projets

0. ~~**0064** — une seule liste de features (champ `product:`)~~ — shipped #66 / #68
1. ~~**0094** — brancher l'émetteur sur vectorz~~ — shipped #54
2. ~~**0095** — faire émettre `ezk-product-builder`~~ — shipped #55
3. ~~**0082** — registre {projet · méthode}~~ — shipped #70
4. **0168** — run orphelin = verrou sans clé (bouton abandon siège + erreur actionnable) · `build` · **ready 2026-07-30** · P0 dogfood (#63 avec 0105)
5. **0062** — onglet « Projets » : liste par projet, cliquable → activité · `build`
6. **0063** — « ajouter un projet » depuis le Moniteur (dossier + install, 2 modes) · `build`

## ⏭️ NEXT — la méthode se tient + confort

7. **0090** — cohérence de sprint : garde-fou anti-collision (3 worktrees en parallèle vu le 25/07) · `build`
8. **0079** — graver « tout artefact lu par un humain est lisible » · `build`
9. **0091** — mise à plat + glossaire du jargon du backlog · `build`
10. **0022** — Moniteur : afficher heure/durée/historique déjà collectés · `build`
11. **0060** — réparer les deux docs d'install périmés (checklist + guide web UI) · `build`
12. **0041** — cobaye : banc de test rapide pour sécuriser les devs · `build`
13. **0089** — finir l'ordonnancement (brancher PLAN sur l'intake — amorcé par ce fichier) · `build`
14. **0149** — `composes:` : rendre la composition inter-skills mécanique (remontée P2→P1
    le 2026-07-26) · `build` *(à faire avant 0102, sinon ses liens naissent en prose)*
15. **0102** — `ezk-testbed` : brique « démarrer un env de test » (PR · branche · local)
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
- **Archi historique en pause** — epic 0034 · 0024 · 0038/0039 (bloqués) + périphérie P3 (réserve).

## 🚦 Note — lancement autonome (autre session)

Pour qu'`ezk-product-builder` / `ezk-sprint` **tire** une fiche, elle doit être **`ready`**
(gate DoR). Après 0082 shipped (#70), la prochaine tête du NOW est **0168**
(**ready 2026-07-30** — P0 dogfood / run orphelin). Puis **0062** (idea — groom/ready).

Comportement attendu au lancement (déjà en place — checkpoint « aucune fiche ready »,
0100 point 5) : le builder **s'arrête et propose un grooming** au lieu de démarrer à
vide. Le raffinement demandé par le PO le 2026-07-26 — s'arrêter tant que le nombre de
fiches ready est **sous un seuil de lot** (pas seulement zéro) — est capturé dans **0100**
(ex-mc-0064, renumérotée le 2026-07-26 puis migrée dans la liste unique).
