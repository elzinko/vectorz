---
id: "20261026132118384"
title: "Board : enrichir les runs — émettre les transitions de fiche (moments) et les jetons"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [dashboard, board, supervision, read-model, cop1]
status: idea
pr:
evidence: before-after
created: 2026-10-26
blocked: panel
---

# 20261026132118384 — Board : enrichir les runs (moments + jetons)

**En clair.** Le board montre les **vrais runs**, mais pauvrement : il voit les lancements et les
jalons, pas le **détail des fiches traitées** (quelle fiche est passée de *prête* à *livrée*) ni le
**coût en jetons**. La raison est en amont : le journal de supervision **n'émet pas** ces choses. Les
afficher demande d'enrichir ce que le journal écrit — ce qui **touche le contrat gelé**, donc un panel.

**Si tu arrives frais.** Un *moment* = une étape d'un run avec les **transitions de fiche** qu'elle
porte. Le journal n'émet aujourd'hui que six types d'évènements (démarrage, jalons, battements, fin…),
sans transition de fiche ni jeton. L'adaptateur du board (`chantierAdapter`, livré le 2026-10-26)
produit donc une vue **mince** et honnête : il n'invente aucun moment ni chiffre absent.

## Contexte / Problème

L'adaptateur `projectChantiers → board` est livré (fiche
[runs réels](done/20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md)), mais sa vue
est mince par construction :

- **Moments de fiche** : le moment `fiche.transition` a été **différé** par le panel d'ADR-084
  (décision G4, NO-GO en l'état) — un évènement **métier** greffé sur la supervision casserait le
  validateur et muterait une version gelée.
- **Jetons** : toujours `absent` (garde D9) — aucune source runtime fiable ne les fournit.

Donc `LiveRun.moments` et `LiveRun.tok` restent vides. Pour les remplir, il faut que le **journal les
émette** d'abord.

## Proposition

- **Décision de contrat, réservée au PO / au panel** (d'où `blocked: attend-panel`). Trancher **où**
  vivent les transitions de fiche (les trois pistes d'ADR-084) :
  - **(a)** le board les **lit depuis git/backlog** (historique des `status:` et des passages en
    `done/`) — **zéro changement de contrat** ;
  - **(b)** un **contrat de domaine séparé** (précédent `.improvement/` d'ADR-030, lit `.supervision/`
    en lecture seule) ;
  - **(c)** un **bump de version** du contrat de supervisabilité (`@0.3`), validateur enseigné.
- Une fois la source décidée : remplir `LiveRun.moments` / `tok` dans l'adaptateur (bien placé — point
  pur, `now` injecté) et afficher le détail dans la vue.

## Critères d'acceptation

> Provisoires — à finaliser au panel selon la piste retenue.

- [ ] Un run réel affiche sur le board ses **transitions de fiche** (quelle fiche, de quel état à quel
      état) — tirées d'une source décidée au panel, jamais inventées.
- [ ] Les **jetons** s'affichent quand une source fiable existe ; sinon, l'absence reste honnête.

## Comment vérifier

```bash
# Après la décision de source + l'émission : ouvrir le board d'un projet qui a des runs keyés
# récents → la chronologie d'un run montre ses moments (transitions de fiche) et, si mesurés, ses jetons.
```

## Notes / décisions

- Issue de la **rétro 2026-10-26** (capture `docs/captures/2026-10-26-retro-session-adr084-board.md`).
- Suite directe d'[ADR-084](../docs/adr/ADR-084-surface-emission-declaree-et-moments.md) (G4 différé) et
  de la fiche adaptateur livrée (vue mince assumée).
- **Dépend d'une décision de contrat** (les 3 pistes ci-dessus) — pas de construction en run autonome
  tant que le panel n'a pas tranché.
- 2026-10-27 : raison blocked: passée à `panel` ; contexte d'origine déplacé de la valeur : ajoute des évènements/champs au contrat de supervisabilité gelé (ADR-084 G4), arbitrage PO + panel requis
