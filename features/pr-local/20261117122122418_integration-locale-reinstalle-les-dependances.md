> 🗎 Rendu de la fiche [features/20261117122122418_integration-locale-reinstalle-les-dependances.md](../20261117122122418_integration-locale-reinstalle-les-dependances.md)

# 20261117122122418 — L'intégration locale réinstalle les dépendances quand le lockfile change

**En clair.** Quand une story ajoute une bibliothèque, son intégration dans main change le fichier des
dépendances, mais personne ne les installe dans le dossier principal. Le PO lance alors mission control
depuis main, et l'écran plante sur une bibliothèque introuvable. L'intégration doit installer les
dépendances elle-même, ou au moins le dire.

**Si tu arrives frais.** `ezk forge integrate` intègre une story dans main. Le lockfile
(`pnpm-lock.yaml`) liste les versions exactes des dépendances ; `pnpm install` les installe dans
`node_modules`.

## Contexte / Problème

Le 2026-11-17, la carte Process zoomable a ajouté `@xyflow/react`. Après son intégration dans main,
l'écran Process du dossier principal affichait : « Failed to resolve import @xyflow/react/dist/style.css ».
Il a fallu lancer `pnpm install --frozen-lockfile` à la main. Le PO serait tombé dessus en testant.

## Proposition

Après une intégration locale (squash local ou avance rapide), si `pnpm-lock.yaml` a changé entre l'ancien
et le nouveau main, `ezk forge integrate` lance `pnpm install --frozen-lockfile` dans le dossier
principal. Si l'installation échoue, il le dit en une ligne, sans annuler l'intégration.

## Critères d'acceptation

- [x] Une intégration qui change le lockfile installe les dépendances dans le dossier principal.
- [x] Une intégration qui ne change pas le lockfile n'installe rien.
- [x] Un échec d'installation est dit en une ligne et laisse l'intégration en place.

## Comment vérifier

```bash
cd products/mega-city && pnpm exec vitest run -t "forge integrate"
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 3 critères prouvés, dont un rejeu du script sur entrées hostiles. Le geste vit dans `ship-merge.sh --local` ; `EZK_INTEGRATE_NO_INSTALL=1` le coupe. Portée : le squash local seulement ; push-ff et --remote n'installent rien (fiche à part si besoin). Latent, non bloquant : un `git diff` en échec déclencherait l'installation au lieu d'être signalé.


- Origine : [rétro du sprint 2 du 17 novembre](../../docs/captures/2026-11-17-retro-sprint-2-tout-ce-qui-est-relie.md),
  proposition 2, retenue par délégation du PO absent.


## Validation

| Modalité | Statut |
|---|---|
| Gate mega-city | ✅ tests + 48 suites |
| Revue ezk-reviewer | ✅ GO 3/3 |
| Before / after (UI) | N.A. — outillage sans écran |
