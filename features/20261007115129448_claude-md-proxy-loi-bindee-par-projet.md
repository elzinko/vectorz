---
id: "20261007115129448"
title: "CLAUDE.md = simple proxy vers la loi, bindée par projet et visible dans le dépôt"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, loi]
status: idea
pr:
evidence: none # refactor d'outillage/convention, pas d'UI
created: 2026-10-07
---

# 20261007115129448 — CLAUDE.md proxy + loi bindée par projet

**En clair.** Aujourd'hui le `CLAUDE.md` du projet **recopie** des règles de clarté en dur, et la
loi compilée de la méthode vit **hors du dépôt** (`~/.claude/rules/iamthelaw.md`, déploiement
global) — donc invisible quand on feuillette le projet. On veut l'inverse : un `CLAUDE.md` **mince
qui pointe** vers la loi, et une loi **bindée par projet** (`.iamthelaw/` dans le dépôt), visible et
versionnée avec le code. Effet : on voit la loi qui s'applique, et on ne duplique plus les règles.

**Si tu arrives frais.** La « loi » de la méthode, ce sont des règles (`products/mega-city/rules/`)
compilées par l'outil `lawgiver` (`products/mega-city/bin/lawgiver.ts`). `bind-global` pose le
compilé dans `~/.claude/` (global, tous projets) ; `bind` le pose dans `.iamthelaw/` **à l'intérieur
d'un projet** (local, visible). `CLAUDE.md` est le fichier d'instructions que Claude Code lit au
démarrage d'un projet.

## Contexte / Problème

Constat PO du 2026-10-06/07, en lisant le `CLAUDE.md` de vectorz :

- **Le `CLAUDE.md` porte des règles en dur.** Il redit la règle de clarté (« En clair d'abord »,
  phrases courtes, Markdown seul…) au lieu de **pointer** vers elle. Toute évolution de la règle
  oblige à éditer deux endroits, qui divergent.
- **La loi est invisible dans le projet.** Elle est déployée en global (`~/.claude/rules/`), hors du
  dépôt. Le PO ne la voit pas en feuilletant vectorz — « ça m'embête de ne pas voir ». Elle n'est
  donc ni versionnée avec le code, ni relisible en revue.

Le principe visé : **le `CLAUDE.md` est un aiguilleur**, la loi est la source. C'est le même esprit
que l'ADR-0029 côté fiches (« la fiche est le document, la PR en est le rendu ») appliqué aux
règles : une seule source, des rendus qui pointent.

## Proposition

POC d'abord (binder vectorz sur lui-même en dogfooding), polish ensuite. Décision d'archi prise le
2026-10-07 — [ADR-0064](../products/mega-city/docs/adr/0064-loi-bindee-par-projet-cap-law-only.md).

1. **Un nouvel hôte `claude-code-law`** dans `lawgiver` (pas un flag). Il pose seulement
   `<projet>/.iamthelaw/ENTRY.md` (la loi compilée) + le bloc managé de `CLAUDE.md` qui pointe vers
   elle. Il **n'écrit ni** `.claude/skills` **ni** `.claude/agents` dans le dépôt — c'est ce qui
   évite la duplication circulaire (vectorz est la source de ses propres skills).
2. **Binder le profil `base`** : il compile la même loi (les 6 règles du socle) que `global`/`daily`,
   sans traîner la toolbox. Commande :
   `pnpm --dir products/mega-city lawgiver bind base "$(git rev-parse --show-toplevel)" claude-code-law`.
3. **Amincir `CLAUDE.md`** : le cap pose le pointeur ; **retirer les règles recopiées est une
   édition humaine unique**. Après, `CLAUDE.md` = orientation + lien, pas un règlement.
4. **Hors périmètre** : les hooks (vectorz gère les siens) ; l'anti-dérive du fichier généré
   committé (voir « Mesure de suivi »).

Le cœur de `lawgiver` (`bind.ts`) et le parsing CLI restent **intacts** : `host` est déjà un
argument positionnel (`bind <profil> <projet> [host]`). On ajoute un module de cap + une ligne au
registre (OCP/DIP, ADR-0003).

## Critères d'acceptation

- [ ] Le cap `claude-code-law` existe (`src/caps/claude-code-law.ts`) et est enregistré dans
      `registry.ts` ; `bind.ts` est **inchangé** (prouvé par diff).
- [ ] `lawgiver bind base <repo> claude-code-law` écrit `.iamthelaw/ENTRY.md` + le bloc managé de
      `CLAUDE.md`, et **n'écrit ni** `.claude/agents` **ni** `.claude/skills` dans le dépôt.
