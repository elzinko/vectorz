# Journal des difficultés — claude/ezk-backlog-ready-cf99c8

## [20261002115451315] Numéro d'ADR : deux dossiers, vérifier --next
- **Coincé** : ADR-039 choisi d'après docs/adr/ (max 038) est entré en collision : un 039 existe déjà dans products/mega-city/docs/adr/ (format 00NN, jusqu'à 0065).
- **Réglé** : Deux dossiers d'ADR coexistent. Prochain numéro libre DES DEUX : bash products/mega-city/bin/check-adr-ids.sh . --next → 0069. ADR écrit dans products/mega-city/docs/adr/ (le dossier moderne).
- **Pourquoi** : Le test bin/test-adr-ids-repo.sh croise les deux dossiers ; ne jamais déduire le prochain numéro du seul docs/adr/ racine.
