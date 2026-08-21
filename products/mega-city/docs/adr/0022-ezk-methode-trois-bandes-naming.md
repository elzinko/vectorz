# ADR 0022 — Clarifier les 3 bandes + naming (`ezk-pr`, caps, archive)

- Statut : **superseded** — absorbé par [ADR-0020](0020-capacite-partagee-brique-autonome.md)
  le 2026-08-20 (fusion décidée par le PO)
- Date : 2026-07-30

> ⚠️ **Ne pas s'appuyer sur cette fiche.** Sa décision vit désormais dans l'*Amendement du
> 2026-08-20* d'[ADR-0020](0020-capacite-partagee-brique-autonome.md), qui la **révise sur
> deux points** : les **3 bandes deviennent 4** (la bande « Capacités » est scindée en
> *artefacts de méthode* et *outillage techno*), et le **rename est exécuté** au lieu de
> rester une préférence — `ezk-pr-pilot` → `ezk-pr`, `ezk-tdd` → `ezk-dev`.
>
> Cette fiche entrait en **contradiction frontale** avec ADR-0020, qui rejetait ce même
> rename ; c'est ce conflit non tranché qui a fait vivre pendant trois semaines des noms
> fantômes (`ezk-dev`, `ezk-sandbox`) dans `ezk-ezk` et dans les diagrammes. Conservée pour
> l'histoire, jamais supprimée (règle d'immuabilité, ADR-025 §5 racine).
>
> ⚠️ `ezk-sandbox` / `ezk-caps-*` (§3 ci-dessous) reste un nom **réservé, non construit**
> (fiche 0102, `blocked`).
- Amende : [ADR-0009](0009-ezk-pr-pilot-orchestrateur-validation-prs.md) (où vit
  `init` Validation ; nom préféré `ezk-pr`) ·
  [ADR-0020](0020-capacite-partagee-brique-autonome.md) (option A : le rename
  `pr-pilot` → `pr` n'est plus rejeté *en soi* — il reste cosmétique tant que
  non exécuté, mais **souhaité** pour la clarté) ·
  Fiche : [0173](../../../../features/done/0173-ezk-methode-trois-bandes-naming.md)
- Diagramme : [`diagrams/ezk-methode-globale/`](../../diagrams/ezk-methode-globale/)

## Contexte

Deux confusions récurrentes :

1. **`ezk-backlog` vs `ezk-pr(-pilot)`** — on les sent redondants parce que les
   deux parlent de « features livrées » et ont un verbe `ship`. Ce ne sont pas
   les mêmes objets.
2. **`ezk-archive` dans la chaîne des orchestrateurs** — le schéma
   product-builder → sprint → pr → **archive** suggère un 4ᵉ chef de file ;
   or archive est une **hygiène de clôture** (portier check/run), composable,
   pas un enchaînement de livraison.

Par ailleurs : drop de `-pilot` ; préfixe `ezk-caps-*` ; boot d'env isolé =
`ezk-sandbox` ; convention Validation **mieux ancrée à terme** sur
`ezk-backlog init` (scaffold repo) que sur l'orchestrateur de stock — **tant
que non migré, `ezk-pr-pilot init` reste le chemin opérationnel**.

## Décision

### 1. Trois bandes (carte officielle)

| Bande | Définition | Exemples |
|---|---|---|
| Orchestrateurs | enchaînent plusieurs steps ou un stock | product-builder, sprint, **pr** |
| Rôles | métier d'UNE feature | pm, architect, dev, qa, reviewer |
| Capacités | briques composables | backlog, sandbox, preview, commits, **archive** |

### 2. `ezk-backlog` ≠ `ezk-pr` (intersection assumée)

| | backlog | pr |
|---|---|---|
| Objet | fiches markdown (features/bugs) | PRs GitHub ouvertes |
| Question | *quoi* prioriser / groomer / ship | *comment* ordonner, tester, merger le stock |
| Intersection | `ship` / `reconcile` autour du « done » | même verbe, **objets différents** |

Ne pas fusionner les skills. Documenter l'intersection dans les deux SKILL.md.

### 3. Naming

- Nom préféré : **`ezk-pr`** (alias / rename progressif de `ezk-pr-pilot`).
- Capacités : **`ezk-caps-…`** quand utile ; alias court autorisé
  (`ezk-sandbox` ⇔ `ezk-caps-sandbox` ; ex-`ezk-testbed`).
- **`ezk-archive` = capacité**, retirée de la bande Orchestrateurs sur le
  diagramme global.
- **`ezk-backlog init`** absorbe (ou absorbe à terme) l'installation de la
  convention Validation ; `ezk-pr` conserve `plan|run|report|ship`.
  Jusqu'à migration mécanique, `ezk-pr-pilot init` reste fonctionnel et pointe
  la dette.

### 4. Doctrine reprise d'ADR-0020

Une capacité utilisée par ≥ 2 rôles **ne vit pas** dans un orchestrateur.

## Options considérées

- **Fusionner backlog et pr** — rejetée : objets et cycles de vie distincts.
- **Garder archive en orchestrateur** — rejetée : n'enchaîne pas une livraison ;
  c'est un rituel de clôture (ADR-0021).
- **Rename mécanique immédiat de tous les fichiers** — hors scope de cette ADR ;
  la fiche 0173 découpe : d'abord doctrine + diagramme + ezk-ezk, ensuite
  rename code/tests/profils.

## Conséquences

- Plus clair : on sait où ranger un nouveau skill (3 bandes + test ADR-0020).
- Dette : alias `ezk-pr-pilot` jusqu'au rename ; `init` Validation encore sur
  pr-pilot jusqu'à migration vers backlog.
- Après merge : **re-bind / reload des skills locaux** (`~/.claude/skills`) pour
  prendre la carte dans `ezk-ezk`.
