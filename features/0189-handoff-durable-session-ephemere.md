---
id: 0189
title: ezk-archive — le handoff doit survivre aux sessions éphémères (cloud/conteneur jetable)
type: bug
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-09
---

# 0189 — Handoff durable en session éphémère

## Contexte / Problème

`ezk-archive` persiste la note de clôture dans `.claude/handoff.md`, **gitignoré**
par conception (« éphémère personnel, jamais committé » ; anneau FIFO ; borné par
`handoff.sh carry` au titre de `token-economy/read-once`).

Ce design est **local-first** : il suppose un **poste persistant** où le fichier
survit d'une session à l'autre. Or dans une session **cloud / conteneur jetable**
(Claude Code web, exécution distante), le conteneur est **recyclé** et **tout
fichier non poussé est perdu**. La note de handoff **n'atteint donc jamais la
session suivante** — exactement ce que le rituel est censé empêcher.

Constat concret (session gmail-cleanerz, 2026-08-09) : après `run`, le handoff a
été écrit dans `.claude/handoff.md` (gitignoré) ; le code et le backlog étaient
saufs (poussés), mais la note elle-même n'aurait pas survécu au recyclage. Seuls
deux rappels **non dérivables** du repo auraient été perdus (un écart de doc, une
divergence de convention du gate).

**Même famille** que le bug déjà rencontré où `handoff.sh` a sur-ignoré `.claude/`
entier alors qu'il était committé (le bind) : le script raisonne comme si
`.claude/` n'était jamais versionné.

## Proposition (à groomer — ne pas trancher ici)

Faire de **l'hôte éphémère un environnement de premier rang** pour la méthode.
Pistes non exclusives :

- **A — Handoff committé (public) distinct de la note perso** : sortir un
  handoff *durable* du gitignore (ex. `docs/sessions/HANDOFF.md` ou entrée
  `docs/sessions/`), la note `.claude/handoff.md` restant l'anneau local perso.
- **B — Détection d'éphémère → bascule** : si l'hôte est jetable (heuristique :
  variable d'env cloud, absence de home persistant), `run` **committe** le
  handoff (ou le pousse sur une branche/notes) au lieu de le laisser gitignoré.
- **C — Le handoff devient un pointeur** : écrire les faits **non dérivables**
  dans des artefacts **déjà commités** (backlog, ADR, mémoire projet) ; la note
  ne fait que **pointer** — rien d'unique n'y vit. (Aligne avec l'esprit « le
  repo est la source de vérité ».)

Le gate `check.sh` rend déjà `HANDOFF … gitignored=1` : ce signal peut déclencher
un **warning** « handoff non durable sur cet hôte » en attendant la décision.

## Critères d'acceptation (préliminaires — à affiner au grooming)

- [ ] Décision A/B/C (ou hybride) enregistrée (ADR de la méthode).
- [ ] Sur un hôte éphémère, la note de clôture (ou son contenu non dérivable) **survit** à un nouveau clone — cas reproduit.
- [ ] Aucune régression du mode local (anneau FIFO gitignoré conservé si pertinent).
- [ ] Le sur-ignore `.claude/` par `handoff.sh` est corrigé **à la source** (ne plus ignorer un `.claude/` committé — cf. correctif ad hoc côté gmail-cleanerz).
- [ ] `token-economy/read-once` respecté (pas de relecture intégrale du handoff).

## Notes / décisions

- Déclencheur : sessions Claude Code **cloud** (exécution distante) — hôte
  officiellement supporté, donc le rituel de clôture doit y être fiable.
- Correctif ad hoc déjà appliqué côté produit (gmail-cleanerz) : `.gitignore`
  restreint à `.claude/handoff.md` au lieu de `.claude/` — à **remonter en source**
  dans `handoff.sh` (`ensure_gitignored`).
- Voisin méthode : 0186 (versioning des skills déployées) et 0188 (ADR lisibles) —
  même thème « la méthode doit être fiable hors du poste d'origine ».
