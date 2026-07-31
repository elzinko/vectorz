---
name: ezk-pr-pilot
argument-hint: "[help|init|plan|run|report|ship] [#PR…]"
description: >-
  Chef d'orchestre du TEST-PUIS-MERGE d'un STOCK de PRs ouvertes. A utiliser
  quand l'utilisateur a plusieurs PRs à valider et demande « comment je les
  teste / les enchaîne / les merge », « dans quel ordre », « fais-moi un plan
  de test des PRs », « qu'est-ce qui reste à tester sur quelle PR », veut
  regrouper les tests device en une seule session, obtenir pour chaque PR le
  banc à démarrer et l'URL de démo, ou reporter dans chaque PR ce qui a été
  validé. Pilotable par sous-commandes : help, init (installe la convention
  « Validation » dans un repo — template PR mince + doc liée, sans jamais
  écraser un template existant), plan (analyse le stock : ordre de merge par
  dépendances/merge-tree, conflits, sessions de test groupées), run (déroule
  une session : démarre les bancs, tend URLs/checklists pas-à-pas), report
  (poste les résultats en commentaire des PRs), ship (squash-merge au vert +
  ezk-backlog ship). COMPOSE ezk-preview, ezk-device/ezk-apk, verify/run,
  ezk-backlog, ezk-commits — il ne réimplémente rien. N'est PAS ezk-sprint
  (qui PRODUIT une PR) : lui CONSOMME le stock. Une seule instance par repo.
---

# ezk-pr-pilot

> **Nom préféré : `ezk-pr`** (ADR-0022). Le dossier / invocation `ezk-pr-pilot`
> reste l'alias jusqu'au rename mécanique. **Pas** `ezk-backlog` : backlog =
> fiches (*quoi*) ; ici = stock de PRs (*comment* valider/merger). Intersection :
> `ship` / reconcile autour du done — objets différents.

Tu es le **chef d'orchestre de la validation** : face à un **stock de PRs
ouvertes**, tu calcules l'**ordre de merge**, tu regroupes les tests en
**sessions efficaces** (une session device pour N PRs mobiles, pas N sessions),
tu **démarres les bancs**, tu guides l'utilisateur **checklist en main**, tu
**reportes les résultats dans chaque PR**, et tu **merges au vert**.

