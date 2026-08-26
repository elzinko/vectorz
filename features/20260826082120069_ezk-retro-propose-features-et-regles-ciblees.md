---
id: "20260826082120069"
title: ezk-retro — proposer des features ET des règles ciblées (agent / skill par composition), validées dans le rapport
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# 20260826082120069 — ezk-retro propose des features et des règles ciblées

## En clair

Aujourd'hui, la rétro produit surtout des **règles générales** et écarte les outils.
On veut qu'elle propose aussi de **vraies features**, et qu'une règle décidée puisse être
**rattachée à un agent ou un skill précis** (par composition), pas seulement au silo
global. Chaque proposition apparaît dans le **rapport de rétro** avec **ta case
d'acceptation** — tu valides à la fin.

## Contexte / Problème

La seule rétro réellement tenue (2026-07-18) a adopté **3 règles + 1 geste, 0 feature**,
et a **écarté exprès** tous les outils proposés (« discipline d'abord ; on outillera
seulement si ça se reproduit »). Les deux seules fiches nées de la rétro (0079, 0080)
l'ont été via une **demande PO directe**, hors du mécanisme de la cérémonie.

Constat du PO (2026-08-26) : « je ne vois pas de décision pour créer des features afin de
s'auto-améliorer ». Le format prévoit pourtant la catégorie `feature` (SKILL.md, temps 3),
mais la cérémonie retombe en pratique sur des règles.

Autre manque : `ezk-retro` range déjà les règles dans `rules/` + `bundles/` + DoD, mais
**ne sait pas cibler** une règle vers **un agent** ou **un skill** donné.

## Proposition

Faire évoluer la skill `ezk-retro` (temps 3 « sortie typée » + temps 5 « rangement ») :

1. **Proposer franchement des `feature`** quand un symptôme est **structurel**, au lieu de
   retomber par défaut sur une règle. Le biais « discipline d'abord » reste un garde-fou,
   pas un couvercle : le jugement se fait au cas par cas et se **trace**.
2. **Une règle porte une cible** : `global` (`rules/`), `agent:<nom>`, ou `skill:<nom>`.
   ⚠️ **Le mécanisme de ciblage est à définir, pas à présupposer.** Router une règle via
   un `bundle` ne préserve **pas** la portée : un bundle sélectionné est étendu à **tout le
   profil** (`products/mega-city/src/core/expand.ts:65-79`). Aujourd'hui un agent lie ses
   règles via `Agent.interactions`, et un **skill n'a aucune relation de règle**
   (`products/mega-city/docs/domain.ts:74-102`). Cibler `agent:<nom>` / `skill:<nom>`
   suppose donc de **matérialiser des liens explicites agent/skill → règle** — c'est le
   cœur du travail de conception de cette fiche.
3. **Tout passe par le rapport, pour ton acceptation** : chaque proposition typée
   (`feature` / `règle` / `action` / `spike`) figure dans la capture avec une case
   d'acceptation PO (⏳ → ✅/❌), **jamais pré-remplie**.

**Compose l'existant** (ne réinvente rien) :

- la boucle d'**elicitation** (fiche 20260825161522791) pour des propositions plus riches
  qu'un jet unique ;
- le **modèle compilé** de la méthode (fiche 20260821204737357) pour un ciblage
  déterministe règle → agent / skill ;
- le mécanisme de **bundles** existant (`products/mega-city/bundles/`, 12 bundles) **pour
  la portée globale** — le ciblage fin agent/skill exige en plus une **nouvelle relation
  agent/skill → règle** (voir Proposition §2).

## Critères d'acceptation

- [ ] Une rétro peut produire des propositions de type **`feature`**, pas seulement `règle`.
- [ ] Une proposition de règle **porte une cible** : `global` / `agent:<nom>` / `skill:<nom>`.
- [ ] Le rapport **liste chaque proposition avec un statut d'acceptation PO** (⏳/✅/❌),
      jamais pré-rempli.
- [ ] Le rangement **respecte la cible** via un **lien explicite agent/skill → règle**
      (pas via un bundle, qui est global au profil) : une règle « agent X » ne concerne que X.
- [ ] La **réversibilité** est conservée (une règle ciblée reste retirable via `retire`).
- [ ] Gate locale verte.

## Comment vérifier

- Rejouer une rétro sur une friction **structurelle** → au moins une proposition
  **`feature`** en sort.
- Décider une règle ciblée « agent `ezk-dev` » → vérifier qu'elle est **rattachée au
  bundle de `ezk-dev`**, pas au silo global.
- Ouvrir la capture : les **cases d'acceptation sont vides** tant que le PO n'a pas tranché.

## Notes / décisions

- **Origine** : demande PO du 2026-08-26.
- **`product: mega-city`** (skill de méthode).
- **`priority: P2` proposée** — *à confirmer par le PO*.
- **Compose** : 0167 (la cérémonie, shippée) ; elicitation 20260825161522791 (idea) ;
  modèle compilé 20260821204737357 (idea, P1 — **dépendance** pour le ciblage déterministe).
- **Trio rétro voisin** : 0079 (voix, shippée), 0080 (compte-rendu — **enrichi en parallèle**
  pour rendre les décisions visibles), 0081 (carnet de préparation, idea).
- **Frontière** : ne touche pas au déclenchement par métrique (Sujet B / ADR-030).
- **À groomer (DoR) au tirage** : la grammaire exacte des cibles, **la relation skill →
  règle à créer** (absente du modèle aujourd'hui, cf. `domain.ts`), l'ordre elicitation ↔
  round-robin, la dépendance au modèle compilé.
