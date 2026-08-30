---
id: "20260830104013793"
title: Distribution d'app desktop via bucket objet public (Cloudflare R2) + endpoint de téléchargement
makes: Un mécanisme de distribution app gratuite/Pro (binaires hors GitHub, servis via R2 + endpoint /api/downloads)
source: ~/git/bacasable/muti
composes: []
status: ready
home: central
created: 2026-08-24
updated: 2026-08-30
---

# Plan — construction, déploiement et distribution de l'app samplerz

> **Document vivant.** Mis à jour au fil de la construction et des corrections.
> Objectif : concentrer le maximum de détails sur **comment l'app est buildée,
> déployée, et rendue téléchargeable depuis le site** — inspiré de **muti**, dont
> on reprend *sensiblement* la méthode. Ce doc est la **matière** d'une future
> **fiche de feature dans vectorz** : une « recette » ezk déployable sur d'autres
> projets.
>
> Dernière mise à jour : **2026-08-24**.

## En clair

L'app samplerz se **télécharge gratuitement** depuis le site, **sans clé**. La
version **Pro** nécessite une **clé de licence**. Les binaires ne vivent pas sur
GitHub (le repo est privé → les assets renvoient 404) mais dans un **bucket objet
public (Cloudflare R2)** ; le site les sert via un petit endpoint `/api/downloads`
qui redirige vers R2. On copie la méthode muti, en l'adaptant.

## 1. Le modèle gratuit / Pro

- **Gratuit** : téléchargement libre de l'app, **aucune clé requise** — décision
  actuelle, « pour le moment ».
- **Pro** : débloqué par une **clé de licence** (achetée en boutique). L'app
  desktop reçoit/stocke la clé et la valide.
- Le **cœur** (découper + exporter) reste gratuit ; les accélérateurs sont Pro.
- Liens : `features/backlog/app_free_pro_gating.feature` (modèle gelé),
  `plugin_marketplace_model`, `trial_license_moom`.

## 2. Le mécanisme de distribution (méthode muti)

```
[CI release] --build--> binaires --upload--> [Bucket R2 public]
                                                    ^
[Site /download] --clic--> /api/downloads?platform&version --302--> R2 --> téléchargement
```

- **Hébergement** : binaires dans un bucket **Cloudflare R2** public
  (`R2_PUBLIC_URL`, ex. `https://pub-xxxx.r2.dev`). Clé R2 :
  `releases/<tag>/<filename>`.
- **Endpoint site** (fonction Vercel) : `GET /api/downloads?platform=…&version=…`
  → **302** vers `R2_PUBLIC_URL/releases/v<version>/<filename>` ; `503` si non
  configuré (pas de lien mort).
- **Front** : la page `/download` (et `/docs`) pointent vers `/api/downloads`,
  **jamais** vers github.com.
- **CI** : à chaque release, le workflow **uploade** les binaires buildés dans R2.
- **Version** : source unique — muti lit `/version.txt` ; samplerz lit le
  manifeste (`download-manifest.json`). À normaliser (cf. §4).
- Fichiers de référence **muti** (`~/git/bacasable/muti`) :
  `apps/website/api/downloads.js` · `apps/website/src/pages/Download.vue` ·
  `scripts/upload-desktop-to-r2.mjs` · `.github/workflows/cd.yml` (upload R2) +
  `cleanup.yml` (purge).
- Implémentation **samplerz** en cours : PR #378 (`feat/download-object-store-r2`).

## 3. Où on en est (checklist « rien d'oublié »)

