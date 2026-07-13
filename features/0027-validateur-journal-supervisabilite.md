---
id: 0027
title: Validateur de journal de supervisabilité — l'invariant devient exécutable
type: feature
priority: P2
status: todo
pr:
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

- [ ] Jeu de fixtures : run nominal ✅ ; violation post-gate ❌ ; trou de seq ❌ ; double
      `gate.reached` ; `continue` orphelin ; adoption sans `upgrade_ok` ; journal tronqué.
- [ ] Utilisable en CI (code retour) et à la main (rapport).
- [ ] Zéro import du runtime cop1 (le validateur doit pouvoir juger n'importe quel couple
      superviseur/méthode).
- [ ] Doc : comment l'appliquer à un run réel.

## Notes / décisions

- Origine : compte rendu du panel design, capture §7 (« l'invariant devient exécutable »).
- Dépend du gel v0.1 (PR #60 mergée). Compose avec la fiche mega-city 0050 (kit émetteur).
