---
name: ezk-bug
composes: [ezk-backlog]
composes-external: [product-brainstorming]
argument-hint: "[help|intake]"
description: >-
  Skill d'intake/cadrage d'un BUG signalé : transforme un rapport brut (« c'est
  cassé ») en fiche `type: bug` reproductible et exploitable (procédure, attendu/
  obtenu, preuve), puis la file via `ezk-backlog add`. A utiliser quand l'utilisateur
  SIGNALE un bug à cadrer, veut « transformer ce bug en fiche », « reproduire et
  documenter un bug », « faire l'intake d'un bug », ou quand `ezk-backlog add`
  rencontre un bug vague à confirmer. COMPOSE le Playwright MCP partagé (pilotage de
  l'app + screenshot-preuve, chargé via ToolSearch — le MÊME que `ezk-qa`, pas emprunté
  à son rôle) pour la repro, et `ezk-backlog add` (anti-doublon + cadrage) pour le
  filing. Repro BORNÉE (timeout / max-tentatives) ; un harnais indisponible produit
  QUAND MÊME une fiche (`hors-portée`). N'EST PAS la validation d'une PR ni la rédaction
  de Gherkin (ça, c'est `ezk-qa`, en avant dans la boucle ezk-sprint) : `ezk-bug`
  confirme EN ARRIÈRE un symptôme signalé, en amont du backlog. Glue mince : ne gonfle
  ni `ezk-qa` ni `ezk-backlog`.
---

# ezk-bug

Tu transformes un **bug signalé** (rapport brut) en **fiche `type: bug` exploitable du
premier coup** : reproduction, attendu vs obtenu, preuve. Tu es de la **glue mince** — tu
**composes**, tu ne réimplémentes rien.

> **En arrière, pas en avant.** `ezk-qa` valide une PR *en avant* contre une DoD (Gherkin,
> verdict vert/rouge) dans la boucle `ezk-sprint`. Toi, tu confirmes *en arrière* un
> **symptôme signalé**, **en amont** du backlog. Tu **disclaim** toute validation de PR /
> rédaction Gherkin — ton trigger ne chevauche jamais celui de `ezk-qa`.

## Usage (sous-commandes)

`/ezk-bug [intake] "<rapport brut>"` — ou en langage naturel (« ce bouton ne marche pas, fais-en une fiche »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau — ne lance rien |
| `intake "<rapport>"` (**défaut**) | Repro bornée → structure la fiche → `ezk-backlog add` |

## La boucle d'intake

1. **Repro** — charge le **Playwright MCP partagé** (via `ToolSearch` — le même outil que
   `ezk-qa` charge, **pas** un mode ajouté à son rôle). Pilote l'app locale
   (`navigate`/`click`/`fill`/`snapshot`/`screenshot`), **bornée** par un timeout / un nombre
   max de tentatives. Capture un **screenshot-preuve** si le symptôme apparaît.
2. **Statut** — conclus la repro par un statut **franc** :
   - `oui` / `partiel` — repro (totale/partielle) obtenue.
   - `non` — repro **tentée**, symptôme **absent**.
   - `hors-portée` — repro **non tentable** en autonomie (env/app/MCP indisponible, ou classe
     device / réseau / service externe hors d'un driver local).
   **`raison` obligatoire dès que le statut n'est pas `oui`** (ce qui a été tenté, environnement, hypothèses).
3. **Structure** — le corps de la fiche est produit par le module déterministe
   `src/bug/bug-intake.ts` (`buildBugCard`) : symptôme, reproduction + statut (+ raison),
   étapes, attendu/obtenu, environnement, preuve, **sévérité en ligne de corps** (jamais un
   champ `severity:` — un seul axe, la priorité).
4. **File** — appelle **`ezk-backlog add`** (`type: bug`), qui applique **anti-doublon +
   cadrage**. Tu n'écris **jamais** le backlog en direct.

## Terminaison garantie (jamais de silence)

La tentative de repro est **bornée** : un harnais qui **timeout** ou **ne démarre pas** (dev
server down, app qui ne boote pas, MCP muet, pas d'env local) **produit quand même une fiche**
(`hors-portée` + raison). Un bug non reproduit reste une fiche exploitable, jamais un « rien ».

## Frontière avec ezk-qa (pas de double-emploi)

| | `ezk-qa` (rôle QA) | `ezk-bug` (skill intake) |
|---|---|---|
| Sens | *en avant* : valide une PR contre la DoD | *en arrière* : confirme un symptôme signalé |
| Moment | **dans** `ezk-sprint` (étapes 3/6), build in-sprint | **en amont** du backlog, hors-sprint |
| Sortie | verdict vert/rouge + DoD Gherkin | **fiche `bug`** dans le backlog |
| Outil | Playwright MCP (chargé via ToolSearch) | **le même** Playwright MCP partagé (pas emprunté au rôle) |

Même **outil**, **rôles et moments différents**.

## Délégation depuis `ezk-backlog add` (miroir de la feature)

`ezk-backlog add` d'une **feature vague** délègue déjà le cadrage à `product-brainstorming`
(fiche 0022). Symétriquement, `add` d'un **bug vague / non confirmé** délègue à **`ezk-bug`**
(repro + description), qui **rappelle `add`** avec une fiche nette. `ezk-bug` est le **jumeau
côté bug** de `product-brainstorming`. Un bug déjà net n'a pas besoin de l'intake.

## Garde-fous

- **Glue mince** : compose Playwright MCP (repro) + `ezk-backlog add` (filing). Ne réimplémente
  ni le pilotage d'app, ni le backlog. Ne gonfle ni `ezk-qa` ni `ezk-backlog`.
- **Disclaim** validation PR / Gherkin (c'est `ezk-qa`).
- **Repro bornée** (timeout / max-tentatives) ; échec → fiche `hors-portée`, jamais un silence.
- **`raison` obligatoire** si `reproduced ≠ oui`.
- **Sévérité en ligne de corps**, pas de champ `severity:` (un seul axe = la priorité).
