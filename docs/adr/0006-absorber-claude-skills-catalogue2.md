# ADR 0006 — Absorber `claude-skills` comme Catalogue 2 (strangler-fig + install global)

- Statut : **proposé**
- Date : 2026-06-27

## Contexte

`claude-skills` (repo séparé) stocke aujourd'hui les **skills** et **agents** `ezk-*`
et les installe via deux portées :
- **global** — `install.sh` **symlink** chaque `skills/<name>/` (avec `SKILL.md`) dans
  `~/.claude/skills/` et chaque `agents/<name>.md` dans `~/.claude/agents/` (`--copy`
  = snapshot figé). Un `git pull` met à jour **partout**.
- **par-projet** — `link-project.sh` symlink un **sous-ensemble** piloté par un manifest
  committé `<projet>/.claude/claude-skills.yml` ; `--remove`/`--prune` ne touchent **que
  ses propres symlinks, jamais un vrai fichier**.

`link-project.sh:12` acte la frontière : *« Rules are NOT handled here — iamthelaw's job »*.
Donc aujourd'hui : **deux corpus** (claude-skills = équipe, iamthelaw = loi) et **deux
installeurs**. L'utilisateur veut **une seule source** (ne plus ajouter des skills à deux
endroits) **sans casser** son daily-driver (les symlinks `~/.claude/` actifs).

mega-city est conçu pour ça : son domaine pose **deux catalogues** — *la LOI*
(rules/bundles = iamthelaw) et *l'ÉQUIPE* (agents/skills = **claude-skills**) — composés
par un `Profile` et matérialisés par `caps/`. ADR-0001 §6 prévoit déjà le **strangler-fig**.

## Décision

Absorber `claude-skills` dans mega-city comme **Catalogue 2**, en **strangler-fig**, en
**fermant deux trous de capacité** de `bind` avant tout débranchement.

1. **mega-city = seul write-target dès le jour J.** `claude-skills` est **gelé en source
   lecture-seule** : on n'y **ajoute** plus rien ; tout nouveau skill/agent est créé dans
   mega-city. (C'est la parade à la douleur « deux endroits » pendant la transition — la
   frontière doit être non-ambiguë *immédiatement*, pas seulement à la fin.)
2. **Le `Profile` subsume le manifest** `claude-skills.yml` (sous-ensemble par projet) : pas
   de nouveau concept, c'est déjà le keystone.
3. **Un seul `bind` remplace deux installeurs** : équipe + loi matérialisées ensemble (fini
   `install.sh` *et* `iamthelaw setup` séparés).
4. **Fermer deux trous avant de basculer** (cf. fiches 0017, 0018) :
   - **cible globale `~/.claude/`** : `bind` ne vise qu'un projet ; il faut un chemin global.
   - **mode `link` vs `copy`** : la coquille I/O ne fait que copier ; porter le symlink-par-
     défaut (live-update via `git pull`) que claude-skills offre.
5. **Migration du contenu au fil de l'eau** (0004 ezk-commits, puis les autres skills + les
   agents `ezk-*`). Bascule des symlinks `~/.claude` claude-skills → mega-city **seulement**
   quand 0017 + 0018 sont verts ; puis **archiver claude-skills**.

## Conséquences

**Devient plus facile** — une seule source à éditer ; un seul `bind` livre équipe + loi ;
le Profile remplace le manifest ; capitalisation unifiée (un repo, un journal).

**Coûts / à surveiller** — période transitoire où les skills vivent dans **deux repos** :
tenue uniquement par la **discipline** (gel de claude-skills + write-target unique). Le mode
symlink réintroduit un couplage live (un `git pull` mega-city change les outils partout) —
voulu pour le global, à **choisir explicitement** par-projet (`copy` vs `link`).

**Invariant unifiant (à dogfooder, fiche 0007)** — *un cap/installeur ne touche QUE ses
propres artefacts, jamais un fichier de l'utilisateur*. C'est la propriété commune à
claude-skills (`--prune`), iamthelaw (`setup`) **et** au `bind` merge-safe (fiche 0010). Un
seul principe pour les trois.

**À revisiter quand** — (a) un 3ᵉ hôte veut l'install global (cap global générique) ;
(b) on veut publier `iamthelaw`/les skills séparément en OSS (les dossiers sont déjà nets).

## Alternatives écartées

- **Big-bang** (tout déplacer + retirer claude-skills d'un coup) — re-pointer les symlinks
  `~/.claude` globaux en plein vol, alors que la cible globale et le mode symlink n'existent
  pas encore dans mega-city. Risque élevé sur le daily-driver. **Rejeté** au profit du strangler-fig.
- **Ne pas migrer** (mega-city pointe vers claude-skills) — contredit le domaine (mega-city
  doit *posséder* les catalogues) et pérennise deux repos + la fragmentation. **Rejeté.**
