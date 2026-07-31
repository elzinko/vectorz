---
id: 0174
title: ezk-issues — intake GitHub (analyse, PR fix/feature md opt-in, coût local)
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-07-31
---

# 0174 — ezk-issues : intake GitHub (analyse + PR opt-in)

## Contexte / Problème

Les apps dogfood (ex. **city-guided** via bouton feedback / fiche **0025**) déversent des
**issues GitHub utilisateurs**. Personne ne les traitera à la main. On veut un traitement
**automatique différé** (nuit, ou matin sur demande sous budget) **à coût ~0** (Ollama local)
ou **coût contrôlé** (lot matin + notifs), sans :

- fermer / archiver systématiquement l'issue ;
- polluer le backlog `features/*.md` par ajout silencieux sur `main` ;
- confondre le cycle **signal** (GitHub) et le cycle **travail** (markdown — SoT, cf. [0172](0172-convention-sot-backlog-md.md)).

**Positionnement** : GitHub + Copilot pourront un jour faire un job similaire ; mega-city
vise le **même résultat à coût ~0 / contrôlé**. Contexte stratégique, pas dépendance.

**Décision produit** (2026-07-31) documentée côté app dans city-guided
[ADR-0003](https://github.com/elzinko/city-guided/blob/main/docs/adr/ADR-0003-intake-issues-utilisateurs.md)
et tracker app [0064](https://github.com/elzinko/city-guided/blob/main/features/0064-intake-issues-github.md).
**Cette fiche** = capacité **méthode** (`product: mega-city`) — pas d'impl, pas de sprint tant
qu'elle n'est pas groomée.

## Proposition (brouillon — à affiner au grooming)

Skill catalogue **`ezk-issues`** (nom à confirmer) qui **compose** et ne réimplémente pas :

1. **Issues restent sur GH** — pas d'archivage / fermeture forcée à l'intake.
2. **Analyse commentée** sur chaque issue éligible + labels **pipeline** + marqueur
   d'idempotence (commentaire machine-lisible et/ou `intake:analyzed`).
3. **Bug facile à reproduire** → PR de **fix rapide opt-in** (délègue repro à [0152](0152-ezk-bug-intake-repro.md)) ;
   **humain = merge / prod** (pas de merge auto, pas de deploy auto).
4. **Suggestion de feature** → trackée **dans l'issue** (commentaire + labels) ;
   **PR md opt-in** possible (markdown de feature seulement, éventuellement un peu de grooming) —
   **validation = merge** ; jamais d'écriture directe sur `main`.
5. À l'arrivée d'une fiche sur `main` : labelliser l'issue + champ `github:` sur la fiche
   (aligné [0171](0171-adapter-github-issues-push-only.md) — sens inverse, surfaces disjointes :
   l'intake ignore les issues « projection de fiche »).
6. **Labels** : source / env / type (posés par l'émetteur app) + pipeline (posés par la skill).
7. **Chemin chaud sans LLM** (création issue côté app) ; **lot nuit / matin sous cop1** pour
   l'analyse LLM (budget / kill-switch / notifs).
8. **city-guided = signal** (0025) ; **méthode = mega-city** (cette skill) — zéro code d'intake
   dans l'app.

## Critères d'acceptation (brouillon)

- [ ] Skill catalogue `ezk-issues` (ou nom retenu) documentée / placée catalogue-first (ADR mega-city 0011).
- [ ] Lot différé : issue d'origine connue non analysée → commentaire d'analyse + labels pipeline, **sans fermeture forcée**.
- [ ] Idempotence : marqueur empêche le re-traitement en boucle ; corps modifié → re-triage possible.
- [ ] Bug facile → **peut** ouvrir une PR de fix ; aucun merge/deploy automatique.
- [ ] Suggestion feature → trackée dans l'issue ; PR md opt-in possible ; **aucune** fiche sur `main` sans merge / OK humain.
- [ ] Fiche créée suite à validation porte `github: <url>` ; issue labellisée / référencée en retour.
- [ ] Composition : délègue repro à `ezk-bug` (0152) ; anti-doublon / cadrage via `ezk-backlog` quand une fiche est proposée.
- [ ] Respect SoT [0172](0172-convention-sot-backlog-md.md) ; pas de conflit avec adaptateur push-only [0171](0171-adapter-github-issues-push-only.md).
- [ ] Cadence via cop1 (nuit / matin sur demande) ; Moniteur lecture seule uniquement.
- [ ] Notifs optionnelles après lot : « issues analysées » / éventuellement « fix à livrer ».

## Hors-scope / suite

- Implémentation, wiring cop1, sprint, webhook, multi-canal.
- Archivage agressif des issues (décision rejetée — city-guided ADR-0003).
- Création auto de fiches **directement sur `main`**.
- **Anti-flood email** (email + validation pour limiter le flood) — hors MVP ; tracker plus tard
  si priorisé (pas de 2ᵉ fiche idea pour l'instant).
- **Rate-limit API** (création d'issues côté app) — autre fiche technique **au besoin** ;
  ne pas mélanger avec l'intake LLM. Noté ici seulement.
- Packaging plugin / modèle d'extension ([0170](0170-modele-extension-plugin-mega-city.md)) —
  bloquant pour un adaptateur *dans* le cœur ezk-backlog ; l'intake reste une skill hors cœur.

## Liens

| Lien | Rôle |
|------|------|
| city-guided [0064](https://github.com/elzinko/city-guided/blob/main/features/0064-intake-issues-github.md) | Tracker **app / signal** (frontend) |
| city-guided [ADR-0003](https://github.com/elzinko/city-guided/blob/main/docs/adr/ADR-0003-intake-issues-utilisateurs.md) | Décision produit (référence repo city-guided) |
| city-guided [0025](https://github.com/elzinko/city-guided/blob/main/features/0025-bouton-feedback-github.md) | Émetteur des issues (chemin chaud) |
| [0152](0152-ezk-bug-intake-repro.md) | Repro / cadrage bug (composition) |
| [0171](0171-adapter-github-issues-push-only.md) | Adaptateur fiche → issue (sens inverse) |
| [0172](0172-convention-sot-backlog-md.md) | SoT backlog md |
| [0170](0170-modele-extension-plugin-mega-city.md) | Modèle d'extension (frontière) |

## Notes / décisions

- `status: idea` volontaire — à groomer (archi / PM) avant `ready`.
- Priorité P2 provisoire (alignée city-guided 0064 / 0025) — à réarbitrer au grooming.
- Anti-doublon : **distinct** de 0152 (repro bug), 0171 (push export), 0172 (convention SoT) —
  cette fiche = **boucle d'admission / analyse / PR opt-in** sur issues utilisateurs.
- Pas de fiche séparée rate-limit / anti-flood tant que non priorisé (voir hors-scope).
