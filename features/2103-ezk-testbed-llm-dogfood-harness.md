---
id: 2103
product: mega-city
title: "Tests dogfood automatisés avec un agent + Playwright"
type: feature
priority: P1
epic:
depends: [2094]
labels: [method, dogfood, enabler, testbed]
status: todo
ready:
pr: '#62'
created: 2026-07-28
---

# 2103 — Tests dogfood automatisés (agent + Playwright)

## Problème

Aujourd’hui, pour savoir si la chaîne **méthode → journal → Moniteur** marche vraiment,
il faut qu’un humain ouvre Claude Code, lance une démo, et regarde l’UI.

Le smoke mécanique (`scripts/dogfood-smoke.sh`) vérifie déjà link / probe / journal
**sans** Claude Code — utile, mais ça ne prouve pas qu’un vrai skill émet, ni que
le Moniteur affiche un run.

Résultat : les preuves « on voit un run dans le Moniteur » (liées à
[2094](2094-emetteur-branche-sur-claude-code.md) / [2095](2095-ezk-product-builder-n-emet-pas.md))
restent en attente d’une session manuelle 30–45 min.

## Idée

Un **guide dogfood** qui fait le maximum tout seul, et qui **demande clairement**
à l’humain seulement quand c’est indispensable :

1. scripts automatiques (smoke, checks fichiers) ;
2. **Playwright** pour ouvrir le Moniteur et prendre des captures ;
3. plus tard (v2) : un agent LLM qui lance la démo à ta place.

Le point d’entrée humain reste [`docs/DOGFOOD.md`](../docs/DOGFOOD.md).

## Ce que ça fait

Trois couches, bien séparées :

| Couche | Déjà là / à livrer | Rôle |
| --- | --- | --- |
| **1. Smoke mécanique** | ✅ `scripts/dogfood-smoke.sh` | Bind jetable, link, probe, journal démo, validateur — **sans** LLM ni UI |
| **2. Checks Moniteur (Playwright)** | ✅ MVP : `scripts/dogfood-guided.sh` | Démarre / oriente le Moniteur, captures d’écran, rapport OK/KO, pauses humaines claires |
| **3. Acteur LLM (optionnel)** | ❌ v2 | Claude Code headless qui lance `/supervision-demo` ou un sprint trivial, puis assertions scripts |

La couche 2 aide **maintenant** (avant merge PR #62). La couche 3 ne bloque pas.

## Ce que ça ne fait pas

- Ne remplace pas le jugement « est-ce que la carte Moniteur est lisible ? » (1× humain).
- Ne mesure pas les tokens archive ([2088](2088-ezk-archive-cout-cloture-session-disciplinee.md)) — ça reste un parser de usage, pas un avis LLM.
- Ne tourne **pas** sur chaque push/PR (trop cher / trop flaky) : nightly ou label `dogfood` pour la v2.
- Ne fusionne pas smoke et acteur LLM dans un seul script (coûts différents).

## Critères d’acceptation simples

### MVP (cette PR / couche 1+2) — « je peux dogfooder en 15–30 min »

- [x] **AC1 — Guide unique.** `docs/DOGFOOD.md` explique en français, étapes numérotées, ce qui est auto vs humain.
- [x] **AC2 — Runner guidé.** `bash scripts/dogfood-guided.sh` : smoke + (si possible) captures Moniteur + pauses « appuie Entrée » + rapport OK/KO/PARTIAL.
- [x] **AC3 — Visuel.** Capture homepage / vue supervision quand le serveur répond (`scripts/dogfood-screenshot.mjs`) ; sinon étape SKIP (pas de faux vert).
- [x] **AC4 — Preuve fichier.** Après l’étape humaine, le script vérifie la présence / nouveauté d’un `events.jsonl` (ou dit KO clairement).
- [x] **AC5 — Rapport.** Markdown + JSON sous `docs/dogfood-reports/` (gitignoré) — verdict PARTIAL si étapes humaines SKIP.

### v2 (acteur LLM) — plus tard

- [ ] **AC6 — Scénario figé.** Un scénario écrit (Given/When/Then) : MCP branché → démo/sprint trivial → journal + run listable API.
- [ ] **AC7 — Acteur borné.** Claude Code headless/CLI, budget max tokens/outils, dépassement = fail explicite.
- [ ] **AC8 — Juge = scripts.** Pass/fail uniquement via probe / shapes journal / validateur — pas un second LLM.
- [ ] **AC9 — Cadence.** Nightly **ou** label PR `dogfood` ; absent du chemin critique de chaque PR.

## Première version (MVP)

1. Réécrire cette fiche + `docs/DOGFOOD.md` (entrée unique).
2. Livrer `scripts/dogfood-guided.sh` (+ petite capture Playwright optionnelle).
3. Garder `dogfood-smoke.sh` tel quel (filet pas cher).
4. Reporter l’acteur LLM en **v2** (AC6–AC9).

**Done (MVP) quand :** un solo PO/dev suit `docs/DOGFOOD.md`, lance le guided runner,
obtient un rapport OK/KO honnête, et sait en 2 minutes ce qui reste à faire à la main.
