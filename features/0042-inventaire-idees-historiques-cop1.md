---
id: 0042
title: Inventaire — idées historiques cop1 réutilisables dans le paradigme vectorz (icebox)
type: feature
priority: P3
product: vectorz
status: idea
pr:
created: 2026-07-16
---

# 0042 — Inventaire des idées historiques cop1 (icebox)

## Contexte / Problème

Le clone cop1 → vectorz a emporté l'outillage et le code, mais des **idées de capacités**
qui vivaient dans les artefacts de planning cop1 (`_bmad-output/`, rétros, SCPs, captures,
brownfield-snapshot, PRD) ne sont **jamais devenues des fiches**. Cette fiche les **capture
cheap** (statut `idea`, hors flux P0→P3) pour ne rien perdre. Chaque item est **promu en
sa propre fiche `todo`** quand on le tire — c'est là qu'on fixe problème/valeur/critères.

Récolté le 2026-07-16 par deux fouilleurs parallèles (planning-artifacts ; rétros +
brownfield + captures), **filtré** contre les 41 fiches existantes et le pivot :
ne restent que les idées **agnostiques à la méthode** (survivent au pilote natif E3/E4)
**ou** de **contrôle-plane / moniteur pur** (mode nominal). Tout ce qui n'avait de sens
que pour le moteur BMAD supprimé a été écarté.

> Priorités indiquées = **suggestions grossières des fouilleurs** pour situer, pas un
> engagement. La fiche elle-même est P3/icebox.

## Bloc 1 — Contrôle-plane / moniteur nominal (~P2)

1. **Arrêt/pause opérateur d'un run vivant** (kill-switch non-interactif) + primitive
   d'annulation de session (`abortController` exposé). *Le pendant d'« octroyer des
   clairances » = pouvoir les révoquer.* Sources : `controlled-overnight-run-design-2026-06-20.md`
   §Features missing + Annexe F ; `prd.md` FR36 ; `epic-ea9-retro-2026-04-08.md` §D6 (F9).
   Distinct de 0028 (auto-continue *machine*) et d'ADR-017 (déclencheur *budget*). ~P2.
2. **Watchdog de run muet** (heartbeat / dérive sous `maxTurns`) + **canal de notification
   sortant** (escalade / blocage / cap → Telegram ou générique). *Le moniteur détecte ET
   alerte — 0021 a rendu l'escalade non-terminale mais rien ne la livre à un humain.*
   Sources : `controlled-overnight-run-design` §Features missing + Annexe F #11 ;
   `prd.md` §Growth (Telegram) + FR144. ~P2.
