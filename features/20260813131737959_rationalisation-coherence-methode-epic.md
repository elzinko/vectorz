---
id: "20260813131737959"
title: Rationalisation & cohérence de la méthode mega-city — audit → chantiers (épic)
type: epic
priority: P2
product: mega-city
version:
epic:
status: todo
ready:
pr:
created: 2026-08-13
---

# Rationalisation & cohérence de la méthode mega-city (épic)

## En clair

La méthode **marche** (382 tests verts, typecheck propre le 2026-08-13) — mais ses **23 skills
+ 7 agents** ont accumulé des **incohérences de surface** : un doublon perçu, des préfixes
mélangés, des références périmées, et **0 skill sur 23 testé localement**. Cet épic **regroupe
les chantiers** pour rendre la méthode *cohérente & solide* — **sans créer de nouvelle skill**.
Priorités proposées ci-dessous — **à arbitrer PO**.

> **Épic non-buildable** — ne pas tirer cette fiche à l'intake : tirer ses filles.

## Contexte / Problème

**Origine (session 2026-08-13, demande PO)** : « créer une commande qui analyse les ezk pour
en juger la cohérence et la solidité, et qui propose une roadmap de rationalisation ». L'analyse
a montré qu'**il ne faut PAS créer de skill** pour ça (voir triangle ci-dessous) : la bonne
réponse est un **audit ponctuel → cet épic**.

**Méthode de l'audit** : gate mécanique (`ezk-steward`) + **panel adverse de 3 lentilles**
(architecte / QA-refs-mortes / PM-doublons), 2026-08-13.

**Ce n'est PAS une remise à plat** : la méthode fonctionne. C'est de l'**hygiène de cohérence**.

## Le triangle qui a déclenché la demande — 3 rôles distincts, PAS un doublon

La confusion PO : « une skill pour analyser/optimiser la méthode ferait-elle doublon avec la
rétro ? ». **Réponse tranchée par les 3 lentilles : oui, ce serait un doublon — ne pas la créer.**

| Brique | Déclencheur | Objet | Statut |
|---|---|---|---|
| **`ezk-retro`** (skill) | humain, par **symptôme** (Sujet A) | la **méthode / les règles** | ✅ shippé |
| **`ezk-steward`** (agent) | audit à la demande | la **librairie** (conformité) | ✅ existe |
| **fiche [0057](0057-agent-analyse-methode.md)** | les **chiffres/KPI** (Sujet B, ADR-030) | la méthode via **outcomes** | ⏸️ parké (YAGNI) |

Le manque n'est donc **pas une skill** : c'est (a) **documenter cette carte** en un seul endroit
(fille [E](20260813131737971_carte-roles-analyse-methode.md)), et (b) **réveiller 0057** quand
l'historique KPI existera (épic [0051](0051-observabilite-qualite-produit.md)).

## Chantiers (filles) — construire → prouver → retirer

**Nouvelles fiches (créées avec cet épic)** :

| Fille | Chantier | Prio proposée |
|---|---|---|
| [A](20260813131737962_nommage-catalogue-adr0022.md) | Nommage & catalogue : rename `ezk-pr-pilot`→`ezk-pr`, ranger `vz-`/`supervision-` (ADR-0022), README table scannable | P2 |
| [C](20260813131737968_assainir-references-methode.md) | Assainir les références : `install.sh` mort, rot de numérotation, graphe `composes:` sous-peuplé | P2 |
| [E](20260813131737971_carte-roles-analyse-methode.md) | Carte des rôles d'analyse (retro/steward/0057) + juge unique — **étend le `method-map.md` vivant ([0133](0133-adr-carte-roles-skills.md)), pas un artefact séparé** | P2 |

**Fiches existantes rattachées** (déjà au backlog, regroupées ici) :

