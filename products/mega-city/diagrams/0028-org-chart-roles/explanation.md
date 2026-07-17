Ce diagramme montre **qui fait quoi dans l'équipe `ezk-*`**, comme un organigramme.

En haut, la **chaîne de valeur** — l'ordre dans lequel une feature avance : le PO/BA
cadre le besoin, l'architecte tranche la structure, le dev implémente, la QA valide,
le reviewer contrôle le diff. Le scrum master (`ezk-sprint`) orchestre ce défilé pour
UNE feature ; au-dessus, le product-builder enchaîne les features, sprint après sprint.

À côté, deux fonctions de **management** qui ne produisent pas de code : le release
manager (`ezk-pr-pilot`) qui teste puis merge le stock de PRs, et la clôture de session
(`ezk-archive`) qui range tout entre deux sessions de travail.

Enfin, la distinction **rôle vs capacité** : TDD, règles (« la loi ») et diagrammes
sont des outils qu'un rôle mobilise — pas des personnes de plus dans l'organigramme.
