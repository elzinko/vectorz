---
id: "20260906121839943"
title: Unifier les scripts ezk-secret-* en une commande unique `ezk-secret <verbe>` (CLI POSIX)
type: feature # feature | bug | refactor | chore | epic
priority: P1 # P0 | P1 | P2 | P3
product: vectorz # obligatoire dans ce monorepo — vectorz | mega-city | …
epic:
status: ready # idea | ready | in-progress | blocked | shipped
ready: 2026-09-06
pr:
evidence: none # outil CLI, pas d'écran
created: 2026-09-06
---

# 20260906121839943 — Unifier les scripts ezk-secret-* en une commande unique `ezk-secret`

## En clair

Aujourd'hui, ranger un secret passe par cinq petits scripts séparés
(`ezk-secret-set`, `-set-ionos`, `-get`, `-list`, `-check`). C'est incohérent et sans
aide en ligne. On veut **une seule commande**, `ezk-secret <verbe>`, aux conventions
POSIX. À la fin : même sécurité, mais un outil propre, avec `--help` partout et un verbe
pour ouvrir le trousseau.

## Contexte / Problème

Les scripts vivent dans [`recipes/secrets-trousseau/`](../recipes/secrets-trousseau/README.md)
et sont copiés dans `~/.local/bin/`.

Quatre frictions constatées :

1. **Cinq exécutables** au lieu d'un, avec des conventions qui divergent. Le nom du
   secret est tantôt positionnel, tantôt implicite.
2. **Pas d'aide en ligne.** Aucun `--help`, aucun message d'usage cohérent.
3. **Le cas ionos est un script à part** (`ezk-secret-set-ionos`) uniquement parce que la
   clé IONOS se saisit en deux morceaux, préfixe public et secret, joints par un point.
4. **Piège de saisie sur les secrets longs.** La saisie masquée passe par une ligne de
   terminal en mode canonique. Elle tronque au-delà de ~1024 octets et peut capturer un
   caractère invisible collé. Contournement actuel : `--clip` (lecture du presse-papier).
   À conserver dans la commande unifiée.

Rappel de sécurité à ne pas casser : les secrets sont des *generic passwords* du
trousseau **login**, stockés avec `-T ''`. Résultat voulu : « Confirmer avant d'autoriser
l'accès » à chaque lecture. C'est l'« accès sur demande » de la recette.

## Proposition

Un **dispatcher** unique `ezk-secret <verbe> [args]`. Le nom du secret devient un
**argument positionnel** (convention POSIX : le sujet en positionnel, les options en
drapeaux).

```
ezk-secret set <nom> [--clip] [--trust <app>]                     # crée ou remplace (upsert)
ezk-secret get <nom>                                              # révèle (à capturer, jamais afficher)
ezk-secret check <nom>                                            # inspecte SANS révéler (longueur, aperçu, empreinte)
ezk-secret list [motif]                                           # liste les noms
ezk-secret remove <nom>                                           # supprime
ezk-secret open [nom]                                             # ouvre le Trousseau d'accès
ezk-secret help | --help | -h                                    # aide ; sans argument → usage
```

Choix de conception :

- **Pas de verbe `update`.** `set` écrit déjà avec `security add-generic-password -U`,
  donc il crée *ou* remplace. Un `update` séparé ferait doublon.
- **`get` vs `check`.** `get` révèle le secret. `check` l'inspecte sans le révéler. Les
  deux sont conservés : `check` est l'outil sûr de vérification (longueur / aperçu masqué
  / empreinte SHA-256 tronquée).
- **`open`.** Simple `open -a "Keychain Access"`. Utile car les secrets ezk **n'apparaissent
  pas** dans la nouvelle app « Mots de passe » (celle-ci gère les logins iCloud et passkeys,
  pas les *generic passwords* du trousseau login).
- **Cas ionos : pas de profil.** La clé IONOS a le format `préfixe.secret`. Le préfixe est
  l'identifiant public du compte, seul le secret (après le point) est sensible. Mais l'API
  veut la valeur **complète** dans l'en-tête. On la range donc entière, collée en une fois
  via `set --clip`. Plus besoin du script `set-ionos` ni d'un profil dédié.
- **Rétro-compatibilité.** Garder les anciens noms (`ezk-secret-set`, etc.) comme fines
  redirections vers la nouvelle commande pendant une transition, puis les retirer.

## Décisions à trancher (PO)

