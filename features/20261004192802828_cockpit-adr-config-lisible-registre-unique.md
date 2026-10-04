---
id: "20261004192802828"
title: "Cockpit, socle : l'ADR, « ezk config show » lisible depuis un autre projet, un seul registre de projets"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [ezk-map, supervision, cli]
status: ready
pr:
evidence: none # commandes de terminal et ADR, pas d'écran
created: 2026-10-04
split_from: "20260904080827072"
---

# 20261004192802828 — Cockpit, socle : l'ADR, la config lisible depuis un autre projet, un seul registre

**En clair.** Avant de construire le cockpit, on pose son socle, sans écran. Un ADR consigne la
décision : un seul tableau de bord pour tous les projets. `ezk config show` apprend à lire la
config d'un autre projet, sans jamais pouvoir y écrire. Et l'inscription d'un projet au registre
vise toujours le même fichier, même lancée depuis un worktree.

**Si tu arrives frais.** Le *cockpit* est le tableau de bord de la méthode (`ezk dashboard`), qui
devient multi-projets. Le *registre* est `supervision.registry.yaml` : la liste des projets suivis
(id, chemin, méthode). Une *commande projet* est une commande `ezk` marquée `project: true` dans
`products/mega-city/ezk-manifest.yml` : elle sait viser un autre projet avec `--root`.

## Contexte / Problème

Première des trois fiches nées du découpage de « Un seul tableau de bord pour tous tes projets »
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
2. **`ezk config show`** devient une commande projet : `ezk --root <projet> config show` lit la config
   de ce projet. L'écriture (`ezk config github on|off`) reste au projet courant : avec un `--root`
   qui vise un autre projet, elle est refusée.
3. **Le registre est le même pour tous.** `registry-add` écrit dans le registre du dossier principal
   du dépôt, pas dans la copie d'un worktree, et dit quel fichier il a écrit.

## Critères d'acceptation

- [ ] Un ADR consigne la décision : global, le tableau de bord comme cockpit, le registre de la
      supervision comme registre unique. Il dit pourquoi le Moniteur et la fusion sont écartés.
- [ ] `ezk --root <projet> config show` affiche la config d'un autre projet.
- [ ] `ezk --root <projet> config github off` est refusé : l'écriture reste au projet courant.
- [ ] `ezk config show` lancé sans `--root` affiche la config du projet courant, comme aujourd'hui
      `ezk config`.
- [ ] Inscrire un projet avec `ezk supervision registry-add` depuis un worktree écrit dans le
      registre du dossier principal, et la commande imprime le chemin du fichier écrit.

## Comment vérifier

```bash
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts
ezk --root ~/git/bacasable/muti config show          # la config de muti
ezk --root ~/git/bacasable/muti config github off    # → refusé, rien écrit dans muti
ezk config show                                      # la config du projet courant
# depuis un worktree de vectorz :
ezk supervision registry-add essai /tmp/essai        # → imprime le registre du dossier principal
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
  ses critères 1, 12, 13 et 14. Les deux sœurs : la liste des projets et leurs fiches
  (20261004192802897), la page « config » (20261004192802964).
- Critère ajouté au découpage : `config show` sans `--root` garde le comportement d'aujourd'hui (le
  passage à un verbe obligatoire ne doit rien casser pour le projet courant).
- Vise les projets hôtes (lecture de la config de muti) : règle
  `development/host-project-proof-before-ship`, la preuve se fait sur muti ou sur le banc
  cop1-cobaye avant le ship.
- **Prête le 2026-10-04** (run `ezk-product-build` en mode auto, sans `--review`) : critères hérités
  du parent prêt, concurrence `ezk-pm` GO sur la porte « prête ».
