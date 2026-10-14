# Run v0.15.0 « voir les runs » — compte rendu

**En clair.** v0.15.0 est **livrée et taguée en local**, rien poussé. Ses **6 fiches** sont toutes
construites et livrées : le run autonome est plus robuste (filtre d'éligibilité, boucle multi-versions,
auto-tag opt-in, park hors version), le registre de supervision ne perd plus son mode d'emploi, et
surtout cop1 **affiche désormais les runs lancés avec leurs paramètres**. Une **chasse aux bugs adverse**
(3 relecteurs indépendants) a trouvé **1 vrai bug** avant le tag ; corrigé. **Ce qu'il te reste à
faire** : pousser l'étiquette quand tu veux (`git push origin v0.15.0`, qui pointe `6c80098a`) — c'est le
seul geste laissé au PO.

## Le lot livré (flux local, github: false)

Chaque fiche a suivi : branche → code + test → revue adverse → `ezk forge integrate` (squash local sur
le `main` du principal) → `ezk backlog ship … local (<sha>)` → `git reset --hard main`. Tout est sur
`main` local, non poussé.

| Fiche | En deux mots | Squash | Ship |
|---|---|---|---|
| [le run autonome filtre l'éligibilité avant de délibérer](../../features/done/20261011091553794_run-autonome-filtre-eligibilite-avant-deliberer.md) | écarte sans délibérer une fiche bloquée/grosse/différée ; borne de version | `0162cd57` | `09079594` |
| [ezk-product-build enchaîne plusieurs versions](../../features/done/20261013131852375_product-build-boucle-multi-versions.md) | `--versions all` + frontière rétro/clôture par version (POC) | `3d60cf61` | `1409e182` |
| [auto-tag et clôture de version en local, opt-in](../../features/done/20261013131852581_auto-tag-close-local-opt-in.md) | `--seal-versions local` + ADR-0076, jamais hors flux local | `8156ad0c` | `50ccca9c` |
| [l'auto-groom sort une fiche inconstruisable de sa version](../../features/done/20261013131852779_auto-groom-sort-fiche-hors-version.md) | `ezk backlog park`, réversible | `f33e994b` | `6e97d924` |
| [registry-add préserve les commentaires d'en-tête](../../features/done/20261010114133220_registry-add-preserve-commentaires.md) | le mode d'emploi du registre survit à l'ajout d'un projet (bug) | `7dc5df29` | `80a07065` |
| [cop1 affiche les itérations lancées + leurs paramètres](../../features/done/20260906142654370_cop1-afficher-iterations-lancees-parametres.md) | « voir les runs » : params dans run_start → Moniteur | `1eac510f` | `6b5aba08` |

La pièce maîtresse (fiche 6) traverse **deux produits** : mega-city **émet** les paramètres du run dans
`run.started`, cop1 les **affiche** dans le Moniteur (carte + historique). La couche app passe les
paramètres par héritage, sans code. Pose la **donnée** + une **liste** ; la vue riche reste pour le board
v0.17.

## La chasse aux bugs adverse (gate de release)

`ezk release v0.15.0` a d'abord rendu **NO-GO** : sa passe « chasse aux bugs adverse » exige un verdict
de relecteur indépendant. Trois relecteurs adverses (agents frais, pas l'auteur), chacun avec une
lentille distincte — correction & cas limites, intégration & contrats, régression & invariants — ont
relu le cœur du delta `v0.14.0..HEAD`. **1 vrai bug trouvé**, corrigé avant le tag :

- **Tri de la suite multi-versions corrompu par un jeton illisible** —
  [`version-sequence.ts`](../../products/mega-city/src/backlog/version-sequence.ts). `--versions <liste>`
  triait avec `compareVersions`, qui rend `NaN` sur un jeton non numérique (`vnext`, `v1.2.0-rc.1`) et
  désordonnait les versions **valides** (tri V8 instable). Le défaut `--versions all` n'était pas touché.
  Corrigé : tri avec `compareLoose` (teste le format avant de comparer) + test de non-régression. Commit
  intégré `6c80098a`.

Les deux autres relecteurs : **GO, zéro bug** — chaîne inter-produits alignée de bout en bout, tolérante
à l'absence ; aucune régression (200 tests rejoués verts). Puis `ezk release v0.15.0` → **GO**, et
`ezk backlog version close v0.15.0 --tag` a posé l'étiquette sur `6c80098a`.

## Validation

- **Gate complète** (frontière de version) : `pnpm test` **2068/2068** · `pnpm test:scripts` **43 suites**
  · `tsc --noEmit` — tout vert.
- **Gate de release** : `dod-mecanique` GO · `chasse-aux-bugs` GO (verdict dans
  `.vectorz/release/v0.15.0.bughunt-go`, artefact local).
- Tests cop1 touchés : `journal-validator` 16/16 · web `SupervisionView` 38/38 (vérifiés aussi sur le
  principal). La couche app cop1 n'a pas pu tourner dans le worktree (dist des packages frères non
  construit) — passthrough typé, sans code à elle.

## Rétro légère — 2 notes déposées

Au carnet de rétro (`<git-common-dir>/ezk/retro-notes/`), pour la prochaine cérémonie :

1. **Worktree neuf, cop1 non testable sans install complet + build des frères** : le principal (vitest 2
   périmé) masquait une incompat vitest 4 du stub `EventSource` qu'un install frais a révélée. Vérifier la
   version vitest **résolue**, et construire les packages frères, avant de conclure « tests cassés ».
2. **Le `--dry-run` du dispatcheur `ezk` masque celui du sous-script** : pour éprouver le vrai dry-run de
   `forge integrate` / `ship`, appeler le bin directement, pas via `ezk`.

Et un signal positif : la chasse aux bugs de release a de nouveau gagné sa place — elle a attrapé un bug
que l'auto-revue par fiche avait laissé passer.

## Et maintenant ?

- `git push origin v0.15.0` — publier l'étiquette (geste du PO).
- v0.16.0 est débloquée par le tag — à construire **en session dédiée** (même consigne de build
  autonome), ou à piloter à la main.
