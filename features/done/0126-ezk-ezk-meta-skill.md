---
id: 0126
title: ezk-ezk — méta-skill : créer un skill depuis la session (brainstorm → archi → déploiement)
type: feature
priority: P2
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-06-27
---

## Contexte / Problème
Productiser EXACTEMENT le workflow fait à la main dans cette session : brainstormer un besoin
(`/product-brainstorming`), l'architecturer (`/architecture`, ADR), en tirer un skill, le placer
au bon endroit et le déployer. Aujourd'hui c'est manuel et dépend de l'opérateur.

## Proposition
Une commande `ezk-ezk` (méta-skill = un skill qui crée des skills) qui :
1. **Propose les sujets traités** dans la session (≤ 3 + un champ libre). Si un seul → demande confirmation.
2. **Résume** le sujet retenu et pose d'éventuelles questions. L'utilisateur peut **valider / refuser / compléter**.
3. **Compose** les sous-skills adaptés (`/product-brainstorming`, `/architecture`, et d'autres si pertinent —
   ex. `skill-creator`) pour générer le prompt/contenu du skill.
4. **Demande où** : mega-city (`skills/`, write-target ADR-0006) ou claude-skills (déprécié).
5. **Ajoute** le skill `ezk-…` (dossier `SKILL.md` + frontmatter `description` = le déclencheur).
6. **Déploie** et le rend accessible **dans la session en cours** pour un nouveau prompt — *si possible*.

## Critères d'acceptation
- [ ] propose les sujets de session (≤ 3 + champ libre) ; cas « un seul sujet » → confirmation
- [ ] résumé + questions ; boucle **valider / refuser / compléter** avant toute génération
- [ ] choix de destination demandé (mega-city `skills/` vs claude-skills déprécié)
- [ ] skill `ezk-…` bien formé (SKILL.md + description-déclencheur) ajouté à la destination choisie
- [ ] déploiement effectif ; dispo en session « si possible » (sinon : message clair + comment recharger)

## Notes
- **Compose, ne réinvente pas** : s'appuie sur `skill-creator` (anthropic-skills) pour la mécanique de
  création/validation d'un skill ; orchestre par-dessus la récolte de sujets + brainstorm + archi.
- **Destination** gouvernée par [ADR-0006](../../docs/adr/0111-absorber-claude-skills-catalogue2.md)
  (mega-city = write-target, claude-skills gelé/déprécié).
- **Déploiement** s'appuiera sur **0017** (cap global `~/.claude`) ; la dispo *intra-session* d'un skill
  fraîchement ajouté est l'inconnue (le harness charge les skills au démarrage) → d'où le « si possible ».
- Méta : cette fiche décrit l'automatisation du déroulé exact de la session du 2026-06-27.
