# ADR-0027 — Matérialisation des assets d'un dossier de skill (`approaches/`, `scripts/`, …)

- **Statut** : accepté (2026-08-12)
- **Contexte** : ADR-0014 §4/§5 (« gap `scripts/` = hors MVP », à revisiter quand on veut
  matérialiser `scripts/` → étendre `Skill` + loader) ; ADR-0025 « Portée » (le remodelage
  « Skill = dossier (SKILL.md + assets) » est déféré). Cette décision **lève** ce report.

## Problème

Un skill est un **dossier** `skills/<id>/` : `SKILL.md` **plus** des fichiers auxiliaires
(`approaches/*.md` de la PR #134, `scripts/*.sh`, `references/`, `templates/`, `assets/`…).
Le modèle ne porte que `Skill = { id, content }` : le loader lit uniquement `SKILL.md` et
`skillFolderFiles` (`src/caps/skill-content.ts`) n'émet que `<prefix>/<id>/SKILL.md`.

Conséquence : en **install par symlink** (mode dev — `~/.claude` pointe vers le dépôt, ou
`bind-global --link`) le dossier entier est atteignable à travers le lien, **tout marche**.
En **install copy-mode** (`lawgiver bind-global` copy ; cap `claude-desktop`) seul `SKILL.md`
est copié : `approach=<nom>` ne trouve rien, et les `scripts/` sont absents (c'est déjà la
raison pour laquelle `ezk-backlog` minte ses ids **inline** dans `SKILL.md`). Le copy-mode
n'est donc **pas équivalent** au symlink-mode — objectif visé par cet ADR : la parité.

## Décision

1. **Domaine** — `Skill` gagne un champ optionnel (source de vérité `docs/domain.ts`,
   ré-exportée par `src/domain/model.ts`), et un type `SkillAsset` :
   - `assets?: SkillAsset[]` — les fichiers auxiliaires du dossier, hors `SKILL.md` ;
   - `SkillAsset = { path: string; content: string; executable?: boolean }` où `path` est
     **relatif au dossier du skill**, en séparateurs POSIX (`approaches/vectorz.md`).
   Absent ⇒ champ non posé (rétro-compat totale : un skill sans asset se charge comme avant,
   même invariant que `composes` en ADR-0025).

2. **Loader** (`src/loaders/catalog.ts`) — `readSkill` marche récursivement le dossier du
   skill et collecte les assets, **triés** par chemin relatif (déterminisme, F4) :
   - **fichiers réguliers seulement** : les symlinks (et les entrées non-fichier) sont
     **ignorés** — même garantie anti-exfiltration que `resolveHookScript` (un lien commité
     pointant hors dépôt ne peut pas faire embarquer un contenu externe), sans le double-pass
     realpath puisqu'on n'ouvre jamais un lien ;
   - **hors dotfiles** : les entrées `.*` (fichiers et dossiers, ex. `.DS_Store`) sont sautées
     → le plan reste déterministe vis-à-vis du **contenu versionné**, pas de l'état du FS local ;
   - `SKILL.md` (racine) est exclu (déjà porté par `content`) ;
   - `executable` = bit d'exécution de la source (`stat().mode & 0o111`) — git le versionne
     (100644/100755), donc déterministe sur un checkout propre ;
   - chaque `path` relatif passe par `assertSafeId` (défense frontière F1) — les noms issus de
     `readdir` sont sûrs par construction, on **maintient** néanmoins l'invariant explicite.
   Contenu lu **verbatim** (utf8), **non normalisé** — contrairement au `content` de `SKILL.md`
   (trim + `\n`) : un script doit rester byte-fidèle.

3. **Cap** (`src/caps/skill-content.ts`) — `skillFolderFiles` émet, pour chaque skill à
   `content` non vide, `SKILL.md` **plus** un `FileWrite` par asset à
   `<prefix>/<id>/<asset.path>`, avec un `mode` **toujours explicite** (`0o755` si
   `executable`, sinon `0o644`) — sans lui, une ré-application in-place (`applyPlan`, sans
   `rm` préalable) laisserait survivre un ancien bit `+x` quand l'asset redevient
   non-exécutable (finding Codex PR #138). **Double garde-fou** : `id` ET
   `asset.path` passent par `assertSafeId` au moment où ils deviennent un chemin de sortie —
   `assertSafeId` accepte le `/` interne, donc `approaches/x.md` est validé tel quel, `..`/
   absolu/antislash refusés. Le cap reste **pur** (l'I/O — `stat`, lecture — est faite en amont
   par le loader, ADR-0003).

4. **Coquille I/O** (`src/io/apply.ts`, `applyGlobalPlan`) — un skill n'est plus « un fichier »
   mais **un dossier multi-fichiers**. Le plan global est **groupé par dossier de skill**
   (`skills/<id>`), les agents inchangés :
   - le dossier de skill est dérivé du **`dirname` du `SKILL.md`** (jamais en tronquant l'id à
     2 segments) : un id **slashé** (`assertSafeId` l'autorise → `skills/foo/bar/SKILL.md`)
     reste correctement isolé (finding Codex PR #138) ;
   - garde **non-destructive** élargie : `assertManagedSkillDir` connaît désormais l'**ensemble
     des noms de premier niveau gérés** pour ce dossier (`SKILL.md`, `approaches`, `scripts`…),
     dérivé du plan. Un fichier **étranger** (hors de cet ensemble) dans un dossier de skill →
     **refus** (garantie inchangée). Sans cela, le 2ᵉ `bind-global` copy **lèverait** (le
     `approaches/` que *nous* avons écrit serait vu comme « non géré ») ;
   - copy-mode = **remplacement atomique du dossier géré** : on retire notre entrée gérée
     (symlink **ou** dossier ne contenant que du géré) puis on réécrit le contenu figé du plan.
     Corrige (a) l'**idempotence** avec assets, (b) l'écriture **à travers un symlink** lors
     d'une bascule link→copy (un asset trié avant `SKILL.md` s'écrirait sinon dans la source du
     catalogue), (c) la **péremption** d'un fichier retiré **d'un dossier d'assets encore géré**
     (le dossier est reconstruit exactement au plan). En revanche, retirer **tout** un dossier
     d'assets de premier niveau (ex. `approaches/` disparu du plan) est **refusé** : il est
     indistinguable d'un fichier utilisateur → non-destructif d'abord, retrait à la main (le
     message d'erreur le dit) ;
   - link-mode inchangé dans l'esprit : on **symlink le dossier** une fois par skill (les assets
     viennent gratuitement à travers le lien).
   `applyPlan` (par-projet : cap `claude-desktop`, `claude-code`) écrit déjà **tout** fichier du
   plan sans garde de dossier → aucun changement requis, les assets y atterrissent directement.

## Portée — ce que cette décision ne fait PAS

- **Assets texte uniquement (utf8).** `FileWrite.content` est une `string` ; les binaires
  (images dans un `assets/`) sortiraient corrompus. Le corpus actuel n'en contient aucun. Un
  support binaire exigerait de plomber un `Buffer`/base64 dans `FileWrite` → **différé**.
- **Cap `claude-code` par-projet inchangé.** Il matérialise les skills en **fichier plat**
  `.claude/skills/<id>.md` (forme non-dossier) : il ne peut pas porter d'asset **par
  construction**. Le passer en forme dossier `.claude/skills/<id>/SKILL.md` est une décision
  distincte (impacte CLAUDE.md/hooks du cap projet) → **hors périmètre**.

## Conséquences

- **+** Le copy-mode devient **équivalent** au symlink-mode : `approach=<nom>` fonctionne en
  install figée, et les `scripts/` deviennent **exécutables** côté install (bit préservé) —
  ce qui, à terme, retire la contrainte du mint **inline** d'`ezk-backlog`.
- **+** Rétro-compat totale (`assets` optionnel) ; `bind()` reste pur ; le plan reste
  déterministe et trié.
- **+** La garantie anti-traversal est **maintenue** sur la nouvelle source de sous-chemin
  (asset `path`), validée au loader **et** au cap (défense en profondeur).
- **−** `applyGlobalPlan` gère maintenant des dossiers multi-fichiers : plus de logique que
  « un fichier = un skill ». Contenue dans des helpers privés testés (idempotence + bascule
  link↔copy avec assets).
- **À surveiller** — le helper `skillFolderFiles` est partagé (global + desktop, ADR-0014) :
  tout changement de forme des assets impacte les deux caps (voulu : même contrat d'import).

## Alternatives écartées

- **Ne matérialiser qu'une liste blanche de sous-dossiers** (`approaches/`, `scripts/`…) — plus
  de config, et le copy-mode divergerait encore du symlink-mode (qui copie **tout** le dossier).
  On préfère « miroir du dossier, moins `SKILL.md`, moins dotfiles/symlinks ». **Rejeté.**
- **Normaliser le contenu des assets** (trim + `\n`, comme `SKILL.md`) — casserait la fidélité
  byte des scripts. **Rejeté** : verbatim.
- **Garder `apply.ts` intact et n'ajouter que loader+cap** — le 2ᵉ `bind-global` copy lèverait
  (« fichiers non gérés : approaches »), et une bascule link→copy écrirait à travers le symlink.
  Livrerait une feature **cassée à la 2ᵉ application**. **Rejeté** : la coquille I/O est dans le
  périmètre par nécessité de correction.
- **Résoudre les symlinks d'assets avec le double-pass realpath** (comme `resolveHookScript`) —
  utile seulement si on **voulait** suivre des liens. On n'a aucun cas d'usage légitime de lien
  dans un dossier de skill → **ignorer les symlinks** est plus simple et aussi sûr. **Rejeté.**
