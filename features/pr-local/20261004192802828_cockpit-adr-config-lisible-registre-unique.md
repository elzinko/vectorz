> 🗎 Rendu de la fiche [features/20261004192802828_cockpit-adr-config-lisible-registre-unique.md](../20261004192802828_cockpit-adr-config-lisible-registre-unique.md)

# 20261004192802828 — Cockpit, socle : l'ADR, la config lisible depuis un autre projet, un seul registre

**En clair.** Avant de construire le cockpit, on pose son socle, sans écran. Un ADR consigne la
décision : un seul tableau de bord pour tous les projets. `ezk config show` lit la config d'un
autre projet par `--root`, et seule cette option peut rediriger une écriture. Et l'inscription d'un
projet au registre dit quel fichier elle a écrit, et prévient quand c'est la copie d'un worktree.

**Si tu arrives frais.** Le *cockpit* est le tableau de bord de la méthode (`ezk dashboard`), qui
devient multi-projets. Le *registre* est `supervision.registry.yaml` : la liste des projets suivis
(id, chemin, méthode). Une *commande projet* est une commande `ezk` marquée `project: true` dans
`products/mega-city/ezk-manifest.yml` : elle sait viser un autre projet avec `--root`.

## Contexte / Problème

Première des trois fiches nées du découpage de
[« Un seul tableau de bord pour tous tes projets »](../done/20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md)
(20260904080827072), décidé par le PO le 2026-10-04 pour tenir le coût d'un sprint. Les deux
suivantes construisent l'écran ; celle-ci pose ce dont elles ont besoin.

- **La décision n'est écrite nulle part.** Le PO l'a tranchée le 2026-10-02 (global, pas une app
  par projet), puis au grooming le 2026-10-03 (le tableau de bord devient le cockpit, le registre
  de la supervision est le registre unique). Aucun ADR ne la consigne.
- **`ezk config` ne sait pas viser un autre projet.** `ezk rules show` et `ezk dor show` le savent :
  ce sont des commandes projet. `ezk config` ne l'est pas. Elle sait aussi écrire
  (`github on|off`) : la déclarer telle quelle « commande projet » permettrait d'écrire par erreur
  dans un autre projet. Le routeur refuse un domaine qui mêle une commande sans verbe et des verbes
  (`src/core/ezk-cli.ts`, vers la ligne 136) : toutes les commandes `config` doivent donc prendre un
  verbe (constaté le 2026-10-03).
- **Le registre se dédouble depuis un worktree.** `bin/supervision-registry-add.ts` cherche
  `supervision.registry.yaml` en remontant depuis le projet, puis depuis le dossier où on le lance.
  Lancé depuis un worktree, il écrit dans la copie du registre propre à ce worktree ; le cockpit,
  lancé depuis le dossier principal, ne la voit pas (constaté le 2026-10-03).

## Valeur — ce que coûte de ne rien faire

- Les fiches suivantes du cockpit n'ont ni décision écrite à citer, ni moyen de lire la config d'un
  autre projet par la même voie que le terminal.
- Un projet inscrit depuis un worktree n'apparaît jamais dans le cockpit, sans message.

## Proposition

1. **Un ADR** dans `products/mega-city/docs/adr/` : global ; le tableau de bord devient le cockpit ;
   le registre de la supervision est le registre unique, lu et jamais écrit par le cockpit. Il dit
   pourquoi le Moniteur (option B, plugin cop1 hors méthode, ADR-0039) et la fusion (option C) sont
   écartés, et il garde les deux règles de sûreté de l'ADR-0057 : un projet se choisit par son
   identifiant, jamais par un chemin ; un pouce s'écrit dans le projet choisi.
2. **`ezk config show`** lit la config du projet que vise `--root`. L'écriture
   (`ezk config github on|off`) suit la règle livrée le 2026-10-04 : elle va au projet de l'option
   `--root`, sinon au projet du dossier courant ; une variable `EZK_ROOT` restée dans le shell ne la
   redirige jamais.
