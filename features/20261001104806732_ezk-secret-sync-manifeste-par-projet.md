---
id: "20261001104806732"
title: "ezk-secret sync — un manifeste de secrets par projet, poussé à l'aveugle"
type: feature
priority: P2
product: vectorz
labels: [secrets, ci, dx]
status: idea
pr:
evidence: none
created: 2026-10-01
---

# 20261001104806732 — ezk-secret sync — un manifeste de secrets par projet, poussé à l'aveugle

**En clair.** Aujourd'hui, pour poser un secret sur GitHub ou Vercel, l'agent lit la valeur
puis la recolle dans une commande — la valeur passe donc sous ses yeux, et un réglage à la main
peut être faux (ça a cassé la release 0.9.0 de samplerz). Proposition : chaque projet déclare ses
secrets dans un `secrets.yaml` (des noms et des rôles, jamais de valeurs), et `ezk-secret sync`
lit ce fichier, prend chaque valeur au trousseau et la pousse vers GitHub / Vercel / le `.env`
local en un seul geste, sans que l'agent la voie. Effet : un seul endroit par projet pour savoir
« quel secret, pour quoi, où », et un provisioning aveugle et rejouable depuis n'importe quel
worktree.

**Si tu arrives frais.** `ezk-secret` est la commande qui range et lit des secrets dans le
trousseau macOS (recette `recipes/secrets-trousseau/`). Le « trousseau » est le coffre chiffré de
macOS, déverrouillé par Touch ID. Un « secret » ici = une clé d'API, un token, un mot de passe.

## Contexte / Problème

- `ezk-secret` sait `set` / `get` / `check` / `list` / `remove`, mais tout **dans le trousseau**.
  Il ne **pousse** nulle part.
- Pour approvisionner GitHub Actions ou Vercel, on fait aujourd'hui, à la main ou via
  `gh secret set X --body "$(ezk-secret get X)"`. Deux défauts :
  - la valeur **transite par une commande que l'agent écrit** — il la voit ;
  - le réglage manuel est **faillible** : la 0.9.0 de samplerz a échoué sur un
    `APPLE_SIGNING_IDENTITY` mal saisi et des `R2_*` vides.
- Le `.env` de dev, lui, ne vit que dans **un seul checkout** : depuis un autre worktree, on ne
  l'a pas (vécu le 2026-10-01 — il a fallu aller chercher les valeurs R2 dans le `.env` du
  checkout principal pour poser les secrets GitHub).
- L'inventaire « quel secret, où, pour qui » vit dans un **catalogue central** markdown
  (`recipes/lancement-app/catalogue-secrets.md`), tenu à la main et vite périmé — sa section
  samplerz ne connaît ni les secrets Apple ni Vercel, pourtant posés depuis.

## Proposition

