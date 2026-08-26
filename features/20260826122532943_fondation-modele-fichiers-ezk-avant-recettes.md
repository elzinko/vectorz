---
id: "20260826122532943"
title: "Fondation — le modèle de fichiers ezk : compilé, schématisé, validé (avant les recettes)"
type: feature
priority: P0
product: mega-city
version:
epic:
depends: []
labels: [architecture, format, moteur, fondation, bmad]
status: todo
ready:
pr:
created: 2026-08-26
---

## En clair

Avant d'étendre la méthode vers les **recettes**, on stabilise le **tronc** : le **modèle des
fichiers ezk**. Aujourd'hui ce modèle est à moitié posé. Le **schéma** typé existe
(`domain.ts`), mais il n'y a **pas d'instance compilée**, **pas de schéma qui refuse** un fichier
malformé, et le **versionnement** (Skema) ne couvre qu'une seule skill.

Cette fiche **cadre** la fondation. Elle **regroupe** les fiches déjà écrites sur le sujet, elle
**appelle un ADR**
([ADR-0040](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md))
pour trancher les choix porteurs, et elle **conditionne** les recettes à **consommer** ce modèle
au lieu de le réinventer.

> **Chapeau / cadrage.** Cette fiche ne réécrit pas les fiches du cluster : elle les **pointe**,
> les **séquence**, et fixe le **P0**. Le *comment* se tranche dans l'ADR.

## Le tronc est déjà posé (ne pas rouvrir)

- **[ADR-0001](../products/mega-city/docs/adr/0001-monorepo-composable-coeur-deterministe.md)** —
  cœur déterministe, le LLM ne travaille qu'aux bords. Le **benchmark BMAD** (2026-08-25) le
  désigne comme le meilleur pari des deux méthodes. **On construit dessus.**
- **[ADR-0039](../products/mega-city/docs/adr/0039-trois-etages-moteur-methode-branchements-plugin.md)** —
  trois étages (moteur / méthode / branchements), rangés dans **un** YAML validé en complétude.
- **`products/mega-city/docs/domain.ts`** — le **schéma typé** (Rule / Bundle / Skill / Agent /
  Profile) existe **déjà**. Il manque son **instance**.

## Le vrai P0 = trois trous couplés, un seul objet

1. **Le graphe est dérivé, jamais stocké.** Cinq mots pour dire « X est lié à Y » (`composes`,
   `enforcements`, `competences`, `roles`, `interactions`), plus ~600 liens de **prose** qui
   cassent à chaque `ship`. Porté par
   **[357](20260821204737357_cabler-la-methode-modele-compile.md)**.
2. **Aucun schéma qui *échoue*.** Un front-matter malformé passe en **warning**, jamais en rouge.
   Porté par **[652](20260823121712652_modele-statut-kanban-schema-valide.md)** + le **sliver
   validateur** de **[0186](0186-skema-versioning-migrations-skills-deployees.md)** + ma fiche
   **[281](20260826112620281_schema-markdown-declaratif-validateur.md)** (à fusionner ici).
3. **Skema (versioning + migrations) ne couvre qu'`ezk-backlog`.** Porté par
   **[0186](0186-skema-versioning-migrations-skills-deployees.md)**.

Les trois = **le modèle des fichiers ezk**, compilé + schématisé + versionné + validé. C'est
mot pour mot la « structuration des fichiers markdown et le fonctionnement global d'ezk ».

## Pourquoi AVANT les recettes

`ezk-chef` (fiche
[chapeau recette](20260824185422122_recette-artefact-premier-rang-et-gardien.md)) va instancier
**le même motif une 4ᵉ fois** — une famille d'artefacts + un index + un gardien + une validation —
**à la main**. Sans modèle compilé ni schéma déclaré, on **grave un 6ᵉ dialecte de lien** et un
**3ᵉ validateur maison**, et le format de recette qu'on veut « faire évoluer sans rien casser »
n'a **aucun schéma vérifiable** contre lequel évoluer.

**Décision de séquence :** la recette devient le **premier consommateur** du modèle. `ezk-chef`
et l'extraction ([794](20260824122629794_ezk-extract-capitaliser-feature-en-recette.md))
**attendent** que la fondation ait livré, au minimum, le **graphe compilé** et le **contrat de
schéma**.

## Périmètre

