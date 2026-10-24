> 🗎 Rendu de la fiche [features/20261015122120198_ezk-backlog-groom-par-version-avec-rapport.md](../done/20261015122120198_ezk-backlog-groom-par-version-avec-rapport.md)

# 20261015122120198 — Groomer une milestone en une passe, avec rapport

**En clair.** Aujourd'hui on groome **une fiche à la fois** (`ezk-backlog groom <id>`). Quand on
prépare une version, c'est fastidieux. On veut une commande qui **mûrit d'un coup toutes les
fiches d'une milestone** (en auto-groom) et rend un **rapport** : lesquelles sont devenues prêtes,
lesquelles restent en idée (et pourquoi), lesquelles ont été **découpées** (filles ajoutées) ou
**exclues** (fusionnées/supersedées).

**Si tu arrives frais.** *Groomer* = mûrir une fiche vers « prête » (DoR). L'*auto-groom*
(non-interactif) existe déjà pour les runs autonomes ; ici on le lance **en lot, par version**.

## Contexte / Problème

`ezk-backlog groom <id>` traite une seule fiche, en boucle guidée. Le mode **non-interactif**
(sans opérateur) existe déjà — `ezk-product-build` l'utilise : « pour chaque slot manquant,
applique toi-même la technique la plus utile ». Mais il n'y a **pas** de commande qui l'applique
à **toutes les fiches d'une milestone** et qui dise ce qui a bougé. Préparer une milestone de 6
fiches idée le rendrait évident.

## Proposition

- Une option / sous-commande : `ezk-backlog groom --milestone <nom>` (ou `groom-milestone <nom>`).
- Elle sélectionne les **fiches actives de la milestone** encore à mûrir (idée, ou prête mais
  faible), et lance sur chacune l'**auto-groom non-interactif** (une technique par slot manquant).
- Elle **ne force jamais** `ready` : c'est le gate `ready <id>` qui promeut. Une fiche qui demande
  un **arbitrage humain** (ex. décision structurante / panel) **reste idée**, signalée.
- Elle rend un **rapport de delta** à la fin :
  - **prêtes** (passées au vert, prêtes pour le gate) ;
  - **toujours idée** + la **raison** (slot non remplissable sans arbitrage, panel requis…) ;
  - **découpées** (filles ajoutées) et **exclues** (fusionnées / supersedées) ;
  - **dépendances ajoutées** ou drapeaux posés.
- Best-effort : ne bloque jamais, dégrade proprement si `ezk` absent (applique la règle à la main).

## Critères d'acceptation

- [ ] `groom --milestone <nom>` mûrit en une passe les fiches idée de la milestone (auto-groom non-
      interactif), sans forcer `ready`.
- [ ] Le **rapport** liste : prêtes / toujours idée (avec raison) / découpées / exclues.
- [ ] Une fiche nécessitant un arbitrage humain **reste idée** et est **nommée** dans le rapport.
- [ ] Rien n'est passé `ready` sans le gate ; aucune fiche d'une **autre** milestone n'est touchée.

## Comment vérifier

- Sur une milestone à N idées, lancer la commande → elle les groome et le rapport nomme le delta.
- Une fiche « panel requis » reste idée dans le rapport, avec sa raison.
- Vérifier qu'aucune fiche hors milestone n'a bougé.

## Notes / décisions

- Réutilise l'**auto-groom non-interactif** existant (branche « sans opérateur » de `groom`) +
  le gate `ready` inchangé. Distinct d'`aggregate` (restructuration du stock) et de `review`
  (sanity check périodique).
- Origine : demande PO du 2026-10-15 (préparer une version en un geste, avec un rapport du delta),
  née en préparant le lot multi-sessions (v0.23, [ADR-079](../../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md)).
- **Milestone `preparation`** (ADR-083 : on groome par milestone ; le numéro de version se pose à la
  construction, plus à la préparation). Outillage à glisser quand il y a de la marge.
- Groomée « prête » le 2026-10-23 avec le lot de la milestone « Préparer une milestone ».


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ (2184 tests + scripts) |
| Revue locale | ✅ (2 constats corrigés) |
| CI | N.A. (local) |
| Before/after (UI) | N.A. — commande CLI sans écran |
