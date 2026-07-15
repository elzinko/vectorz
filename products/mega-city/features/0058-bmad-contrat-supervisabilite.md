---
id: 0058
title: adapter BMAD au contrat de supervisabilité — 2ᵉ méthode émettrice (adaptateur→overlay→fork jetable)
type: feature
priority: P2
status: todo
pr:
created: 2026-07-15
---

## Contexte / Problème

Le contrat de supervisabilité v0.1 (gelé côté cop1, D12 : « l'émetteur canonique est fourni
par la méthode ») n'a qu'**une** méthode émettrice : mega-city (fiche 0050, in-progress). Une
abstraction à un seul consommateur n'est pas prouvée — et mega-city ne peut pas révéler les
biais du contrat puisqu'elle les partage (co-conçus : mêmes gates, mêmes hypothèses sur « une
étape »). Il faut une méthode **étrangère**. BMAD-METHOD est le candidat idéal : phases
explicites avec artefacts (frontières naturelles pour `gate.reached`), suffisamment
différente (multi-agents à personas, workflow long) pour stresser le contrat — et cop1
**pilote déjà** des commandes BMAD (sprint-core : BMADSessionStep, BMADCommandPort,
SupervisorService). Il ne manque que l'émission.

## Proposition

Expérience **bornée** (pas un produit) : rendre un run BMAD conforme au contrat, par
**échelle graduée** — ne monter d'un cran que si le précédent échoue :

1. **Adaptateur à la frontière d'orchestration** : cop1 voit déjà début/fin de commande,
   artefacts, statut → émission déterministe (classe A), **zéro ligne changée dans BMAD**.
2. **Overlay natif** si la lecture stricte de D12 exige que la méthode *embarque* son
   émetteur : la « méthode » devient {BMAD vanilla **épinglé** + overlay émetteur} via le
   mécanisme d'extension BMAD (modules/skills v6), `method:{name,version}` honnête.
3. **Fork jetable pinné** en dernier recours — instrument de mesure, jamais à maintenir
   (rebaser des prompts en langage naturel = le pire type de conflit).

**Périmètre strict : instrumenter, PAS alléger.** « BMAD trop long » est un problème
orthogonal (profils/sélection de workflows, chantier séparé si jamais) ; les mélanger rend
le REX ininterprétable. **Séquencement : ne démarre qu'après 0050 verte** (validateur OK
sur mega-city) — sinon on stresse le contrat sur deux fronts.

## Critères d'acceptation

- [ ] ADR au démarrage : adaptateur vs overlay vs fork — tranché AVANT de coder (et la lecture de D12 « fourni par la méthode » explicitée côté contrat)
- [ ] Un run BMAD réel (une story de bout en bout) émet un `events.jsonl` qui passe le journal-validator (cop1 0027) et s'affiche dans le lecteur mission-control (0031)
- [ ] Zéro modification des prompts/personas BMAD au-delà des consignes d'émission (~15 l.) — toute envie d'allègement part en fiche séparée
- [ ] Chaque friction contrat/méthode (gate interne invisible, phase qui boucle, mapping douteux) documentée comme finding v0.2 (fiche cop1 0029) — jamais maquillée pour « passer le validateur »
- [ ] Journal de migration tenu au fil de l'eau (squelette du 1ᵉʳ article de la série 0059)
- [ ] Si distribution publique : nom **sans « BMad »** (trademark BMad Code, LLC) + notice MIT conservée ; « compatible with BMad Method » est permis

## Notes

- Faits vérifiés (workflow 2026-07-15) : licence **MIT + trademark notice** (fork légal mais
  renommage obligatoire si distribué) ; **v6 très modulaire** (modules installables, skills,
  overrides `.toml`, BMad Builder) → un vrai fork est rarement nécessaire, la customisation
  est prévue par le projet ; « c'est long » **confirmé** même par les adeptes (~5-6 workflows
  documentaires avant le code) — d'où le périmètre strict ci-dessus.
- Issue « échec instructif » prévue : si BMAD ne se laisse pas instrumenter proprement à un
  niveau de l'échelle, c'est un finding v0.2 documenté, pas une perte.
- Limite d'honnêteté du REX : deux méthodes pilotées par cop1 ne prouvent pas la généralité
  universelle — seulement que le contrat survit à une méthode non-maison.
- Liens : 0050 (kit émetteur, prérequis), 0059 (série d'articles), cop1 0027 (validateur),
  0029 (différés v0.2), 0031 (lecteur mission-control).
