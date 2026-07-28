---
id: 2086
product: mega-city
title: Le journal remonte à l'arbre principal + le serveur annonce où il écrit (fin de la perte silencieuse en worktree)
type: feature
priority: P0
epic:
status: shipped
ready: 2026-07-24
pr: "#46"
created: 2026-07-19
---

# 0086 — Normaliser la racine vers l'arbre principal, et le dire

## Contexte / Problème

Le kit émetteur est **totalement aveugle à git** : le mot « worktree » n'apparaît nulle
part dans le chemin d'écriture du journal. Il écrit `.supervision/` dans le dossier qu'on
lui donne, sans aucun contrôle.

Conséquence quand une méthode tourne dans un worktree — **quatre casses distinctes** :

1. **Le journal naît dans le worktree, et disparaît avec lui.** Chez le PO, les worktrees
   vivent sous `.claude/worktrees/`, et `.claude/` est **gitignoré** : le journal est
   invisible à `git status` **et** emporté par un `git worktree remove --force`.
   Ce n'est pas une erreur, c'est **un effacement**.
2. **Le lecteur est aveugle — et muet sur sa cécité.** Il regarde `<racine>/.supervision/runs`
   sans récursion : un journal enfoui dans un worktree n'est jamais atteint. Et comme
   rien n'est énuméré, **aucun avertissement n'est émis** : le moniteur affiche « rien à
   signaler » en ne regardant pas au bon endroit.
3. **La règle « le journal vit dans l'arbre principal » n'existe qu'en prose.** Aucun
   point d'implémentation : aucune résolution de racine git dans le kit. Elle survit dans
   une capture, une fiche, et une **case à cocher manuelle** d'une checklist de démo.
   Une règle non exécutable est une règle non tenue.
4. **Une exigence écrite est violée sans détection** : le chemin de rapport doit être
   « relatif à la racine du projet, pas au worktree » ; le code le calcule relativement à
   ce qu'on lui donne. Si on lui donne un worktree, l'exigence est fausse **et rien ne le
   remarque**.

## Valeur

C'est la seule des options analysées qui traite le problème **à la racine**, et elle
supprime les quatre casses d'un coup. Elle transforme une règle de prose en **invariant
tenu par la machine**.

Bénéfice de second ordre, sous-estimé : elle **unifie en un seul flux** les journaux des N
worktrees d'une même tâche — très probablement ce qu'on veut voir dans un moniteur : *un*
travail, pas sept.

Et le message de démarrage n'est pas un confort : c'est **le seul mécanisme qui rende
détectable, côté humain, l'écriture d'un journal dans le mauvais projet** — le mode
d'échec silencieux d'un émetteur épinglé sur un dossier.

## Proposition

À l'initialisation du serveur, quelle que soit la provenance de la racine :

- **Normaliser vers l'arbre principal** si le chemin fourni est un worktree ; repli propre
  et silencieux si ce n'est pas un dépôt git (le kit doit rester utilisable hors git).
- **Échappatoire explicite** pour qui veut délibérément un journal par worktree.
- **Annoncer au démarrage**, en clair, la racine effective **et sa provenance**
  (variable explicite / lanceur / dossier courant / normalisée depuis un worktree).

## Critères d'acceptation

- [ ] Serveur démarré avec une racine pointant un **worktree** → le journal est écrit dans
      **l'arbre principal** du dépôt (test).
- [ ] Racine hors dépôt git → comportement **inchangé**, aucune erreur (test).
- [ ] L'échappatoire explicite rétablit le journal **dans le worktree** (test).
- [ ] Au démarrage, le serveur **annonce la racine effective et sa provenance** ; un
      humain qui lit cette ligne sait immédiatement où le journal va s'écrire et pourquoi.
- [ ] Le chemin de rapport redevient conforme à l'exigence « relatif à la racine du
      projet » — et l'exigence devient **testable**.
- [ ] Vérifié sur le dépôt réel du PO (7 worktrees) : un travail lancé depuis un worktree
      produit un journal **visible et durable** dans l'arbre principal.

## Notes

- **Décision opiniâtre assumée** : quelqu'un pourrait légitimement vouloir des journaux
  isolés par worktree — d'où l'échappatoire. À noter aussi : N sessions parallèles
  écrivant dans un même arbre ⇒ **vérifier la concurrence d'écriture** sur le dossier des
  travaux.
- **Normalisation et message ne se séparent pas** : normaliser sans dire où l'on écrit
  remplace une surprise par une autre (le journal apparaît ailleurs que là où l'on
  travaille). Le message est une **condition**, pas un bonus.
- **Ordre recommandé** : cette fiche **avant** la portée projet Claude Code — elle n'a
  aucune dépendance à une inconnue, alors que la portée projet dépend de la mesure de la
  fiche 0083. Livrer la portée projet sans celle-ci, sur un utilisateur à sept worktrees,
  remplacerait une friction visible par une perte invisible.
- Réfs : `src/supervision/mcp-server.ts`, `runtime.ts`, `journal.ts` ; capture du
  2026-07-14 (règle « arbre principal ») ; fiche racine 0030 ; analyse
  `docs/captures/2026-07-19-topologie-supervision-et-plan-diagrammes.md` ; fiches 0083
  (mesure), 0084 et 0085 (quiescence).
