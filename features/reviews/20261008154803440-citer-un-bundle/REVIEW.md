# Revue adverse — 20261008154803440 (citer un bundle)

- **Fiche** : [20261008154803440](../../done/20261008154803440_consommateur-cite-un-bundle.md)
- **Branche** : `feat/20261008154803440-citer-un-bundle`
- **Reviewer** : `ezk-reviewer` (Opus, modèle distinct du constructeur)
- **Verdict** : **GO** (aucun bloquant)
- **Date** : 2026-10-10

## En clair

Le patch est correct et sans danger pour le catalogue réel. Les 4 critères de la fiche
passent réellement, le code est pur et déterministe, et le changement est **latent** : aucun
consommateur réel ne cite encore de bundle, donc zéro régression possible. Deux réserves non
bloquantes, assumées par le périmètre de la fiche (avis `ezk-architect` GO).

## NO-GO (bloquant)

Aucun.

## À corriger (non bloquant) — risques possédés par le PO

- **[P1] `src/core/expand.ts` — `appliedRuleIds` n'est appelé par aucun consommateur de
  production (brique posée pour F2).** Le bind ne l'appelle pas encore : `ENTRY.md` se
  construit depuis les profils et le manifeste, pas depuis les `applies`/`interactions`. La
  promesse « dépliée au bind » de la fiche n'est donc pas *observable* ici — c'est le câblage
  de **F2** ([20261008154804532](../../20261008154804532_dod-dor-contrat-partage.md)). Les 4
  critères passent quand même (critère 1 prouvé par test unitaire ; critère 3 négatif,
  satisfait à vide). **Risque** : si F2 ne se fait pas, `appliedRuleIds` devient du code mort
  à retirer (`clean-code/no-dead-code`, MUST). F2 est la prochaine fiche P0 du plan → risque
  assumé.

- **[P2] `src/core/graph.ts` — garde d'unicité id règle↔bundle absente (latent).** Le routage
  repose sur `catalog.bundles.has(id)`. Rien n'impose l'unicité d'un id entre règles et
  bundles. Aucune collision dans le catalogue réel (règles en `thème/slug`, bundles plats).
  Garde manquante, pas un bug présent.

## Ce qui a été activement éprouvé et qui tient

- Id de bundle inconnu → `graph:check` **rouge** (routé en arête règle cassée, `validateGraph`
  la remonte, `compileGraph` throw). Pas d'ignore silencieux.
- Pas de double extraction : les filtres `applies` (`!has`) et `applies-bundle` (`has`) sont
  exclusifs → un bundle ne crée jamais d'arête règle cassée en parallèle (test dédié).
- Rétro-compat : changement latent, prouvé sur le catalogue réel (toutes les valeurs réelles de
  `applies`/`interactions` portent un `/`, aucune n'est un bundle).
- `appliedRuleIds` « par référence » : ne renvoie que des ids, jamais le texte ; cycle-safe
  (`seen`) ; déterministe (`localeCompare`).
- Vocabulaire fermé : tests `graph-vocabulary` (couples `applique`) et `graph` (16→18) mis à
  jour délibérément.

## Gate locale (rejouée par le constructeur)

- `pnpm --dir products/mega-city test` : **1899/1899 vert** (154 fichiers).
- `pnpm --dir products/mega-city graph:check` : **aucun lien cassé**.
- `tsc --noEmit` : OK.
