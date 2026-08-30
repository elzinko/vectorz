---
id: "20260830104013541"
title: Élicitation par authentification forte (l'agent demande, l'humain authentifie)
makes: Un flux d'élicitation où l'agent demande un accès et un humain l'ouvre par preuve de présence (Touch ID), consentement signé et expirant
source: ~/git/google-mcp-multi-account/
composes: []
status: ready
home: central
created: 2026-08-24
updated: 2026-08-30
---

# Recette — Élicitation par authentification forte (l'agent demande, l'humain authentifie)

> **Document vivant.** Matière d'une future fiche vectorz — une « recette » ezk réutilisable.
> Source prouvée : **`~/git/google-mcp-multi-account/`** (implémentation `gwsa`).
> Dernière mise à jour : **2026-08-24**.

## En clair

Un agent puissant ne devrait **jamais s'accorder ses propres droits**. Il **demande** ; l'accès,
c'est un humain qui l'ouvre — **avec son doigt** (Touch ID). Et le consentement est **signé**,
**lié à l'action** précise, avec une **date d'expiration**. Par défaut, tout est **verrouillé**.

C'est le renversement : la décision d'élargir un accès **quitte l'agent** pour revenir à un humain,
à chaque fois. C'est la même gouvernance que « cowork propose, l'app juge » — renforcée par une
**preuve de présence** biométrique.

## 1. Le principe : demander, jamais prendre

- Par défaut, **chaque ressource est verrouillée**. L'agent ne peut rien tant qu'un humain n'a pas ouvert.
- L'agent ne possède **qu'un seul outil** pour réclamer : `access_request`. Il **n'accorde rien** —
  il renvoie **la commande exacte** que l'humain devra taper.
- L'humain exécute la commande ; l'agent propose, l'humain dispose.

## 2. « Authentification forte » = preuve de présence, pas un code SMS

- `unlock` / `grant` exigent **Touch ID** (biométrie) ou, à défaut, le mot de passe de session macOS.
- Ce n'est **pas** le sens habituel (code reçu par SMS) : c'est une **preuve qu'un humain est là, maintenant**.
- **La fenêtre Touch ID nomme le produit** (« google-multi-account », pas un intitulé cryptique) :
  ce qu'on **lit** au moment d'apposer son doigt compte autant que ce qui se passe derrière. Le helper
  biométrique est appelé **par son chemin complet**, jamais deviné, pour qu'aucun imposteur ne s'y glisse.

## 3. Le consentement signé, lié à l'action (v2)

- **Payload canonique unique** : `action`, `alias`, `target`, `session_id`, `minutes`/`hours`,
  `nonce`, `issued_at`, `expires_at`.
- Le helper **dérive le prompt Touch ID ET signe le JSON canonique** (SHA-256 + ECDSA P-256).
  Le consentement est donc **cryptographiquement lié** à l'action exacte, pas un simple « oui » réutilisable.
- **Clé** : enrôlement `Secure Enclave → Keychain → fichier` (repli fichier `0600`, car un script Swift
  non codesigné se voit souvent refuser une clé permanente — `errSecMissingEntitlement`).

## 4. Fail-closed, anti-rejeu, reçus

- **Fail closed** : strongauth activé sans enrôlement → **refus** (jamais d'accord silencieux).
  Biométrie indisponible → refus. Pas de repli vers un simple « presence check ».
- **Anti-rejeu** : un `nonce` par demande, journal `nonces.json`.
- **Reçus** : `receipts.jsonl` + entrées `decision=elicitation` dans `usage.jsonl` — traçabilité.
- **CI / Linux** : mode mock (`GWSA_ELICITATION_MOCK=1`, HMAC-SHA256) pour tester sans Swift/biométrie.

## 5. Ce que ça garantit — et ce que ça ne garantit pas (honnêteté)

- Ça **discipline le comportement** d'un agent **coopératif** : par le chemin prévu, il ne peut
  qu'attendre qu'un humain ouvre.
- Ça ne lui **retire pas toute capacité** : un agent avec un accès terminal libre pourrait contourner
  par un autre chemin. **Parade** : ne faire transiter les données **que par le serveur local** du projet
  (la prise unique), et fermer les autres portes. Voir le modèle de menace du projet source.

## 6. Pour pasteriz

pasteriz incarne déjà « l'agent propose, l'app juge, l'humain fait le geste sensible ». Cette recette
ajoute la **preuve de présence** sur les gestes vraiment sensibles :

- Un outil façon `access_request` : l'agent **propose** une action (ex. « valider ce lot de renouvellements »,
  « déverrouiller la liste des comptes »), l'app renvoie **la commande/le geste humain exact**.
- Ce geste est gardé par **Touch ID** (Mac de Thomas), avec un consentement **signé et expirant**.
- La 2FA sur chaque site reste un geste humain distinct ; l'élicitation garde les opérations **au niveau pasteriz**.

## Fichiers de référence (entonnoir — ne pas copier, pointer)

Racine : **`~/git/google-mcp-multi-account/`**

- Explication grand public : `docs/articles/2-elicitation-authentification-forte.md`
- Décisions : `docs/adr/ADR-0001-onboarding-par-elicitation.md` · `docs/adr/ADR-0005-elicitation-signee-v2.md`
- Feature : `features/0001-elicitation-signee-strongauth-v2.md`
- Code : `gateway/elicitation.py` (payload canonique) · `scripts/elicitation-sign.swift` (Touch ID + signature) · `bin/gwsa` (CLI `unlock`/`grant`/`elicitation enroll`)
- Flux : `diagrams/onboarding-add-account-elicite/` · `diagrams/lecture-donnees-elicitee/`
- Frontière : `docs/threat-model.md`

## Statut de cette recette

Capturée le 2026-08-24 (déclenchée par pasteriz : besoin d'un geste humain fort sur les actions sensibles).
Emplacement **provisoire** — voir le débat « où vit une recette ? » dans
[la fiche 20260824185422122](../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md).
