---
id: 0088
title: ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné)
type: chore
priority: P2
product: mega-city
epic:
status: in-progress
ready: 2026-07-26
pr:
created: 2026-07-25
---

# 0088 — La clôture coûte 65× ce qu'elle rapporte quand la session a tenu ses comptes

## Contexte / Problème

Mesuré le **2026-07-25**, à la clôture d'une session `/ezk-product-build build` qui avait
livré 4 fiches (PRs #45-#48) : `/ezk-archive run` a consommé **~130 000 tokens**, **~8
minutes**, **27 appels d'outils** (dont 1 commande en échec et 1 suppression bloquée par le
classifieur) — pour un bénéfice net proche de zéro, voire négatif :

> ### 📐 Mesure de référence recalculée (2026-07-26)
>
> Le « ~130 000 » ci-dessus vient d'une lecture d'affichage. Re-mesure directe sur les
> transcripts (`~/.claude/projects/<slug>/<sessionId>/subagents/agent-*.jsonl`, filtrés sur
> `"agentType":"ezk-archive"`), sur **les 4 runs disponibles** :
>
> | run | date | outils | tours | **tokens neufs** | *(cache_read, exclu)* |
> |---|---|---|---|---|---|
> | `a2468112` | 2026-07-16 | 9 | 19 | 210 862 | 1 008 116 |
> | `a04e5373` | 2026-07-26 | 13 | 25 | 211 561 | 1 885 447 |
> | **`ac6ad4ee`** | **2026-07-25** | **27** | **47** | **234 684** | 3 870 125 |
> | `ae1bc5f0` | 2026-07-26 | 29 | 54 | 244 688 | 4 613 992 |
>
> **Définitions figées** (sans elles, avant/après ne sont pas comparables) :
> - **Tokens neufs** = Σ(`input_tokens` + `cache_creation_input_tokens` + `output_tokens`).
>   **`cache_read_input_tokens` est EXCLU** : facturé ~10× moins et recompté à chaque tour —
>   l'inclure gonfle d'un facteur ~20 et noie le signal.
> - Ces chiffres couvrent le **seul sous-agent**. La part inline du skill (composition du
>   résumé + restitution) s'y ajoute : +43 668 sur le run du 2026-07-25, soit **278 352 au total**.
>
> **Ce que la ventilation apprend** — le coût ne vient pas d'abord du *travail* :
> - **Plancher d'amorçage ~53 k** au premier tour (prompt système + toolbox héritée en entier,
>   l'agent n'ayant pas de champ `tools:` restreint) — payé avant toute action utile.
> - Le reste s'accumule en `cache_creation` **à chaque tour** : 19 tours ⇒ 141 k, 54 tours ⇒ 220 k.
> - D'où un run à **9 outils qui coûte déjà 210 k**, soit 86 % d'un run à 29 outils. **Réduire
>   le nombre de vérifications ne suffit donc pas** : il faut, quand il n'y a rien à faire, ne
>   pas invoquer le sous-agent du tout.
>
> **Référence retenue pour l'avant/après : 234 684 tokens neufs · 27 outils · 3 min 32**
> (run du 2026-07-25, le seul dont le contexte de session est documenté ci-dessous).

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
      2026-07-25 (**234 684 tokens neufs / 27 outils / 3 min 32**) — chiffre mesuré et
      consigné, pas estimé.
      → **En attente du merge.** `~/.claude/skills/ezk-archive` est un symlink vers l'arbre
      principal : tant que la PR n'est pas mergée, une clôture réelle exécuterait encore
      l'ANCIENNE version. Protocole figé ci-dessous ; cible **≤ 28 000 tokens neufs et
      ≤ 6 outils**.
- [x] Aucune vérification ne **re-dérive** un fait déjà affirmé par l'appelant sans nécessité
      démontrée ; ce qui reste vérifié l'est par un contrôle borné.
      → Le portier rend `VERDICT: CLEAN|DIRTY points=…` ; sur CLEAN aucun sous-agent n'est
      invoqué ; sur DIRTY le prompt porte le bloc gate **collé verbatim** + un SCOPE qui
      interdit de re-dériver les points prouvés CLEAN. Sortie du gate bornée
      (25 faits/point, 47 au total) et **vide pour un point CLEAN** (test G1).
- [x] Tout verdict « diverge réellement / ne pas resync » est **confirmé par le test à deux
      volets** (diff two-dot + existence du contenu dans `origin/main`) **avant** d'être
      remonté — 3ᵉ occurrence du faux positif évitée.
      → `classify_branch` paramétrée en `classify_ref <base> <ref>` : la garde est un 2ᵉ
      appel de l'algorithme déjà testé par la fiche 0076, pas du code neuf. **`test-mainsync.sh`
      M3 reproduit exactement le faux positif** (contenu livré par squash + origin qui
      ré-évolue sur le même fichier) et exige `AHEAD_ABSORBED`. M2 vérifie que le mot
      « diverge » est absent quand `ahead=0` ; M4/M5 vérifient qu'un vrai contenu non livré
      (et un revert) restent bien signalés ; M7 qu'une ref périmée donne `UNKNOWN`, jamais
      `AHEAD_ABSORBED`. Le diffstat two-dot est émis **étiqueté heuristique** — il ne décide pas.
