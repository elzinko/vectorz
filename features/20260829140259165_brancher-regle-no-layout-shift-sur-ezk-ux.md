---
id: "20260829140259165"
title: Brancher la règle UX « no-layout-shift » sur l'agent ezk-ux
type: chore
priority: P3
product: mega-city
version:
epic:
status: blocked
ready:
pr:
created: 2026-08-29
---

# 20260829140259165 — Brancher la règle UX « no-layout-shift » sur l'agent ezk-ux

## En clair

On vient de poser une règle d'interface dans le corpus : « réserver l'espace des
éléments optionnels » (`products/mega-city/rules/ux/no-layout-shift.md`). Pour l'instant
elle s'applique seulement par consigne au modèle (`enforcement: prompt`). Quand l'agent
`ezk-ux` existera, il faudra la brancher pour de bon : en faire un point vérifié et la
ranger dans le moteur de règles design. Cette fiche garde le fil pour ne pas l'oublier.

## Contexte / Problème

- La règle `ux/no-layout-shift` existe déjà, mais **dormante** : enforcement `prompt`,
  aucun bundle, aucun profil, aucun juge automatique.
- Le moteur de règles UX et l'agent `ezk-ux` censé les faire respecter sont **conçus mais
  pas encore construits** — voir [ADR-0026](../products/mega-city/docs/adr/0026-capacite-ux-agent-plus-skill-mince.md)
  (action items 2, 3 et 5 non faits).
- Tant que l'agent n'existe pas, on ne peut pas mettre `agent: ezk-ux` en enforcement :
  aucune règle du corpus ne référence un agent inexistant.
- D'où le **blocage** : cette fiche dépend de la création de l'agent `ezk-ux`
  (« la fiche de l'agent »).

## Proposition

Quand l'agent `ezk-ux` sera créé (sa propre fiche, ou les action items d'ADR-0026) :

1. **Promouvoir l'enforcement** de `ux/no-layout-shift` : ajouter
   `type: agent-check, agent: ezk-ux` à côté du `type: prompt`.
2. **Trancher le format définitif** de la règle UX : garder le frontmatter iamthelaw
   (`id` / `kind` / `level` / `enforcements`) OU migrer vers le frontmatter copywriterz
   (`id` / `tags` / `priority` / `enabled`) qu'envisage ADR-0026 §1bis — **un seul
   dialecte**, pas deux.
3. **Ranger** la règle dans un bundle design (`bundles/ux.yml`) et l'exposer dans le(s)
   profil(s) pertinents (desktop, mobile).
4. **Vérifier** qu'`ezk-ux audit` la contrôle réellement sur une app qui tourne (capture
   avant/après), exception comprise.

## Critères d'acceptation

- [ ] `ux/no-layout-shift` porte un enforcement `agent-check` vers `ezk-ux`.
- [ ] La règle appartient à un bundle et à au moins un profil.
- [ ] `ezk-ux audit` signale un saut de mise en page non justifié (déclenché tout seul)
      et laisse passer un push après clic (l'exception encadrée).
- [ ] Format de règle UX tranché et unique (pas deux dialectes frontmatter qui divergent).

## Comment vérifier

<À préciser au grooming, une fois `ezk-ux` défini. Piste : rejouer `ezk-ux audit` sur un
écran cobaye portant un élément qui s'affiche après détection (ex. la carte de
téléchargement de muti), et vérifier que la règle est citée dans le plan de correctifs.>

## Notes / décisions

- **Dépend de** la création de l'agent `ezk-ux` (ADR-0026, statut « proposé »). La fiche
  reste `blocked` tant que « la fiche de l'agent » n'est pas faite.
- **Origine concrète** : muti, page de téléchargement. La phrase « Installateur pour votre
  système » s'affichait sur le seul OS détecté et décalait ce bloc par rapport aux autres.
  Retrait immédiat côté muti ; la règle générale est née de ce cas.
- **Format susceptible d'évoluer** (« ou comportement selon comment le domaine aura
  évolué ») : selon l'implémentation du moteur UX, « associer la règle » pourra vouloir dire
  un fichier `.md` à frontmatter, une entrée de profil, ou un check d'agent.
- **Priorité P3** : différée car bloquée par un prérequis lointain ; à remonter quand
  `ezk-ux` passe en construction.
