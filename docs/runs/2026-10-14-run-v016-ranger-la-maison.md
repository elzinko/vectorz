# Run v0.16.0 « ranger la maison (2e jet) » — compte rendu

**En clair.** Le lot v0.16.0 est **construit et livré en local**, rien poussé : **6 fiches sur 7**
sont sur `main` (flux `github: false`). La 7e — « trier les sorties de rétro » — a été **sautée** :
elle demande d'aligner la doc sur un mécanisme (« règle en observation », gabarit `.rules/`) qui
n'existe pas encore dans le code ; c'est un arbitrage produit, pas un chore autonome. Une **chasse aux
bugs adverse** (3 relecteurs frais) n'a trouvé **aucun bug bloquant** ; les incohérences réelles ont été
corrigées avant la frontière. **MAIS le tag v0.16.0 n'est pas posé** : la version porte encore 4 fiches
non livrées **réservées au PO** (3 bloquées par conception + la fiche sautée), et le garde-fou des fiches
bloquées empêche — à juste titre — de clore la version. **Ce qu'il te reste à faire** : trancher le sort
de ces 4 fiches (les détails en bas), puis le tag se pose en une commande (ou je le fais sur ton feu
vert).

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

**Fiche sautée** (non livrée) :
[trier les sorties de rétro par nature](../../features/20261002155911271_trier-sorties-retro-par-nature.md)
— la 3e surface à aligner (« README `.rules/` qui range des règles *en observation* ») et le concept
« règle en observation / buffered » n'existent **nulle part** dans le code. Documenter un mécanisme
inexistant serait mentir (« livré ≠ tourne »). Décision PO requise : reformuler le tri sur ce que la
méthode fait vraiment, ou ficher à part la construction du tampon. La fiche a été **enrichie** du constat
daté pour son re-grooming.

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

## Pourquoi le tag n'est PAS posé — à toi de trancher

`ezk backlog version close v0.16.0 --tag` **refuse** : 4 fiches restent `version: v0.16.0` sans être
livrées, et 3 d'entre elles sont **bloquées par conception** (le garde-fou des fiches bloquées empêche la
clôture — c'est voulu). Les voici :

| Fiche | Statut | Pourquoi elle bloque |
|---|---|---|
| [trier les sorties de rétro](../../features/20261002155911271_trier-sorties-retro-par-nature.md) | ready, **sautée** | prémisse absente du code → arbitrage PO (cf. plus haut) |
| [basculer vectorz vers `scrum/`](../../features/20261007154842643_basculer-vectorz-vers-dossier-scrum.md) | bloquée `sous-revue` | déménagement 168 fichiers, « à faire sous revue, pas en run autonome » |
| [note de migration `scrum/`](../../features/20261007154842917_note-migration-bascule-consommateurs-scrum.md) | bloquée `attend-dépendance` | dépend de la bascule `scrum/` |
| [où vivent les ADR (multi-projets)](../../features/20261011142027875_ou-vivent-les-adr-repo-multi-projets.md) | bloquée `attend-panel` | « décision structurelle à tenir avec le PO, pas un build autonome » |

Un run autonome ne peut pas taguer une version qui porte des fiches que la méthode réserve au PO. J'ai
tenté de les reporter à v0.17.0 pour débloquer la clôture, puis **annulé** : la place de ces fiches dans
la séquence **curée** du PLAN (sa section v0.17 est thématique « board unifié ») est un arbitrage de
plan, pas du rangement mécanique. L'état du dépôt est donc **cohérent** (les 4 fiches restent v0.16.0,
`version check` = 0 erreur), et la décision te revient.

## Rétro légère — 3 notes déposées

Au carnet de rétro (`<git-common-dir>/ezk/retro-notes/`), pour la prochaine cérémonie :

1. **Tag autonome bloqué par des fiches réservées au PO** — un run ne peut taguer une version qui porte
   des fiches bloquées/hors-scope ; piste : sortir ces fiches de la version AVANT le run, ou distinguer
   « lot livré » (taggable) de « version complète ».
2. **Une fiche ready peut porter une prémisse absente du code** (cas « trier les sorties de rétro ») ;
   piste : au grooming d'une fiche d'alignement de doc, vérifier que chaque surface citée existe.
3. **Garder-calculé laisse des surfaces d'affichage à zéro** (in-progress) ; piste : décider du sort de
   *chaque* surface qui lit un statut rendu « calculé ».

## Et maintenant ?

- **Décider du sort des 4 fiches ci-dessus** (geste PO) — par exemple les reporter à une version
  ultérieure (champ `version:` + leur ligne dans `PLAN.md`), ou les sortir de la version. Dis-moi la
  cible et je l'applique.
- Une fois v0.16.0 réduite à ses fiches livrées : `ezk backlog version close v0.16.0 --tag` pose
  l'étiquette locale (la gate de release est déjà **GO**), puis `git push origin v0.16.0` la publie
  (geste du PO).
- v0.17.0 « le board unifié (cop1) » est la version suivante — à construire en session dédiée une fois
  v0.16.0 taguée.
