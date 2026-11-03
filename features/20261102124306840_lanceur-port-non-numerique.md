---
id: "20261102124306840"
title: "Le lanceur de mission control accepte un port qui n'est pas un nombre"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [mission-control]
status: ready
pr:
evidence: none # message du lanceur dans le terminal ; pas d'écran
created: 2026-11-02
---

# Le lanceur accepte un port qui n'est pas un nombre

**En clair.** Si on règle le port avec autre chose qu'un nombre, par exemple `COP1_WEB_PORT=abc`, le
lanceur ne le refuse pas. Il démarre le daemon, affiche « http://localhost:abc », puis échoue. Il
nettoie derrière lui, mais il a annoncé une adresse fausse. Le lanceur devrait refuser tout de suite
un port mal écrit, avec un message clair.

**Si tu arrives frais.** Mission control (cop1) se lance par `pnpm cop1:dev`. Les variables
`COP1_WEB_PORT` et `COP1_DAEMON_PORT` règlent ses deux ports.

## Contexte / Problème

Gravité : **mineure**. Seule une saisie malformée déclenche le défaut, et le lancement finit bien en
erreur.

Relevé par la revue adverse du 2026-11-02, sur la correction du port web déjà pris
([le lanceur annonce un port web faux](done/20261102100505427_lanceur-annonce-port-web-faux.md)). Ce
défaut existait avant cette correction.

Reproduction :

1. `COP1_DAEMON_PORT=4354 COP1_WEB_PORT=abc pnpm cop1:dev --no-build`
2. Le contrôle des ports passe : `lsof -iTCP:abc` ne trouve rien.
3. Le daemon démarre, et le journal annonce « ▶ web cop1 → http://localhost:abc ».
4. Le lancement finit en erreur (code 1), et le daemon est arrêté.

Attendu : un refus immédiat « port invalide : abc ». Obtenu : un daemon lancé pour rien et une adresse
fausse affichée.

## Proposition

`scripts/cop1-dev.sh` vérifie chaque port avant tout le reste, avant même le contrôle du port déjà
pris. Un port valide est un entier entre 1 et 65535, écrit sans zéro en tête. Sinon le lanceur
s'arrête, avec un message qui nomme la variable et la valeur, et ne démarre rien.

Un test de script, `scripts/test-cop1-dev.sh`, rejoue les valeurs refusées. Il est branché sur
`pnpm test:scripts`, donc sur la gate.

## Critères d'acceptation

- [ ] Un port qui n'est pas un entier entre 1 et 65535 est refusé avant tout lancement, avec un
      message qui nomme la variable et la valeur.
- [ ] Le refus vaut pour les deux variables, `COP1_WEB_PORT` et `COP1_DAEMON_PORT`.
- [ ] Le test de script tourne dans `pnpm test:scripts`.

## Comment vérifier

1. `bash scripts/test-cop1-dev.sh` passe, puis `pnpm --dir products/mega-city test:scripts`.
2. Rejouer la reproduction : `COP1_DAEMON_PORT=4354 COP1_WEB_PORT=abc pnpm cop1:dev --no-build`
   s'arrête tout de suite, sans démarrer le daemon.

## Notes / décisions

- Trouvé par la revue adverse (ezk-reviewer) du sprint 5, le 2026-11-02, constat P2 hors périmètre.
- Indice de localisation : `scripts/cop1-dev.sh`, fonction `refuse_busy_port` et lecture des
  variables de port.
- **Groomée le 2026-11-03** (run autonome) : la vérification se pose dans le
  script, avant `refuse_busy_port`. Aucun écran ne change.
