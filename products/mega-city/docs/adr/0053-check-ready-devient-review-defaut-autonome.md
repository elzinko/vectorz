# ADR 0053 — `--check-ready` devient `--review`, défaut autonome (révise le défaut d'ADR-0028)

**Statut :** Accepté
**Date :** 2026-09-19
**Deciders :** PO (opérateur) — décision prise en session brainstorming produit

## En clair

Le flag `--check-ready` mentait. Son nom laissait croire à une vérification, alors qu'il
réglait *qui tamponne `ready`* après un grooming automatique. On le renomme `--review`, un
interrupteur nu qui dit son geste : « arrête-toi après le groom, je regarde ». Et on bascule le
défaut : sans rien taper, `ezk-product-build` tourne en tout-autonome (il groome, tamponne
`ready` avec `ezk-pm` en second regard, enchaîne). L'arrêt humain devient un opt-in, plus le
défaut.

## Contexte

[ADR-0028](0028-product-builder-auto-groom-ready.md) a introduit l'auto-groom vers la DoR et
l'option `--check-ready true|false` pour régler qui pose le tampon `ready` :

- `true` (défaut) : auto-groom **puis STOP humain** pour tamponner (A5 préservé) ;
- `false` : le builder auto-tamponne, sur concurrence indépendante d'`ezk-pm`.

Deux douleurs constatées (session 2026-09-19).

**1. Le nom trompe.** `--check-ready` se lit comme un prédicat en lecture seule (« est-elle
prête ? oui/non »). En réalité il déclenche le grooming puis règle le tampon. Le nom a fabriqué
un faux modèle mental jusque chez le PO qui l'avait commandé. Un flag doit faire ce que son nom
annonce.

**2. Le défaut ne colle pas à l'usage.** Le PO fait tourner le builder en `--check-ready false`
en pratique (sessions dogfooding 0183/0184, product-build 4-sprints). Le défaut `true` (STOP
humain à chaque tampon) l'oblige à écrire `false` à chaque lancement autonome. Le défaut devrait
être le cas courant.

## Décision

**1. Renommer `--check-ready` en `--review`, interrupteur nu (pas de valeur).**

- `--review` **présent** = après auto-groom, **STOP** : le PO regarde la fiche groomée et
  tamponne `ready` (`ezk-backlog ready <id>`). C'est l'ancien `--check-ready true`.
- `--review` **absent** = pas d'arrêt : le builder tamponne `ready` **sur concurrence `ezk-pm`**
  et enchaîne. C'est l'ancien `--check-ready false`.

Le nom dit le geste humain (relire) et non l'action machine (groomer), qui a toujours lieu de
toute façon.

**2. Basculer le défaut en autonome.** Le défaut passe de « STOP humain » à « pas d'arrêt » :
l'absence de `--review` **est** le nouveau défaut.

**3. Rétro-compat.** `--check-ready true|false` **reste accepté** pour lire les commandes
héritées : `true` → `--review`, `false` → absence de `--review`. On **écrit** `--review` pour
toute nouvelle commande. Même politique que `--checkpoints` → `--mode` et `once` → `--once`.

| tu tapes | tampon `ready` | ancien équivalent |
|---|---|---|
| *(rien)* — **nouveau défaut** | `ezk-pm` cosigne, pas d'arrêt | `--check-ready false` |
| `--review` | STOP humain | `--check-ready true` |

**Le garde-fou anti-Goodhart est conservé.** Le défaut autonome n'est **pas** un auto-tampon
solo : `ready` n'est posé que si `ezk-pm` (décideur indépendant) concourt que la DoR est
atteinte. Le plancher outcome-testable, le skip-plutôt-qu'inventer et les 4 STOP humains
d'ADR-0028 restent en vigueur, inchangés.

## Ce que ça révise de l'A5 (ADR-0016)

ADR-0028 avait préservé A5 **par le défaut** (`--check-ready true` = le gate humain demeure par
défaut). Cette ADR **retire cette protection par défaut** : le gate humain d'A5 devient un opt-in
(`--review`), plus le défaut.

C'est un affaiblissement assumé, borné par trois choses :

- `ezk-pm` cosigne toujours le tampon — jamais la machine seule ;
- le PO garde le contrôle de *quoi* construire par la **sélection du lot** (décision (b)
  d'ADR-0028), que rien ici ne touche ;
- `--review` rend le gate humain à un seul geste.

## Options considérées

### Option A — Garder `--check-ready true|false` tel quel
**Pour :** zéro changement. **Contre :** le nom continue de tromper ; le défaut oblige à taper
`false` pour l'usage courant. La double douleur demeure.

### Option B — Renommer en `--groom` (proposition initiale du PO)
**Pour :** très court. **Contre :** `--groom` se lit « fais le grooming », or le grooming se fait
toujours ; le flag règle en fait l'**arrêt de relecture**. On recréerait le mensonge de nom
qu'on corrige.

### Option C — `--review` interrupteur nu + défaut autonome + rétro-compat (RETENUE)
**Pour :** le nom dit le geste (relire) ; un seul gate ; défaut = cas courant ; les commandes
héritées ne cassent pas ; garde-fou `ezk-pm` intact. **Contre :** casse la symétrie de forme avec
les flags à valeur (`--mode manuel|auto`) — accepté au nom de la simplicité de frappe.

## Trade-off

On échange la **protection A5 par défaut** contre l'**autonomie par défaut**. Le risque (un build
sur une fiche mal groomée) reste tenu par `ezk-pm` + le plancher outcome-testable + le skip. Le PO
peut re-serrer d'un mot (`--review`) sans changer de configuration.

## Conséquences

- ✅ Le flag fait ce que son nom dit ; plus de faux modèle mental.
- ✅ Le lancement autonome courant se tape sans flag.
- ✅ Le contrôle humain reste à un geste (`--review`), et la sélection du lot reste au PO.
- ⚠️ A5 n'est plus protégé **par défaut** — dépendance accrue à `ezk-pm` sur le tampon.
- 🔁 À revisiter si des builds hors-cible apparaissent (signal Goodhart) → re-serrer le défaut ou
  durcir le plancher, comme déjà prévu par ADR-0028.

## Action Items

1. [ ] `ezk-product-build/SKILL.md` : `--review` partout (hint, usage, tables, § dédié), défaut
   basculé, `--check-ready` gardé en alias hérité.
2. [ ] Notes de révision dans [ADR-0028](0028-product-builder-auto-groom-ready.md) et
   [ADR-0016](0016-rituels-scrum-cycle-de-vie-backlog.md) (A5).
3. [ ] Fiche backlog de suivi : complétion dynamique des paramètres (surface à trancher :
   CLI `ezk` vs `/slash`).