3. **Le registre dit où il écrit.** `registry-add` écrit dans le registre du checkout où on le lance
   (le fichier est suivi par git : c'est un changement à committer). Il imprime le fichier écrit.
   Lancé depuis un worktree, il prévient que le cockpit du dossier principal verra le projet après
   le merge.

## Critères d'acceptation

- [x] Un ADR consigne la décision : global, le tableau de bord comme cockpit, le registre de la
      supervision comme registre unique. Il dit pourquoi le Moniteur et la fusion sont écartés.
- [x] `ezk --root <projet> config show` affiche la config d'un autre projet.
- [x] Une variable `EZK_ROOT` restée dans le shell ne redirige pas `ezk config github off` :
      sans l'option `--root`, l'écriture va au projet du dossier courant.
- [x] `ezk config show` lancé sans `--root` affiche la config du projet courant, comme aujourd'hui
      `ezk config`.
- [x] `ezk supervision registry-add` imprime le chemin du registre qu'il a écrit. Lancé depuis un
      worktree, il prévient que le cockpit du dossier principal verra le projet après le merge.

## Comment vérifier

```bash
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts
ezk --root ~/git/bacasable/muti config show          # la config de muti
EZK_ROOT=~/git/bacasable/muti ezk config github status   # → la config du dossier courant, pas muti
ezk config show                                      # la config du projet courant
# depuis un worktree de vectorz :
ezk supervision registry-add essai /tmp/essai        # → imprime le registre écrit, et prévient (worktree)
```

## Dépendances externes

- **dépendance muti — accès constaté le 2026-10-04.** Dépôt `~/git/bacasable/muti`, sur `main`,
  fiches au format 5. Sert à prouver `config show` sur un autre projet.

## Glossaire

- `registre` — `supervision.registry.yaml` : la liste des projets suivis (id, chemin, méthode).
- `commande projet` — commande `ezk` marquée `project: true` au manifeste ; elle lit le projet que
  désigne `--root`.

## Notes / décisions

- 2026-10-04 : née du découpage de 20260904080827072 (décision PO, run `ezk-product-build`), avec
  ses critères 1, 12, 13 et 14. Les deux sœurs :
  [la liste des projets et leurs fiches](../20261004192802897_cockpit-menu-projets-et-leurs-fiches.md)
  (20261004192802897), [la page « config »](../20261004192802964_cockpit-page-config-en-sections.md)
  (20261004192802964).
- Critère ajouté au découpage : `config show` sans `--root` garde le comportement d'aujourd'hui (le
  passage à un verbe obligatoire ne doit rien casser pour le projet courant).
- Vise les projets hôtes (lecture de la config de muti) : règle
  `development/host-project-proof-before-ship`, la preuve se fait sur muti ou sur le banc
  cop1-cobaye avant le ship.
- **Prête le 2026-10-04** (run `ezk-product-build` en mode auto, sans `--review`) : critères hérités
  du parent prêt, concurrence `ezk-pm` GO sur la porte « prête ».
- **Arbitrages du PO du 2026-10-04, au build** (contradiction avec l'état livré, run auto) :
  - le refus de `ezk --root <autre projet> config github off` est retiré. La fiche
    [« le mode local marche depuis un projet hôte »](../done/20261003200945204_mode-local-depuis-projet-hote.md)
    (livrée le 2026-10-04) fait écrire `config` dans le projet que vise
    `--root`, comme `ship` et `regen` ; seule l'option explicite redirige une écriture. Le critère
    devient : `EZK_ROOT` seul ne redirige jamais une écriture ;
  - le registre est un fichier suivi par git : l'écrire dans le dossier principal depuis un worktree
    le laisserait modifié hors de toute branche. `registry-add` écrit donc dans le checkout courant,
    le dit, et prévient depuis un worktree.
- **Éprouvée sur cop1-cobaye le 2026-10-04** (règle `development/host-project-proof-before-ship`) :
  `ezk --root ~/git/bacasable/cop1-cobaye config show` affiche la config du banc (GitHub coupé), et
  `ezk --root ~/git/bacasable/muti config show` celle de muti. Aucune gêne trouvée.


## Validation

| Modalité | Statut |
|---|---|
| test-supervision-registry-add (R1-R2) | ✅ |
| ezk-manifest.test sur le vrai manifeste | ✅ |
| vitest 1791 | ✅ |
| test:scripts 36 | ✅ |
| typecheck | ✅ |
| check-adr-ids | ✅ |
| Revue ezk-reviewer | ✅ GO |
| Preuve projet hôte | ✅ cop1-cobaye et muti (config show) |
| Before / after (UI) | N.A. — commandes et ADR sans écran |
| CI cloud | N.A. github off |
| Codex | N.A. github off |