3. **Gouvernance runtime des outils/MCP/chemins protégés** + **journal d'audit MCP** +
   autonomie par paliers (allowlist par classe d'action). *L'ontologie des « clairances »
   au niveau runtime.* Sources : `prd.md` MVP-14/FR121 (flaggé « Critical MVP gap » dans
   `implementation-readiness-report-2026-04-14.md`) + §Growth (MCP Phase 3) ;
   `controlled-overnight-run-design` Annexe F #12. Plus large que 0040 (allowlist CI statique). ~P2.
4. **Durabilité / atomicité d'écriture du journal `.supervision` (Track 3).** *Le journal
   est devenu la source de vérité contractuelle (ADR-028) — l'écriture best-effort =
   events perdus = auditabilité cassée. 0027 détecte les trous, ne garantit pas
   l'écriture.* Source : `epic-ea10-ea11-retro-2026-04-14.md` §Technical Debt D9. ~P2.
5. **Assainissement des sorties agent rendues** (mission-control / journal) contre
   injection log/markdown + **threat-model des surfaces de supervision** + isolation du
   superviseur. *Le rendu affiche du contenu émis par un agent d'un projet supervisé =
   source non fiable.* Sources : `epic-ea12-retro-2026-04-15.md` §Adversarial Review
   AT-6/AT-1/AT-2/R16 ; `2026-07-13-contrat-methode-et-versions.md` §4/§6.4. ~P2.
6. **Boucle fermée interactive de la mission-control** (bouton « Continue » humain →
   `check_clearance`). *Pont moniteur→pilote piloté par l'humain — distinct de 0022
   (affichage) et 0028 (auto-continue machine).* Source :
   `2026-07-14-revue-groupe-deux-sieges.md` §6 Divergences #3. ~P2 (post-démo).
7. **Digest de supervision synthétique (« rapport du matin »).** *Le livrable naturel du
   moniteur : synthèse narrative (fait / bloqué / coûté / à décider) au-dessus du journal
   brut ; `SessionReportService` inventorié dormant.* Sources : `prd.md` Journey 2 + FR144 ;
   `controlled-overnight-run-design` Annexe A. ~P2/P3.

## Bloc 2 — Agnostique méthode, survit au pilote natif (~P3)

8. **Reprise sur crash de la boucle de run** (`CheckpointService` câblé dans
   l'orchestrateur + graceful shutdown SIGTERM→checkpoint). *Machinerie existante, jamais
   câblée.* Sources : `controlled-overnight-run-design` §Features missing ; `architecture.md`
   NFR9/NFR10 ; `adr-011-…-autonomous-orchestration.md` §12 open-Q #4 ; `real-run-report` gap #7. ~P3.
9. **Clairance de concurrence resource-aware** (garde RAM/CPU *live* + ramp-up progressif).
   *La « concurrence » est une des 4 clairances (ADR-022) ; distinct de 0032/0033 qui ne
   traitent que la config, pas une garde en cours de run.* Sources : `prd.md` MVP-8 + Epic 7 ;
   `architecture.md` NFR11/NFR13. ~P3.
10. **Exécuteurs isolés / distants derrière `AgentSessionPort`** (ContainerAdapter sandbox
    Docker ; RemoteAdapter Claude Code distant). *Blast-radius + mode pilote différé ;
    distinct du `ContainerRuntimePort` Ollama supprimé (E6-S2) et des adapters de 0020.*
    Source : `epic-12-retro-2026-02-22.md` §Execution Gateway Pattern. ~P3.
11. **Commit-anchor réel + stratégie SHA** (amend vs 2-passes). *Agnostique ; à **rattacher
    à la fiche 0007** (qui n'a que le sliver « pin BMAD »).* Sources : `architecture.md`
    §B1/§B2 ; `real-run-report` gap #4. ~P3.
12. **Sémantique de version d'un run + provenance** (tuple loggé `(cop1@sha, méthode@vX)`
    + règle ADR + test + affichage UI). *Reproductibilité/traçabilité d'un run supervisé.*
    Source : `2026-07-13-contrat-methode-et-versions.md` §4 + §6.2. ~P3.
13. **Method viewer enfichable** (module de rendu fourni par mega-city, hébergé par cop1,
    au-dessus du journal neutre). *Garde le journal method-neutral tout en autorisant une
    présentation spécifique ; explicitement parké « à la douleur ».* Sources :
    `2026-07-14-revue-groupe-deux-sieges.md` §3 Q2 ; `2026-07-13-contrat-methode-et-versions.md` §7 D13. ~P3.

## Bloc 3 — Distribution & futur

14. **Packaging / distribution de cop1** (`pnpm dlx cop1`, pre-flight checks, création de
    PR via `gh`). *Prérequis au dogfooding externe ; `cop1 init` scaffolde mais ne publie
    rien ; ADR-011 sans fiche.* Sources : `epic-ea10-ea11-retro-2026-04-14.md` §Next Epic #3 ;
    `brownfield-snapshot.md` §12.8/§11 (EA8, ADR-011). ~P2-P3.
15. **Supervision multi-projets** (une UI, N moteurs par projet, versions par moteur).
    Source : `2026-07-13-contrat-methode-et-versions.md` §5 Q3. ~P4/future.
16. **DemoAgent / démo visuelle de l'ouvrage + preview environment** servi depuis le
    worktree. *Distinct de 0030 (démo du produit).* Sources : `prd.md` Journey 7 + CA16 ;
    `adr-011` §12 open-Q #2 ; `implementation-readiness` (Preview-Env manquant). ~P3 (pilote, différé).
17. **Idéation nocturne / worker d'occupation productive** (« 0 nuit blanche »). *Spéculatif,
    comportement de travailleur plus que de siège ; les signaux vivent déjà dans 0029.*
    Source : `prd.md` §Innovation #2 + §Growth. ~P3.

## Notes / décisions

- **Statut `idea` / P3 assumé** (PO, 2026-07-16) : icebox, hors flux P0→P3. Promotion
  item-par-item en fiche `todo` au moment de tirer.
- **Rattachements** : #11 → 0007 ; #1/#10 composent avec 0020 (seam exécuteur) ; #6
  compose avec 0022/0031 ; #13/#16 touchent la frontière mega-city.
- **Écartés (déjà trackés)** : commit/session-log → 0007 · cobaye → 0041 · affichage
  mission-control → 0022/0031 · auto-continue/commands.jsonl → 0028 · Stub/rename/Ollama
  executor → 0020 · multi-piste/hash-chain/report_schema/authority → 0029 · DoDLimiter → 0018
  · double-writer → 0037.
- **Écartés (caducs BMAD-only)** : détection heuristique questions `--resume`,
  `BmadCommandStatusAdapter`, extraction `BmadCycle`, iamthelaw en module BMM, day-copilot /
  burndown scrum / mode diurne (tués par le pivot).
