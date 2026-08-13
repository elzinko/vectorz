# ADR 0028 — Product-builder : auto-groom vers la DoR + `--check-ready`, révise A5 d'ADR-0016

**Statut :** Accepté
**Date :** 2026-08-13
**Deciders :** PO (opérateur) — décision prise en session product-builder

## Contexte

[ADR-0016](0016-rituels-scrum-cycle-de-vie-backlog.md) a fait du gate `ready` (DoR) un
**gate bloquant** et de son invariant **A5** un **STOP humain** : quand aucune fiche n'est
tirable, `ezk-product-builder --checkpoints auto` **pré-remplit** les DoR mais **s'arrête et
attend que l'humain tamponne** — *« le gate ready n'est jamais auto-tamponné »*.

Douleur constatée (session 2026-08-13) : sur un backlog où **rien n'est `ready`** (cas
courant), le mode `auto` **cale immédiatement** sans rien construire. Le PO fournit les
**grands axes** d'une fiche et veut que la méthode soit **opérationnelle ensuite** — pas
qu'elle s'arrête à chaque fiche non encore rédigée `ready`.

**Reframe qui débloque.** Le gate humain mélange deux vérifications :
- **(a) DoR complète** — la fiche est-elle *assez claire pour être construite* ? (problème /
  valeur / critères, dépendances accessibles). **Mécanique, délégable à des agents.**
- **(b) Vaut-elle le coup** — faut-il construire *ça*, *maintenant*, cette direction produit ?
  **Décision humaine (PO).**

Le Goodhart que A5 prévenait, c'est **(b)** — la méthode qui se convainc que son travail vaut
le coup. Or **pré-autoriser un lot depuis le backlog tranche déjà (b)** : il ne reste que (a),
que la méthode peut faire seule.

## Décision

En `--checkpoints auto`, `ezk-product-builder` **groome désormais la fiche de tête vers la
DoR de façon autonome** (délègue `product-brainstorming` pour dériver problème/valeur/critères
depuis les grands axes, `ezk-architect` pour la structure, `ezk-tdd` pour un spike de
faisabilité, `ezk-pm` pour les micro-arbitrages PO du périmètre pré-autorisé) — au lieu de
s'arrêter à vide. Le tampon final est réglé par une **nouvelle option `--check-ready true|false`** :

| | Tampon `ready` | Garde-fou |
|---|---|---|
| **`--check-ready true` (DÉFAUT)** | auto-groom **puis STOP humain** pour tamponner | A5 **préservé** par défaut |
| **`--check-ready false`** | le builder **auto-tamponne** ready | **concurrence indépendante d'`ezk-pm`** (jamais un auto-tampon solo) |

**Invariants ajoutés (garde-fous anti-Goodhart) :**
1. **Plancher outcome-testable.** Une fiche doit contenir (ou permettre de dériver) **au moins
   un critère de succès vérifiable**. En dessous, on **n'invente pas** la direction produit →
   **skip + journal + surface**.
2. **Auto-tampon jamais solo.** En `--check-ready false`, `ready` n'est posé que si `ezk-pm`
   (décideur indépendant) **concourt** que la DoR est atteinte. Le builder ne se rubber-stampe pas.
3. **Blocage réel → skip.** Dépendance externe qui ne répond pas / inaccessible, conflit
   stratégique, ou décision humaine requise ⇒ **skip vers la fiche suivante + journal**. Si
   **tout** le stock tirable skippe ⇒ **STOP humain** (« rien de constructible, voici pourquoi »).
4. **Les 4 STOP humains restent absolus** (irréversible/sortant · hausse de budget tokens ·
   direction produit sur backlog vide · exigences contradictoires) — l'auto-ready ne les
   court-circuite jamais.

**Ceci révise A5 sans l'abroger** : en `--check-ready true` (défaut) le gate humain demeure ;
`false` est une **soupape PO explicite** adossée à la concurrence `ezk-pm`.

## Options considérées

### Option A — Garder A5 tel quel (STOP humain systématique)
**Pour :** zéro risque de Goodhart. **Contre :** cale le mode `auto` à chaque fiche non-ready ;
la méthode n'est pas opérationnelle sur de grands axes — la douleur exprimée.

### Option B — Auto-ready plein (le builder tamponne toujours seul)
**Pour :** autonomie maximale. **Contre :** ré-ouvre le Goodhart (la méthode juge seule que
son travail vaut le coup) ; supprime tout contrôle humain même quand il le faudrait.

### Option C — Hybride `--check-ready` + concurrence `ezk-pm` + plancher (RETENUE)
**Pour :** sépare (a) mécanique de (b) humain ; défaut prudent (`true`) ; autonomie opt-in
(`false`) bornée par un décideur indépendant et un plancher testable ; le skip évite la boucle
folle. **Contre :** dépend de la qualité de jugement d'`ezk-pm` — mitigé par le plancher.

## Trade-off

Le risque résiduel se déplace du **tampon** (réglé par `ezk-pm`) vers le **grooming** : sur des
axes trop minces, la machine pourrait dériver une DoR *plausible mais fausse*. Le **plancher
outcome-testable** est la digue : sans critère vérifiable dérivable, on skippe plutôt que
d'inventer. Le PO garde le contrôle de **(b)** par la sélection du lot ; il délègue **(a)**.

## Conséquences

- ✅ Plus d'arrêt « aucune fiche ready » à vide : la méthode avance sur de **grands axes**.
- ✅ Le PO pilote par **sélection de lot** + `--check-ready`, pas par tamponnage fiche à fiche.
- ⚠️ Nouvelle dépendance forte au jugement d'`ezk-pm` (auto-tampon) et du grooming délégué —
  bornée par le plancher testable et le skip-plutôt-qu'inventer.
- 🔁 À revisiter si des fiches auto-readyées produisent des builds hors-cible (signal Goodhart) →
  durcir le plancher ou re-basculer le défaut.

## Action Items

1. [ ] `ezk-product-builder/SKILL.md` : option `--check-ready`, boucle d'auto-groom déléguée,
   skip+journal, plancher outcome-testable, concurrence `ezk-pm` pour l'auto-tampon.
2. [ ] Note de révision dans [ADR-0016](0016-rituels-scrum-cycle-de-vie-backlog.md) (A5).
3. [ ] Fiche backlog de suivi (implémentation + éventuel durcissement du plancher).
