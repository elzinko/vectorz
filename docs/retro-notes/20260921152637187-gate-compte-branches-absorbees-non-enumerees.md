# Le portier ezk-archive compte des branches absorbées qu'il n'énumère pas

**Symptôme (constaté à la clôture 2026-09-21, worktree `models-per-client-config-ad598f`).**
`scripts/check.sh --gate --point 2` a annoncé `branch_absorbed=26` mais n'a émis que
**16** lignes `[P2] branch ABSORBED … safe_delete=1`. Relever la borne (`MAX_FACTS=300`)
n'a rien changé — ce n'est donc pas le plafond d'affichage. Après purge des 16 nommées,
le compteur est tombé à `branch_absorbed=10` : dix branches restent comptées sans jamais
être listées, donc **impurgeables** par la clôture (on ne supprime pas une ref qu'on ne
voit pas).

**Pourquoi ça compte.** La correction sûre du `run` (`git branch -D` des absorbées
prouvées) ne peut agir que sur ce que le portier **émet**. Un écart compte≠émis fait que
chaque clôture laisse un résidu invisible qui ne diminue jamais — exactement la dette de
branches que le point 2 est censé résorber.

**Piste (à trancher en rétro).** Soit le compteur inclut des refs non émises (remote-
tracking `origin/*`, ou une déduplication tête↔branche) — alors aligner le compteur sur
l'ensemble émis. Soit l'émission est bornée en amont du grep — alors émettre toutes les
absorbées. Vérifier dans `products/mega-city/skills/ezk-archive/scripts/check.sh` d'où
sortent respectivement le compte `branch_absorbed=N` et les lignes `[P2] branch ABSORBED`.

**Reproduire.** Repo vectorz, depuis n'importe quel worktree :
`bash products/mega-city/skills/ezk-archive/scripts/check.sh --gate --point 2 | grep -c "branch ABSORBED"`
puis comparer au `branch_absorbed=` de la ligne `P2_PENDING`.