> Né du rétrofit livestreamz 2026-07-06 (PRs #69–#79) : 8 PRs, 3 sessions de
> test au lieu de 8, ordre de merge calculé par `git merge-tree`, et le constat
> qu'aucun corps de PR n'était rejouable sans contexte → la convention
> « Validation » (ADR-0009). **Intention ADR-0022** : l'installation de cette
> convention migre vers `ezk-backlog init` (scaffold repo) ; `init` ici reste
> supporté jusqu'à migration.

## Usage (sous-commandes)

`/ezk-pr-pilot [sous-commande] [#PR…]`

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Ce tableau + l'état du stock (`gh pr list` ou branches locales) |
| `init` | Installe la **convention « Validation »** (cf. plus bas). **Dette ADR-0022** : à terme, même geste via `ezk-backlog init` |
| `plan` | Analyse le stock → **ordre de merge**, conflits, **sessions de test groupées** |
| `run [session|#PR]` | Déroule une session : bancs démarrés, URLs/démos, checklist pas-à-pas |
| `report` | Poste dans chaque PR testée le résultat (✅/❌ par critère, signaux observés) |
| `ship [#PR…]` | Squash-merge des PRs **au vert et validées**, `ezk-backlog ship`, branche supprimée |

## `init` — installer la convention « Validation »

La convention vit dans **deux fichiers découplés** (le fond peut évoluer sans
toucher le template) :

1. **`docs/PR_VALIDATION.md`** — le fond (depuis [`assets/PR_VALIDATION.template.md`](assets/PR_VALIDATION.template.md) ;
   si l'asset n'a pas été matérialisé par le déploiement — cap en mode copy —
   le lire dans le catalogue mega-city ou le régénérer depuis ses sections 1–7) :
   matrice de modalités, bloc « Comment tester » copy-pastable, signaux
   observables, règles spécifiques (rebuild natif, remise à zéro, artefacts
   régénérés…). **Adapter la matrice au repo** : pas de ligne émulateur/device
   sans mobile, pas de preview Vercel sans déploiement Vercel.
2. **`.github/PULL_REQUEST_TEMPLATE.md`** — le squelette, depuis
   [`assets/PULL_REQUEST_TEMPLATE.thin.md`](assets/PULL_REQUEST_TEMPLATE.thin.md)
   (symétrique de `PR_VALIDATION.template.md`). **Mode copy (cap)** : seul
   `SKILL.md` est matérialisé — si l'asset est absent, **écrire le squelette
   inline** (bloc « Squelette mince » ci-dessous ; mêmes 3 titres + Validation).
   Deux cas d'installation :
   - Template **ABSENT** → **copier** le squelette mince (Summary + Lien fiche +
     Comment tester + matrice minimale + lien vers `docs/PR_VALIDATION.md`).
   - Template **EXISTANT** → **ne JAMAIS l'écraser ni le réécrire** : y
     **agréger une courte section-lien** en fin de fichier
     (`## Validation — voir docs/PR_VALIDATION.md` + la matrice minimale).
     Le fond reste dans la doc liée — c'est le découplage voulu.
3. Commit `docs: PR Validation convention` (via `ezk-commits`).

### Squelette mince (fallback inline — mode copy)

En mode copy (cap), seul `SKILL.md` est matérialisé — l'asset
`assets/PULL_REQUEST_TEMPLATE.thin.md` est souvent absent. **Utiliser le bloc
ci-dessous tel quel** pour écrire `.github/PULL_REQUEST_TEMPLATE.md` (identique
à l'asset catalogue ; ne pas se contenter des titres en prose).

````markdown
## Summary

<!-- ≤ 5 lignes user-facing : ce que ça change et pourquoi.
     Ouvre par « En clair ». Un tiers doit reformuler le besoin sans ouvrir le diff. -->

## Lien fiche

<!-- Chemin vers la fiche backlog, ex. `features/0079-restitutions-po-lisibles.md`.
     L'id est déjà dans la branche `feat/<id>-<slug>`. -->

## Comment tester

<!-- Commandes littérales depuis un clone frais — OU preuves agent (screenshots
     before/after) qui pointent vers des scripts npm / BDD **existants**.
     Ne pas dupliquer le Gherkin de la fiche : orienter et renvoyer.
     Voir docs/PR_VALIDATION.md pour la matrice et les signaux observables. -->

```bash
# ex. pnpm --dir products/mega-city test -- <chemin pertinent>
```

## Validation

| Modalité | Statut |
|---|---|
| CI | ⏳ |
| Tests unitaires | ⏳ |
| E2E navigateur | N.A. / ⏳ |
| Before / after (UI) | N.A. / ⏳ |
| Preview de déploiement | N.A. |

Voir [docs/PR_VALIDATION.md](../docs/PR_VALIDATION.md).
````

### Garde-fou corps de PR (`check-pr-body`)

Vérifie mécaniquement `## Summary` / `## Lien fiche` / `## Comment tester`.

**Résolution du script** (dans l'ordre, premier trouvé gagne) :
1. Dossier skill installé : `~/.claude/skills/ezk-pr-pilot/scripts/check-pr-body.sh`
   (présent seulement si le skill a été déployé **avec** ses scripts — link/catalogue,
   pas le mode copy SKILL-only).
2. Monorepo vectorz : `products/mega-city/skills/ezk-pr-pilot/scripts/check-pr-body.sh`
3. **Fallback inline** (stdin) si aucun fichier :

```bash
body=$(cat)   # ou : gh pr view N --json body -q .body
missing=()
for h in '## Summary' '## Lien fiche' '## Comment tester'; do
  grep -qF "$h" <<<"$body" || missing+=("$h")
done
((${#missing[@]})) && { printf 'PR body incomplete — missing: %s\n' "${missing[*]}" >&2; exit 1; }
echo "OK — Summary + Lien fiche + Comment tester présents"
```

Usage quand le script est dispo (le chemin résolu **est** le fichier `.sh`) :
`bash <chemin-résolu>` (stdin ou fichier) — ne pas ré-appendre `/check-pr-body.sh`.

## `plan` — le cœur : ordonner et regrouper

1. **Inventaire** : `gh pr list --state open` (repo **sans remote** → branches
   locales **RÉELLES uniquement**, via la classification du `check.sh`
   d'ezk-archive — sur un repo squash-merge, `git branch --no-merged` brut liste
   surtout des résidus déjà livrés, fiche mega-city 0076). Lire chaque corps
   de PR : si la convention est en place, les blocs Validation disent déjà
   testé/reste/modalités — sinon, déduire du diff (et le signaler comme dette).
2. **Dépendances & conflits** : `git merge-tree` entre chaque paire qui partage
   des fichiers — pas de suppositions, des faits. Artefacts **régénérés**
   (index de backlog, lockfiles) : conflit ⇒ « régénérer au rebase », jamais
   résoudre à la main.
3. **Ordre de merge** : docs/infra d'abord, **protocole/lib partagée avant les
   clients** (les tests device se font contre le serveur final, la rétro-compat
   devient *testée* au lieu de *raisonnée*), UI ensuite, mobiles en dernier
   (après leur session device), les PRs empilées dans l'ordre de leur pile.
4. **Sessions groupées** (numérotées **S1, S2…** — c'est ce que `run` référence) :
   regrouper par **banc requis**, pas par PR —
   ex. 1 session desktop (server+web), 1 session preview (rien à démarrer),
   1 session device pour TOUTES les PRs mobiles via **branche d'intégration**
   (`git merge` des N branches, **seulement si merge-tree est propre**) et
   **UN seul build** dev-client (un rebuild natif requis par une PR couvre
   les autres).

## `run` — dérouler une session

- **Démarre les bancs** de la session (dev server/web, port non-défaut pour
  prouver une auto-découverte, émulateur…), donne l'**URL de démo** : preview
  de déploiement si pertinente (⚠️ dire explicitement quand elle ne montre PAS
  la feature), sinon `ezk-preview` (tunnel/tailscale), sinon séquence locale.
- Device : compose `ezk-device` (adb/Tailscale) ou `ezk-apk` (EAS QR) ; branche
  d'intégration + install fraîche si un scénario premier-lancement l'exige.
- Guide **un critère à la fois** : l'action exacte, puis le **signal observable**
  attendu (payload `curl`, requête réseau, message UI, ligne de log). Consigne
  ce qui est observé — **jamais** « ça a l'air bon ».

## `report` / `ship`

- `report` : un commentaire par PR — matrice mise à jour (✅ fait avec méthode /
  ❌ échec avec le signal observé / ⏳ reste), horodaté. Un échec ⇒ la PR sort
  de la file de merge et retourne au dev (ezk-sprint), avec le signal en main.
- `ship` : uniquement les PRs dont **toutes les modalités bloquantes** sont ✅ —
  squash-merge dans l'ordre du plan, CI re-verte entre deux PRs qui partagent
  des fichiers, branche supprimée **remote ET locale** (+ worktree retiré le cas
  échéant — une locale oubliée sur un repo squash devient un faux « non-mergé »
  permanent, fiche mega-city 0076), `ezk-backlog ship <fiche> #PR`. Après un
  squash fait par le PO **depuis l'UI GitHub** : `git fetch --prune` + supprimer
  la copie locale — l'UI ne supprime que la branche remote — **puis
  `ezk-backlog reconcile` et `ship`** : un merge fait hors du flux ne passe la
  fiche en `done` par personne, `reconcile` le détecte et propose le `ship`
  (ADR-0018) — sinon la fiche reste orpheline du merge.

## Frontière & délégation — compose, ne réimplémente rien

| Besoin | Délègue à |
|---|---|
| Produire/corriger une PR | **`ezk-sprint`** (lui produit UNE PR ; toi tu consommes le stock) |
| URL de démo partageable | `ezk-preview` |
| Device physique distant / APK d'install | `ezk-device` / `ezk-apk` |
| Voir tourner l'app localement | `verify` / `run` |
| Marquer la fiche livrée | `ezk-backlog` (`ship`) |
| Messages de commit / merge | `ezk-commits` |

## Garde-fous

- **Jamais de merge** sans les modalités **bloquantes** cochées (mobile =
  device réel obligatoire si c'est la règle du repo — la respecter, pas la
  contourner).
- **Une seule instance par repo** : à l'intake, vérifier `git worktree list` +
  les PRs/branches existantes — si une autre boucle travaille le même stock,
  STOP (leçon des boucles parallèles livestreamz 2026-07-05).
- **Branche d'intégration** seulement si `git merge-tree` est propre ; sinon
  tester PR par PR dans l'ordre de la pile.
- **Ne jamais inventer un résultat de test** : reporter uniquement ce qui a été
  observé, avec son signal. Un critère non observé reste ⏳.
- Repo **local-only** (pas de remote) : pas de `gh` — le stock = branches
  locales, `report` = note dans le handoff/fiches, `ship` = merge local.
- **Une seule responsabilité** : orchestrer la validation du stock. Pas le
  build d'une feature (ezk-sprint), pas la clôture de session (ezk-archive).
