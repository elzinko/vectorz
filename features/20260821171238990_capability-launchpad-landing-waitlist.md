---
id: "20260821171238990"
title: Capability launchpad (landing + waitlist + tracking) — récoltée de city-guided, réutilisable pour valider un produit
type: feature
priority: P2
product: mega-city
status: idea
pr:
created: 2026-08-21
---

# Capability launchpad — landing + waitlist + tracking, réutilisable

> **Idée** (capture 2026-08-21, session elzinko-clyphx / rig manager Ableton). À
> groomer avant tirage — pas encore de scénarios. Origine : le PO veut, pour
> **chaque nouveau produit qu'il teste**, sortir vite une page de validation de
> demande (landing + liste d'attente + mesure de conversion) sans la recoder à
> chaque fois. `city-guided` a déjà une landing qui marche, mais **codée en
> one-off** non réutilisable → en faire une **capability mega-city** (un skill).

## En clair

Un skill mega-city qui outille **la validation de demande d'un produit** : générer
une landing page, capturer une liste d'attente (emails), et **mesurer la conversion**
(visites → inscriptions) via PostHog. Objectif : brancher ça sur n'importe quel
nouveau produit en quelques minutes, au lieu de copier-coller un `index.html` à la
main. Cross-projet, activé à la demande, **hors méthode scrum**.

## Contexte / Problème

Le PO teste plusieurs produits (le rig manager Ableton est le premier cobaye). Pour
chacun, le besoin revient : une page qui pitche, un formulaire d'inscription, et des
chiffres pour décider si ça vaut le coup de construire. Aujourd'hui c'est refait à la
main : `city-guided/landing/index.html` est une page statique autoportante, avec un
form Formspree **en dur** et **aucun tracking**. Rejouable zéro fois : pas de
paramétrage, pas de scaffold, pas de mesure. Le geste est bon, l'implémentation n'est
pas réutilisable.

## Pourquoi / Valeur

Débloque la **validation rapide et mesurée** de tout futur produit (business-first :
savoir vite si un produit intéresse avant d'y investir). Une capability réutilisable
plutôt qu'un one-off par produit. La **waitlist** est la seule brique qu'aucun objet
marketing existant du backlog ne couvre (cf. section suivante) : c'est le trou net que
cette fiche comble.

## Positionnement dans la ligne marketing existante (anti-doublon — À LIRE avant grooming)

La ligne marketing existe déjà en pièces. Cette capability doit **composer**, pas
réimplémenter :

| Objet backlog | Statut | Jambe couverte | Rapport au launchpad |
|---|---|---|---|
| `ezk-article` (0153) | ✅ shipped | contenus | à composer (rédaction) |
| `0156 ezk-marketing` | 🔴 todo | canaux + contenus (promo outbound) | à composer (diffusion) |
| `0157 ezk-landing` | 💡 idea | landing page | **recouvrement fort** — à fusionner ou à composer |
| `0194 ezk-marketing-analyst` | 💡 idea | tracking PostHog, A/B, copy | à composer (mesure) |
| `capability-vente-lemonsqueezy` | 💡 idea | vente / checkout | aval (si produit payant) |

- **La waitlist n'existe nulle part ailleurs** → c'est l'apport neuf de cette fiche.
- **Recouvrement direct avec `0157 ezk-landing`** : au grooming, décider si le
  launchpad **absorbe** 0157, ou si 0157 reste la brique « page » que le launchpad
  orchestre. Ne pas livrer deux générateurs de landing.
- Forme pressentie : un **orchestrateur mince** (bande Orchestrateurs, façon
  `ezk-product-builder`) qui séquence 0157 (page) + waitlist + 0194 (tracking) +
  0156 (canaux), plutôt qu'un monolithe.
- ⚠️ **Doublon backlog à nettoyer** : `0194-ezk-marketing-analyst-agent.md` et
  `20260812104022234_ezk-marketing-analyst-agent.md` sont la même fiche.

## Base / Référence (à harvester via `ezk-ezk`)

**city-guided** a la landing qui tourne — `~/git/bacasable/city-guided/landing/` :
- `index.html` (373 lignes) — landing complète, page unique autoportante.
- Waitlist → **Formspree** (form `mbdvlldb`), POST via `fetch` (l. 291 + l. 349).
- Assets : `og.png` (Open Graph), `favicon.svg`.
- **Manque : tout tracking** (aucun PostHog / analytics câblé).

À **garder** (le geste qui marche) : la structure et le copy de la page, le pattern de
capture email sans backend lourd (Formspree). À **ne pas** reproduire (le « non
réutilisable ») : HTML statique copié, form id en dur, zéro paramétrage, zéro mesure.

Doctrine (cf. `capability-vente-lemonsqueezy`) : faire le geste une fois à la main sous
les yeux de city-guided, PUIS harvester en skill via `ezk-ezk` — ne pas pré-designer
une flotte de sous-skills.

## Décisions déjà prises en cadrage (session 2026-08-21)

- **Stack cible** : Next.js + Vercel + PostHog (deploy preview, PostHog natif,
  réutilisable). À reconfirmer au grooming ; une variante « page statique légère »
  reste ouverte pour les produits minimalistes.
- **Identité de publication** : build-in-public **au nom du PO**, posture de maker
  assumé. **Pas d'astroturfing** (faux comptes se faisant passer pour des utilisateurs
  indépendants) — le skill rédige des brouillons, le PO publie.
- **Périmètre visé** : landing + waitlist + tracking conversion + rédaction contenus +
  stratégie canaux.

## Forme cible (ontologie mega-city)

- C'est un **Skill**, pas un `cap` (les caps sont les adaptateurs d'hôte). Précisément
  une **brique autonome / capacité** au sens ADR-0020, bande « Capacités » ou
  « Orchestrateurs » d'ADR-0022 selon la décision compose-vs-monolithe.
