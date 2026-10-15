# Run v0.16.0 « ranger la maison (2e jet) » — compte rendu

**En clair.** v0.16.0 est **livrée et taguée en local** (HEAD `1761a30c`), rien poussé. **7 fiches
livrées** : le lot « ranger la maison » (cockpit, discipline de grooming, « en cours » déduit des
branches, `in-progress` calculé, lentille étiquette≠comportement, garde-fous de test) **plus** la
décision « où vivent les ADR », tranchée en séance avec le PO (option B — deux dossiers + règle de
routage, [ADR-078](../adr/ADR-078-ou-vivent-les-adr-routage.md)). Une **chasse aux bugs adverse** (3
relecteurs frais) n'a trouvé **aucun bug bloquant** ; les incohérences réelles ont été corrigées avant le
tag. **3 fiches non livrées sont parkées hors v0.16** (réveil au grooming) : le déménagement `scrum/`
(×2, sous revue) et le tri des sorties de rétro (grooming + panel adverse). **Ce qu'il te reste à
faire** : `git push origin v0.16.0` quand tu veux — le seul geste laissé au PO.

## Le lot livré (flux local, github: false)

Chaque fiche a suivi : branche → code + test → revue adverse → `ezk forge integrate` (squash local sur
le `main` du principal) → `ezk backlog ship … local (<sha>)` → `git reset --hard main`. Tout est sur
`main` local, non poussé.

| Fiche | En deux mots | Squash | Ship |
|---|---|---|---|
| [le cockpit liste le projet de lancement une seule fois](../../features/done/20261010114133345_cockpit-liste-lancement-une-fois.md) | dédoublonne la barre « Projet » : le lancement déjà au registre n'est plus listé deux fois | `c26c36b6` | `1d8a243f` |
| [au grooming : un ajout de comportement est une story ou reçoit un critère](../../features/done/20261010114133469_groom-ajout-comportement-est-une-story.md) | `ezk dor check` ouvre sa liste de contrôle par ce rappel (règle `acceptance-criteria-before-merge`) | `56f9b984` | `c0ec13e7` |
| [« en cours » se déduit des branches (portier + vue)](../../features/done/20261013131852984_en-cours-deduit-des-branches-portier-vue.md) | plus de `status: in-progress` écrit : une branche `feat/<id>-…` non absorbée par `main`, lue à la volée | `5dd0f4c3` | `315288c8` |
| [trancher le sort de la valeur in-progress du schéma (ADR court)](../../features/done/20261013131853182_sort-valeur-in-progress-schema.md) | ADR-0077 : `in-progress` reste CALCULÉ mais devient non-écrivable (le validateur le refuse) | `351dc74e` | `5d395dd4` |
| [toucher les règles d'un agent : dire si ça change le comportement ou l'étiquette](../../features/done/20261010235329987_etiquette-pas-comportement-en-tetes-agent.md) | lentille `ezk-reviewer` : promettre un effet runtime via `interactions:`/`applies:`/le graphe = NO-GO | `8840a86a` | `6b1ffcbc` |
| [un contrôle refuse une section en double + les tests ne figent plus le backlog](../../features/done/20261003201035080_skills-sans-section-double-tests-sans-donnee-figee.md) | 2 garde-fous de test : doublons de titres dans un `SKILL.md` ; chemins/ids de fiches actives figés | `89840129` | `ac091b8f` |
| [où vivent les ADR : deux dossiers + règle de routage](../../features/done/20261011142027875_ou-vivent-les-adr-repo-multi-projets.md) | décision tranchée en séance (option B, [ADR-078](../adr/ADR-078-ou-vivent-les-adr-routage.md)) : garder les 2 dossiers + règle de routage, **rien déplacé** | `dc165b3c` | `1761a30c` |

**3 fiches parkées hors v0.16** (`ezk backlog park`, réveil au grooming) :
- [trier les sorties de rétro](../../features/20261002155911271_trier-sorties-retro-par-nature.md) — sa prémisse (« règle en observation », gabarit `.rules/`) n'existe **nulle part** dans le code ; et le modèle du tri (tout passer par une fiche ? la règle comme *livrable* d'une fiche ?) est à trancher en **grooming + panel adverse**. Fiche enrichie du constat.
- [basculer vers `scrum/`](../../features/20261007154842643_basculer-vectorz-vers-dossier-scrum.md) + [note de migration](../../features/20261007154842917_note-migration-bascule-consommateurs-scrum.md) — déménagement 168 fichiers, **à faire sous revue**, pas en run autonome : son propre chantier.

## La chasse aux bugs adverse (gate de release)

