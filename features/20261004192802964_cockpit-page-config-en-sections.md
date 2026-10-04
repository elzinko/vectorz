---
id: "20261004192802964"
title: "Cockpit : la page « config » du projet choisi, en sections qui se lisent chacune seule"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [ezk-map, config]
status: ready
pr:
evidence: before-after
created: 2026-10-04
split_from: "20260904080827072"
---

# 20261004192802964 — Cockpit : la page « config » du projet choisi, en sections

**En clair.** La config d'un projet ne se lit aujourd'hui que dans le terminal, en trois commandes.
Cette fiche l'affiche dans le cockpit, sur une page « config » du projet choisi. La page montre les
interrupteurs GitHub, les règles propres du projet et ses critères de « prête ». Elle n'écrit rien,
et un fichier illisible ne casse que sa section.

**Si tu arrives frais.** Le *cockpit* est le tableau de bord de la méthode (`ezk dashboard`), avec
son menu de projets (fiche sœur 20261004192802897). La config d'un projet vit dans trois fichiers
de `.vectorz/` : `config.yml` (GitHub), `rules.yml` (règles propres) et `dor.yml` (critères de
« prête »). Le terminal les lit par `ezk config show`, `ezk rules show` et `ezk dor show`.

## Contexte / Problème

Troisième des trois fiches nées du découpage de « Un seul tableau de bord pour tous tes projets »
(20260904080827072), décidé par le PO le 2026-10-04.

- **La config d'un projet ne se lit que dans le terminal**, en trois commandes. Aucun projet local
  n'a aujourd'hui de `.vectorz/config.yml`, `rules.yml` ni `dor.yml` (constaté le 2026-10-03) : une
  comparaison sur eux se ferait à vide.
- **Une vue de données qui échoue rend une erreur pour toute la page** (`bin/ezk-map.ts`, vers la
  ligne 186, constaté le 2026-10-03).

## Valeur — ce que coûte de ne rien faire

- Pour connaître la config d'un projet, il faut trois commandes et savoir lesquelles.
- La page « config » est aussi celle où la fiche des réglages d'agents
  (20261002205205417) ajoutera sa section modifiable.

## Proposition

1. **Une page « config »** du projet choisi dans le menu, faite de trois sections : les
   interrupteurs GitHub (PR, CI, revue Codex), les règles propres, les critères de « prête ».
   Toutes en lecture seule.
2. **Les mêmes lecteurs que le terminal** : la page passe par les fonctions qu'utilisent
   `ezk config show`, `ezk rules show` et `ezk dor show`, pas par une copie.
3. **Chaque section se lit seule** : un fichier illisible n'affecte que sa section, qui affiche
   « illisible » et le chemin du fichier. Les autres restent visibles.

## Critères d'acceptation

- [ ] La page « config » montre, pour le projet choisi, les mêmes valeurs que `ezk config show`,
      `ezk rules show` et `ezk dor show`. Elle n'écrit rien. La preuve se fait sur une copie de
      test dont les trois fichiers portent des valeurs différentes des défauts.
- [ ] Un fichier de config illisible n'affiche « illisible » et son chemin que dans sa section. Les
      deux autres sections restent visibles.
- [ ] Un projet à l'état « méthode non prise en charge » n'a pas de page « config » inventée.

## Comment vérifier

```bash
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts
# copie de test créée au build : config.yml, rules.yml et dor.yml y portent des valeurs
# différentes des défauts
ezk supervision registry-add essai-config <chemin-de-la-copie-de-test>
ezk --root <chemin-de-la-copie-de-test> config show
ezk --root <chemin-de-la-copie-de-test> rules show
ezk --root <chemin-de-la-copie-de-test> dor show
ezk dashboard
# → choisir essai-config, ouvrir « config » : mêmes valeurs que les trois commandes
# → casser config.yml dans la copie : seule la section GitHub affiche « illisible » et son chemin
```

- vue config : `http://127.0.0.1:<port>/config` (avant : page absente ; après : trois sections)

## Glossaire

- `section` — un bloc de la page « config », lu depuis un seul fichier de `.vectorz/`.
- `lecture seule` — la page affiche, elle n'écrit aucun fichier.

## Notes / décisions

- 2026-10-04 : née du découpage de 20260904080827072 (décision PO, run `ezk-product-build`), avec
  ses critères 9 et 10. Dépend du socle (20261004192802828 : `config show` commande projet) et du
  menu (20261004192802897 : le choix du projet).
- Critère ajouté au découpage : un projet « méthode non prise en charge » n'a pas de page config
  inventée (le critère 6 du parent le disait pour la config, il revient à cette page).
- L'écriture dans la config (section « Agents ») reste à la fiche sœur 20261002205205417, qui
  amendera l'ADR-0057.
- Vise les projets hôtes : règle `development/host-project-proof-before-ship`, preuve sur la copie
  de test inscrite au registre, ou sur le banc cop1-cobaye, avant le ship.
- **Prête le 2026-10-04** (run `ezk-product-build` en mode auto, sans `--review`) : critères hérités
  du parent prêt, concurrence `ezk-pm` GO sur la porte « prête ».
