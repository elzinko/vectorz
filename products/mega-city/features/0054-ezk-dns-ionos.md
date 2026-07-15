---
id: 0054
title: ezk-dns — automatiser la config DNS chez IONOS via l'API (l'achat reste manuel)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-15
---

## Contexte / Problème

Configurer le DNS d'un domaine (enregistrements A/AAAA/CNAME/TXT/MX…, délégation, challenges
ACME) se fait aujourd'hui à la main dans l'interface IONOS. IONOS expose une **API
développeur** (`api.hosting.ionos.com`, clés créées sur https://developer.hosting.ionos.fr) ;
l'idée est de piloter la **configuration DNS** depuis un LLM, de façon reproductible.
**L'achat/enregistrement d'un domaine reste manuel** — c'est un choix (garder la main sur la
dépense) *et* une contrainte : l'API IONOS **ne sait pas** enregistrer un nouveau domaine
(vérifié — voir Notes).

## Ce que l'API IONOS permet réellement (vérifié 2026-07-15)

- **DNS API** (`/dns/v1`) : CRUD complet sur les zones et enregistrements d'un domaine
  **déjà présent dans le compte** — A, AAAA, CNAME, MX, NS, SOA, SRV, TXT, CAA ; + DynDNS.
  C'est le cœur du skill.
- **Domains API** (`/domains/v1`) : lecture/mise à jour de domaines **existants** (contacts,
  nameservers, DNSSEC, transfert in/out) — **aucun** endpoint d'achat/enregistrement.
- **Auth** : clé API en deux parties `préfixe-public.secret` dans le header `X-API-Key` (le
  secret n'est montré qu'à la création → stockage gitignoré, jamais loggé).
- **Achat d'un nouveau domaine** : **impossible par API**, passe par le webshop / Control
  Panel. Le skill s'arrête donc au DNS ; l'achat reste une action humaine.

## Contrainte d'accès multi-comptes (le vrai sujet)

Une clé API est **liée au compte/contrat qui la crée** et ne voit que les zones de **ce**
compte. Constat de l'utilisateur : le compte principal (email perso) **n'a pas** l'accès API
(« Le programme API n'est pas encore actif » sur byhere.fr) ; seul le compte du projet
**muti.app** l'a activé. Conséquence directe à noter dans le skill :

> Pour automatiser **sans** activer l'accès API sur chaque compte séparément, il faut
> **regrouper les domaines sous un seul compte API-activé** (celui de muti.app). Une clé
> unique pilote alors **toutes** les zones de ce compte.

Réserves (à confirmer côté IONOS avant de s'engager) : le regroupement suppose de
**transférer les domaines entre comptes** (probablement via le Control Panel, pas l'API) et
que le DNS de chaque domaine soit bien **délégué à IONOS** dans ce compte. Il existe aussi un
mode **revendeur / sous-contrats** (header `X-Contract-Number`) où un compte maître pilote
plusieurs sous-contrats — piste alternative si le regroupement n'est pas souhaitable.

## Proposition (à cadrer)

Skill `ezk-dns` (provider IONOS d'abord) :

- **Auth** : récupérer/stocker la clé API IONOS (secret hors-git) ; l'utilisateur la fournit,
  le skill ne saisit jamais d'identifiants à sa place.
- **Actions** : lister les zones, lire/créer/modifier/supprimer des enregistrements DNS
  (typiquement : pointer un domaine, configurer MX, poser un TXT ACME DNS-01).
- **Garde-fous** : l'**achat** d'un domaine est hors périmètre (manuel) ; toute suppression
  d'enregistrement est confirmée.
- **Piège à encoder** : IONOS a **deux** API DNS incompatibles — « Developer/Hosting »
  (`api.hosting.ionos.com`, clé `préfixe.secret`) et « IONOS Cloud DNS » (`api.ionos.com`,
  token). Pour un domaine grand public comme muti.app, c'est **Developer/Hosting**.

## Critères d'acceptation (esquisse)

- [ ] Vérifier explicitement l'absence de skill équivalent avant de créer (fait le 2026-07-15 : aucun)
- [ ] La clé API (`préfixe.secret`) est fournie par l'utilisateur, stockée hors-git, jamais loggée
- [ ] Le skill lit les zones et fait le CRUD des enregistrements d'un domaine du compte (cas test : un TXT DNS-01)
- [ ] L'achat de domaine est explicitement HORS périmètre (documenté : passe par le webshop)
- [ ] Le skill choisit la bonne API (Developer/Hosting vs Cloud DNS) selon où la zone est hébergée
- [ ] La note « regrouper les domaines sous le compte API-activé (muti.app) » figure dans le skill

## Notes

- Cas d'usage lié : configurer le DNS de **samplerz.fr** une fois le domaine acheté (achat
  manuel) — voir la fiche côté repo `samplerz`.
- Vérifications (workflow adversarial du 2026-07-15) : « pas d'achat par API » = **confirmé**
  (spec OpenAPI Domains : aucun POST de création) ; « une clé = toutes les zones du compte »
  = **confirmé** (certbot-dns-ionos, libdns/ionos, Terraform ionos-developer : une seule
  clé / plusieurs domaines) ; « accès API activé par compte, invisible d'un compte à l'autre »
  = **plausible mais pas absolu** (vrai pour deux comptes indépendants ; exception revendeur
  ci-dessus). Le libellé exact « programme API pas encore actif » et sa procédure ne sont pas
  documentés publiquement → **à confirmer via le Control Panel / support IONOS**.
- Docs : https://developer.hosting.ionos.fr/docs · clés : https://developer.hosting.ionos.fr/keys
- Réf. d'implémentation tierces (pattern « une clé, plusieurs zones ») : `certbot-dns-ionos`
  (helgeerbe), `libdns/ionos`, provider Terraform `ionos-developer`.
- Limites de débit non publiées (429 possible).