- [ ] `.iamthelaw/ENTRY.md` est committé et **égale** la loi du profil `base`.
- [ ] `CLAUDE.md` ne recopie plus de règle : orientation + pointeur vers la loi seulement.
- [ ] Décision consignée en [ADR-0064](../products/mega-city/docs/adr/0064-loi-bindee-par-projet-cap-law-only.md).

**Mesure de suivi** — anti-dérive : `.iamthelaw/ENTRY.md` est un artefact généré committé (ADR-0055) ;
si `rules/` change sans re-bind, il ment. Une garde légère (recompiler et exiger un `git diff` propre,
façon `views:check` ou `doctor` ciblé projet) peut être ajoutée ici ou en **fiche-suite**, pour garder
ce POC mince.

## Comment vérifier

```bash
# 1. Le bind law-only écrit la loi + le pointeur, PAS les skills/agents.
pnpm --dir products/mega-city lawgiver bind base "$(git rev-parse --show-toplevel)" claude-code-law
ls .iamthelaw/ENTRY.md                                 # la loi est là
git status --porcelain .claude/skills .claude/agents   # doit rester VIDE (rien recopié)
# 2. CLAUDE.md pointe vers la loi, sans recopier de règle (contrôle humain + grep du lien).
grep -nE "iamthelaw" CLAUDE.md
# 3. Anti-dérive : la loi committée égale celle du profil base (re-bind puis diff propre).
git diff --exit-code .iamthelaw/ENTRY.md && echo "OK — pas de dérive"
```

## Glossaire

- **binder (bind)** : compiler la loi (règles + bundles) vers un fichier d'entrée que Claude Code
  lira ; `bind-global` → `~/.claude/`, `bind` → `.iamthelaw/` du projet.
- **proxy / aiguilleur** : un `CLAUDE.md` qui ne porte pas les règles mais renvoie à leur source.

## Notes / décisions

- **Origine** : revue PO 2026-10-06/07 (lecture du `CLAUDE.md` + question « iamthelaw, global ou par
  projet ? »). Jugé connexe au rangement, d'où le lot V0.9, mais concern distinct des docs → fiche
  à part.
- **Lien** : fiche sœur [regrouper les artefacts de méthode](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md),
  même lot « Ranger la maison ».
- **Prior art** : fiches déjà livrées sur lawgiver — `0106` (bind cap claude-code), `0111` (migrer
  les rulesets vers iamthelaw), `0140` (geler/archiver iamthelaw). Vérifier au grooming qu'on ne
  recoupe pas leur périmètre.

### Grooming 2026-10-07 — mécanisme confirmé + le fork à trancher

**Confirmé dans `products/mega-city/bin/lawgiver.ts`** : `bind <profil> <projet>` écrit
`<projet>/.iamthelaw/ENTRY.md` (la loi compilée), et `bind-global <profil>` écrit
`~/.claude/rules/iamthelaw.md`. La loi est donc **bien compilée** des deux côtés (une note de
mémoire datée du 2026-09-03 disait le contraire — périmée).

**Le fork à trancher (cœur de la fiche).** `bind <profil> <projet>` n'écrit pas QUE la loi : il
matérialise aussi `<projet>/.claude/skills` et `.claude/agents`. Pour vectorz, c'est un cas
**spécial** : vectorz est la **source** de ces skills (`products/mega-city/skills/`), et
`~/.claude` est déjà fait de **liens** vers ce checkout (voir la mémoire d'isolation des
sessions). Un `bind` complet y recopierait ses propres skills — circulaire. Trois voies :

- **A — bind complet** : accepter les copies de skills/agents dans `vectorz/.claude/`. Simple,
  mais duplique la source. Probablement mauvais pour vectorz.
- **B — « loi seule »** : ne produire que `.iamthelaw/ENTRY.md` (option/variante de `lawgiver` à
  ajouter), sans toucher skills/agents. Le plus propre pour vectorz, mais demande un petit ajout
  outil.
- **C — ne pas binder vectorz** : juste faire pointer `CLAUDE.md` vers la loi (globale et/ou la
  source `rules/`), sans fichier compilé dans le dépôt. Zéro outil, mais la loi reste moins
  « palpable » dans le repo.

C'est une décision de structure → candidate à l'avis de l'architecte, et à consigner en ADR
(critère d'acceptation déjà présent). Le **profil** à binder (`default` ? un profil vectorz ?)
dépend de cette voie.

**Résolu le 2026-10-07 (avis `ezk-architect`)** : voie **B**, implémentée comme un **nouvel hôte
`claude-code-law`** (pas un flag `--law-only`, qui descendrait une condition dans le cœur `bind.ts`).
Profil **`base`**. `bind.ts` et la CLI restent intacts (l'hôte est déjà positionnel). Détail et
schéma : [ADR-0064](../products/mega-city/docs/adr/0064-loi-bindee-par-projet-cap-law-only.md). La
Proposition et les Critères ci-dessus reflètent cette décision.