**Dans le P0**
- Compiler le graphe en **une instance typée** (pas un Mermaid) — la 1ʳᵉ livraison, plus fort levier.
- Unifier les **5 vocabulaires de lien** (ou justifier qu'ils restent distincts).
- Références structurelles par **id**, plus par chemin markdown.
- Un **schéma déclaré par famille** + un **validateur qui échoue** (préflight + CI).
- Généraliser **Skema** au-delà d'`ezk-backlog` (émission / registre de bind / consommation).
- Le modèle des **4 métas** (`schema` / `generated_by` / `version` / sprint), cf. 652.

**Hors P0 (reste en P2 — « on verra ensuite »)**
- Les **affordances BMAD** : le « et maintenant ? »
  ([next-step](20260825160456259_next-step-affordance-commandes-suivantes.md)) et
  l'[elicitation](20260825161522791_elicitation-raffinement-structure-groom.md). Utile, mais UX,
  pas fondation.
- La **construction** de `ezk-chef` et de l'extraction (elles consomment, elles ne fondent pas).

## Le cluster que cette fiche cadre

| Fiche | Rôle dans la fondation | Statut aujourd'hui |
|---|---|---|
| [357](20260821204737357_cabler-la-methode-modele-compile.md) | graphe compilé + unifier les liens (+ BMAD) | P1 idea — **l'ancre** |
| [0186](0186-skema-versioning-migrations-skills-deployees.md) | Skema généralisé + sliver validateur | P2 idea |
| [652](20260823121712652_modele-statut-kanban-schema-valide.md) | schéma de statut + 4 métas | P1 todo |
| [281](20260826112620281_schema-markdown-declaratif-validateur.md) | validateur de conformité | P3 — **fusionner ici** |

*(357 reste rattachée à son épic
[carte fidèle](20260821163346487_carte-methode-fidele-et-revue.md) ; la carte est **un**
consommateur du modèle, comme les recettes.)*

## La décision d'architecture → ADR-0040

Le *comment* se tranche dans
**[ADR-0040 — Le modèle de fichiers ezk : liens compilés, schéma validé, versionné](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md)**
(**panel tenu + ratifié PO le 2026-08-26** — *GO-avec-amendements*, statut **accepté**). Quatre
décisions couplées : les **liens** (compiler vs manifeste vs statu quo) · la **validation** (schéma
qui échoue) · le **versionnement** (granularité Skema) · les **4 métas**.

> **MAJ 2026-08-26 — panel `ezk-architect` tenu.** Verdict **unanime : GO-avec-amendements**
> (3 lentilles : architecte · reviewer adverse · dev). **5 amendements**, dont une décision **D5**
> nouvelle (où vit le graphe compilé + préflight en **lecture seule**). Les gros points : **ne rien
> renommer sur disque** (unifier dans le compilateur — 162 refs code mesurées), **schéma dérivé de
> `domain.ts`**, **validateur en warning avant bloquant**, **métas optionnelles**. Capture :
> [`docs/captures/2026-08-26-panel-ezk-architect-adr-0040.md`](../docs/captures/2026-08-26-panel-ezk-architect-adr-0040.md).
> **Ratifié PO le 2026-08-26 → ADR accepté.** Construction ouverte : **graphe compilé en premier**
> (fiche [357](20260821204737357_cabler-la-methode-modele-compile.md)).

## Critères d'acceptation

- [x] **ADR-0040** validé en panel `ezk-architect` + **ratifié PO** (2026-08-26) — D1–D5 tranchées, conséquences écrites.
- [ ] **Graphe compilé** : un `pnpm` émet le graphe de la méthode en **objet typé** ; la webapp lit
      **ça**, plus aucune arête peinte à la main (dogfood de 357).
- [ ] **Vocabulaire de lien** unifié (ou distinction justifiée) ; références structurelles par **id**.
- [ ] **Validateur qui échoue** : un front-matter hors-schéma **bloque** (préflight + CI), testé
      rouge→vert ; **absorbe 281** et la validation de 652.
- [ ] **Skema généralisé** : ≥ **2 artefacts** (dont un autre qu'`ezk-backlog`) portent `VERSION` +
      `migrations/` ; le `bind` écrit un manifeste versionné (0186).
- [ ] **Frontière recettes écrite** : `ezk-chef` / extraction **consomment** le modèle (le schéma
      de recette = une famille du validateur ; les liens de recette = des ids du graphe).
- [ ] **281 fusionnée** (retirée du backlog actif, historique dans git) ou re-scopée en sliver de 0186.

## Comment vérifier

```bash
# Après construction : interroger le graphe sans grep —
#   « qui applique la règle clean-code/no-dead-code ? » → réponse par le modèle compilé.
# Sabotage : un front-matter hors-schéma → la gate ÉCHOUE (rouge), plus un simple warning.
```

## Notes

- Origine : échange PO du **2026-08-26** — « prendre du recul sur la structuration des fichiers
  markdown et le fonctionnement global d'ezk, informé par le benchmark BMAD, **avant** les recettes ».
- Benchmark : `products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md` — verdict « garde le
  socle, vole 3 affordances » ; le **graphe compilé** est le **seul** point-modèle où BMAD gagne.
- **Ne pas rouvrir** ADR-0001 / ADR-0039 : la fondation **construit dessus**.
- Doctrine « pas d'outillage sans preuve dans ≥ 2 projets » (ADR-0013) = **question, pas interdit**
  (doctrine PO 2026-08-21) — ce chantier sert la méthode entière, il n'attend pas un 2ᵉ projet.
