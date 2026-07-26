---
name: ezk-archive
argument-hint: "[help|check|run]"
description: >-
  Rituel de CLÔTURE de session avant archivage : clôt proprement un repo pour ne
  RIEN perdre entre deux sessions. A utiliser quand l'utilisateur veut « archiver
  / clôturer une session », « fermer proprement avant de partir », « ne rien
  perdre entre deux sessions », préparer un « handoff » pour la prochaine session,
  ou demande « on archive ? » « avant de fermer ». Pilotable par sous-commandes :
  help, check (dry-run strictement read-only : produit le rapport de clôture),
  run/close (applique les corrections sûres — ship/regen du backlog, mémoire — et
  produit la note de handoff). Un script portier (`scripts/check.sh`) rend un
  verdict CLEAN/DIRTY sur 4 points de contrôle : working tree + stashes, PRs &
  branches non-mergées (crucial pour les repos sans remote), fiches déclarées
  livrées, ADR de la session ; sur CLEAN la clôture est traitée directement, sur
  DIRTY elle est déléguée au sous-agent, scopée aux points signalés. Produit
  toujours la note de handoff persistée dans `.claude/handoff.md` (anneau FIFO)
  et le verdict archivable/pending. Ne merge/push JAMAIS tout seul ; hygiène de
  clôture uniquement (pas du scrum/sprint — ça, c'est ezk-sprint).
---

# ezk-archive

**Ce skill ne *juge* jamais lui-même.** C'est l'invariant — il a remplacé « ce skill ne
fait QUE déléguer », qui était posé à la mauvaise granularité et coûtait ~235 000 tokens
par clôture (fiche mega-city 0088). Le partage, en trois verbes, suit ADR-0001 §2 :

| Verbe | Qui | Quoi |
|---|---|---|
| **Ranger** | le **script** | classer une branche, prouver une divergence, faire tourner le handoff, écrire un fichier |
| **Rédiger** | **cette session** | le récit de ce qui a été livré, les faits durables, les candidats — elle seule a la matière |
| **Juger** | le **sous-agent** | cette branche RÉELLE est-elle un brouillon supersédé ou du travail à récupérer ? cette divergence, on en fait quoi ? |

Le sous-agent (`~/.claude/agents/ezk-archive.md` — `model: sonnet`, `effort: medium`)
n'a **aucune mémoire de la conversation**. Lui déléguer la *rédaction* n'achète donc pas
un meilleur rédacteur : il ne peut que recopier ce qu'on vient de lui écrire, et on paie
son prompt d'entrée **et** sa sortie. Le modèle/effort figés n'ont de valeur que là où la
qualité dépend du modèle — le **jugement**. C'est pour ça, et seulement pour ça, qu'on
délègue.

> **Une seule responsabilité : l'hygiène de clôture.** Ce n'est PAS du sprint ni du
> scrum (ça, c'est [`ezk-sprint`](../ezk-sprint/)), ni le suivi du *quoi* (ça, c'est
> [`ezk-backlog`](../ezk-backlog/)). `ezk-sprint` **ouvre/déroule**, `ezk-backlog`
> suit **le quoi**, **`ezk-archive` clôt**.

## Usage (sous-commandes)

`/ezk-archive [sous-commande]` — ou en langage naturel (« clôture la session »,
« on archive ? »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau + un mot sur chaque vérification |
| `check` | **Dry-run, ne modifie RIEN** — produit le rapport de clôture |
| `run` / `close` | Applique les **corrections sûres** (ship/regen backlog, mémoire) puis produit la **note de handoff** + le **verdict** |

Deux échappatoires, quand le portier ne doit pas décider :

| Modificateur | Effet |
|---|---|
| `run --delegate` | force la délégation au sous-agent même sur un verdict `CLEAN` |
| `run --inline` | interdit la délégation ; à n'utiliser que si tu assumes de juger toi-même les points DIRTY |

Le détail des 7 vérifications et les garde-fous vivent dans le sous-agent
(`~/.claude/agents/ezk-archive.md`) ; le gabarit de la note vit dans
[`references/handoff-template.md`](references/handoff-template.md), **source unique lue
par les deux chemins** (`scripts/test-template-unicity.sh` interdit de le dupliquer).

## Le portier décide

### 1. Compose le résumé de session

5-15 lignes : fiches/PRs livrées **avec leurs ids**, décisions ADR, faits notables
appris (contraintes, choix et leur *pourquoi*) — tout ce qui **n'est pas dérivable de
l'état git/gh**. Tu es la seule à l'avoir.

### 2. Interroge le portier — **une seule commande**

```bash
bash <chemin-du-skill>/scripts/check.sh --gate --shipped <ids-livrés>
```

`--shipped` prend les ids que tu viens de lister (`0089,mc-0097`), ou `none` si la
session n'a **rien** livré. **Ne l'omets jamais sans raison** : sans déclaration, le
portier n'a aucune preuve, répond `P3_BACKLOG: UNKNOWN` et force la délégation complète.
C'est voulu — c'est ce qui garantit qu'une session qui n'a *pas* tenu ses comptes reçoit
toujours le rituel entier.

Le portier est **read-only** et rend ~12 lignes sur une session propre.

### 3. Lis `VERDICT:` — et une seule des deux branches suivantes

#### `VERDICT: CLEAN` → tu traites la clôture toi-même

Les 4 points de contrôle sont **prouvés** propres. Il ne reste que les points d'écriture,
qui ne demandent aucun jugement :

1. `bash <skill>/scripts/handoff.sh carry` → les pendings **non-git** à reporter.
2. **Mémoire projet** : propose les faits durables non-dérivables du repo (dates
   relatives converties en absolues). Ne mémorise pas ce que le repo encode déjà.
3. Rédige la note d'après [`references/handoff-template.md`](references/handoff-template.md),
   puis écris-la :
   ```bash
   bash <skill>/scripts/handoff.sh add "<date> — <titre> — clôture ezk-archive" <<'EOF'
   …
   EOF
   ```
4. Rends la note + le verdict **✅ archivable**.

#### `VERDICT: DIRTY points=…` → tu délègues, scopé

Appelle l'outil **Agent** avec `subagent_type: "ezk-archive"`, `run_in_background: false`,
et un prompt **autonome** contenant :

- la sous-commande (`check` ou `run`) et le chemin du repo (cwd) ;
- le **résumé de session** de l'étape 1 ;
- **le bloc gate collé verbatim** — il a déjà payé la dérivation, la refaire est une faute ;
- la phrase de scope :

> `SCOPE : traite les points de contrôle <liste>. Les autres points de contrôle sont`
> `PROUVÉS CLEAN par le portier — les re-dériver est une faute (token-economy/read-once).`
> `Les points d'écriture 5 (mémoire), 6 (handoff), 7 (verdict) sont TOUJOURS de ton ressort.`

Puis **restitue la réponse de l'agent telle quelle**.

## Intégration

- **[`ezk-backlog`](../ezk-backlog/)** : le sous-agent lui délègue `ship`/`add`/`regen`
  — **uniquement si le point 3 est DIRTY** (c'est le geste le plus cher de la chaîne) ;
  la note de handoff renvoie vers `list`.
- **[`ezk-sprint`](../ezk-sprint/)** : complémentaire — le sprint *ouvre/déroule*,
  ezk-archive *clôt*. Typiquement invoqué **après** le checkpoint de fin de sprint.
- **[`ezk-commits`](../ezk-commits/)** : tout commit produit suit les Conventional Commits.
- **`ezk-product-builder`** : à ses pauses inter-sprint, il **rappelle** que
  `/ezk-archive` est disponible — il ne réimplémente rien du handoff.

## Garde-fous (skill)

- **Ne juge jamais toi-même** une branche RÉELLE (brouillon supersédé ou travail à
  récupérer ?) ni une divergence de `main` : c'est ce qui se délègue. Si tu te surprends
  à trancher un cas comme ceux-là dans la conversation principale, arrête-toi et délègue.
- **Ne relis jamais `.claude/handoff.md`** : `handoff.sh carry` en rend la seule partie
  utile, bornée. Le lire en entier (20 Ko, deux fois par run) est ce que la fiche 0088 a
  supprimé — et c'est une violation directe de `rules/token-economy/read-once.md`.
- **Ne re-dérive jamais un point que le gate a prouvé CLEAN**, ni dans la conversation,
  ni en le redemandant au sous-agent.
- **Ne recopie pas le gabarit ici** : il vit dans `references/handoff-template.md`.
- **Toujours fournir le résumé de session** au sous-agent quand tu délègues : sans lui,
  il ne voit que l'état git, pas ce qui a été décidé/appris/livré.
- **Ne merge/push rien toi-même** ; ça reste à l'utilisateur de trancher.