1. **Un manifeste par projet** — `secrets.yaml` à la racine du dépôt. Des noms, des rôles, des
   destinations (`to: github | vercel:<env> | local`). Jamais de valeur sensible. Les valeurs
   **non** sensibles (ID d'org Vercel, identité de signature publique) peuvent y figurer en clair.
   Premier exemplaire déjà rédigé : `elzinko/samplerz:secrets.yaml`. Un **gabarit**
   `secrets.template.yaml` vit dans la recette ; chaque projet le copie et le remplit.
2. **Un verbe `ezk-secret sync`** — lit le manifeste ; pour chaque entrée, prend la valeur au
   trousseau et la pousse vers ses destinations **en un seul processus**. La valeur va du trousseau
   vers `gh secret set --body-file -` ou `vercel env add` **par stdin**, ou vers le `.env` local,
   sans passer par une commande que l'agent écrit ni une sortie qu'il lit. `--dry-run` affiche le
   plan sans rien poser.
3. **`ezk-secret check` étendu au manifeste** — compare la **déclaration** (manifeste) et la
   **réalité** (trousseau + GitHub + Vercel + `.env`), rend ✅ posé / ❌ manquant / ⚙️ à propager.
   Remplace les colonnes d'état tenues à la main dans le catalogue.
4. **Migration** — ranger au trousseau les secrets aujourd'hui seulement sur GitHub ou `.env`
   (R2, Apple, Vercel), pour que le trousseau devienne la **source unique**.
5. Le catalogue central reste la **vue inter-apps** lisible, à terme **généré** depuis les
   manifestes de chaque projet.

POC d'abord : `sync` vers **GitHub seulement** (le besoin immédiat de samplerz), puis le `.env`
local, puis Vercel.

## Critères d'acceptation

- [ ] Un `secrets.yaml` racine déclare les secrets d'un projet (nom, rôle, destinations) sans
      aucune valeur sensible.
- [ ] `ezk-secret sync` pose sur GitHub tous les secrets `to: [github]` du manifeste, en lisant
      les valeurs au trousseau, **sans** que la valeur apparaisse dans une commande ou une sortie
      lisible par l'agent.
- [ ] `ezk-secret sync --dry-run` affiche le plan (quels noms, quelles destinations) sans rien
      poser ni révéler de valeur.
- [ ] `ezk-secret check` en mode manifeste rend, pour chaque secret, un état trousseau / GitHub /
      Vercel / `.env` sans révéler de valeur.
- [ ] Les valeurs marquées non sensibles (`kind: variable` + `value:`) sont posées comme
      **variables**, pas comme secrets.
- [ ] Un gabarit `secrets.template.yaml` documenté existe dans la recette, prêt à copier.
- [ ] La destination `local` écrit le `.env` (gitignoré) du **worktree courant** — un worktree
      neuf récupère sa config sans copier le `.env` d'un autre checkout.
- [ ] La recette documente le flux « gérer les secrets d'un projet avec le LLM » : format du
      manifeste, flux aveugle, et le rôle du `.env` comme artefact **dérivé** (jamais une source).

## Comment vérifier

```bash
# depuis un clone frais, ezk-secret installé et le trousseau rempli
ezk-secret sync --dry-run --manifest secrets.yaml      # plan, aucune valeur affichée
ezk-secret sync --manifest secrets.yaml --only github
gh secret list --repo elzinko/samplerz                 # les noms attendus, datés de maintenant
ezk-secret sync --manifest secrets.yaml --only local   # écrit le .env de CE worktree
ezk-secret check --manifest secrets.yaml               # ✅/❌/⚙️ par secret, sans valeur

# invariant de sécurité : la valeur n'apparaît ni dans l'historique shell ni en sortie
shellcheck recipes/secrets-trousseau/ezk-secret
bash recipes/secrets-trousseau/test-ezk-secret.sh
```

## Glossaire

- `manifeste` — le `secrets.yaml` d'un projet : la liste déclarée de ses secrets et de leurs
  destinations, sans valeurs.
- `sync aveugle` — propagation d'une valeur du trousseau vers une destination sans qu'elle transite
  par une commande ou une sortie que l'agent lit.
- `.env dérivé` — un `.env` de dev **généré** par `ezk-secret` depuis le trousseau, jamais commité
  et jamais source de vérité.

## Notes / décisions

- **Déclencheur** : release 0.9.0 de samplerz cassée par un `APPLE_SIGNING_IDENTITY` mal réglé et
  des `R2_*` vides ; plus l'exigence « l'agent ne doit jamais voir la valeur » ; plus la douleur du
  `.env` absent d'un worktree.
- S'appuie sur la CLI unifiée `ezk-secret` (fiche livrée `20260906121839943`) et le catalogue
  `recipes/lancement-app/catalogue-secrets.md`.
- Premier manifeste rédigé, hors vectorz : `elzinko/samplerz:secrets.yaml` ; gabarit :
  `recipes/secrets-trousseau/secrets.template.yaml`.
- Faisabilité du flux aveugle : `gh secret set` lit `--body-file -` (stdin) ; `vercel env add` lit
  stdin. Le tuyau trousseau → stdin reste **interne** à `ezk-secret`.
- **12-factor / `.env`** : le `.env` reste nécessaire pour lire la config en dev, mais il devient
  un artefact **généré par `ezk-secret`** (jamais commité, jamais source). Le trousseau est la
  source unique ; `.env`, GitHub et Vercel en sont des **projections**. C'est le pattern standard
  d'un gestionnaire de secrets + provisioning (Doppler, 1Password `op`, Vault, sops) en version
  locale/Mac : simple, solo-friendly, sans SaaS — au prix d'être mono-machine / mono-utilisateur.
- **Secrets partagés (niveau compte)** : certains secrets ne sont pas propres à un projet —
  identifiants Apple, cert Developer ID. On les range UNE fois au trousseau, SANS préfixe, et
  chaque manifeste pointe dessus via `from:`. Le nom poussé peut différer par projet quand l'outil
  l'impose (tauri `APPLE_PASSWORD` vs electron-builder `APPLE_APP_SPECIFIC_PASSWORD`). Le mécanisme
  complet (scope compte/par-app, specs de recette, valorisation à l'application) est détaillé dans
  la fiche sœur [`20261001142603963`](20261001142603963_ezk-secret-apply-scope-compte-par-app.md),
  dont cette fiche est la brique de poussée.
- **Priorité P2** : hors chemin critique de la 1.0, mais supprime une classe d'erreurs de release
  et sert **tous** les projets.
- Portée POC : GitHub d'abord, puis `.env` local, puis Vercel. Les secrets lus uniquement en local
  (IONOS, Lemon Squeezy) restent hors POC.
