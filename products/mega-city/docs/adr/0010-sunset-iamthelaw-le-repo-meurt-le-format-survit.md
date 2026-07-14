# ADR 0010 — sunset `iamthelaw` : le repo meurt, le nom et le format survivent

- Statut : **proposé**
- Date : 2026-07-06

## Contexte

Audit du 2026-07-06 : le repo `iamthelaw` (~/git/bacasable/iamthelaw) est un CLI npm jamais
publié **ni poussé** (aucun remote git). Il détient encore l'essentiel de LA LOI : 10 rulesets,
53 règles, 11 enforcements typés (7 agent-check, 3 hook, 1 prompt), et les 3 seuls hooks
exécutables du portefeuille (commit-msg,
pre-commit typecheck, pre-push CI-locale) — mega-city n'a repris que le format frontmatter et
2 règles (fiche 0006, todo). Trois dialectes incompatibles coexistent :

1. `ruleset.yaml` du repo (`rules:[{id,title,level,content}]` + `enforcements`) ;
2. le dialecte cop1 `iamthelaw/{global,scrum,architecture}.yaml`
   (`rules:[{id,description,source,check?}]`), réimplémenté localement dans `IamTheLawLoader`
   — zéro dépendance au repo, et **personne n'écrit ces fichiers aujourd'hui** ;
3. `rules/*.md` mega-city (frontmatter `kind/level/enforcements`).

Le CLI n'écrit pas ce que cop1 lit (`.iamthelaw/` vs `iamthelaw/`) : le couplage de format
supposé est déjà rompu. Les deux consommateurs pnpm du repo (city-guided `link:../iamthelaw`,
umbillical `link:` chaîné) ont été **coupés le 2026-07-06** (installs verts). Cursor est
abandonné par l'opérateur. Précédent : ADR-0006 (absorption claude-skills, strangler-fig).

## Décision

1. **Strangler-fig #2, même playbook qu'ADR-0006.** mega-city est le seul write-target de
   LA LOI ; `iamthelaw` devient source de migration, puis archive GitHub (lecture seule).
2. **Migre** : les 53 règles atomisées en `rules/` (1 règle = 1 fichier markdown+frontmatter),
   1 ruleset = 1 bundle dans `bundles/`, les enforcements typés conservés tels quels, et les
   3 hooks exécutables rapatriés comme assets d'enforcement (résout au passage la ref cassée
   `hooks/commit-msg.sh` de `rules/conventional-commits.md`). → fiche 0006 (révisée).
3. **Ne migre PAS** (remplacé ou abandonné) : le CLI/installeur (`bind` le remplace,
   ADR-0006), le générateur ENTRY.md (les caps matérialisent), `module import/export`
   (les profiles composent), le target **Cursor** (abandonné), le layout `.iamthelaw/`.
4. **Le nom et le format survivent.** « iamthelaw » reste le nom du Catalogue 1 (LA LOI).
   Le dialecte cop1 `iamthelaw/*.yaml` devient le **format de matérialisation du cap cop1**
   (fiche 0016) : mega-city en sera le premier écrivain réel — couture libre, personne à
   déloger.
5. **Ordre** : fiche 0006 (migration) → fiche 0035 (gel README + `gh repo archive`).
   Pas d'archivage avant migration complète, pour ne jamais revenir dessus.

## Conséquences

**Plus facile** — une seule source de LA LOI ; les hooks enfin possédés par le catalogue ;
le cap cop1 cible un format que plus rien d'autre ne prétend écrire ; un repo de moins à
maintenir.

**À surveiller** — la fidélité de conversion (title/tags/version se perdent : les porter en
frontmatter si utiles) ; les 11 enforcements doivent rester exécutables après migration
(fiche 0011 : dériver le hook du champ `enforcement.hook.script` au lieu du hook codé en dur).

## Alternatives écartées

- **Publier `iamthelaw` comme package et le brancher dans cop1** — dialectes incompatibles,
  double catalogue, contraire à ADR-0005 (couture = fichiers natifs, jamais une lib). Rejeté.
- **Garder les deux catalogues vivants** — dérive garantie (déjà constatée : 2 règles
  divergentes), double maintenance. Rejeté.
- **Archiver sans migrer** — perte des 51 règles et des hooks, retour en arrière inévitable.
  Rejeté (l'opérateur veut archiver « pour ne pas y revenir »).
