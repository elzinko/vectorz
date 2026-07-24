Le diagramme de déploiement de l'observabilité qualité : **où tourne quoi**, et par quel canal —
modèle **corrigé après le panel adverse du 2026-07-22** (ADR-033).

Nœuds :

- **GitHub · runner de CI** (au build de PR) : y tournent la **Méthode + ses hooks** (qui
  *lancent* l'analyse) et un **Mesureur tiers** (qui *lit* le résultat et *écrit* la mesure).
- **SaaS d'analyse · cloud** : **Codecov, SonarCloud, CodeQL** (language-agnostic), interrogés
  par API (pull) ou déclenchés par webhook (push).
- **Côté vectorz** : le **Silo** (journal append-only, écrit derrière une interface `MetricSink` —
  son foyer = le **cahier frère `.quality/`**, Q2 tranché le 2026-07-22, ADR-033 Option B) ; un
  **Miroir** tamper-évident **différé** (hors POC) ; et le **Moniteur mission-control** (app web)
  qui lit le silo en lecture seule.
- **Navigateur du PO**, qui consulte le moniteur en HTTP.

Canaux : la méthode appelle les outils en API/webhook et reçoit l'artefact ; le **mesureur tiers**
écrit la mesure dans le silo (**lui seul écrit** — ni la méthode auditée, ni le moniteur) ; le silo
sera copié/haché vers le miroir *plus tard* ; le moniteur lit le silo en lecture seule ; le PO
accède au moniteur en HTTP.
