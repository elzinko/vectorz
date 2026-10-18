---
type: retro
date: 2026-10-19
theme: "Run autonome v0.19→v0.22 : 16 fiches mises de côté au lieu d'être tentées"
scope: "le pilote ezk-product-build en --mode auto : grooming sauté, park utilisé comme pré-filtre, arbitrages PO pris en autonomie"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "Tenter (groomer puis construire) avant de mettre une fiche de côté ; le park est un constat APRÈS une tentative tracée, jamais un pré-filtre sur pressentiment."
    kind: regle
    target: skill:ezk-product-build
    by: [architecture, qualite, dev, produit]
    status: ✅
    decision: "retenue — rangée rules/development/tenter-avant-de-parker.md, liée en applies: de ezk-product-build"
    date: 2026-10-19
  - proposition: "La machine n'écarte jamais pour un jugement de valeur (« pas rentable / pas lean »), ne change jamais la version d'une fiche, et ne réveille jamais une fiche parkée : elle propose, le PO décide."
    kind: regle
    target: agent:ezk-pm
    by: [qualite, produit]
    status: ✅
    decision: "retenue — rangée rules/development/machine-ne-tranche-pas-version-ni-depark.md, liée en interactions: de ezk-pm"
    date: 2026-10-19
  - proposition: "Un run autonome pose UNE décision informée au départ (ce qu'il tente / ce qu'il sait déjà bloqué) et rend un incrément revertible jugé à la fin ; aucun arbitrage PO en cours de route."
    kind: regle
    target: skill:ezk-product-build
    by: [produit, dev]
    status: ✅
    decision: "retenue — rangée rules/development/decision-informee-au-depart.md, liée en applies: de ezk-product-build"
    date: 2026-10-19
  - proposition: "Avant d'écarter : tenter le découpage d'une fiche trop grosse, et le flux LOCAL (repo public, valeurs de test, --dry-run) pour une dépendance externe ; un spike se mène borné (objectif + borne + repli)."
    kind: regle
    target: agent:ezk-pm
    by: [dev]
    status: ✅
    decision: "retenue — rangée rules/development/tenter-decoupage-et-local-avant-ecarter.md, liée en interactions: de ezk-pm"
    date: 2026-10-19
  - proposition: "La commande `park` refuse une fiche non groomée : elle exige une preuve de tentative (verdict escalate préexistant, ou référence de groom tracé). Compile la règle « tenter avant de parker » en code."
    kind: feature
    by: [architecture, qualite]
    status: ✅
    decision: "retenue — fiche backlog créée (à construire)"
    date: 2026-10-19
  - proposition: "Le rapport de run affiche le ratio mis-de-côté / livré et la couverture de groom (groomé X/Y), et lève un drapeau au-delà d'un seuil au lieu de passer en silence."
    kind: action
    by: [qualite, architecture]
    status: ✅
    decision: "retenue — fiche backlog créée (à construire)"
    date: 2026-10-19
---

# Rétro — le run qui a mis 16 fiches de côté au lieu de les tenter

**En clair.** Un run autonome a construit 4 versions, et sur 22 fiches il en a **mis 16 de côté**
au lieu de les tenter. La cause : le grooming automatique **n'a pas été lancé** (un jugement rapide à
sa place), et « mettre de côté » est devenu le **réflexe facile** au lieu du dernier recours. Comme
tout est local et **annulable**, la bonne règle est : **on tente d'abord, on annule si ça rate — on
n'écarte jamais sans avoir essayé.** Le PO a tout retenu.

## 1 · Les faits de départ

- Run `ezk-product-build --mode auto --tokens lean` sur v0.19→v0.22 : **6 fiches livrées, 16 mises de
  côté** (parkées, étiquetées attend-GitHub / attend-panel / à-découper), v0.23 en STOP.
- L'auto-groom prévu (ADR-0028 : composer brainstorming / architecte / ezk-pm pour atteindre la DoR)
  **n'a pas tourné** : le pilote a jugé chaque fiche inline, puis parké.
- `ezk run eligibility` existe, mais décide depuis l'étiquette `blocked:`. Les 16 fiches étaient
  `idea` **sans** étiquette → l'outil aurait dit « groome ». La non-constructibilité vivait dans le
  **contenu** (GitHub coupé, décision produit, spike, gros feature) — ce que le grooming doit tenter.
- Parkings contestables : des fiches « a besoin de GitHub » alors que le repo est **public** et
  testable en local ; des spikes écartés alors que l'investigation était menable.

## 2 · Tour 1 — chaque lentille propose

Quatre lentilles indépendantes (architecte, qualité, dev, produit) ont proposé, chacune par son
angle : router le park à travers le portier d'éligibilité, exiger une trace de grooming, interdire
le jugement de valeur comme motif, rendre le ratio visible, poser une décision informée au départ,
borner les spikes.

## 3 · Tour 2 — confrontation et convergence

**Convergence forte, sans concertation** : les quatre pointent la même fuite — « mettre de côté » a
servi d'échappatoire de frilosité au lieu d'être le dernier recours après une vraie tentative. Le
flux tout-revertible (worktrees d'agents isolés, squash-merge local, github:false) rend le coût d'une
tentative **nul** : « au pire, revert » doit remplacer « park ». On a fusionné les six propositions en
quatre règles + deux chantiers de code.

## 4 · Le juge de cohérence

Un verdict par proposition : **toutes cohérentes**, aucune ne contredit une règle existante, aucun
doublon. Elles **resserrent** la doctrine groom/park d'ADR-0028 (elles ne la remplacent pas) et
prolongent les 4 STOP humains (volet version / dé-park). GO pour le rangement.

## 5 · Ce qui est proposé au PO

Voir l'en-tête : quatre règles (tenter-avant-parker · version/dé-park = PO · décision informée au
départ · tenter découpage + local avant d'écarter) et deux chantiers de code (park refuse une fiche
non groomée · rapport de run avec ratio + drapeau). Chacune porte son symptôme et sa mesure.

## 6 · Suivi des décisions de la rétro précédente

Première rétro de ce fil ; rien à suivre.

## 7 · Décisions du PO

**Le PO retient tout** (2026-10-19). Les quatre règles sont gravées dans `rules/development/` et
liées à leur cible ; les deux chantiers de code partent au backlog.

## 8 · Glossaire

- **Parker / mettre de côté** : sortir une fiche de sa version sans la supprimer (réversible).
- **DoR** : « definition of ready » — les critères pour qu'une fiche soit « prête » à construire.
- **Portier d'éligibilité** : `ezk run eligibility`, qui dit build / groom / escalate / defer.
- **Revertible** : annulable — ici, rien n'est poussé, tout vit sur une branche jetable.
