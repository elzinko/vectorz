# En clair : où en est le backlog

> **Carte lisible** (fiche 0091) — relis en ≤ 2 minutes l'état du stock, des PR ouvertes
> et de la séquence décidée. Index détaillé : [`features/BACKLOG.md`](../features/BACKLOG.md).
> Ordre de travail : [`features/PLAN.md`](../features/PLAN.md). Glossaire :
> [`glossaire-jargon-ezk.md`](glossaire-jargon-ezk.md).
>
> **Instantané** : 2026-08-05 · régénérer les compteurs avec
> `bash products/mega-city/bin/regen-backlog.sh .`

Le monorepo porte **178 fiches** (89 livrées, 89 actives). La tête du plan est **0091**
(cette carte + glossaire) ; juste après viennent **0022** (historique Moniteur) et **0060**
(docs d'install périmés). Deux fiches sont **prêtes à construire** dès maintenant :
**0041** (banc de test cobaye) et **0044** (mesureur d'outcomes).

---

## PR ouvertes

| PR | Branche | En attente de |
|---|---|---|
| [#88](https://github.com/elzinko/vectorz/pull/88) | `docs/features-0178-0179-mega-city` | Revue + merge (idées 0178 checks / 0179 incubation skills) |

Aucune PR de feature bloquante sur le flux NOW.

---

## Séquence PLAN — prochaines cartes

| # | Intention (une ligne) | Statut | Prêt ? |
|---|---|---|---|
| **0091** | Carte + glossaire du jargon backlog | 🔴 todo | grooming en cours |
| **0022** | Moniteur : heure / durée / historique déjà collectés | 🔴 todo | non — à groomer |
| **0060** | Réparer les deux docs d'install périmés | 🔴 todo | non — à groomer |
| **0041** | Banc de test rapide (cobaye) | 🔴 todo | ✅ ready |
| **0044** | Mesureur d'outcomes métier (MVP A) | 🔴 todo | ✅ ready |

Horizon **NOW** (voir projets / Moniteur) : entièrement livré (#95–#99). Le fil reprend
en **NEXT** avec 0091.

Commande utile : `pnpm --dir products/mega-city plan:head` → 1re fiche tirable + têtes
bloquées avant elle dans l'ordre du plan.

---

## Stock actif — compteurs

| Métrique | Valeur |
|---|---|
| Total fiches | 178 |
| 💡 Idées (non groomées) | 42 |
| 🔴 À faire (`todo`) | 39 — dont **2 prêtes** |
| 🟠 En cours | 3 (0030 démo Desktop · 0164 vz-product-builder · 0088 archive) |
| ⛔ Bloquées | 5 |
| ✅ Livrées (`done/`) | 89 |
| 🧭 Épics | 3 |
| Création médiane des `todo` | 2026-07-15 |

---

## Trois fichiers à connaître

| Fichier | Rôle en une phrase |
|---|---|
| [`features/PLAN.md`](../features/PLAN.md) | **L'ordre** décidé (NOW / NEXT / LATER) — curé, jamais régénéré |
| [`features/BACKLOG.md`](../features/BACKLOG.md) | **L'index** auto-généré depuis le front-matter de chaque fiche |
| [`features/[NNNN]-slug.md`](../features/) | **La fiche** — source de vérité du statut, critères, PR |

Priorité (`P0`→`P3`) = importance relative. **PLAN** = quoi d'abord. Une fiche **prête**
(`ready:` daté) = assez cadrée pour être construite sans revenir vers toi.

---

## En cours — ce qui bouge

| # | Titre court | Produit |
|---|---|---|
| 0030 | MVP démo Desktop (Moniteur pur) | vectorz |
| 0164 | vz-product-builder autonome | vectorz |
| 0088 | ezk-archive — ne pas re-vérifier ce que l'appelant a déjà fait | mega-city |

---

## Hygiène ouverte (PLAN)

- **0030** (démo Desktop, in-progress) — probablement à clore ou re-scoper.
- Distribution / publication (**0087**, **0050**, …) — **NE PAS PUBLIER** (décision PO 2026-07-26).
