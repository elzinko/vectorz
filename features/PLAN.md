# PLAN — séquence de travail (vectorz)

> Décidé le **2026-07-26** (roadmap PO). Ceci est l'**ORDRE**, pas la priorité
> (la priorité `P0→P3` reste le *bucket d'importance* dans chaque fiche ; ici c'est
> *quoi d'abord*, vu les dépendances et la valeur visible).
> Source de vérité du **statut** = le front-matter des fiches ; ce fichier est **curé**,
> jamais régénéré. Fiches du backlog méthode préfixées `mc-` (products/mega-city).

## 🧹 Hygiène préalable (rapide)

- `ship` **0059** · **0061** (racine) — livrés par #50, encore marqués « à faire ».
- `audit` **0030** (MVP démo Desktop, in-progress) — le circuit démo tourne depuis le
  2026-07-25, probablement à clore ou re-scoper.

## ▶️ NOW — voir et gérer ses projets

1. **mc-0094** — finir le branchement de l'émetteur (résidu `.supervision` + preuve worktree) · `build`
2. **mc-0095** — faire émettre `ezk-product-builder` (sinon ton vrai manager reste invisible) · `build`
3. **mc-0082** — registre {projet · méthode} : la donnée « quels projets, quelle version » · `build`
4. **0062** — onglet « Projets » : liste par projet, cliquable → activité · `build`
5. **0063** — « ajouter un projet » depuis le Moniteur (dossier + install, 2 modes) · `build`

## ⏭️ NEXT — la méthode se tient + confort

6. **mc-0090** — cohérence de sprint : garde-fou anti-collision (3 worktrees en parallèle vu le 25/07) · `build`
7. **mc-0079** — graver « tout artefact lu par un humain est lisible » · `build`
8. **mc-0091** — mise à plat + glossaire du jargon du backlog · `build`
9. **0022** — Moniteur : afficher heure/durée/historique déjà collectés · `build`
10. **0060** — réparer les deux docs d'install périmés (checklist + guide web UI) · `build`
11. **0041** — cobaye : banc de test rapide pour sécuriser les devs · `build`
12. **mc-0089** — finir l'ordonnancement (brancher PLAN sur l'intake — amorcé par ce fichier) · `build`

## ⏳ LATER — pas maintenant

- ⚠️ **Distribution / publication** — mc-0087 · 0050 · mc-0078 · mc-0096 · mc-0029.
  **NE PAS PUBLIER : pas prêt (décision PO 2026-07-26).** L'ADR de versionnage et la
  question « méthode dans le projet, façon BMAD » s'instruiront quand *le PO* décidera
  d'ouvrir à d'autres.
- **Observabilité qualité** (epic 0051) — 0052/0053/0054/0055/0056/0058 : mesurer la qualité par PR.
- **Articles & promo** — 0043/0049 · mc-0052/0053/0069/0073/0074/0062 · epic mc-0059.
- **Méthode avancée** (mc) — 0064→0068 / 0077 / 0080 / 0088 / 0092 (dont le seuil de lot ready, voir ci-dessous).
- **2ᵉ méthode / BMAD** — mc-0058.
- **Archi historique en pause** — epic 0034 · 0024 · 0038/0039 (bloqués) + périphérie P3 (réserve).

## 🚦 Note — lancement autonome (autre session)

Pour qu'`ezk-product-builder` / `ezk-sprint` **tire** une fiche, elle doit être **`ready`**
(gate DoR). Les fiches du NOW sont encore `idea` → **0 fiche ready aujourd'hui**.

Comportement attendu au lancement (déjà en place — checkpoint « aucune fiche ready »,
mc-0064 point 5) : le builder **s'arrête et propose un grooming** au lieu de démarrer à
vide. Le raffinement demandé par le PO le 2026-07-26 — s'arrêter tant que le nombre de
fiches ready est **sous un seuil de lot** (pas seulement zéro) — est capturé dans **mc-0064**.