Légende : ✅ fait · 🟠 différé (sorti de #378, à refaire propre) · ❌ à faire ·
⚙️ config / geste humain.

**Cœur — fait dans #378 :**
- ✅ Hébergement R2 (bucket `vectorz`, v0.7.2 peuplée + vérifiée HTTP 200).
- ✅ Endpoint `/api/downloads` → 302 R2 (+ HEAD, garde `__proto__`, 503, tests).
- ✅ Manifeste + front sans aucun lien GitHub.
- ✅ Script d'upload manuel (`scripts/upload-desktop-to-r2.mjs`) + dépendance
  déclarée (`scripts/package.json` + lockfile).

**Pipeline de release — différé de #378 :**
- 🟠 Upload R2 **automatique en CI** à chaque release (retiré ; à refaire propre).
- 🟠 Chemin de bundle par cible `--target` (`target/<triple>/release/bundle/…`).
- 🟠 Disponibilité du manifeste **gatée sur l'objet R2** (pas les assets GitHub).
- ❌ Builds de PR (preview) → R2 `preview/<branche>/` + `Content-Disposition`.
- ❌ Workflow de **nettoyage** des vieux binaires R2.

**Config & gestes humains :**
- ⚙️ `R2_PUBLIC_URL` sur Vercel (Production) — pas encore posé.
- ⚙️ Bucket R2 + accès public + 4 secrets CI (`R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).
- ⚙️ Domaine public : `pub-….r2.dev` (muti utilise `downloads.muti.app`).

**Licence / Pro :**
- ❌ Validation de la clé Pro dans l'app (en ligne via la boutique, ou signature
  hors-ligne) — cf. `app_free_pro_gating`.
- ✅ (décision) Gratuit **sans clé** — pour le moment.

## 4. Options à trancher (au grooming)

- **Timer pour la démo / version gratuite ?** — actuellement **non** (le cœur est
  gratuit, illimité, sans clé). À décider si on veut une **démo Pro** limitée dans
  le temps (essai N jours).
- **Source de version** : `/version.txt` (muti) vs manifeste (samplerz) — à
  normaliser dans la recette.
- **Domaine public** : `pub-….r2.dev` suffit, ou domaine perso
  (`downloads.samplerz.fr`) ?
- **Builds de PR téléchargeables** (preview) : utile, ou hors scope v1 ?
- **Nettoyage R2** : purge auto des vieilles versions, ou manuel ?
- **Validation clé Pro** : en ligne (API boutique) vs hors-ligne (signature) ?
- **macOS Intel** : builder le `.dmg` x64, ou rester Apple Silicon only ?
- _(à compléter au fil de l'eau)_

## 5. L'approche « recette » (méta — germe de la fiche vectorz)

**Idée** : plutôt que recoder à chaque projet, **extraire un plan** d'une
implémentation existante (muti) pour qu'un LLM **reconstruise** la fonctionnalité
vite, en réutilisant des briques éprouvées.

**Pistes discutées (à challenger) :**
- Le LLM **analyse** l'implémentation de référence (muti) et en **extrait la
  recette** (ce doc) + repère les **briques réutilisables** (endpoint, script
  d'upload, workflow) pour ne pas les recoder.
- **Stockage des briques** : un repo de templates/gabarits ? Mais « les templates,
  ça existe déjà » — à faire **intelligemment**, pour que le LLM reconstruise
  depuis **exemples + gabarits**.
- La recette doit être **améliorable** ensuite (ajouter options/features).

**Proposition « commencer simple, améliorer ensuite » :**
1. **Recette = ce doc** (instructions détaillées) + **implémentation de référence
   = muti** (les « exemples/gabarits » que le LLM lit et adapte). Pas besoin d'un
   repo de templates séparé au début : **muti EST le template**, la recette dit
   quoi en reproduire et comment l'adapter au projet cible.
2. **Plus tard**, pour la vitesse : extraire les briques vraiment **génériques**
   (l'endpoint `downloads.js`, le script d'upload, le job CI) dans un petit
   **magasin de gabarits** versionné, référencé par la recette.
3. **Options** (§4) = les leviers que le grooming active/désactive **par projet**.

→ Cette section est le **germe** de la future **fiche de feature vectorz** : le
mécanisme ezk (mega-city) qui, à partir de cette recette, crée une fiche dans
n'importe quel projet ezk et en pilote l'implémentation *sans rien oublier*.

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`~/git/bacasable/muti`**

- `apps/website/api/downloads.js` — endpoint 302 vers R2
- `apps/website/src/pages/Download.vue` — front `/download`
- `scripts/upload-desktop-to-r2.mjs` — script d'upload manuel
- `.github/workflows/cd.yml` — upload R2 en CI (release)
- `.github/workflows/cleanup.yml` — purge des vieux binaires

## 6. Journal du plan

- **2026-08-24** — création du doc. Cœur du mécanisme livré en **PR #378** (non
  mergée) ; R2 peuplé + vérifié pour v0.7.2. Pipeline CI + licence Pro à faire.
  **samplerz gardé intact** (non mergé, Vercel non configuré) comme **cobaye** de
  test pour le futur mécanisme vectorz.
