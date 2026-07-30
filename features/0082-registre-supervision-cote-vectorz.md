---
id: 0082
title: Registre de supervision versionné côté vectorz — QUOI + MÉTHODE, jamais OÙ (modèle à deux clés)
type: feature
priority: P1
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-07-19
---

# 0082 — Le registre de supervision (côté vectorz, en git)

## Contexte / Problème

Aujourd'hui, la déclaration « **quel projet est supervisé** » est un **réglage de
l'extension dans Claude Desktop** (`SUPERVISION_PROJECT_ROOT`, fixé par l'humain à
l'initialisation du serveur, jamais paramètre d'outil — invariant anti-falsification de
la fiche 0050 : le modèle ne choisit JAMAIS où son journal s'écrit).

Deux limites apparaissent dès qu'on dépasse un seul projet :

1. **Mono-projet** : un réglage = un projet supervisé ; changer de projet est un geste
   manuel dans l'interface.
2. **Double saisie** : le moniteur (côté cop1) tient sa **propre** liste de dossiers à
   surveiller — la même information est déclarée deux fois, à deux endroits, sans lien.

Demande du PO (2026-07-19) : « le réglage est côté vectorz qui tourne ! C'est vectorz qui
déclare une **liste de projets** pour lesquels il est utilisé pour automatiser les devs,
avec **la méthode choisie** (aujourd'hui mega-city, demain peut-être BMAD ou qui sait) ».

## Valeur

- **Le git ajoute la détection à la prévention.** La v1 *empêche* le modèle de choisir son
  journal (prévention), mais une mutation du réglage Desktop **ne laisse aucune trace**.
  Une déclaration **versionnée** est historisée, diffable, relue en PR : on voit qui a
  ajouté quel projet, et quand. C'est en cela — et seulement en cela — que « en git » est
  **plus fort** que le réglage d'application.
- **Fin de la double saisie** : une seule liste nourrit l'émission et la lecture.
- **Prêt pour la suite** : multi-projets, et multi-méthodes (BMAD, fiche 0058) sans
  toucher au contrat.

## Proposition — le modèle à deux clés

Séparation **plan de contrôle / plan de données** : donner raison au PO sur le fond
(la déclaration appartient à vectorz) **sans** réintroduire le choix du journal par le
modèle.

- **Le registre** (fichier versionné à la racine vectorz) dit **QUOI** superviser et
  **AVEC QUELLE MÉTHODE**. Il ne contient **aucun chemin de journal**.
- **L'ancrage** (réglage Desktop posé par le `.mcpb`) continue de dire **OÙ** chaque
  instance écrit — une fois, hors de portée du modèle.
- **L'OÙ effectif** reste une **dérivation non configurable** : `<racine>/.supervision/`
  (même doctrine que l'enveloppe calculée côté serveur).
- **Nécessaire mais jamais suffisant** : ajouter une ligne au registre **n'écrit rien
  nulle part** tant qu'un humain n'a pas ancré une instance via l'interface. Le modèle,
  qui peut certes éditer un fichier du dépôt, ne peut donc qu'**élargir une liste inerte**
  — et cette édition est immédiatement visible (diff, arbre sale ⇒ pas de montée de
  version au jalon suivant, revue de PR).
- **Deux renforts d'audit** (hors contrat, aucun nouvel outil) : contrôle d'appartenance
  au registre à l'initialisation de l'émetteur ; **marquage d'écart de méthode** au
  démarrage d'un travail (méthode déclarée ↦ méthode attendue) — une annotation d'audit,
  jamais un refus (la méthode s'auto-déclare, c'est le contrat).
- **`supervision doctor`** : script **lecture seule** qui compare le registre à la
  configuration Desktop et **imprime ce qui manque** ; il ne touche jamais la
  configuration de l'application — l'humain applique.
- **Dérivation** de la liste du moniteur depuis le registre.

## Critères d'acceptation (à groomer)

- [ ] Un **fichier registre versionné** à la racine vectorz déclare les couples
      {projet, méthode} — **aucun champ de chemin de journal**.
- [ ] **Interdits gravés** (même rang que « jamais d'outil d'émission générique »,
      fiche 0050) : aucun sélecteur de projet en **paramètre d'outil**, ni en réglage
      multi-dossiers ; registre **lu à l'initialisation uniquement**.
- [ ] `supervision doctor` : lecture seule, compare registre ↔ configuration Desktop,
      imprime le manquant, ne modifie **jamais** la configuration de l'application.
- [ ] Émetteur : **fail-fast** si le dossier ancré n'est pas au registre ; **marquage**
      de l'écart de méthode au démarrage d'un travail.
- [ ] La liste de dossiers surveillés par le moniteur **dérive du registre** (fin de la
      double saisie) — à vérifier sur pièce au grooming.
- [ ] **Rollback trivial** : sans fichier registre, comportement v1 strictement inchangé.

## Notes / décisions

- **Montée en P1 par le PO (2026-07-25).** Motif : « il faudrait pouvoir ajouter des
  projets » est devenu la demande directe du PO en découvrant le Moniteur. Le moment
  anticipé ci-dessous — « devrait précéder le passage à 2 projets supervisés » — est
  arrivé.
- **P2 confirmée par le PO** (2026-07-19). Ne bloque ni 0058 (BMAD peut démarrer en v1
  pure) ni 0078 (le `.mcpb` reste le geste d'ancrage) — mais **devrait précéder** le
  passage à 2 projets supervisés simultanés, moment où la double saisie et l'absence
  d'attendu de méthode commencent à coûter.
- **✅ Vérifié sur pièce le 2026-07-25** — lève l'item de grooming « références au
  moniteur à confirmer » ci-dessous. Côté lecture, le moniteur est **déjà multi-projets**
  et la double saisie est réelle :
  - `supervision.watch_roots` est une **liste** (`ConfigSchema.ts:99`,
    `z.array(z.string()).default([])`) — plusieurs projets surveillés simultanément
    fonctionnent sans modification ;
  - elle est lue **une seule fois, au démarrage du daemon** (`DaemonService.wireSupervision`,
    « chargement one-shot ») ⇒ ajouter un projet impose aujourd'hui d'éditer le YAML **et
    de redémarrer le daemon** ; liste vide ⇒ supervision **dormante**, aucun watcher ;
  - **aucune interface** ne permet d'ajouter une racine : le seul geste est l'édition
    manuelle de `cop1.config.yaml`.
  ⇒ la « dérivation de la liste du moniteur depuis le registre » est donc bien un
  remplacement d'un `watch_roots` écrit à la main, et non d'un mécanisme dynamique
  existant. Le point de branchement est `wireSupervision` (un seul appelant).
- **Prérequis technique identifié (2026-07-25)** : le « marquage d'écart de méthode »
  (méthode déclarée ↦ méthode attendue) n'a aujourd'hui **rien à comparer** — la
  projection ne porte ni `method` ni `seat` (fiche racine **0061**). 0061 devrait précéder
  ce volet-là de la fiche.
- **Contrat v0.1 non rouvert** : aucun nouvel outil, aucun champ d'enveloppe.
- **`portfolio.sh` est un faux ami** : il agrège les backlogs internes du monorepo, pas
  des projets clients — mais son **motif** (script en lecture seule qui agrège des
  sources de vérité décentralisées vers une vue générée) est le germe naturel du registre.
- Issu d'un **panel architecte** (2026-07-19) : 3 options évaluées (statu quo mono-projet ;
  registre qui dessert une liste — écarté car il rendrait au modèle le choix du journal ;
  modèle à deux clés — retenu).
- **Structurant côté invariant** → panel adverse recommandé au grooming (convention du repo).
- Réfs : fiche 0050 (kit émetteur, shippé — invariant anti-falsification), 0058 (BMAD,
  2ᵉ méthode), 0078 (`.mcpb`, la clé Desktop), ADR-021 (couplages interdits, doctrine
  statique/versionné/zéro runtime partagé), ADR-0001 (le script range, l'humain décide).
  *(Les références au moniteur — liste de dossiers surveillés — étaient à confirmer sur
  pièce : **fait le 2026-07-25**, voir la note de vérification ci-dessus.)*
