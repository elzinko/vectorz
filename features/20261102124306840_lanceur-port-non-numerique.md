---
id: "20261102124306840"
title: "Le lanceur de mission control accepte un port qui n'est pas un nombre"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [mission-control]
status: idea
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

À instruire au groom. Piste : vérifier dans `scripts/cop1-dev.sh` que chaque port est un entier entre
1 et 65535, avant tout le reste.

## Critères d'acceptation

- [ ] Un port qui n'est pas un entier entre 1 et 65535 est refusé avant tout lancement, avec un
  message qui nomme la variable et la valeur.

## Comment vérifier

Rejouer la reproduction ci-dessus : le lancement doit s'arrêter à l'étape 1, sans démarrer le daemon.

## Notes / décisions

- Trouvé par la revue adverse (ezk-reviewer) du sprint 5, le 2026-11-02, constat P2 hors périmètre.
- Indice de localisation : `scripts/cop1-dev.sh`, fonction `refuse_busy_port` et lecture des
  variables de port.
