# ADR-025 — Co-développement cop1 + mega-city dans un seul monorepo (option E)

**Statut :** Proposé (2026-07-13)
**Révisé par :** [ADR-027](ADR-027-vectorz-umbrella-monorepo.md) (2026-07-14) — remplace
la Décision §1 (« mega-city = workspace package du repo cop1, `mega-city/` à la racine »)
par l'umbrella neutre E′ (`products/*`, produits co-égaux) ; le reste (§2→§6) tient.
*(Back-ref posé par la fiche 0035, 2026-07-15.)*
**Déciders :** elzinko
**Révise :** [ADR-023](ADR-023-cop1-megacity-packaging-lifecycle.md) — remplace sa Décision §1
(« monorepo vendoré ») ; le reste d'ADR-023 (build-time couple/runtime indépendant, migrations
atomiques, rollback = revert, option D en réserve) **tient et s'en trouve simplifié**.
**Étend :** [ADR-021](ADR-021-megacity-integration-boundary.md) (couture inchangée : fichiers de
config natifs, zéro import runtime).
**Source :** [capture 2026-07-13](../captures/2026-07-13-contrat-methode-et-versions.md) (D6, Q6).

## Contexte

ADR-023 a retenu l'option A : une **copie vendorée** de mega-city dans le repo cop1, la source de
vérité restant le repo mega-city standalone, synchronisée par bumps. Cette option optimisait le
**déploiement** (tuple reproductible, rollback atomique) — mais elle ne résout pas, et aggrave
même, la douleur réelle constatée à l'usage : le **développement en parallèle**. Deux repos liés,
deux backlogs, deux sessions Claude Desktop qui se marchent dessus, et avec A un troisième
artefact à discipliner (la copie vendorée + drift-check).

Le besoin exprimé (2026-07-13) : **co-développer les deux produits dans un seul repo**, avec un
**backlog partagé**, tout en les gardant **indépendants** et **séparables** le jour où le besoin
de versionnement indépendant se matérialise.

L'argument qui avait disqualifié la fusion (option C d'ADR-023 : « tue l'host-agnosticité de
mega-city ») ne s'applique pas ici : l'host-agnosticité se perd par les **imports et la direction
des dépendances**, pas par la **co-localisation**. Des garde-fous CI la protègent aussi bien —
mieux, car vérifiables — qu'une frontière de repo.

## Décision

1. **mega-city devient un workspace package du repo cop1** (emplacement historique E :
   `mega-city/` à la racine — **supersédé par ADR-027** : co-localisation sous
   `products/mega-city/` et `products/cop1/packages/`, produits co-égaux). L'import
   préserve l'historique git (`git subtree add` ou équivalent). Le repo standalone
   `~/git/bacasable/mega-city` est ensuite **gelé** avec un README pointeur (même sort que
   claude-skills, mega-city ADR-0006).
2. **Versionnement d'ensemble pour l'instant** : une release = un tag du monorepo ; le tuple
   `(cop1, mega-city)` **est** le SHA, par construction. mega-city **conserve** son
   `package.json` (nom, version) — c'est le garde-fou qui permet de re-versionner et publier
   indépendamment le jour venu (bascule vers l'option D d'ADR-023, inchangée en réserve).
3. **Garde-fous de séparabilité, vérifiés en CI** :
   - zéro import croisé **dans les deux sens** (les anti-décisions d'ADR-021 deviennent des
     règles lint/CI, plus seulement des phrases d'ADR) ; cop1 n'invoque mega-city qu'au
     build/gouvernance (`bind` → config committée), jamais au runtime ;
   - `pnpm --filter mega-city build` (et ses tests) doit passer **seul** — mega-city reste
     buildable/releasable sans cop1, donc host-agnostic.
4. **Backlog partagé** : une seule arborescence `features/` à la racine, champ front-matter
   `product: cop1 | mega-city | transverse` (skill ezk-backlog — fiche mega-city 0048, adoption
   progressive). Fiches mega-city **ouvertes** re-numérotées dans la séquence racine avec table
   de correspondance dans le commit de migration ; les `done/` restent archivés tels quels.
5. **ADRs : l'histoire ne déménage pas.** Les deux séquences existantes restent en place,
   immuables (cop1 `docs/adr/ADR-0NN` ; mega-city `docs/adr/000N`, figée avec pointeur).
   **Une seule séquence racine pour toute décision future** — c'était déjà le cas de facto
   (ADR-021/022/023, les décisions de frontière, vivent ici).
6. **Consommateurs de mega-city** (symlinks `~/.claude`, `deploy.sh` d'ezk-ezk) : re-pointés
   par un simple re-`bind --global` post-migration (mega-city ADR-0006/0014). Un seul geste,
   pas de patch manuel.

## Options considérées

| Option | Douleur dev (2 repos/2 backlogs) | Rollback/tuple | Séparable plus tard | Verdict |
|---|---|---|---|---|
| **A** — copie vendorée (ADR-023) | ❌ persiste (+ discipline de sync) | ✅ atomique | ✅ | Optimise le mauvais plan (ship, pas dev) |
| **E** — co-développement monorepo | ✅ éliminée | ✅ natif (un SHA) | ✅ (garde-fous §3, sortie D) | **Retenue** |
| **E'** — umbrella neutre (à la `muti`) | ✅ | ✅ | ✅ | Plus « juste » symboliquement, mais migration ×2 (cop1 est déjà un monorepo pnpm outillé, CI comprise) — écartée pour l'instant, compatible plus tard |
| **C** — fusion (mega-city sous `packages/`) | ✅ | ✅ | ❌ | Subordination réelle — reste écartée (ADR-023) |
| **D** — dépendance publiée | ❌ (2 repos) | ✅ lockfile | n/a | Reste la **cible de sortie** quand mega-city aura de vraies releases |

E domine A sur toutes les forces qu'ADR-023 invoquait : le tuple et l'atomicité des migrations
sont **natifs** (un seul arbre) au lieu d'être fabriqués (vendoring + pin + drift-check).
Le seul prix : mega-city perd son repo standalone — accepté en séance.

## Conséquences

- **Plus facile :** fin des entrechocs de sessions dev ; un seul backlog ; tuple = SHA sans
  machinerie ; migration/rollback atomiques par construction ; **les Action Items 2–5
  d'ADR-023 deviennent caducs** (plus de `governance/megacity.pin`, plus de script de sync,
  plus de drift-check de vendoring — il reste le check « la config générée par `bind` est
  committée et à jour »).
- **Plus difficile :** la discipline de frontière repose désormais **entièrement sur la CI**
  (imports croisés, build filtré autonome) — à câbler dès la migration, pas après ; migration
  one-shot des consommateurs (`re-bind`) et gel du repo standalone.
- **À revisiter :** bascule vers D à la première vraie release séparée de mega-city ;
  l'emplacement `mega-city/` vs un éventuel umbrella si un 3e produit apparaît.

## Action items

1. [ ] Fiche de migration : import `git subtree` de mega-city → `mega-city/`, ajout au
   `pnpm-workspace.yaml`, build/test filtrés au vert.
2. [ ] Garde-fous CI : règle d'import croisé (deux sens) + job `--filter mega-city` autonome.
3. [ ] Fusion des backlogs (re-numérotation des fiches ouvertes + table de correspondance) —
   après livraison du champ `product` (fiche mega-city 0048).
4. [ ] `re-bind --global` des consommateurs + gel du repo standalone (README pointeur).
5. [x] Marquer dans ADR-023 la révision de sa Décision §1 par le présent ADR (fait dans le même commit).
