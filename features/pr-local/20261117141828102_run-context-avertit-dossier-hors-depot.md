> 🗎 Rendu de la fiche [features/20261117141828102_run-context-avertit-dossier-hors-depot.md](../done/20261117141828102_run-context-avertit-dossier-hors-depot.md)

# 20261117141828102 — `ezk run context` avertit quand le dossier de la session n'est pas dans le dépôt visé

**En clair.** Le 17 novembre, un run autonome s'est ouvert dans un dossier vide, hors de vectorz.
L'agent développeur `ezk-dev`, qui travaille dans un worktree isolé, n'a pas pu démarrer : il exige un
dépôt git comme dossier de session. Environ 300 000 jetons sont partis en deux appels sans code. Le
contexte de run, affiché à l'ouverture, avertit désormais quand le dossier courant n'est pas dans le
dépôt visé, et dit comment y déplacer la session.

**Si tu arrives frais.** `ezk run context` est la première sortie d'un run `ezk-product-build` (étape 0).
`--root` y désigne le dépôt travaillé ; le dossier courant est celui de la session Claude Code.

## Contexte / Problème

- Erreur vue le 17 novembre : `Cannot create agent worktree: not in a git repository`.
- Après déplacement de la session dans un worktree de vectorz, l'agent a démarré dans son propre
  worktree isolé, qui ne pouvait pas écrire dans celui de la story ; ce worktree vide a été effacé.

## Proposition

`ezk run context` compare le dossier courant à `--root`. Hors du dépôt, il imprime une ligne
d'avertissement : « la session n'est pas dans le dépôt visé : les agents isolés ne démarreront pas ;
déplace la session dans le dépôt avant de déléguer ». L'avertissement ne bloque jamais, comme celui du
retard sur `origin/main`.

## Critères d'acceptation

- [x] Lancé hors du dépôt visé, `ezk run context` imprime l'avertissement et sort en 0.
- [x] Lancé dans le dépôt ou dans un de ses worktrees, il n'imprime rien de plus qu'aujourd'hui.

## Comment vérifier

```bash
(cd /tmp && ezk run context --root "$OLDPWD" --mode auto --delivery per-feature --tokens lean)   # avertit
ezk run context --mode auto --delivery per-feature --tokens lean                                  # n'avertit pas
```

## Notes / décisions

- Livrée le 2026-11-17, écrite par l'orchestrateur (story courte du lot). Critères prouvés par ezk-reviewer (GO) : depuis /tmp, une ligne « Dossier … hors du dépôt visé … déplace la session » et code 0 ; depuis le dépôt ou un worktree, sortie inchangée (test d'égalité, 4 cas sur dépôts jetables). Le routeur `ezk` passe le vrai dossier de l'utilisateur par `INIT_CWD`.

- Origine : [rétro du 17 novembre, deux pilotes sur un dépôt](../../docs/captures/2026-11-17-retro-sprint-objectifs-versions-deux-pilotes.md), proposition P3.
- Priorité remontée en P1 par ezk-pm le 17 novembre, par délégation du PO : le coût vécu dépasse celui de la proposition P2.
- Mesure (retirabilité) : 0 échec de démarrage de l'agent développeur sur les 5 prochains runs.


## Validation

| Modalité | Statut |
|---|---|
| Gate mega-city | ✅ voir revue |
| Revue ezk-reviewer | ✅ GO 2/2 prouvés |
| Before / after (UI) | N.A. — une ligne de sortie de commande |
