# Livre des recettes — vectorz

> Index auto-généré (`regen-recipes.sh` mega-city) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque recette.
> Gabarit : [RECIPE_TEMPLATE.md](RECIPE_TEMPLATE.md). Gardien : `ezk-chef`. Statuts : 📝 draft · ✅ ready.

| Id | Titre | Fabrique | Statut | Emplacement |
|----|-------|----------|--------|-------------|
| [20260830104013372](brancher-domaine-vercel.md) | Brancher un domaine + environnements (prod / staging / dev) sur Vercel, DNS chez IONOS | Un domaine et ses sous-domaines staging/dev posés sur Vercel, DNS géré chez IONOS, alias posés par la CI par tag | 📝 draft | central |
| [20260830104013460](dns-ionos-mcp.md) | Gérer les DNS IONOS via leur serveur MCP | Un accès agent (lecture/écriture) aux enregistrements DNS d'un domaine IONOS, via un token scope Domains only | 📝 draft | central |
| [20260830104013541](elicitation-authentification-forte.md) | Élicitation par authentification forte (l'agent demande, l'humain authentifie) | Un flux d'élicitation où l'agent demande un accès et un humain l'ouvre par preuve de présence (Touch ID), consentement signé et expirant | ✅ ready | central |
| [20260830104013623](outreach-presse-influenceurs.md) | Outreach presse & influenceurs (produit indie, sans budget) | Une méthode réutilisable pour faire connaître un produit indie (presse, forums, réseaux, influenceurs) sans budget pub | 📝 draft | central |
| [20260830104013705](page-attente-marketing.md) | Mailing list sur une page d'attente (coming-soon) | Une page d'attente qui remplace le site en prod et collecte des emails (RGPD, honeypot), sans casser staging | 📝 draft | central |
| [20260830104013793](plan-distribution-app.md) | Distribution d'app desktop via bucket objet public (Cloudflare R2) + endpoint de téléchargement | Un mécanisme de distribution app gratuite/Pro (binaires hors GitHub, servis via R2 + endpoint /api/downloads) | ✅ ready | central |
| [20260830104013889](tour-guide-in-app-resilient.md) | Tour guidé in-app résilient au refactoring (Driver.js + registre data-testid) | Un tour d'onboarding (Driver.js) qui cible des data-testid stables, avec un test qui casse si une cible disparaît du DOM | 📝 draft | central |
| [20260830104013981](vercel-kv-database.md) | Base de données KV sur Vercel (Upstash Redis) | Un store clé-valeur Redis (Upstash) branché à un projet Vercel, avec un adaptateur tolérant les 2 nommages de variables | 📝 draft | central |

