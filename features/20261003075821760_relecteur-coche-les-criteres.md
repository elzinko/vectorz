---
id: "20261003075821760"
title: Le relecteur coche les critères d'acceptation, pas le constructeur
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [revue]
status: idea
pr:
evidence: none # changement de méthode de revue, pas d'écran
created: 2026-10-03
---

# 20261003075821760 — Le relecteur coche les critères d'acceptation, pas le constructeur

**En clair.** Le gabarit de fiche le dit : une case cochée veut dire « prouvé, jamais
auto-déclaré ». Mais aucun agent n'est chargé de cette preuve. En pratique, celui qui construit la
story coche lui-même ses critères, avant même la revue. On veut que le **relecteur** rejoue
« Comment vérifier », puis coche chaque case avec sa preuve, et qu'il ne dise GO que si toutes les
cases sont prouvées.

**Si tu arrives frais.** Les *critères d'acceptation* sont les cases à cocher d'une fiche : ce qui
doit être vrai pour accepter la story. Le *relecteur* est l'agent `ezk-reviewer`, la revue adverse
de l'étape 7 d'`ezk-sprint`.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-02, PR #333 : le constructeur a coché 7 critères sur 8 dans un commit
à lui (`2fb3500e`, « cocher les critères tenus »), **avant** la revue adverse. Le relecteur a jugé le
diff, mais il n'a confirmé aucune case une par une. Le 2026-10-03, le PO demande : « qui fait cette
validation des critères avec ezk ? ».

**Pourquoi personne ne le fait.** Constat du 2026-10-03 :

- la consigne d'`ezk-reviewer` (`agents/ezk-reviewer.md`) ne parle jamais des critères de la fiche :
  il juge le diff ;
- `ezk-qa` écrit des scénarios de test, mais ne coche pas la fiche ;
- `ezk-sprint` n'a aucune étape « vérifier chaque critère ».

Le gabarit pose la règle ; rien ne la fait tenir.

## Proposition

- À l'étape 7 d'`ezk-sprint`, `ezk-reviewer` reçoit la fiche avec son patch. Il rejoue
  « Comment vérifier » et juge chaque critère d'acceptation : **prouvé** (avec sa preuve : commande
  et sortie, ou `fichier:ligne`) ou **non prouvé** (avec ce qui manque).
- Son verdict liste chaque critère. **Pas de GO** tant qu'un critère reste non prouvé. Le bloc
  « Mesure de suivi » n'est pas concerné : il se relève après la livraison.
- Le constructeur ne coche plus rien lui-même. L'orchestrateur reporte dans la fiche les cases du
  verdict, telles quelles, et le verdict reste attaché à la PR.

## Critères d'acceptation

- [ ] La consigne d'`ezk-reviewer` décrit le jugement critère par critère, avec la preuve exigée, et
      interdit un GO tant qu'un critère n'est pas prouvé.
- [ ] L'étape 7 et la DoD d'`ezk-sprint` disent que les cases sont cochées d'après le verdict du
      relecteur, jamais par le constructeur.
- [ ] Un test de contrat sur le texte vérifie ces deux consignes.

**Mesure de suivi** — sur les 5 prochaines PR de story, chaque case cochée a sa preuve dans le
verdict du relecteur.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
```

- Relire `agents/ezk-reviewer.md` : la section « critères d'acceptation » y figure.
- Relire l'étape 7 d'`ezk-sprint` : les cases viennent du verdict.

## Notes / décisions

- **P1 demandée par le PO** le 2026-10-03.
- Voisine distincte : [« La revue locale rejoue les scripts bash modifiés »](20261002230039755_revue-rejoue-scripts-bash.md)
  (même agent, autre geste : exécuter les scripts, pas valider les critères).
- Lien avec la règle `development/acceptance-criteria-before-merge` : elle garantit que chaque
  critère **peut** se cocher avant le merge ; cette fiche dit **qui** le coche.
