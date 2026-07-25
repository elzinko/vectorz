---
id: 0088
title: ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné)
type: chore
priority: P2
epic:
status: todo
ready:
pr:
created: 2026-07-25
---

# 0088 — La clôture coûte 65× ce qu'elle rapporte quand la session a tenu ses comptes

## Contexte / Problème

Mesuré le **2026-07-25**, à la clôture d'une session `/ezk-product-builder build` qui avait
livré 4 fiches (PRs #45-#48) : `/ezk-archive run` a consommé **~130 000 tokens**, **~8
minutes**, **27 appels d'outils** (dont 1 commande en échec et 1 suppression bloquée par le
classifieur) — pour un bénéfice net proche de zéro, voire négatif :

- **5 des 7 vérifications ont répondu « rien à faire »** — backlog déjà cohérent (fiches
  shippées, index régénéré), mémoire déjà à jour, ADR déjà mergé, PRs déjà rapprochées,
  working tree propre. C'est **normal** : la boucle product-builder ferme chaque sprint au
  fur et à mesure (ship + regen + nettoyage de branches à chaque checkpoint).
- La 6ᵉ (supprimer une branche absorbée) a été **bloquée** par le classifieur.
- La 7ᵉ — **son unique trouvaille** — était un **faux positif** : « `main` local diverge
  réellement d'`origin/main`, NE PAS faire `reset --hard` ». Vérification faite ensuite :
  les 2 commits locaux n'ont **aucun contenu unique** (leur contenu était dans `origin/main`
  via le squash #43), les 12 lignes « uniques » étaient l'ancienne rédaction de lignes
  réécrites depuis. Coût de la réfutation : **6 commandes de plus**. Valeur nette négative.

**Cause structurelle** (ce n'est pas un bug, c'est le design) : le sous-agent n'a **aucune
mémoire de la conversation**. L'appelant doit donc lui **ré-sérialiser 60 lignes de résumé de
session** dans le prompt ; le sous-agent **redérive ensuite l'état git** que l'appelant
connaissait déjà ; et rend un document de 231 lignes **largement reconstructible depuis le
prompt qu'on vient de lui écrire**. On paie deux fois le même savoir.

**Le faux positif est récurrent, pas accidentel** : c'est la **2ᵉ occurrence** en deux jours
(rapport du 2026-07-24 : « 3 commits orphelins / 309 insertions à récupérer », corrigé dans le
handoff ; rapport du 2026-07-25 : « diverge réellement, ne pas resync », corrigé de même).
`check.sh` et `git merge-tree` **ne distinguent pas « divergence textuelle » et « contenu
unique »** — or ce dépôt est en **100 % squash-merge**, où toute branche livrée diverge
textuellement par construction (cf. fiche 0076, mémoire outillage item 9).

## Valeur

Le rituel de clôture est **invoqué à chaque fin de session**. Un coût de 130k tokens à chaque
fois, sur un dépôt où la session appelante fait déjà le ménage, c'est le budget d'un sprint
entier dépensé en vérification redondante. Pire : un rapport qui crie au loup sur un faux
positif **use la confiance** — au bout de deux fois, l'utilisateur cesse de lire le verdict,
et le jour où l'alerte est vraie elle passe inaperçue (même mécanique que le signal
constamment faux de la fiche 0085).

Symptôme utilisateur direct, PO le 2026-07-25 : « *c'est un peu dur et cher* ».

## Proposition (pistes, à trancher au grooming)

1. **Faire confiance à ce que l'appelant affirme, ou le vérifier en UNE commande** — le
   prompt d'appel devient une source déclarée (« backlog déjà shippé/regen, mémoire à jour,
   ADR mergé ») ; le sous-agent ne re-dérive pas, il **échantillonne** (un `git status`, un
   `grep` d'index) au lieu d'explorer.
2. **Garde anti-faux-positif obligatoire** : aucun verdict « diverge réellement / ne pas
   resync » ne remonte sans avoir été confirmé par (a) `git diff --stat origin/main <ref> --
   <fichiers touchés>` — suppressions dominantes ⇒ la ref est **en retard**, pas en avance —
   et (b) une vérification d'existence du contenu prétendument unique dans `origin/main`.
3. **Deux régimes de clôture** : `check` (dry-run léger) par défaut après une session
   disciplinée ; `run` complet réservé aux sessions qui n'ont **pas** tenu leurs comptes
   (exploration longue, branches multiples, état inconnu) — c'est là que le rituel paie.
4. **Envisager un chemin inline** : quand l'appelant a déjà tout le contexte, écrire le
   handoff directement (~2k tokens) plutôt que de déléguer. À peser contre la raison d'être
   de la délégation (modèle/effort figés, indépendants de la session).

## Critères d'acceptation

- [ ] Une clôture après une **session disciplinée** (fiches shippées, branches nettoyées au
      fil de l'eau) coûte un ordre de grandeur de moins que la mesure de référence du
      2026-07-25 (**~130k tokens / 8 min / 27 outils**) — chiffre mesuré et consigné, pas estimé.
- [ ] Aucune vérification ne **re-dérive** un fait déjà affirmé par l'appelant sans nécessité
      démontrée ; ce qui reste vérifié l'est par un contrôle borné.
- [ ] Tout verdict « diverge réellement / ne pas resync » est **confirmé par le test à deux
      volets** (diff two-dot + existence du contenu dans `origin/main`) **avant** d'être
      remonté — 3ᵉ occurrence du faux positif évitée.
- [ ] **Non-régression** : sur une session qui n'a PAS tenu ses comptes (branches en vol,
      fiches non shippées, PRs mergées hors flux), le rituel trouve toujours ce qu'il
      trouvait — c'est son cas d'usage payant, il ne doit pas être amputé.
- [ ] La note de handoff reste produite et persistée (acquis de la fiche 0026, non régressé).

## Notes

- **Ne pas confondre avec la fiche [0026](done/0026-ezk-archive-persiste-handoff.md)**
  (livrée) : elle a *créé* la persistance du handoff ; celle-ci porte son **coût**.
- Le PO a demandé cette fiche explicitement plutôt que de re-discuter le sujet à chaque
  clôture (2026-07-25).
- Priorité **P2 posée par défaut** (friction de méthode récurrente, ne bloque aucune
  livraison produit) — à confirmer/ajuster par le PO au grooming.
- Réfs : `~/.claude/agents/ezk-archive.md` (les 7 vérifications), `scripts/check.sh`,
  fiche 0076 (hygiène des branches post-squash), fiche 0085 (le signal constamment faux
  qu'on apprend à ignorer — même mécanique de perte de confiance), mémoire projet
  `vectorz-pieges-outillage` items 9-10 (test décisif merge-tree, code retour), handoff
  `.claude/handoff.md` entrées des 2026-07-24 et 2026-07-25 (les deux corrections).
