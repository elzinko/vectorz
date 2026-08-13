---
id: "20260813131259846"
title: Contrat d'améliorabilité — validateur noyau + miroir + chien de garde (surfaces gelées) — gated ADR-030 ratifié
type: feature
priority: P1
product: vectorz
status: blocked
ready:
pr:
created: 2026-08-13
---

# 20260813131259846 — Surfaces gelées du contrat d'améliorabilité (gated ADR-030)

> **Scission de [0044](0044-mesureur-outcomes-script-append-mvp-a.md)** (recadrage
> 2026-08-13, décision PO « MVP mesureur nu »). 0044 livre le mesureur nu (inventaire +
> baseline `outcomes.jsonl`, zéro dépendance de décision). Cette fiche porte le reste :
> les **surfaces gelées** dont le transport et le mécanisme de preuve dépendent d'une
> décision **non encore tranchée**.

## Pourquoi bloquée

[ADR-030](../docs/adr/ADR-030-contrat-ameliorabilite.md) est **PROPOSÉ** (attend le panel
adverse + arbitrage PO). Sa **Décision A2 (transport)** — dossier `.improvement/` avec
**deux fichiers** writer-unique (`outcomes.jsonl` = mesureur / `lifecycle.jsonl` = émetteur)
**vs** un **ledger unique** doté d'un mécanisme d'authentification d'origine — n'est pas
prise. Le **mécanisme de preuve externe** du script d'append (approbation GitHub du compte
humain via `gh` API **vs** commit signé PO) est lui aussi « tranché au panel de gel ». Ces
éléments sont **surface gelée** : les inventer dans un sprint violerait la gouvernance de la
fiche. → **Cette fiche ne peut pas passer `ready` tant qu'ADR-030 n'est pas ratifié.**

## Proposition (les mécanismes gelés déportés de 0044)

- **Script d'append (validateur noyau)** — refuse toute écriture (1) d'application sans
  approbation référencée portant une **preuve externe non-productible par un agent**,
  (2) hors du registre de surfaces, (3) de 2ᵉ essai simultané.
- **Miroir tamper-évident** — hash append-only des ledgers ET des surfaces gelées **hors de
  l'arbre projet** ; toute divergence ⇒ `incident.detected` à chaque MESURER.
- **Chien de garde calendaire** — chaque obligation doublée d'une borne (N émissions OU
  M jours, premier atteint) ; dépassement ⇒ `improvement.overdue` / `proposal.expired`.
- **Verdicts mécaniques** — `improvement.verified|retired` calculé par le mesureur
  (comparaison `critere_verification` vs ledger), jamais rendu par la méthode auditée ;
  écart méthode/mesureur = incident.
- **Second fichier `lifecycle.jsonl`** (writer = émetteur) si le transport deux-fichiers
  est retenu au panel.

## Critères d'acceptation (déportés de 0044)

- [ ] Le script d'append rejette les 3 violations noyau sur fixtures (application sans approbation prouvée, surface gelée, 2 essais simultanés)
- [ ] Le miroir hors de l'arbre détecte une altération simulée du ledger (divergence ⇒ incident)
- [ ] Le chien de garde émet `improvement.overdue`/`proposal.expired` sur cas reproduits (borne calendaire)
- [ ] Le verdict `verified|retired` d'un cas de test est rendu par le mesureur, jamais fourni par l'émetteur
- [ ] Le transport retenu par ADR-030 ratifié est implémenté à l'identique (deux fichiers writer-unique **ou** ledger authentifié)
- [ ] Gate locale verte (typecheck/lint/tests)

## Notes / décisions

- **Gate de déblocage** : ratification d'ADR-030 (panel adverse + PO) fixant A2 (transport)
  et le mécanisme de preuve externe. Sans elle, `ready` refusé.
- Surfaces **gelées** : mesureur, ledger, miroir, script d'append, définitions de métriques —
  toute modification ultérieure = PO après panel.
- Dépend du socle livré par [0044](0044-mesureur-outcomes-script-append-mvp-a.md) (le
  mesureur nu et `outcomes.jsonl` existent déjà quand cette fiche démarre).
