> 🗎 Rendu de la fiche [features/20261104095401066_compte-rendu-sprint-faux-zero-tokens.md](../done/20261104095401066_compte-rendu-sprint-faux-zero-tokens.md)

# 20261104095401066 — Le compte rendu de sprint écrit « 0 tokens » quand il ne mesure pas

**En clair.** Le compte rendu du sprint 27 dit « consommé **0 tokens** ». C'est faux : la fenêtre du
sprint ne contenait aucune mesure, et le rapport est retombé sur le total de la session. Un compte
rendu doit écrire « jetons non mesurés » dans ce cas, jamais un zéro. Mission control affiche
désormais ces comptes rendus : un faux zéro s'y verrait.

## Contexte / Problème

Constaté le 2026-11-04 sur `docs/sprints/2026-11-04-sprint-mission-control-montre-les-bons-etats-et-le-work.md` :
l'ouverture dit « consommé **0 tokens** (grain `session`, fenêtrage sprint vide (aucun message.usage
dans la fenêtre) — repli au grain session (total du run).) ». La phrase d'ouverture
(`products/mega-city/src/sprint-metrics/domain/render.ts`, ligne 28) écrit le total même quand il ne
mesure rien du sprint. La règle `human-facing-lisibility` interdit le faux zéro.

## Proposition

Quand les jetons ne sont pas mesurés au grain du sprint, l'ouverture écrit « jetons non mesurés pour ce
sprint » et garde le détail chiffré en bas, sous le bloc « Détail ». Même règle que la Vue d'ensemble
(fiche [Le dernier sprint et ses indicateurs](../done/20261104090517904_vue-ensemble-dernier-sprint-et-kpi.md)) :
absent = dit en mots.

## Critères d'acceptation

- [x] Un compte rendu dont les jetons retombent au grain de la session n'écrit pas « 0 tokens » en ouverture, mais « jetons non mesurés pour ce sprint ».
- [x] Un compte rendu mesuré au grain du sprint garde son chiffre en ouverture.
- [x] Le bloc « Détail » garde ses chiffres bruts, grain compris.
- [x] Les tests du rendu couvrent les deux cas.

## Comment vérifier

```bash
pnpm --dir products/mega-city vitest run src/sprint-metrics
```

## Notes / décisions

- Issue de la rétro légère des sprints 27-28 (`docs/captures/2026-11-04-retro-sprints-27-28-run-autonome-light.md`), proposition P1, retenue par `ezk-pm` en mode auto.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ |
| Revue | ✅ GO ezk-reviewer |
| Before / after (UI) | N.A. texte de compte rendu sans écran |
