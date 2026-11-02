---
id: "20261102100505427"
title: "Le lanceur de mission control annonce un port web faux quand ce port est déjà pris"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: none # message du lanceur dans le terminal ; pas d'écran nouveau
created: 2026-11-02
---

# Le lanceur annonce un port web faux quand ce port est déjà pris

**En clair.** Quand le port web demandé est déjà occupé, vite prend le port suivant sans rien dire au
script de lancement. Le script affiche quand même l'ancien port. Tu ouvres alors la page d'une autre
instance, ou une page qui ne répond pas. La correction attendue : refuser net, comme le script le fait
déjà pour le port du daemon.

**Si tu arrives frais.** Mission control (cop1) se lance par `pnpm cop1:dev`. Le script démarre un
daemon (le serveur de données) et une page web servie par vite (le serveur de développement).

## Contexte / Problème

Gravité : **majeure**. Une fonction marche mal sur un cas plausible : deux sessions lancent chacune
leur instance, et l'adresse affichée ment.

Reproduction, constatée 2 fois sur 2 :

1. `node -e "require('net').createServer().listen(5284,'::1')" &` occupe le port web.
2. `env COP1_DAEMON_PORT=4354 COP1_WEB_PORT=5284 pnpm cop1:dev --no-build`
3. Le journal affiche « ▶ web cop1 → http://localhost:5284 », puis « Port 5284 is in use, trying
   another one... » et « Local: http://localhost:5285/ ».
4. `curl -m 20 http://localhost:5284/` n'atteint pas mission control.

Attendu : un refus net « port 5284 pris ». Obtenu : l'adresse affichée ne mène pas à la page lancée.

Le même piège a déjà été corrigé pour le port du daemon (commit d28f3ceb, « refuse to start mission
control on a busy daemon port »).

## Proposition

Faire refuser à vite un port occupé (`strictPort`), et laisser le script remonter l'erreur en clair,
comme pour le daemon.

## Critères d'acceptation

- [ ] Port web occupé : le lancement s'arrête avec un message qui nomme le port pris.
- [ ] Port web libre : rien ne change, l'adresse affichée est celle de la page.

## Comment vérifier

Rejouer la reproduction ci-dessus. Le lancement doit s'arrêter à l'étape 3, avec un message clair.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B1), le 2026-11-02.
- Indice de localisation, non garanti : `products/cop1/packages/web/vite.config.ts:14`, où le port
  est posé sans `strictPort`.
