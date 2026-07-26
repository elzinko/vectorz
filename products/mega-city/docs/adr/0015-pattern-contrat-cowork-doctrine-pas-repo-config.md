# ADR 0015 — Le pattern « contrat cowork » devient doctrine mega-city ; pas de skill de mise à jour de skills

- Statut : **proposé**
- Date : 2026-07-14

## Contexte

job-app a fait émerger un pattern qui marche, en trois étages :

1. **Bootstrap statique mince** (in-repo `cowork/job-scan.md` + skill `job-scan` du subtree
   cowork-skills) : vérifier que l'app tourne, la lancer sinon, lire le guide, le suivre.
   Zéro logique de workflow.
2. **Guide dynamique servi par l'app** (`GET /api/llm-guide`, versionné avec le code) :
   tout le volatil vit là, mis à jour **dans la même PR** que chaque évolution d'API
   (règle d'or gardée par un test e2e).
3. **Règles d'or de défense en profondeur** dans le bootstrap (valables même si le guide
   est inaccessible).

**Deux implémentations prouvent le pattern** : job-app (`/api/llm-guide`) et my-resume
(son propre `/api/llm-guide` pour la génération d'URLs de CV). L'audit du 2026-07-14 a
confirmé sa vertu centrale : les fiches 0020/0021 (détection email) ont été livrées **sans
toucher aux bootstraps** — le cowork récupère les nouveautés en relisant le guide.

Deux questions posées le 2026-07-14 :
- Faut-il un **skill pour mettre à jour un skill quand on le modifie** ?
- Où **généraliser** le pattern — proposition initiale : `elzinko-claude-config/cowork/` ?

Forces en présence : ADR-0013 (anti-surproduction de méta-outillage — gate : preuve dans
≥ 2 repos, non couvert par l'existant, rituel récurrent) ; le strangler-fig claude-skills →
mega-city tout juste achevé (fiche 0024), qui a **unifié la source de vérité des skills** ;
`elzinko-claude-config` dont l'inventaire déclare lui-même mega-city source de vérité.

## Décision

1. **Le pattern est nommé et documenté ici** — « **contrat cowork** » (bootstrap statique
   mince / guide servi par l'app / règles d'or). mega-city est le siège de la doctrine
   skills : cet ADR est la référence, les repos applicatifs y pointent.
2. **`elzinko-claude-config/cowork/` est rejeté.** Ce repo est un **inventaire d'intent**
   (audit des 3 surfaces de config), pas une source actionnable. Y loger le pattern
   recréerait le split-brain (deux maisons pour les artefacts skills) que le gel de
   claude-skills vient d'éliminer.
3. **Pas de skill « mise à jour de skill ».**
   - Pour les `ezk-*` **symlinkés** : aucune copie à synchroniser — la modification est
     effective immédiatement ; versionnage et conformité relèvent de `validate.sh` (CI)
     et d'`ezk-steward` (audit). Un skill dédié ne couvrirait rien de nouveau.
   - Pour les skills cowork **dupliqués** (subtree job-app ↔ cowork-skills) : la vraie
     cure est le pattern lui-même — le volatil vit dans l'app, les bootstraps ne changent
     presque jamais (historique job-scan : 4 commits en 3 mois, tous sur la mécanique de
     lancement, zéro sur le workflow).
4. **Un futur `ezk-cowork`** (scaffold du pattern dans une nouvelle app + audit de synchro
   bootstrap ↔ guide ↔ subtree) est **capturé en fiche backlog** (0051, `status: idea`),
   conformément à la doctrine ADR-0013 : sortie = fiche révocable à coût ~zéro, fabrication
   seulement si le gate passe — une **2e app pilotée par cowork** qui se matérialise, ou la
   vérification de synchro qui devient un **rituel récurrent**.

> **Errata (2026-07-26).** `validate.sh` — cité ci-dessus (§3) et dans le tableau de
> l'option A — est un héritage de l'ancien repo autonome `claude-skills` et **n'a jamais
> existé dans ce monorepo**. La gate mécanique réelle de mega-city, ce sont les
> tests/typecheck (`pnpm --filter mega-city test`) + [`bin/check-links.sh`](../../bin/check-links.sh).
> Le texte de la décision est laissé tel quel (trace historique) ;
> cf. [fiche 0066](../../features/0066-tester-un-skill-avant-merge.md).

## Options considérées

### Option A — `elzinko-claude-config/cowork/` (proposition initiale)

| Dimension | Évaluation |
|-----------|------------|
| Complexité | Faible (un dossier de docs) |
| Cohérence écosystème | **Mauvaise** — 2e maison pour du contenu skills, contredit l'inventaire du repo lui-même |
| Actionnabilité | Nulle (doc morte, pas de gouvernance validate.sh/steward) |

**Contre** : recrée le split-brain post-strangler-fig ; un pattern qu'on veut appliquer
doit vivre là où vivent les outils qui l'appliquent.

### Option B — Doctrine ADR dans mega-city + fiche `idea` pour ezk-cowork (choisie)

| Dimension | Évaluation |
|-----------|------------|
| Complexité | Minimale (1 ADR + 1 fiche) |
| Cohérence écosystème | Bonne — siège unique de la doctrine, gate ADR-0013 respecté |
| Réversibilité | Totale — la fiche se promeut ou se clôt sans coût |

### Option C — Fabriquer `ezk-cowork` maintenant

| Dimension | Évaluation |
|-----------|------------|
| Complexité | Moyenne (skill + scripts scaffold/audit) |
| Preuves | **Insuffisantes** — 1 seule app scaffoldée (job-app), 1 seule vérif de synchro datée |
| Risque | Celui que l'ADR-0013 documente : le méta-outillage qui précède le besoin |

## Conséquences

- Plus facile : retrouver le pattern (un seul endroit), l'appliquer à une future app
  (l'ADR décrit les 3 étages et leurs garde-fous : test e2e des concepts clés, règle
  « guide mis à jour dans la même PR »).
- Plus difficile : rien — l'option A n'apportait qu'un rangement, sans gouvernance.
- À revisiter : si une 2e app cowork naît (samplerz, muti…), promouvoir la fiche 0051 et
  fabriquer `ezk-cowork` via `ezk-ezk create` (l'unique fabrique, ADR-0007/0013).

## Actions

1. [x] Fiche 0051 `ezk-cowork` créée en `idea` (ce commit).
2. [ ] Pointer cet ADR depuis job-app (CLAUDE.md, section cowork/) à la prochaine PR docs.
3. [ ] Au grooming de 0051 : fixer la priorité et vérifier le gate ADR-0013.
