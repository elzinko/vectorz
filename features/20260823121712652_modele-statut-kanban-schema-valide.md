---
id: "20260823121712652"
title: "Modèle de statut kanban — liste de statuts validée par schéma, `ready` devient une colonne"
type: feature
priority: P1
product: mega-city
status: todo
ready:
pr:
created: 2026-08-23
---

# Modèle de statut kanban — des colonnes contrôlées, pas un champ date bancal

## En clair

Les statuts des fiches ne sont **validés nulle part** : une faute de frappe (`to-do`) passerait sans
bruit. Et le feu vert DoR est un **champ date** (`ready: 2026-08-21`) qui prête à confusion. On veut un
**tableau kanban** : une liste de statuts **définie dans un schéma**, éditable par repo, **contrôlée par
un validateur**, où `ready` devient une **colonne** à part entière — plus un champ date obscur.

## Contexte / Problème

- La liste des statuts (`idea / todo / in-progress / blocked / shipped`) est **en dur** dans les scripts.
  Rien ne rejette une valeur invalide.
- `ready:` est un **champ orthogonal** au statut (source de l'incompréhension PO du 2026-08-23 : « pourquoi
  une date, on ne passe pas juste le statut à *ready* ? »).
- On réinvente un bout d'outil scrum — le risque étant de le faire « en moins bien ». La ligne de crête :
  **schéma léger + validateur + vues générées, jamais un moteur de workflow**.

## Proposition

- **Un schéma** porte la liste des statuts (colonnes), **éditable** (par repo — cf. manifeste de slots
  [[20260815080414006]]) sans toucher au code.
- **Un validateur** (gate CI / pré-commit) **refuse** toute fiche dont `status` ∉ liste.
- **`ready` devient une colonne** : `Backlog → Ready → En cours → Revue → Livré`. Le tampon DoR = « la fiche
  entre dans *Ready* », et **le champ date `ready:` disparaît** (la date vient de git — cf. [[20260823121712716]]).
- **Migration** des fiches existantes (convertir les `ready:` en colonne, retirer le champ). ⚠ **Cas
  `blocked` + `ready`** (retour Codex #164) : `0102` est `status: blocked` **et** `ready: 2026-07-26` —
  or `Bloqué` et `Ready` seraient deux colonnes **exclusives**, donc une fiche ne peut pas être dans les
  deux, et l'éligibilité au déblocage (déjà passée par la DoR) doit survivre. La migration n'est « sans
  perte » **qu'à condition** de trancher : (a) `blocked` reste un **attribut orthogonal** (un flag, pas
  une colonne), ou (b) une représentation dédiée aux items *bloqués-mais-mûrs*. **À décider au grooming.**
- **Ce qu'on ne fait PAS** : transitions autorisées, rôles, permissions, objets sprint. Juste valeurs validées.

## Critères d'acceptation (à groomer)

- [ ] La liste des statuts vit dans **un schéma éditable** (pas en dur dans les scripts).
- [ ] Un validateur **rejette** un `status` hors-liste (testé, rouge→vert).
- [ ] `ready` est une **colonne** ; le champ date `ready:` est **retiré** du front-matter.
- [ ] Migration des fiches actives + `done/` **sans perte** — y compris les items `blocked` **et**
      `ready` (cf. `0102`), via un `blocked` orthogonal ou une représentation dédiée.
- [ ] Markdown reste la **source** ; aucun moteur de workflow introduit.

## Comment vérifier

Introduire une fiche avec `status: n-importe-quoi` → le validateur bloque avec un message clair. Tamponner
une fiche → elle apparaît dans la colonne *Ready* du board.

## Notes / voisins

- Voisins : [[0186]] (validateur de conformité d'artefacts), [[20260815080414006]] (manifeste de slots par
  repo = colonnes flexibles), [[20260823121712716]] (les vues générées : board + historique git).
- Issu de l'échange PO du 2026-08-23 (le champ `ready:` daté jugé bancal ; préférence pour des colonnes
  validées). **Non ready** — à groomer/architecturer avant de tirer (format du schéma, stratégie de migration).
