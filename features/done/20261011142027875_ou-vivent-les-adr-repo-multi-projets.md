---
id: "20261011142027875"
title: "Où vivent les ADR dans un repo multi-projets (décision + panel)"
type: chore
priority: P2
product: vectorz
milestone:
version: v0.16.0
labels: [adr, archi]
status: shipped
blocked:
split_from: "20261010114133097"
pr: "local dc165b3c"
evidence: none # décision + ADR, pas d'écran
created: 2026-10-11
---

# 20261011142027875 — Où vivent les ADR dans un repo multi-projets

**En clair.** Les ADR sont écrits dans deux dossiers (`docs/adr/` et
`products/mega-city/docs/adr/`), avec deux numérotations. Cette cohabitation n'a jamais été
tranchée : faut-il un seul dossier, ou deux assumés avec une règle claire ? On veut une
**décision d'architecture écrite** (un ADR court), appuyée sur un panel, avant tout
déplacement de fichiers.

**Si tu arrives frais.** Un *ADR* est une note de décision d'architecture, numérotée. Le dépôt
est un monorepo : la méthode (`products/mega-city/`) et le reste (`docs/`) ont chacun leur
dossier d'ADR. Le câblage « prochain id libre des deux dossiers » est traité à part
(fiche sœur [ezk adr new](20261011142027748_ezk-adr-new-prochain-id-libre.md)) ; ici, c'est la
**décision de fond**.

## Contexte / Problème

- Un seul **espace d'id logique**, deux **séquences physiques**, aucune autorité d'allocation ni
  règle écrite sur « quel ADR va où ».
- Leçon mémoire : lire les ADR récents **avant** toute reco d'archi ; ne pas recommander la fusion
  des dossiers sans panel.

## Proposition

Un **panel** (`ezk-architect` + `ezk-pm`) tranche et écrit un **ADR court** « où vivent les ADR
dans un repo multi-projets » : soit un dossier unique (avec le plan de migration), soit deux
dossiers assumés avec une règle de routage explicite. Pas de déplacement de fichiers avant cet ADR.

## Critères d'acceptation

- [ ] Un ADR tranche où vivent les ADR (dossier unique, ou deux assumés + règle de routage), ou
      acte explicitement le statu quo — appuyé sur un panel.
- [ ] Si l'ADR décide une fusion, il porte le plan de migration (sans l'exécuter dans cette fiche).

## Comment vérifier

```
Relecture : après le panel, l'ADR existe et dit clairement la règle « quel ADR va dans quel
dossier » ; aucune reco de fusion n'a été appliquée sans cet ADR.
```

## Notes

- Issue du découpage de « Un allocateur d'id d'ADR unique sur les deux dossiers » (20261010114133097)
  au grooming du 2026-10-11 : la partie **décision/panel** est isolée ici, rangée en v0.16 (« ranger
  la maison ») ; le câblage `--next` est tiré tôt (v0.11, fiche sœur).
- **Grooming 2026-10-13** : laissée `idea` + `blocked:` à dessein. Son livrable est un **panel + ADR**,
  pas du code — décision structurelle (leçon mémoire : pas de reco de fusion des dossiers sans panel).
  Elle se tranche en séance avec le PO, pas par un run autonome. Les 8 autres fiches v0.16 sont prêtes.

## Décision (2026-10-15, en séance avec le PO)

Tranchée : **option B — garder les deux dossiers + écrire la règle de routage**, actée dans
[ADR-078](../../docs/adr/ADR-078-ou-vivent-les-adr-routage.md). Le panel adverse complet a été jugé
**non nécessaire** : l'analyse en lecture seule (lentilles architecte + method-owner) a convergé, et
l'option ne déplace **rien** physiquement (0 lien cassé, respecte ADR-025 §5 « les ADR ne déménagent
pas »). Le vrai trou était l'absence d'une règle écrite, pas la numérotation (déjà réglée par la suite
unique + `ezk adr new`). Décision du PO.

- [x] Un ADR tranche où vivent les ADR (deux dossiers assumés + règle de routage) — ADR-078.
- [x] Pas de fusion décidée → pas de plan de migration à porter (N.A.).