1. **`--trust <app>` (posture de sécurité).** Techniquement, `-T <app>` pré-autorise un
   binaire et supprime la confirmation. Mais le lecteur réel est `/usr/bin/security`, pas
   « l'app Claude » : le trousseau autorise par binaire signé. Pré-autoriser affaiblit le
   modèle « tu valides chaque accès ». **Défaut recommandé : confirmer à chaque accès** ;
   `--trust` reste une option explicite et opt-in, avec avertissement. À valider.
2. **Tags / catégorisation.** Le trousseau n'a pas de vrai système de tags. Défaut
   recommandé : garder la **convention de nommage** `<projet>-<provider>-<type>` +
   `list <motif>`. Option : détourner le champ commentaire (`-j`) pour y ranger des
   métadonnées, au prix d'une recherche bancale. À valider.

> **Tranché le 2026-09-06 — pas de `--profile`.** Le cas ionos passe par `set --clip` (on
> colle la valeur complète `préfixe.secret`). Le préfixe n'étant qu'un identifiant public,
> rien ne justifie un mode de saisie spécial.

## Critères d'acceptation

- [ ] `ezk-secret` unique en place ; les 7 verbes fonctionnent (`set`, `get`, `check`,
      `list`, `remove`, `open`, `help`).
- [ ] `set` fait un upsert (crée ou remplace) via `-U` ; aucun verbe `update` séparé.
- [ ] `set --clip` lit le presse-papier (secrets longs), sans troncature.
- [ ] Le cas ionos se fait via `set --clip` en collant la valeur complète `préfixe.secret` ;
      plus de script `set-ionos` ni de profil.
- [ ] `check` n'affiche jamais la valeur en clair (longueur + aperçu masqué + empreinte).
- [ ] `--help`, `-h` et `help` marchent au niveau global **et** par sous-commande ; sans
      argument → message d'usage, code de sortie propre.
- [ ] Les anciens noms (`ezk-secret-set/get/list/check/set-ionos`) restent fonctionnels
      via redirection pendant la transition.
- [ ] La recette [`secrets-trousseau/README.md`](../recipes/secrets-trousseau/README.md)
      est mise à jour : nouvelle CLI, **plus** la distinction Trousseau d'accès vs app
      « Mots de passe ».
- [ ] Les deux README qui citent les anciens noms sont mis à jour
      ([`recipes/lancement-app/README.md`](../recipes/lancement-app/README.md),
      [`recipes/lancement-app/catalogue-secrets.md`](../recipes/lancement-app/catalogue-secrets.md)).
- [ ] Gate locale verte (shellcheck/tests des scripts) avant PR.

## Comment vérifier

```bash
# 1. Aide à tous les niveaux
ezk-secret help
ezk-secret --help
ezk-secret set --help

# 2. Cycle de vie d'un secret de test
ezk-secret set demo-test-api --clip        # coller une valeur longue au préalable
ezk-secret check demo-test-api             # longueur correcte, valeur jamais affichée
ezk-secret list demo                       # le nom apparaît
ezk-secret get demo-test-api | wc -c       # longueur cohérente, sans afficher la valeur
ezk-secret remove demo-test-api            # suppression

# 3. Cas ionos : coller la valeur complète "préfixe.secret" au préalable, puis
ezk-secret set demo-ionos-api --clip
ezk-secret check demo-ionos-api            # la longueur inclut préfixe + point + secret

# 4. Rétro-compat
ezk-secret-set demo-test-api               # l'ancien nom fonctionne encore

# 5. Ouvrir le trousseau
ezk-secret open
```

## Notes / décisions

- **Rien à réenregistrer** pour les secrets existants : le refactor change la commande,
  pas les données du trousseau. `samplerz-ionos-api` et les autres restent lisibles tels
  quels par la nouvelle CLI.
- **Format ionos.** La clé a la forme `préfixe.secret`. Le préfixe est l'identifiant public
  du compte (non sensible), le secret est la partie après le point. On range la valeur
  **complète** car l'API IONOS l'exige dans l'en-tête. Décision 2026-09-06 : pas de profil,
  on colle la valeur entière avec `--clip` (session avec Thomas).
- Le champ « Où » vu dans le Trousseau d'accès = attribut `svce` = la **clé de recherche**
  (`security -s`), pas un mécanisme de groupe. Le groupe, c'est la convention de nommage.
- Recette : pas de nouvelle recette à créer. `secrets-trousseau/` existe déjà ; elle est
  **mise à jour** dans la même PR (critère d'acceptation ci-dessus).
- Origine : session du 2026-09-06 (friction sur un secret LemonSqueezy de 1035 caractères,
  résolue par `--clip`).
- Voisine mais distincte : [0158](0158-ezk-dns-ionos.md) (automatiser le DNS IONOS via
  l'API) — consomme un secret, ne refactore pas l'outil.
