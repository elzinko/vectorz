---
id: 0027
product: vectorz
title: Validateur de journal de supervisabilité — l'invariant devient exécutable
type: feature
priority: P1
status: shipped
pr: "#62"
created: 2026-07-14
---

# 0027 — Validateur de journal de supervisabilité

## Contexte / Problème

Le contrat de supervisabilité v0.1 (capture 2026-07-13 §7, PR #60) promet un invariant
« vérifiable depuis les journaux seuls » : toute activité après un `gate.reached` sans
`gate.resumed` corrélé = violation. Le panel design (5 lentilles) l'a dit sans détour :
tant qu'aucun outil ne vérifie cet invariant, c'est un slogan. Un validateur de journal
rend l'invariant **exécutable** — c'est aussi le meilleur argument de l'article, le test de
non-régression v0.1→v0.2, et le juge de conformité du kit émetteur (fiche mega-city 0050).

## Proposition

CLI/lib neutre (zéro dépendance au runtime cop1) : `validate <dossier-de-run>` qui rejoue
`events.jsonl` + `commands.jsonl` et vérifie :

- **enveloppe** : schéma `{event_id, run_id, seq, ts, contract, type}`, `seq` strictement
  croissant (trou = perte détectée), `run.started` en premier événement, lecteur tolérant
  (champ/type inconnu signalé, jamais fatal ; dernière ligne sans `\n` ignorée) ;
- **invariant** : reconstruction de la machine à états
  (`launched → running ⇄ at_gate → finished | aborted`) ; tout événement post-`gate.reached`
  sans `gate.resumed` corrélé ⇒ violation ; au plus un gate ouvert ;
- **corrélations** : `continue`/`hold` → `gate_event_id` existant (idempotence : re-continue
  = no-op, id inconnu = erreur) ; `version.adopted` précédé d'un `continue {adopt_version}`
  sur jalon `upgrade_ok` ; `escalation.resolved` → escalade ouverte ;
- **intégrité (option)** : hash-chain des lignes (troncature détectable), `report_ref`
  confiné realpath sous la racine projet ;
- sortie : rapport lisible + code retour ⇒ **CI-able** ; lignes invalides synthétisées en
  `contract.violation`.

## Critères d'acceptation

- [x] Jeu de fixtures : run nominal ✅ ; violation post-gate ❌ ; trou de seq ❌ ; double
      `gate.reached` ; `continue` orphelin ; journal tronqué (16 fixtures, dont le journal réel).
- [x] Utilisable en CI (code retour) et à la main (rapport).
- [x] Zéro import du runtime cop1 (le validateur doit pouvoir juger n'importe quel couple
      superviseur/méthode).
- [x] Doc : comment l'appliquer à un run réel.

## Notes / décisions

- Origine : compte rendu du panel design, capture §7 (« l'invariant devient exécutable »).
- Dépend du gel v0.1 (PR #60 mergée). Compose avec la fiche mega-city 0050 (kit émetteur).
- **2026-07-14 (revue de groupe, DP5) — scope réduit v1, re-priorisée P1** : enveloppe +
  invariant + seq, **enum fermée de commandes**, règle « événement après `run.finished` =
  violation » ; **hash-chain différée** (reste l'option d'intégrité). Étape 3 du MVP démo
  (fiche 0030) : parallèle, jamais bloquant — mais son **vert fait partie du script de démo**.
- **Mode moniteur géré** : `commands.jsonl` ABSENT = légitime (v0.1, gate.resumed
  self-reported) — le valider comme tel, pas comme une erreur.
- Le kit émetteur (mega-city PR #8, mergée 2026-07-14) fournit le 1ᵉʳ journal réel → fixture.
- **Différés v0.2 issus de la revue de code** (NITs N2-N4, non bloquants) : validation de
  type des champs d'enveloppe (`seq` entier ≥ 1, `run_id`/`type` string) ; contrôle « premier
  seq = 1 » ; état `aborted` (corrélation `abort`) aujourd'hui déclaré mais jamais produit.
  + les options déjà différées : hash-chain, corrélations `version.adopted`/`upgrade_ok`,
  `escalation.resolved`, confinement `report_ref`.
- **Livré le 2026-07-14** (PR #62, squash 7e53b37) : revue adverse GO, injection ANSI du
  rapport + ENOENT corrigés dans la PR, journal réel exit 0 / violations exit 1.
