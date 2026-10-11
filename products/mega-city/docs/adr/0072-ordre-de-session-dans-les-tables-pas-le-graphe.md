# ADR 0072 — L'ordre de session vit dans les tables « Et maintenant ? », pas dans le graphe

**Statut :** Accepté (grooming + build, 2026-10-11)
**Date :** 2026-10-11
**Deciders :** PO (Thomas) ; conception tranchée au grooming (`engineering:architecture`, 2026-10-10)
**Fiche :** [`20261010091118580`](../../../../features/done/20261010091118580_boussole-session-quoi-faire-maintenant.md) (« Boussole de session `ezk-now` »)
**Compose :** [`src/core/now.ts`](../../src/core/now.ts) (`suggestNow`, pur) · [`bin/ezk-now.ts`](../../bin/ezk-now.ts) (bord I/O) · s'appuie sur [ADR-0040](0040-modele-fichiers-ezk-compile-schema-valide.md) (graphe compilé, verbes fermés) et la règle [`next-step-affordance`](../../rules/documentation-guidelines/next-step-affordance.md) (pas de moteur de menu)

## En clair

La boussole `ezk now` répond « que faire maintenant ? » en lisant l'état du dépôt (sprint ouvert ?
fiche tirable ? tête à groomer ?) et en rendant 1 à 3 suites. La question : **d'où vient l'ordre
« après X, fais Y » ?** Réponse : des **tables « Et maintenant ? »** que les skills portent déjà
(colonne `quand` = l'état), **pas** du graphe compilé.

## Décision

L'ordre de session (la succession « après `ready` → `next` », « sprint ouvert → le finir ») vit
dans les tables « Et maintenant ? » des skills. Le **graphe compilé** (ADR-0040) garde un jeu de
verbes **fermé et structurel** (`compose`, `applique`, `convoque`, `utilise`, `est-verifie-par`) ;
il **n'a aucun verbe de succession** et ne doit pas en avoir.

`ezk now` (`suggestNow`) **encode les transitions clés pilotées par l'état du dépôt** — le POC couvre
l'état que les traces du dépôt donnent toujours (SPRINT.md, tête du plan via `plan-lot`, dernier
commit). Ce n'est pas un moteur de menu (règle next-step-affordance) : une petite table état → suite, aucune invention,
bornée aux transitions des 2 skills qui ont déjà la table (`ezk-backlog`, `ezk-sprint`).

## Pourquoi pas le graphe

- Le graphe est **structurel** (ce qui compose quoi), pas **temporel** (quoi après quoi).
- L'ordre est **conditionnel à l'état** (« après `ready` → `next` » ne vaut que si la fiche est
  prête), ce qu'une arête statique ne capte pas mais que la colonne `quand` d'une table capte.
- Ajouter un verbe `succède` au graphe ouvrirait un jeu de verbes qu'ADR-0040 a fermé exprès.

## Conséquences

- `ezk now` lit l'état + les transitions encodées ; le graphe reste purement structurel.
- **Éligibilité de la tête** : `ezk now` reflète `plan-lot` (ready, actif, non-épic, **sans drapeau
  `blocked:`**), pas `plan-head` (qui ignore `blocked:`) — on ne propose jamais de développer une
  fiche parquée.
- **Généralisation différée** : couvrir plus de skills attend que les tables soient généralisées via
  le socle « citer un bundle » ([`20261008154803440`](../../../../features/done/20261008154803440_consommateur-cite-un-bundle.md)).
- Décision **susceptible d'être contestée** (quelqu'un voudra un verbe `succède`) : cet ADR est le
  point de référence pour refuser.