- Emplacement : `products/mega-city/skills/ezk-launchpad/` (nom à trancher :
  `ezk-launchpad` ou `ezk-caps-launchpad`). Rangé par `deploy.sh`, jamais à la main.
- **Cross-projet, hors scrum** : ne PAS l'ajouter à `profiles/global.yml` ni
  `daily.yml` ; l'activer par le `skills:` d'un profil projet (ou un mini-profil
  composable via `extends`). Doit passer le test d'autonomie ADR-0020 §2 (marcher dans
  un repo sans aucun autre skill ezk).
- Si le skill orchestre des sous-agents : outil Task + `subagent_type`, modèle/effort
  portés par le front-matter de chaque agent (cf. fiche 0181).

## Périmètre pressenti (à trancher au grooming)

- Scaffold de landing paramétrée (nom produit, pitch, sections, OG image, favicon).
- Capture waitlist : choix du backend (Formspree comme seed, ou alternative type
  Resend/table Vercel/Supabase — à décider).
- Câblage **PostHog** : event `waitlist_signup`, source de trafic, funnel
  visite → inscription (la brique de mesure de 0194).
- Rédaction des contenus de lancement (compose `ezk-article`) + short-list de canaux
  et calendrier (compose `0156 ezk-marketing`) — le PO publie.

## Dépendances / Garde-fous

- **Clés API (PostHog, backend email) = secret humain**, jamais dans le repo — geste
  d'installation, pas automatisable.
- **Anti-astroturfing** : le skill ne publie pas tout seul et n'ouvre pas de faux
  comptes ; il produit des brouillons signés par le maker.
- Trancher le recouvrement avec `0157 ezk-landing` **avant** de coder (voir plus haut).

## Liens

- Seed implémentation : `~/git/bacasable/city-guided/landing/` (landing + Formspree).
- Voisins mega-city : `0156 ezk-marketing`, `0157 ezk-landing-pages`,
  `0194 ezk-marketing-analyst-agent`, `capability-vente-lemonsqueezy`, `ezk-ezk`
  (harvest), `ezk-article` (contenus, déjà livré).
- Premier cobaye produit : rig manager Ableton (repo `elzinko-clyphx`, ADR-0001).

## Revue 2026-08-23 (avant commit)

Revue adverse à la clôture de session : fiche jugée **saine et non-doublon** (son tableau anti-doublon
couvre 0153/0156/0157/marketing-analyst/lemonsqueezy ; la **waitlist** est l'apport neuf). Un point
réaligné : les références à **`0194`** (ezk-marketing-analyst) pointent en réalité vers
**`20260812104022234`** sur `main` — `0194` était une renumérotation portée par la branche
`docs/backlog-cards-0192-0194`, **supprimée** à cette clôture (contenu déjà consolidé sur `main`). Il n'y
a donc **pas** de doublon `0194` à nettoyer. Reste `idea` — le recouvrement avec `0157 ezk-landing` se
tranche au grooming.
