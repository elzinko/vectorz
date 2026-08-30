# Journal de lancement — samplerz

> État de l'infra de lancement + **historique** (ce qui a bloqué, comment réglé).
> Base de connaissance : on ne refait pas deux fois la même erreur.

## État actuel (2026-08-30)

| Sujet | État | Reste à faire |
|---|---|---|
| Bucket R2 | ✅ créé, peuplé (v0.7.2, HTTP 200 vérifié) | — |
| Secrets R2 en CI (×4) | ✅ posés dans GitHub Actions (2026-08-23) | — |
| `R2_PUBLIC_URL` sur Vercel | ❌ **manque** (Production) | **le poser** depuis le `.env` du main |
| Endpoint `/api/downloads` + front sans lien GitHub | ✅ codé (PR #378) | merger #378 (gardée exprès comme cobaye) |
| Upload R2 **auto en CI** | 🟠 différé de #378 | à refaire propre |
| Boutique Lemon Squeezy | 🟠 **test prêt** : compte + boutique (456214) + produit « Samplerz Pro License v1.x » 29 € publié, mais `test_mode` | passer en **live** (produit + clé live) ; tester le parcours achat→licence→app en test d'abord |
| Domaine `samplerz.fr` | ✅ sur Vercel (previews vertes) | dev/staging = 404 (dépend du sprint CI/CD muti, backlog vectorz) |
| Gating free/Pro dans l'app | ✅ loops #381 + stems #384 ; s'allume à la vraie licence | validation clé Pro (dépend LS) |

**Conclusion** : le téléchargement public est à **une variable Vercel** de
marcher. Tout le reste de la valeur (encaisser) dépend de la boutique LS.

## Pièges rencontrés (et la parade)

- **`.env` dans le main, pas le worktree.** Les 5 valeurs R2 sont dans
  `/Users/elzinko/git/samplerz/.env` (racine du dépôt principal). Un worktree ne
  les voit pas. → toujours lire là.
- **Repo privé = liens GitHub Releases morts (404).** C'est pourquoi on sert les
  binaires via R2 + `/api/downloads`, jamais via github.com.
- **Projet Vercel non lié dans le checkout.** `vercel env ls` échoue tant qu'on
  n'a pas fait `vercel link --project samplerz`. → lier d'abord.
- **`timeout` absent sur macOS.** Utiliser `gtimeout` (coreutils) ou rien.
- **Lecture d'un secret du trousseau** peut (ou non selon la version macOS)
  déclencher une validation Touch ID / mot de passe — c'est voulu. Toujours
  capturer dans une variable, jamais afficher.
- **#378 gardée non mergée exprès** comme cobaye du futur mécanisme vectorz
  (décision 2026-08-24). Ne pas la merger « par réflexe » — c'est un choix.

## Historique

- **2026-08-23** — bucket R2 créé + peuplé (v0.7.2) ; 4 secrets R2 posés en CI.
- **2026-08-24** — endpoint `/api/downloads` + front + manifeste sans lien GitHub
  (PR #378). Gardée non mergée (cobaye). `R2_PUBLIC_URL` Vercel resté à poser.
- **2026-08-29** — domaine `samplerz.fr` sur Vercel (previews vertes).
- **2026-08-30** — audit complet : confirmé que le seul trou infra du
  téléchargement = `R2_PUBLIC_URL` sur Vercel. Création de cette recette +
  catalogue + journal.
- **2026-08-30** — clé Lemon Squeezy rangée (`lemonsqueezy-api`, clé de **test**,
  1035 car., rangée via presse-papier car trop longue pour la saisie masquée).
  Inspection API OK : compte Thomas Couderc, boutique samplerz `456214`, produit
  « Samplerz Pro License v1.x » 29 € **publié en test**. Piège trousseau : la 1ʳᵉ
  lecture doit être autorisée depuis le terminal de l'utilisateur (« Toujours
  autoriser »), sinon la lecture headless de l'agent reste bloquée sans dialogue
  visible. Reste : parcours achat→licence→validation app (en test), puis live.
