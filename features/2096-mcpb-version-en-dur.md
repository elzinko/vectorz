---
id: 2096
product: mega-city
title: build-mcpb.sh fige la version en dur — le bundle installé ne dit pas ce qu'il contient
type: bug
priority: P2
epic:
status: todo
ready:
pr:
created: 2026-07-25
---

## Contexte / Problème

`bin/build-mcpb.sh` **calcule** la version puis **ne s'en sert pas** :

```bash
VERSION="$(node -p "require('$MC/package.json').version || '0.1.0'")"   # calculée…
...
  "version": "0.1.0",                                                    # …et écrite en dur
```

Le heredoc n'est pas quoté (`<<MANIFEST`), donc `$VERSION` s'y interpolerait — la variable
est simplement inutilisée. Deux conséquences mesurées le **2026-07-25** :

1. **L'artefact installé ment.** `~/Library/Application Support/Claude/Claude Extensions/
   local.mcpb.vectorz.vectorz-supervision/manifest.json` annonce `"version": "0.1.0"`.
   Le bundle date du **2026-07-20** : il est donc **antérieur** aux fiches **0085**
   (échelle de quiescence) et **0086** (normalisation de racine vers l'arbre principal).
   Vérifié par grep dans le `server/index.js` installé : ni le marqueur
   `normalisée depuis`, ni `cop1/worktrees` — **les deux correctifs sont absents**.
   Rien, dans l'interface, ne permet de le voir : la version affichée sera `0.1.0` avant
   comme après un rebuild.
2. **Impossible de répondre « quelle version tourne sur ce poste ? »** — la question que
   le PO a posée telle quelle. Aujourd'hui la seule réponse honnête est « regarde la date
   de modification du fichier ».

Accessoirement `products/mega-city/package.json` est en `version: 0.0.0` : même câblée, la
version du manifeste serait `0.0.0` tant que ce champ n'est pas tenu.

## Proposition

Fix minimal, **indépendant de toute doctrine de versionnage** : le manifeste doit refléter
la source dont il est construit.

1. Utiliser `$VERSION` dans le heredoc (une ligne).
2. Décider ce que `version` vaut quand `package.json` est en `0.0.0` — a minima **refuser
   de produire un bundle** dont la version est indiscernable d'un autre (fail-fast avec un
   message clair), plutôt que d'en produire un qui ment.
3. Rendre la provenance lisible dans le bundle : ajouter le **SHA court** du commit de
   build dans le `description` ou un champ dédié — c'est ce qui permet de dire, sur un
   poste, *exactement* quel code tourne.

**Frontière avec 0087.** La fiche 0087 (limite n°2, « Aucune version ») décide de la
**doctrine** — que veut dire une version de la méthode, quand on la bumpe, comment on
rollback ; son AC n°1 est un ADR bloquant, couplé à cop1-0050. Cette fiche-ci ne tranche
**rien** de tout ça : elle répare un script qui n'écrit pas la valeur qu'il calcule.
Si le PO préfère, elle s'absorbe dans 0087 — mais elle est réparable en 5 minutes,
0087 ne l'est pas.

## Critères d'acceptation

- [ ] `bash bin/build-mcpb.sh` produit un manifeste dont `version` provient de
      `package.json` (prouvé par un bump : la valeur change).
- [ ] Une version indiscernable (`0.0.0`) fait **échouer** le build avec un message qui
      nomme le champ à renseigner.
- [ ] Le bundle porte la trace du commit dont il est issu (SHA court), lisible depuis
      l'interface de Claude Desktop ou le manifeste installé.
- [ ] Le bundle **réinstallé** sur le poste contient bien les correctifs 0085 et 0086
      (grep des deux marqueurs dans `server/index.js` installé).

## Notes

- Geste PO indépendant, à faire une fois le fix livré : **réinstaller** l'extension (celle
  du 2026-07-20 est périmée) et l'**activer** — son réglage actuel est
  `{"isEnabled": false}`, et aucun `project_root` n'a jamais été renseigné.
