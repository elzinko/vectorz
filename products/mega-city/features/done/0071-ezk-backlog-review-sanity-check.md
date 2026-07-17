---
id: 0071
title: ezk-backlog review — sanity check global du backlog (validité, doublons, ordre, staleness)
type: feature
priority: P1
status: shipped
ready: 2026-07-17
pr: "#26"
created: 2026-07-17
---

# 0071 — ezk-backlog review : le sanity check global du backlog

## Contexte / Problème

L'anti-doublon d'ezk-backlog ne joue qu'à l'`add` : rien ne re-contrôle le **stock**.
Un backlog qui vieillit accumule des fiches devenues fausses (code livré entre-temps,
ADR postérieur qui contredit), des doublons par accumulation, un ordre P0→P3 dont la
cohérence *relative* n'a jamais été revérifiée, et des `todo` fossiles jamais tirés.
Décision actée : **ADR-0016 §4** (amendé par le panel du 2026-07-17 : cadence bornée
A4, compteurs au script A3, contrôle épics A8).

## Proposition

Sous-commande `review` dans le playbook ezk-backlog — **deux modes** (A4) :

- **`review` complet** : après tout pivot structurant + tous les 5 sprints (défaut,
  réglable). Contrôles de jugement LLM : **validité** fiche par fiche, **doublons /
  regroupements** par intention, **cohérence de l'ordre** P0→P3 (l'ordre relatif, pas
  juste les buckets), **staleness** (vieux `todo` → proposer `idea` ou clôture),
  **cohérence épic/enfants** (A8 : épic shipped avec enfants actifs, épic todo aux
  enfants tous livrés), **révocation** des `ready:` devenus faux.
- **`review --delta`** : avant les sprint plannings intermédiaires — fiches modifiées
  depuis le dernier complet + top P0/P1 seulement.

Sortie = **rapport + propositions**, arbitrage PO obligatoire (jamais
d'auto-suppression). Les **compteurs sont produits par le script** (A3, doctrine
ADR-0001 — le LLM ne compte pas) : extension de `regen-backlog.sh` qui agrège depuis
les front-matters : fiches par statut, `todo` ready (champ `ready:`), nb d'`idea`,
ancienneté médiane des `todo`.

## Critères d'acceptation

- [ ] `review` (complet) produit un rapport couvrant les 6 contrôles de jugement.
- [ ] `review --delta` limite la passe aux fiches modifiées + top P0/P1.
- [ ] Compteurs émis par le script (regen étendu), PAS par le LLM ; incluent le
      décompte `ready:`.
- [ ] Aucune modification de fiche sans validation PO explicite (propositions seulement).
- [ ] Cadence documentée dans le playbook (complet : post-pivot + tous les 5 sprints ;
      delta : avant planning) ; câblage à l'intake d'ezk-sprint / ezk-product-builder.
- [ ] Test de séparabilité : la connaissance du format de fiche reste dans ezk-backlog.

## Notes / décisions

- Origine : ADR-0016 (2026-07-17), douleur opérateur « reprendre le backlog en entier,
  contrôler ce qui est valide et ce qui ne l'est plus ».
- 2026-07-17 — panel adverse + juge : le « avant CHAQUE planning » initial était
  intenable (~60-80k tokens/passe chiffrés par le relecteur dev) → modes full/delta.
- Compose avec 0056 (`groom`/`ready`) : `review` détecte, `groom` répare une fiche.
- 2026-07-17 — recoupe la friction **0064** (intake / santé backlog, capturée en session
  parallèle) : voir sa note de réconciliation — reste chez elle l'émission
  `backlog.health` au journal de supervisabilité et les seuils « temps de groomer ».
