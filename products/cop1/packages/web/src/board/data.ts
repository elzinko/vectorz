/**
 * Board unifié cop1 — données d'amorçage (modèle typé, échantillon représentatif).
 *
 * Chaque projet est la SEULE source de ses chiffres : l'entonnoir, les métriques
 * « depuis le début » et les versions viennent d'ici, pas d'un calcul parallèle.
 * Le read-model réel (journal par worktree + backlog) remplacera ces constantes
 * aux tranches suivantes (fiches 20261012231419211, 20261015082118353…) sans
 * toucher aux types ni aux vues.
 */
import type { BoardData, FicheDetail, FicheStatus } from './types.js';

/** Fabrique une fiche en détail avec des valeurs par défaut lisibles. */
function f(
  id: string,
  title: string,
  prio: string,
  status: FicheStatus,
  ver: string,
  enclair: string,
  extra: Partial<FicheDetail> = {},
): FicheDetail {
  return { id, title, prio, status, ver, enclair, ctx: '—', crit: ['à préciser'], verif: 'à définir', ...extra };
}

export const BOARD_DATA: BoardData = {
  vectorz: {
    name: 'vectorz',
    desc: 'la méthode',
    live: true,
    funnel: { idea: 56, ready: 14, wip: 0, unversioned: 20, parked: 71 },
    metrics: {
      done: 296,
      tokens: '18,4 M',
      temps: '~42 h',
      perFiche: '62 k',
      sprints: 120,
      runs: 32,
      retros: 14,
    },
    versions: {
      current: { ver: 'v0.11.0', name: 'La qualité tient', done: 0, wip: 0, ready: 9, idea: 0, total: 9 },
      upcoming: [
        { ver: 'v0.12.0', name: 'Le flux local sans friction', done: 0, wip: 0, ready: 1, idea: 6, total: 7 },
        { ver: 'v0.13.0', name: "La transaction ship, d'un bloc", done: 0, wip: 0, ready: 0, idea: 7, total: 7 },
        { ver: 'v0.14.0', name: 'Les portiers robustes', done: 0, wip: 0, ready: 0, idea: 6, total: 6 },
        { ver: 'v0.15.0', name: 'Voir les runs', done: 0, wip: 0, ready: 0, idea: 4, total: 4 },
        { ver: 'v0.16.0', name: 'Ranger la maison (2e jet)', done: 0, wip: 0, ready: 2, idea: 7, total: 9 },
      ],
      past: [
        { ver: 'v0.10.0', name: 'Portabilité multi-IDE', done: 3, wip: 0, ready: 0, idea: 0, total: 3, date: '2026-10-11', tok: '512 k' },
        { ver: 'v0.9.0', name: 'Ranger la maison', done: 5, wip: 0, ready: 0, idea: 0, total: 5, date: '2026-10-11', tok: '402 k' },
        { ver: 'v0.8.0', name: 'Amélioration mesurée', done: 4, wip: 0, ready: 0, idea: 0, total: 4, date: '2026-10-10', tok: '357 k' },
      ],
    },
    runs: {
      r1: {
        id: 'r1',
        name: 'Cadrage & lotissement du backlog',
        ver: 'v0.11.0',
        live: true,
        kind: 'cadrage',
        date: "aujourd'hui · démarré il y a 12 min",
        when: 'il y a 12 min',
        verdict: 'en cours',
        tok: '218 k',
        dur: '52 min',
        note: 'Tri, lotissement en 6 versions, grooming de v0.11 (9/9).',
        moments: [
          {
            step: 'grooming',
            label: 'Grooming du lot v0.11',
            tok: '218 k',
            fiches: [
              { fid: '20260922175954296', from: 'idea', to: 'ready' },
              { fid: '20261004175528673', from: 'idea', to: 'ready' },
              { fid: '20261003075821760', from: 'idea', to: 'ready' },
            ],
          },
        ],
      },
      rv10: {
        id: 'rv10',
        name: 'Réalisation v0.10 — portabilité multi-IDE',
        ver: 'v0.10.0',
        live: false,
        kind: 'dev',
        date: 'hier',
        when: '1 j',
        verdict: 'GO',
        tok: '512 k',
        dur: '2 h 10',
        note: '3 fiches en 3 sprints. Rétro à la fin.',
        moments: [
          { step: 'sprint', n: 1, label: 'Générateur multi-IDE', tok: '210 k', fiches: [{ fid: 'p1001', from: 'ready', to: 'done' }] },
          { step: 'sprint', n: 2, label: 'Boussole ezk now', tok: '170 k', fiches: [{ fid: 'p1002', from: 'ready', to: 'done' }] },
          { step: 'sprint', n: 3, label: 'Brownfield scout', tok: '132 k', fiches: [{ fid: 'p1003', from: 'ready', to: 'done' }] },
          { step: 'retro', label: 'Rétro v0.10', fiches: [] },
        ],
      },
    },
    fiches: {
      '20260922175954296': f('20260922175954296', 'Release-gate (skill ezk-release)', 'P0', 'ready', 'v0.11.0', 'Passe qualité composable avant le tag ; bloque si NO-GO.', { ctx: 'Avant de taguer, rejouer une passe qualité composable.', crit: ['DoD mécanique rejouée', 'Bloque le tag sur NO-GO'], verif: 'ezk release v0.11.0' }),
      '20261004175528673': f('20261004175528673', 'Corriger les 20 dépendances vulnérables', 'P1', 'ready', 'v0.11.0', 'GitHub signale 20 failles, dont une haute.', { crit: ['0 faille haute', 'audit vert'], verif: 'pnpm audit --prod' }),
      '20261003075821760': f('20261003075821760', 'Le relecteur coche les critères', 'P1', 'ready', 'v0.11.0', 'Une case cochée = prouvé, par la revue.'),
      p1001: f('p1001', 'Générateur multi-IDE', 'P1', 'done', 'v0.10.0', 'Une source de règles génère chaque IDE.', { pr: 'local 920b6b62' }),
      p1002: f('p1002', 'Boussole ezk now', 'P2', 'done', 'v0.10.0', 'Quoi faire maintenant.', { pr: 'local ADR-0072' }),
      p1003: f('p1003', 'Amorçage brownfield', 'P2', 'done', 'v0.10.0', 'ezk scout extract amorce les bundles.', { pr: 'local' }),
      f1202: f('f1202', 'ezk dit quand le principal est en retard', 'P1', 'idea', 'v0.12.0', 'ezk signale un dépôt principal en retard.'),
      f1203: f('f1203', 'Un seul guichet GitHub (github:false respecté)', 'P2', 'ready', 'v0.12.0', 'github:false coupe tous les appels GitHub.'),
      f1601: f('f1601', 'Basculer vectorz vers scrum/', 'P2', 'ready', 'v0.16.0', 'Déménager 5 dossiers sous scrum/.'),
      f1602: f('f1602', 'Trier les sorties de rétro par nature', 'P2', 'idea', 'v0.16.0', 'Une source unique décrit les sorties de rétro.'),
    },
    timeline: [
      { when: 'maintenant', kind: 'lancement', ver: 'v0.11.0', title: 'Cadrage v0.11 en cours', tok: '218 k', cost: 'lo', live: true, ref: { type: 'run', id: 'r1' } },
      { when: "aujourd'hui", kind: 'gate', ver: 'v0.11.0', title: 'Lot v0.11 figé — 9 fiches' },
      { when: 'hier', kind: 'tag', ver: 'v0.10.0', title: 'Version v0.10.0 taguée' },
      { when: 'hier', kind: 'retro', ver: 'v0.10.0', title: 'Rétro v0.10' },
      { when: 'hier', kind: 'sprint', ver: 'v0.10.0', title: 'Sprint 3 — Brownfield scout', tok: '132 k', cost: 'lo', ref: { type: 'sprint', id: 'rv10' } },
      { when: 'hier', kind: 'sprint', ver: 'v0.10.0', title: 'Sprint 2 — Boussole ezk now', tok: '170 k', cost: 'lo', ref: { type: 'sprint', id: 'rv10' } },
      { when: 'hier', kind: 'sprint', ver: 'v0.10.0', title: 'Sprint 1 — Générateur multi-IDE', tok: '210 k', cost: 'mid', ref: { type: 'sprint', id: 'rv10' } },
      { when: 'hier', kind: 'lancement', ver: 'v0.10.0', title: 'Lancement réalisation v0.10', ref: { type: 'run', id: 'rv10' } },
      { when: '2 j', kind: 'tag', ver: 'v0.9.0', title: 'Version v0.9.0 taguée' },
      { when: '2 j', kind: 'gate', ver: 'v0.9.0', title: 'Lot v0.9 figé — 5 fiches' },
      { when: '3 j', kind: 'tag', ver: 'v0.8.0', title: 'Version v0.8.0 taguée' },
      { when: '3 j', kind: 'retro', ver: 'v0.8.0', title: 'Rétro v0.8' },
      { when: '3 j', kind: 'sprint', ver: 'v0.8.0', title: 'Sprint 2 — DoD/DoR', tok: '157 k', cost: 'lo' },
      { when: '3 j', kind: 'sprint', ver: 'v0.8.0', title: 'Sprint 1 — bundle + spike', tok: '200 k', cost: 'mid' },
      { when: '5 j', kind: 'tag', ver: 'v0.7.0', title: 'Version v0.7.0 taguée' },
      { when: '12 j', kind: 'tag', ver: 'v0.1.0', title: 'Versions v0.1 → v0.6 taguées' },
      { when: 'origine', kind: 'gate', title: 'Création du projet vectorz' },
    ],
    chantiers: [
      {
        key: 'v0.17.0',
        name: 'Réalisation v0.17',
        ver: 'v0.17.0',
        state: 'live',
        age: 'il y a 2 min',
        sessions: [
          {
            id: 'pilote',
            label: 'Orchestration · pilote',
            state: 'live',
            pilot: true,
            events: [{ when: '20 min', kind: 'lancement', title: 'Réalisation v0.17 lancée' }],
          },
          {
            id: 'feat/0211',
            label: 'feat/0211 · activité',
            state: 'live',
            events: [
              { when: '2 min', kind: 'sprint', title: 'Sprint 2 — activité run→moments' },
              { when: '35 min', kind: 'gate', title: 'Revue passée · GO' },
              { when: '1 h', kind: 'sprint', title: 'Sprint 1 — modale fiche · livrée' },
            ],
          },
          {
            id: 'feat/0224',
            label: 'feat/0224 · fiches',
            state: 'gate',
            events: [
              { when: '4 min', kind: 'gate', title: 'Revue demandée' },
              { when: '8 min', kind: 'sprint', title: 'Sprint 1 — vue Fiches démarré' },
            ],
          },
        ],
        merged: [
          { when: '2 min', kind: 'sprint', title: 'Sprint 2 — activité', session: '⎇ feat/0211' },
          { when: '4 min', kind: 'gate', title: 'Revue demandée', session: '⎇ feat/0224' },
          { when: '8 min', kind: 'sprint', title: 'Sprint 1 — vue Fiches démarré', session: '⎇ feat/0224' },
          { when: '20 min', kind: 'lancement', title: 'Réalisation v0.17 lancée', session: '⎇ main · pilote' },
        ],
      },
      {
        key: 'v0.18.0',
        name: 'Cadrage v0.18',
        ver: 'v0.18.0',
        state: 'gate',
        age: 'il y a 12 min',
        sessions: [
          {
            id: 'feat/0237',
            label: 'feat/0237 · grooming',
            state: 'gate',
            events: [{ when: '12 min', kind: 'gate', title: 'Grooming — chronologie condensée' }],
          },
        ],
        merged: [
          { when: '12 min', kind: 'gate', title: 'Grooming — chronologie condensée', session: '⎇ feat/0237' },
        ],
      },
      {
        key: 'v0.16.0',
        name: 'Réalisation v0.16',
        ver: 'v0.16.0',
        state: 'done',
        age: 'hier',
        sessions: [
          {
            id: 'feat/0199',
            label: 'feat/0199 · ranger',
            state: 'done',
            events: [{ when: 'hier', kind: 'tag', title: 'Version v0.16.0 taguée' }],
          },
        ],
        merged: [{ when: 'hier', kind: 'tag', title: 'Version v0.16.0 taguée', session: '⎇ feat/0199' }],
      },
    ],
    config: {
      groomPolicy: 'auto',
      sprintSize: 'auto',
      retro: 'à la fin',
      releaseGate: true,
      github: 'false (sur cette branche)',
      root: '~/git/bacasable/vectorz',
      roles: { 'ezk-architect': 'high', 'ezk-dev': 'middle', 'ezk-reviewer': 'high', 'ezk-qa': 'low' },
    },
  },
  muti: {
    name: 'muti',
    desc: 'app carte & admin',
    live: true,
    funnel: { idea: 2, ready: 3, wip: 1, unversioned: 0, parked: 4 },
    metrics: {
      done: 14,
      tokens: '4,1 M',
      temps: '~11 h',
      perFiche: '293 k',
      sprints: 9,
      runs: 7,
      retros: 3,
    },
    versions: {
      current: { ver: 'v1.8.0', name: 'Correctifs carte admin', done: 14, wip: 1, ready: 3, idea: 2, total: 20 },
      upcoming: [
        { ver: 'v1.9.0', name: 'Comptes & rôles', done: 0, wip: 0, ready: 0, idea: 6, total: 6 },
      ],
      past: [
        { ver: 'v1.7.0', name: 'Signalements', done: 12, wip: 0, ready: 0, idea: 0, total: 12, date: '2026-09-20', tok: '1,2 M' },
      ],
    },
    runs: {
      rm1: {
        id: 'rm1',
        name: 'Réalisation 1.8.0 — carte admin',
        ver: 'v1.8.0',
        live: true,
        kind: 'dev',
        date: '3 h · en cours',
        when: '3 h',
        verdict: 'en cours',
        tok: '260 k',
        dur: '1 h',
        note: 'sprint en cours ; le release-gate bloquera le tag tant que le rendu est hors charte.',
        moments: [
          { step: 'sprint', n: 1, label: 'Carte admin', tok: '260 k', fiches: [{ fid: 'm1', from: 'ready', to: 'wip' }] },
        ],
      },
    },
    fiches: {
      m1: f('m1', 'Rendu hors design-system sur la carte admin', 'P0', 'wip', 'v1.8.0', 'Rendu hors charte. Release-gate NO-GO.', { ctx: 'Le rendu de la carte admin sort de la charte du design-system.', crit: ['Rendu conforme à la charte', 'Release-gate GO'], verif: 'ezk release v1.8.0' }),
    },
    chantiers: [
      {
        key: 'v1.8.0',
        name: 'Réalisation 1.8',
        ver: 'v1.8.0',
        state: 'live',
        age: '3 h',
        sessions: [
          {
            id: 'feat/carte-admin',
            label: 'feat/carte-admin · dev',
            state: 'live',
            events: [{ when: '3 h', kind: 'sprint', title: 'Sprint 1 — carte admin' }],
          },
        ],
        merged: [{ when: '3 h', kind: 'sprint', title: 'Sprint 1 — carte admin', session: '⎇ feat/carte-admin' }],
      },
    ],
    config: {
      groomPolicy: 'exiger mon grooming',
      sprintSize: '3 fiches',
      retro: 'après chaque sprint',
      releaseGate: true,
      github: 'true',
      root: '~/git/muti',
      roles: { 'ezk-dev': 'middle', 'ezk-reviewer': 'high' },
    },
  },
  samplerz: {
    name: 'samplerz',
    desc: 'produit cobaye',
    live: false,
    funnel: { idea: 3, ready: 1, wip: 0, unversioned: 0, parked: 2 },
    metrics: {
      done: 10,
      tokens: '0,8 M',
      temps: '~3 h',
      perFiche: '80 k',
      sprints: 4,
      runs: 3,
      retros: 2,
    },
    versions: {
      current: { ver: 'v0.3.0', name: 'Format méthode depuis projet hôte', done: 4, wip: 0, ready: 1, idea: 3, total: 11 },
      // v0.4.0 : lot entièrement groomé, pas encore lancé, sans run → lançable.
      upcoming: [
        { ver: 'v0.4.0', name: 'Durcir le format hôte', done: 0, wip: 0, ready: 3, idea: 0, total: 3 },
      ],
      past: [
        { ver: 'v0.2.0', name: 'Socle', done: 6, wip: 0, ready: 0, idea: 0, total: 6, date: '2026-09-10', tok: '300 k' },
      ],
    },
    runs: {},
    chantiers: [
      {
        key: 'v0.4.0',
        name: 'Durcir le format hôte',
        ver: 'v0.4.0',
        state: 'live',
        age: '1 h',
        sessions: [
          {
            id: 'feat/durcir',
            label: 'feat/durcir · dev',
            state: 'live',
            events: [{ when: '1 h', kind: 'sprint', title: 'Sprint 1 — format hôte' }],
          },
          {
            id: 'wip/essai-local',
            label: 'wip/essai-local · hors méthode',
            state: 'dead',
            events: [{ when: '2 j', kind: 'lancement', title: 'Session locale — silence prolongé' }],
          },
        ],
        merged: [
          { when: '1 h', kind: 'sprint', title: 'Sprint 1 — format hôte', session: '⎇ feat/durcir' },
          { when: '2 j', kind: 'lancement', title: 'Session locale', session: '⎇ wip/essai-local' },
        ],
      },
    ],
    config: {
      groomPolicy: 'auto',
      sprintSize: '2 fiches',
      retro: 'après chaque sprint',
      releaseGate: false,
      github: 'true',
      root: '~/git/samplerz',
      roles: {},
    },
  },
  cop1: {
    name: 'cop1',
    desc: 'plan de contrôle / Moniteur',
    live: false,
    funnel: { idea: 1, ready: 0, wip: 0, unversioned: 1, parked: 0 },
    metrics: {
      done: 0,
      tokens: '0',
      temps: '—',
      perFiche: '—',
      sprints: 0,
      runs: 0,
      retros: 0,
    },
    versions: {
      current: null,
      upcoming: [
        { ver: 'à cadrer', name: 'Moniteur lisible (refonte dashboard)', done: 0, wip: 0, ready: 0, idea: 1, total: 1 },
      ],
      past: [],
    },
    runs: {},
    config: {
      groomPolicy: '—',
      sprintSize: '—',
      retro: '—',
      releaseGate: false,
      github: 'n/a',
      root: '~/git/vectorz/products/cop1',
      roles: {},
    },
  },
};

/** Le projet affiché par défaut à l'ouverture du board. */
export const DEFAULT_PROJECT = 'vectorz';