| Fille | Chantier | Prio |
|---|---|---|
| [0066](0066-tester-un-skill-avant-merge.md) | Tester un skill avant merge (golden + sabotage) — **0/23 skills testés, mesuré 2026-08-13** | P2 |
| [0101](0101-cabler-check-links-ship-et-ci.md) | Câbler `check-links` — **4 liens cassés, mesurés 2026-08-13** | P2 |
| [0161](0161-ezk-challenge-panel.md) | Extraire `ezk-challenge` (panel réutilisé dans 3 skills) | P2 |
| [0113](0113-chief-judge.md) | `chief-judge` — juge de cohérence (le juge unique de la fille E) | P3 |

**Fiches voisines (NON rattachées — objet distinct)** :
- [0057](0057-agent-analyse-methode.md) — reste dans l'épic [0051](0051-observabilite-qualite-produit.md) (analyse KPI, le *nord*).
- [0139](0139-garde-fous-integrite-agents.md) — intégrité des agents (advisory+enforced), cousin.
- [20260812104022240](20260812104022240_backlog-rationalisation-tags-script-llm.md) — rationaliser le **stock de fiches** (≠ la *méthode*). Cet épic **dogfoode** son intention (regrouper sous un épic).
- [0164](0164-vz-product-builder-corpus-reviewers.md) — `vz-product-builder` : la décision **overlay est DÉJÀ prise par le PO** (in-progress, « ne pas toucher `ezk-*` »). L'épic **ne rouvre pas** ce choix (retour Codex #144) ; le dédoublonnage du panel = [0161](0161-ezk-challenge-panel.md).

## Tester & visualiser la méthode (réponse aux 2 questions PO)

- **Tester** : déjà — la gate mécanique (`catalog`/`skill-emission-contract`/`check-links`) ;
  à faire — **exercer** chaque skill ([0066](0066-tester-un-skill-avant-merge.md), 0/23 aujourd'hui)
  et rendre les **refs vérifiables** (fille [C](20260813131737968_assainir-references-methode.md),
  critère « sabotage »).
- **Visualiser** : déjà — `ezk-diagram` + [`diagrams/ezk-methode-globale/`](../products/mega-city/diagrams/ezk-methode-globale/) ;
  à fiabiliser — le **graphe `composes:`** généré (fille C, aujourd'hui il ment) ; à produire — la
  **carte des rôles** (fille E). *La retro ne joue donc pas ce rôle : elle est déclenchée par un
  symptôme, pas par un balayage systématique de la librairie — ça, c'est `ezk-steward` + cet épic.*

## Critères d'acceptation (épic)

- [ ] Les 3 nouvelles filles (A/C/E) sont groomées et priorisées **par le PO**.
- [ ] Le triangle retro/steward/0057 est documenté en **un seul endroit** (fille E livrée).
- [ ] Une **référence morte** (chemin/skill/fiche) fait **rougir une gate** (critère 0066).
- [ ] `check-links` est **vert** (0 lien cassé) et **lancé automatiquement** (0101).
- [ ] **Aucune nouvelle skill** créée pour « analyser la méthode » (non-but tenu).

## Non-buts

- Créer une skill `ezk-analyze`/`ezk-optimize` (doublon de `ezk-retro` + `ezk-steward`).
- Ajouter `analyze`/`optimize` à `ezk-ezk` (casse sa responsabilité unique « session → skill »).
- Remettre à plat la méthode (elle marche) ; toucher au fond des skills qui vont bien.

## Notes / décisions

- **Gate mesurée 2026-08-13** : 40 fichiers / 382 tests verts, typecheck propre, `check-links`
  = 4 liens cassés (ADR 0019, 0021).
- **Priorités = propositions** — l'ordre relatif et l'entrée dans `PLAN.md` sont **arbitrés PO**.
- Panel : lentilles archi + QA + PM, findings avec `fichier:ligne`. Faux positifs de refs mortes
  écartés (regex trop large) — seul `install.sh` confirmé (fille C).