- [x] **Non-régression** : sur une session qui n'a PAS tenu ses comptes (branches en vol,
      fiches non shippées, PRs mergées hors flux), le rituel trouve toujours ce qu'il
      trouvait — c'est son cas d'usage payant, il ne doit pas être amputé.
      → Obtenu **par construction** : sans `--shipped`, le portier n'a aucune preuve ⇒
      `P3_BACKLOG: UNKNOWN` ⇒ `DIRTY` ⇒ délégation complète. Une session qui n'a pas tenu
      ses comptes ne *peut pas* déclarer. Verrouillé par **G5** ; règle générale « CLEAN
      uniquement sur preuve positive » (tout `UNKNOWN`/sonde en erreur/borne dépassée ⇒ DIRTY).
- [x] La note de handoff reste produite et persistée (acquis de la fiche 0026, non régressé).
      → Points d'écriture 5/6/7 déclarés **toujours dus**, quel que soit le verdict (ligne
      `NOTE:` du gate + § « Périmètre d'un appel » de l'agent). `test-handoff.sh` : 8 cas,
      dont l'union entrées vivantes + archivées = tout ce qui a été écrit (H1) et le
      caractère stationnaire du fichier (H6).

## Réalisé (2026-07-26) — ADR [0021](../products/mega-city/docs/adr/0021-cloture-portier-deterministe-ranger-rediger-juger.md)

**Arbitrages PO** : ① l'invariant du skill est **reformulé** (« ne *juge* jamais lui-même »
remplace « ne fait QUE déléguer ») ; ② portée = les 3 lots cœur (le `regen --check` de la
piste 4 reste au backlog).

| Lot | Contenu |
|---|---|
| **Portier** | `check.sh` restructuré en collecte→émission, modes `--gate`/`--full`, options `--base`/`--shipped`/`--point`, verdict machine, `classify_ref` paramétrée, bloc `MAINSYNC`, bloc `P3_BACKLOG`, **suppression du dump regex** (96 lignes sur 120, proportionnel au handoff) |
| **Rangeur** | `handoff.sh` (`path`/`carry`/`add`, anneau FIFO + archive), `references/handoff-template.md` en source unique |
| **Aiguillage** | `SKILL.md` (« Le portier décide », chemins inline/délégué, échappatoires `--delegate`/`--inline`), `agents/ezk-archive.md` (gate obligatoire, périmètre contrôle vs écriture, `ezk-backlog` seulement si `3 ∈ SCOPE`, garde MAINSYNC) |

**DoD** : `pnpm test:scripts` — 6 suites, TOUT VERT (`test-check-branches` **inchangé dans
ses 9 assertions d'origine**, + 3 assertions croisées gate↔full ; `test-check-gate` G1-G9 ;
`test-mainsync` M1-M7 ; `test-handoff` H1-H8 ; `test-template-unicity` ; `test-regen-backlog`).
`pnpm test` : 273 tests vitest passent.

### Revue Codex (PR #56) — 6 findings P1 retenus

| # | Défaut | Correction | Verrou |
|---|---|---|---|
| F5 | `blob_landed` prouvait un blob **n'importe où** en amont : un fichier local unique dont le contenu existe sous un autre nom était « absorbé », et `resync_safe=1` invitait à un `reset --hard` destructeur. Cas dégénéré banal : **tous les fichiers vides ont le même blob** | preuve **au chemin attendu** | M9, M10 |
| F2 | le code retour de `gh pr list` était jeté : une panne réseau/droits rendait la liste vide ⇒ `P2 CLEAN` non prouvé | statut capturé ⇒ `UNKNOWN` | — |
| F1 | le chemin inline CLEAN écrivait handoff + `.gitignore` + mémoire **sans regarder la sous-commande** : un `check` (dry-run) modifiait le dépôt | écriture conditionnée à `run`/`close` | `test-template-unicity` |
| F4 | `handoff.sh add` est un read-modify-write : deux sessions parallèles (worktrees) pouvaient s'écraser | verrou atomique (`mkdir`), scope git-common-dir | H9 |
| F3 | le préfixe d'id était **jeté** et le premier match global retenu — or **62 numéros existent des deux côtés** du monorepo | résolution par backlog (convention `bin/plan-head.ts`), refus si ambigu | G10 |
| F7 | `stat -f %m` est du BSD ; sur GNU, `-f` = `--file-system` et imprime des valeurs mouvantes ⇒ assertion read-only flaky | détection de variante en amont | G7 |

Un finding (fixture sans `-b main`) était déjà corrigé au moment de la revue.

> **Ce que la revue apprend, au-delà des correctifs** : la règle « CLEAN uniquement sur
> preuve positive » ne protège rien si les *preuves* sont trop lâches. F5 et F3 sont deux
> preuves trop permissives sous une règle correcte — un raisonnement seul ne les voyait pas,
> c'est le contrôle adverse qui les a sorties.

### Protocole de mesure (à figer pour que l'avant/après soit comparable)

- **Tokens neufs** = Σ(`input_tokens` + `cache_creation_input_tokens` + `output_tokens`),
  sur `~/.claude/projects/<slug>/<sessionId>/subagents/agent-*.jsonl` filtrés
  `"agentType":"ezk-archive"`, + la part inline de la fenêtre `/ezk-archive` du transcript
  de session. **`cache_read_input_tokens` exclu** (facturé ~10× moins, recompté à chaque tour).
- **Après merge**, mesurer **2 clôtures** : une CLEAN (avec `--shipped`) et une DIRTY, et
  les consigner ici. Sans ces deux chiffres, le 1ᵉʳ critère reste ouvert.

## Notes

- **Ne pas confondre avec la fiche [0026](done/0131-ezk-archive-persiste-handoff.md)**
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
