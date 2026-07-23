## Ce que montre ce diagramme

**Où tourne physiquement chaque pièce**, et par quel canal elles se parlent :

- **bleu = l'exécution** (le runner de CI, au build de PR, où la méthode lance l'analyse ; et le
  navigateur du PO) ;
- **gris = le mesureur tiers** (neutre) — il tourne aussi sur la CI, mais c'est **lui** qui écrit ;
- **ambre = le cloud** (les outils d'analyse SaaS, language-agnostic) ;
- **vert = côté vectorz** (le silo, et le moniteur web).

Le point **corrigé par le panel** : c'est le **mesureur tiers** qui écrit la mesure (ni la méthode
auditée, ni le moniteur). Le silo n'a pas encore de foyer figé (arbitrage Q2 : dans le silo 0044
ou un frère `.quality/`), donc on écrit derrière une interface neutre (`MetricSink`) en attendant ;
et le **miroir** tamper-évident est **repoussé hors du premier jet** (POC). Rien de nouveau à
héberger sauf le silo et le moniteur ; les outils lourds sont délégués au cloud.
