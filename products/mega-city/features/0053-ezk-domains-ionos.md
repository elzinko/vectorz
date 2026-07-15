---
id: 0053
title: ezk-domains — piloter la gestion de noms de domaine IONOS via leur API depuis un LLM
type: feature
priority: P2
status: idea
pr:
created: 2026-07-15
---

## Contexte / Problème

Réserver et gérer des noms de domaine (création, DNS, renouvellement) se fait aujourd'hui à
la main dans l'interface IONOS. IONOS expose désormais une **API** (récente) ; l'idée est de
récupérer une **clé API IONOS** et de piloter la création/modification de domaines
directement depuis un LLM, de façon reproductible et scriptable. Cas d'usage déclencheur
concret : **réserver samplerz.fr** (fiche liée côté repo samplerz).

## Proposition (à cadrer)

Un skill `ezk-domains` (nom candidat), provider **IONOS** en premier :

- **Auth** : récupérer/stocker une clé API IONOS (secret gitignoré, jamais commité — même
  discipline `.secrets` que `ezk-ci`) ; le skill ne saisit jamais d'identifiants à la place
  de l'utilisateur.
- **Actions** : lister les domaines, vérifier la disponibilité, réserver, éditer les
  enregistrements DNS — via sous-commandes ou en langage naturel.
- **Garde-fous** : toute action **payante ou irréversible** (achat/réservation d'un domaine,
  suppression d'un enregistrement) est confirmée explicitement par l'utilisateur avant
  exécution — pas d'achat silencieux.

## Critères d'acceptation (esquisse)

- [ ] Vérifier explicitement l'absence de skill équivalent avant de créer (fait le 2026-07-15 : aucun)
- [ ] Spike : cartographier l'API domaines IONOS réelle (surface, auth, endpoints, quotas) avant de coder — ne rien supposer
- [ ] La clé API est fournie par l'utilisateur et stockée hors-git ; jamais loggée
- [ ] Réserver un domaine (cas test : samplerz.fr) exige une confirmation humaine explicite
- [ ] Frontière provider : IONOS d'abord, mais l'archi laisse la porte à d'autres registrars

## Notes

- Cas d'usage lié : réservation de samplerz.fr (voir la fiche côté repo `samplerz`).
- À valider avant de tirer : ce que l'API IONOS permet réellement (achat de domaine par API,
  ou seulement gestion DNS des domaines déjà détenus ?) — conditionne tout le périmètre.
- Rappel garde-fou plateforme : un achat/réservation se **confirme**, il ne se déclenche pas
  tout seul.
