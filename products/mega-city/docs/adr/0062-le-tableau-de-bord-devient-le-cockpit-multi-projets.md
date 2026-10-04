# ADR 0062 — Le tableau de bord devient le cockpit : une page pour tous les projets, un seul registre

**Statut :** Accepté
**Date :** 2026-10-04
**Deciders :** PO (global, pas une app par projet, 2026-10-02 ; le tableau de bord plutôt que le
Moniteur, au grooming du 2026-10-03 ; découpage en trois fiches et deux arbitrages, 2026-10-04)
**Fiches :** [socle](../../../../features/done/20261004192802828_cockpit-adr-config-lisible-registre-unique.md) ·
[menu des projets](../../../../features/done/20261004192802897_cockpit-menu-projets-et-leurs-fiches.md) ·
[page « config »](../../../../features/20261004192802964_cockpit-page-config-en-sections.md) ·
parent découpé : [un seul tableau de bord pour tous tes projets](../../../../features/done/20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md)
**Précise :** [ADR-0057](0057-le-tableau-de-bord-ecrit-un-seul-dossier.md) (une seule écriture, par
identifiant validé) et [ADR-0039](0039-trois-etages-moteur-methode-branchements-plugin.md) (la
supervision est un branchement).

## En clair

Le PO pilote plusieurs projets avec la méthode : vectorz, muti, samplerz. Pour voir où en est l'un
d'eux, il faut aujourd'hui relancer le tableau de bord sur lui, ou lire le terminal.

On décide : **une seule page web pour tous les projets**. C'est le tableau de bord actuel
(`ezk dashboard`), qui gagne un menu de projets. Il lit la liste des projets dans le registre de la
supervision, le seul registre de projets de la méthode.

Analogie : un tableau de bord de voiture qui ne montrait qu'un compteur gagne un sélecteur. Même
écran, mêmes cadrans ; on choisit seulement quel moteur on regarde.

```
registre des projets (supervision.registry.yaml, lu à chaque requête, jamais écrit par la page)
        │  vectorz · muti · samplerz…
        ▼
tableau de bord ── menu : un projet se choisit par son identifiant, jamais par un chemin
        ├─ pages : les mêmes pour tous (elles viennent de la méthode)
        └─ données et pouces : ceux du projet choisi
Moniteur ── reste la page des runs (inchangé)
```

Ce que ça veut dire pour toi : un coup d'œil suffit pour tous tes projets, sans relancer de serveur.

## Contexte

- `bin/ezk-map.ts` sert ses pages depuis la méthode et calcule ses données à chaque requête, pour une
  racine passée en argument (`dataViewForPath`). Le seul verrou : cette racine est choisie une fois,
  au lancement (`projectRootOrExit`).
- Le Moniteur liste déjà les projets du registre, mais il vit dans le produit cop1 (une application
  React et un service en arrière-plan). L'ADR-0039 range la supervision dans les branchements : un
  plugin optionnel, hors de la méthode.
- Le registre `supervision.registry.yaml` est un fichier suivi par git, à la racine du dépôt de la
  méthode. Chaque checkout (dossier principal, worktree) en a sa copie.

## Décision

1. **Global, pas une app par projet.** Une app par projet multiplierait les ports et n'offrirait
   aucune vue d'ensemble.
2. **Le tableau de bord devient le cockpit** (option A). Il choisit le projet à chaque requête au
   lieu de le fixer au lancement. Sans choix, il garde son comportement d'aujourd'hui : `--root`,
   puis `EZK_ROOT`, puis la méthode elle-même.
3. **Le registre de la supervision est le registre unique.** Le cockpit le lit à chaque requête et
   ne l'écrit jamais. `ezk supervision registry-add` reste le seul geste qui l'écrit : dans le
   registre du checkout où on le lance, en imprimant le fichier écrit. Lancé depuis un worktree, il
   prévient que le cockpit du dossier principal verra le projet après le merge (arbitrage PO du
   2026-10-04 : écrire le fichier suivi du dossier principal le laisserait modifié hors de toute
   branche).
4. **Deux règles de sûreté, reprises de l'ADR-0057.**
   - Un projet se choisit par son identifiant dans le registre, jamais par un chemin venu du
     navigateur. Un identifiant inconnu est refusé, sans rien lire.
   - Un pouce s'écrit dans le projet choisi, et seulement là.
5. **La config d'un autre projet se lit par `--root`.** `ezk --root <projet> config show` lit la
   config de ce projet ; c'est la même voie que le cockpit utilisera. L'écriture suit la règle livrée
   le 2026-10-04 (fiche [« le mode local marche depuis un projet hôte »](../../../../features/done/20261003200945204_mode-local-depuis-projet-hote.md)) : `ezk config github on|off`
   écrit dans le projet que vise l'option `--root`, et seulement l'option : une variable `EZK_ROOT`
   restée dans le shell ne redirige jamais une écriture (arbitrage PO du 2026-10-04, qui retire le
   refus prévu au grooming du 2026-10-03).

## Options écartées

| Option | Raison de l'écart |
|---|---|
| B — le Moniteur | Il vit dans le produit cop1, un branchement (ADR-0039). Y mettre les fiches et la config ferait dépendre la méthode d'un plugin. |
| C — fusionner les deux | Deux techniques différentes à marier, pour un coût élevé et aucun gain pour ce besoin. |
| Un registre propre au cockpit | Deux listes de projets divergeraient. Le registre de la supervision existe et porte déjà la méthode de chaque projet. |

## Conséquences

- Le cockpit doit dire ce qu'il ne sait pas lire, au lieu d'inventer : projet introuvable, méthode
  autre que mega-city, fiches hors du format de la méthode (samplerz et son Gherkin), format en
  retard. Ces états sont l'objet de la fiche « menu des projets ».
- La page « config » (fiche dédiée) passe par les mêmes lecteurs que `ezk config show`,
  `ezk rules show` et `ezk dor show`, en lecture seule. L'écrire depuis la page demandera d'amender
  l'ADR-0057 : c'est la fiche
  [« régler le modèle et l'effort de chaque agent, projet par projet »](../../../../features/20261002205205417_modele-effort-agents-par-projet.md)
  qui le fera.
- Le registre contient des chemins absolus vers les projets hors du dépôt. Il est suivi par git dans
  un dépôt public : un chemin de poste y est visible. Accepté, comme avant cette décision.

## Hors périmètre

- Un lien depuis chaque ligne de projet du Moniteur vers le cockpit.
- Lire les fiches Gherkin de samplerz, ou migrer samplerz au format de la méthode : deux suites qui
  s'excluent, à cadrer après le cockpit.
