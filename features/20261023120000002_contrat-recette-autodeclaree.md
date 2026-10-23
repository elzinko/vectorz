---
id: "20261023120000002"
title: "Contrat de recette auto-déclarée + catalogue (pilote muti validation/)"
type: chore
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, contrat, spike]
depends: ["20261023120000001"]
status: idea
pr:
evidence: none # spike de contrat ; preuve = un répertoire-pilote reconnu comme recette
created: 2026-10-23
---

# 20261023120000002 — Contrat de recette auto-déclarée + catalogue

## En clair

Un répertoire se déclare lui-même **recette réutilisable** en portant un petit fichier de déclaration.
On ne construit pas un système de recettes ailleurs. On pose juste un **contrat** qui vérifie si un
répertoire peut être vu comme une recette, parce qu'il contient ce fichier. Les projets balaient ces
déclarations comme un **catalogue** et peuvent dire « tiens, je tente cet outil ». Idée de Thomas,
2026-10-18. Pilote déjà posé dans muti : `apps/desktop/validation/RECIPE.md`.

## Contexte / Problème

Deux constats de la session du 2026-10-18 (muti).

1. **`SKILL.md` n'est pas le bon support pour déclarer un outil.** `SKILL.md` déclare un *skill* : une
   capacité qu'un humain invoque. Un outil, une recette ou un composant, c'est une *brique* qu'un skill
   (ou n'importe quel objet du domaine) réutilise. Les deux ne se confondent pas. Un répertoire peut
   porter un skill ET être une recette réutilisable : deux déclarations, deux fichiers.
2. **Déclarer et extraire sont deux axes différents.** L'ADR-0015 dit « on extrait le moteur en package
   au 2e consommateur » (anti sur-ingénierie) — vrai pour l'**extraction**, pas pour la **déclaration**.
   Déclarer est bon marché et c'est CE QUI REND la découverte possible. Attendre un 2e besoin pour
   déclarer tue le catalogue. Donc on déclare tout de suite ; on extrait plus tard.

## Proposition

À cadrer en panel. Direction : un **contrat** (ex. `RECIPE.md` ou un petit front-matter) qu'un
répertoire porte pour se déclarer recette ; un **scan** qui bâtit le catalogue des recettes déclarées
d'un (ou plusieurs) projet(s). Spike : éprouver le contrat sur le pilote muti `validation/` avant de
généraliser.

## Critères d'acceptation

Niveau *spike* — on cherche la forme du contrat, pas encore le moteur.

- [ ] Un contrat minimal décide si un répertoire est une recette (il porte le fichier de déclaration).
- [ ] Un scan liste les recettes déclarées d'un projet (catalogue).
- [ ] Le pilote muti `apps/desktop/validation/` est reconnu comme recette par le contrat.
- [ ] La déclaration d'une recette est distincte de celle d'un skill (`SKILL.md`).

## Comment vérifier

- Lancer le scan sur un projet portant au moins un `RECIPE.md` → le catalogue le liste.
- Un répertoire sans déclaration n'apparaît pas au catalogue.

## Notes / décisions

- **Origine** : rédigée dans muti le 2026-10-18 (fiche `muti:features/20261018110931402_contrat-recette-autodeclaree.md`,
  type spike). La fiche muti le dit : « c'est de la méthode (vectorz)… à reprendre dans une session
  vectorz ». Rapatriée ici le 2026-10-23. **Ne pas** déplacer ni modifier la fiche muti ni son pilote.
- Milestone `recettes`, dépend de [Déclarer les outils/recettes/méthodes](20261023120000001_declarer-outils-recettes-methodes-projet.md).
- **Statut idea assumé** : sujet d'architecture, à groomer en panel.
