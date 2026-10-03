---
id: "20261003164801823"
title: Ranger des secrets dans le trousseau macOS, que l'agent lit sur demande
makes: Une commande unique `ezk-secret` qui range un secret au trousseau macOS et le rend à l'agent au moment d'agir, sans qu'il passe par le chat ; plus un manifeste `secrets.yaml` par projet qui liste les secrets par nom et par rôle
source: ~/git/bacasable/vectorz/recipes/secrets-trousseau # implémentation prouvée (CLI + tests + gabarit)
composes: []
status: ready
home: central
created: 2026-08-29
updated: 2026-10-03
---

## En clair

Un secret ne doit traîner ni dans un fichier, ni dans le chat, ni dans l'historique du shell.
Le trousseau macOS le garde chiffré : toi, tu le déposes par une saisie masquée ; l'agent le
relit dans une variable au moment d'agir, sans jamais l'afficher. Le contenu complet de la
recette vit dans son dossier, [`secrets-trousseau/`](secrets-trousseau/README.md) : cette fiche
l'indexe dans le livre, elle ne le recopie pas.

## Ingrédients (prérequis)

- Un Mac, avec le trousseau « login ».
- `~/.local/bin` dans le `PATH`, sinon l'agent ne trouve pas la commande.
- Pour un projet : un fichier `secrets.yaml` à la racine, copié depuis
  [`secrets.template.yaml`](secrets-trousseau/secrets.template.yaml). Il liste les secrets par nom et par
  rôle, jamais par valeur.

## Ustensiles (outils — CLI d'abord)

- `ezk-secret <verbe>` : `set`, `get`, `check`, `list`, `remove`, `open`. `--help` marche partout.
- `security`, la CLI du trousseau macOS, que `ezk-secret` appelle.

## Préliminaires (gestes manuels ⚙️)

- ⚙️ Déposer chaque secret soi-même, par une saisie masquée ou par le presse-papier :
  `ezk-secret set <nom> --clip`. L'agent ne voit jamais la valeur.
- ⚙️ Autoriser chaque lecture quand macOS la demande : c'est l'« accès sur demande ».

## Le concept (mécanisme + schéma)

```text
toi ──(saisie masquée)──> ezk-secret set <nom> ──> trousseau macOS (chiffré)
agent ──> KEY=$(ezk-secret get <nom>) ──> [macOS demande ton accord] ──> variable, jamais affichée
projet ──> secrets.yaml : NOMS + RÔLES (versionné) ; les VALEURS restent au trousseau
```

Nom au trousseau : `<projet>-<fournisseur>-<type>`, par exemple `samplerz-ionos-api`. Les
identifiants communs à plusieurs apps (Apple) se rangent sans préfixe et se désignent par `from:`
dans `secrets.yaml`.

## Exemples pour goûter (référence)

- Éprouvée le 2026-08-29 : dépôt de la clé d'API IONOS, lecture par l'agent, puis création de
  deux enregistrements DNS par l'API IONOS (HTTP 201). Voir le [README du dossier](secrets-trousseau/README.md).
- Manifeste réel : `secrets.yaml` de samplerz (Apple, R2, Vercel), commit `838de5a` du dépôt samplerz.

## Les étapes (playbook)

1. Installer la commande : copier les scripts du dossier dans `~/.local/bin`, puis `chmod +x`.
   La procédure exacte est au paragraphe « Installation » du [README](secrets-trousseau/README.md).
2. ⚙️ Ranger chaque secret : `ezk-secret set <projet>-<fournisseur>-<type> --clip`.
3. Vérifier sans révéler : `ezk-secret check <nom>` (longueur, aperçu masqué, empreinte) ou
   `ezk-secret list <motif>` (les noms seulement).
4. Dans un projet, déclarer les secrets dans `secrets.yaml`, par nom et par rôle.
5. Côté agent : `KEY=$(ezk-secret get <nom>)`, puis utiliser `$KEY` sans jamais l'afficher.

## Checklist « rien d'oublié »

- [ ] `~/.local/bin` est dans le `PATH`.
- [ ] Les copies de `~/.local/bin` sont identiques au dossier de la recette (`cmp`).
- [ ] Chaque secret du `secrets.yaml` du projet est rangé au trousseau sous le nom attendu.
- [ ] Aucune valeur n'apparaît dans un fichier versionné, un log ou le chat.

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`~/git/bacasable/vectorz/recipes/secrets-trousseau`**

- `ezk-secret` — la CLI unique, avec ses verbes et l'aide de chacun.
- `test-ezk-secret.sh` — les tests de la CLI.
- `secrets.template.yaml` — le gabarit du manifeste de secrets d'un projet.
- `README.md` — la recette complète : commandes, flux « sur demande », authentification, cas IONOS, pièges.

## Statut de cette recette

Capturée et éprouvée le 2026-08-29, pendant une session samplerz. CLI unifiée `ezk-secret <verbe>`
le 2026-09-06 (fiche `20260906121839943`). Fiche d'index ajoutée au livre le 2026-10-03 : la recette
vivait dans un dossier sans en-tête, que le générateur du livre ne lit pas, et les agents ne la
trouvaient pas. Limites connues :

- `ezk-secret sync`, qui lirait `secrets.yaml` pour pousser les valeurs vers GitHub, Vercel ou
  le `.env`, n'est pas encore construit (fiche `20261001104806732`).
- Le trousseau natif ne protège pas la lecture au sens fort. Pour une preuve de présence signée,
  voir [`elicitation-authentification-forte`](elicitation-authentification-forte.md).
