---
date: 2026-10-14
session: "main / vectorz"
type: friction
---

# Tag autonome bloqué par des fiches réservées au PO

À la clôture, le run a voulu poser le tag local v0.16.0 (geste délégué par le PO). Impossible : 3 fiches BLOQUÉES par conception restent rattachées à v0.16.0 (sous-revue, attend-dépendance, attend-panel — « pas un build autonome », « à tenir avec le PO ») et une 4e a été sautée (arbitrage PO). Le gate des fiches bloquées empêche correctement la clôture. Un run autonome ne peut donc pas taguer une version qui porte des fiches réservées au PO : le tag devient un geste PO, pas une délégation. Piste : au close, distinguer « lot livré » (taggable) de « version complète » ; ou sortir les fiches bloquées/hors-scope de la version AVANT le run (geste PO), pour que la délégation du tag tienne.
