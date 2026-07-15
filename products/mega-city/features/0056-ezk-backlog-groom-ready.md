---
id: 0056
title: ezk-backlog groom/ready — promouvoir une idea vers Definition of Ready (gate)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-15
---

## Contexte / Problème

Une fiche `status: idea` est capturée cheap, non groomée. La promouvoir en `todo` actionnable
(Definition of Ready : problème / valeur / critères) est aujourd'hui manuel et informel. Deux
voisins couvrent des bouts, mais pas le grooming lui-même : `product-brainstorming` est
**divergent / sans état** (il explore un espace-problème, il ne vise pas une fiche précise ni
n'écrit de transition), et `ezk-backlog add --brainstorm` (fiche 0022) cadre une fiche **à la
création** — rien ne cadre la **promotion** d'une idea existante avec un **gate** DoR.

## Proposition

NE PAS créer un skill `ezk-grooming` lourd : le gate maison **ADR-0013** refuse un skill qui
double une couverture existante (risque n°1 documenté : surproduction de méta-outillage).
Ajouter plutôt le grooming comme **sous-commandes d'`ezk-backlog`**, là où vit déjà la
connaissance du format de fiche :

- `groom <id>` : session de raffinement d'UNE fiche idea — ouvre `product-brainstorming`
  **ciblé** sur elle pour remplir les 3 slots DoR (problème / valeur / critères). Ne flippe
  rien.
- `ready <id>` : vérifie la DoR complète comme **GATE** (refuse si un slot manque), puis
  délègue à la mécanique ezk-backlog le passage `idea → todo` + regen.
- (option) `groom` sans id : prend la 1re idea du backlog trié.

Frontière ADR maison : le LLM fait mûrir via product-brainstorming ; le script d'ezk-backlog
range (flip statut, regen, commit).

## Critères d'acceptation (esquisse)

- [ ] `groom <id>` enrichit la fiche (3 slots DoR) via product-brainstorming, sans changer le statut
- [ ] `ready <id>` REFUSE tant qu'un slot DoR manque ; au vert, flip idea→todo + regen + commit
- [ ] Aucune duplication de la connaissance du format de fiche hors d'ezk-backlog (test de séparabilité)
- [ ] Le challenge adversarial (fiche 0057) est composable comme étape optionnelle de `groom`
- [ ] Doc : quand groomer (avant de tirer) vs cadrer à la création (`add --brainstorm`, 0022)

## Notes

- **Décision de conception à acter en ADR** : « sous-commande d'ezk-backlog » vs « skill dédié
  ezk-grooming » — trancher par le **test de séparabilité** du repo (cf. ADR-027 B′). Défaut =
  sous-commande ; promotion en skill autonome seulement si le grooming devient lourd/récurrent
  (découpe d'epics, dépendances, sizing), via l'entonnoir `ezk-recipy` (0042).
- Compose : `product-brainstorming` (moteur divergent) + éventuellement le panel de challenge
  (fiche 0057) pour confronter l'idée avant de la déclarer Ready.
- Origine : discussion session 2026-07-15 (capture de 0052/0053/0054 en idea → « il faut
  groomer dessus »).