`ezk release v0.16.0` a d'abord rendu **NO-GO** (sa passe « chasse aux bugs » exige un verdict de
relecteur). Trois relecteurs adverses (agents frais, pas l'auteur), chacun une lentille — correctness &
cas limites · régressions & contrats · les tests prouvent-ils le changement + honnêteté — ont relu le
cœur du delta `v0.15.0..HEAD` (code seul). **Aucun bug fonctionnel, aucun NO-GO.** Les incohérences
réelles, corrigées avant la frontière (commit de durcissement `291b3608`) :

- **Portier vs vue, préfixes de branche divergents** : le portier ne reconnaissait que `feat|fix`, la
  vue 7 préfixes. Une story sur `chore/<id>` échappait au portier → aligné sur la vue.
- **Pastille de session non filtrée** : une fiche dont la seule branche est absorbée n'est plus « en
  sprint » (correct), mais pouvait encore afficher « quelqu'un bosse dessus ». Pastille filtrée comme le
  stage.
- **`collectAbsorbedBranches` (TS) sans test** : le classifieur d'absorption qui nourrit la vue n'était
  prouvé que côté shell (portier) → test TS ajouté (vrai dépôt git).
- **Libellés périmés** (portier `--full`, commentaire du validateur) corrigés.

**Laissé tel quel, à dessein** (tracé dans `.vectorz/release/v0.16.0.bughunt-go`) : les surfaces
« in-progress » de `ezk dor health`, `portfolio.sh` et `plan-delta` lisent 0/vide depuis l'ADR-0077
(plus personne n'écrit ce statut). Elles ne sont **pas** du code mort au sens de la règle (atteignables
+ testées par des fixtures : elles rendent un statut *connu*, choix « garder calculé ») ; l'état « en
cours » qui fait foi est désormais déduit des branches. Deux relecteurs l'ont noté ; c'est une tension
assumée, pas un défaut.

## Validation

- **Gate complète** (frontière de version) : `pnpm gate` = `tsc --noEmit` + `pnpm test` + `pnpm
  test:scripts` — **tout vert** (exit 0), rejoué après les corrections.
- **Gate de release** : `ezk release v0.16.0` → **GO** (`dod-mecanique` GO · `chasse-aux-bugs` GO,
  verdict dans `.vectorz/release/v0.16.0.bughunt-go`).

## Clôture — tag posé en local (décidé en séance avec le PO)

Le run autonome s'était arrêté avant le tag : la version portait 4 fiches non livrées **réservées au
PO** (3 bloquées par conception + 1 sautée), et le garde-fou des fiches bloquées empêchait — à juste
titre — de clore. Tranché en séance, puis exécuté :

- **Où vivent les ADR** → **option B** (deux dossiers + règle de routage, [ADR-078](../adr/ADR-078-ou-vivent-les-adr-routage.md)),
  **sans rien déplacer** : la fiche est **livrée**. Le vrai trou n'était pas la numérotation (déjà réglée
  par la suite unique + `ezk adr new`) mais l'absence d'une règle écrite ; coût quasi nul, respecte « les
  ADR ne déménagent pas » (ADR-025 §5).
- **Les 3 fiches restantes** (trier-rétro, scrum ×2) sont **sorties de v0.16** par `ezk backlog park`
  (réversible, réveil au grooming) et retirées de la section v0.16 du PLAN.

v0.16.0 ne contient alors plus que son lot livré → `version check` = **0 erreur, 0 alerte**,
`ezk release v0.16.0` = **GO**, et `ezk backlog version close v0.16.0 --tag` a **posé l'étiquette
`v0.16.0` en local sur `1761a30c`**. Rien n'est poussé (`origin/main` reste à v0.13).

## Rétro légère — 6 notes déposées (3 en clôture de run + 3 en séance PO)

Au carnet de rétro (`<git-common-dir>/ezk/retro-notes/`), pour la prochaine cérémonie :

1. **Tag autonome bloqué par des fiches réservées au PO** — un run ne peut taguer une version qui porte
   des fiches bloquées/hors-scope ; piste : sortir ces fiches de la version AVANT le run, ou distinguer
   « lot livré » (taggable) de « version complète ».
2. **Une fiche ready peut porter une prémisse absente du code** (cas « trier les sorties de rétro ») ;
   piste : au grooming d'une fiche d'alignement de doc, vérifier que chaque surface citée existe.
3. **Garder-calculé laisse des surfaces d'affichage à zéro** (in-progress) ; piste : décider du sort de
   *chaque* surface qui lit un statut rendu « calculé ».

En séance avec le PO (2026-10-15), 3 notes de plus — des questions de **conception à groomer** :

4. **Gate « version prête à lancer »** — en mode auto, vérifier la DoR de toutes les fiches d'une version
   AVANT de lancer les sprints (composer `dor check` + `version check` + le filtre d'éligibilité).
5. **Mode auto en 2 phases** — séparer « groomer + vérifier la DoR » du « dev » ; reporter une fiche
   après grooming avec la raison dans le rapport final.
6. **Modèle des sorties de rétro** — tout passer par une fiche (règle = *livrable* d'une fiche), plutôt
   que la règle imposée directe sans historique de vérification (à trancher en panel).

## Et maintenant ?

- `git push origin v0.16.0` — publier l'étiquette : le **seul** geste laissé au PO (elle pointe `1761a30c`).
- Les **3 fiches parkées** reviennent au **grooming** : le tri des sorties de rétro + le modèle « tout
  passer par une fiche ? » demandent un **panel adverse** ; le déménagement `scrum/` est son propre
  chantier **sous revue**.
- v0.17.0 « le board unifié (cop1) » est la version suivante — à construire en session dédiée.
