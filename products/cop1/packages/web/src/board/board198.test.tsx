import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CadrageView } from './CadrageView.js';
import { DevView } from './DevView.js';
import { cadrageColumns, devColumns, isLaunchable } from './pipeline.js';
import type { BoardProject, Version } from './types.js';

afterEach(cleanup);

const V = (ver: string, over: Partial<Version> = {}): Version => ({
  ver,
  name: ver,
  done: 0,
  wip: 0,
  ready: 0,
  idea: 0,
  total: 0,
  ...over,
});

/** Un projet qui couvre les trois colonnes de chaque pipeline + un lot lançable. */
function makeProject(over: Partial<BoardProject> = {}): BoardProject {
  return {
    name: 'p',
    desc: '',
    live: false,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
    versions: {
      current: V('v2.0.0', { ready: 3, total: 3 }), // cadré, done 0 → à développer / lançable
      upcoming: [
        V('v2.1.0', { idea: 4, total: 4 }), // rien groomé → à cadrer
        V('v2.2.0', { ready: 2, idea: 3, total: 5 }), // partiellement groomé → en cadrage
      ],
      past: [
        V('v1.5.0', { done: 2, ready: 1, total: 4 }), // dev en cours
        V('v1.0.0', { done: 3, total: 3 }), // tout livré
      ],
    },
    runs: {},
    ...over,
  };
}

describe('pipeline — colonnes', () => {
  it('cadrageColumns range par étape de grooming', () => {
    const c = cadrageColumns(makeProject());
    expect(c.acadrer.map((v) => v.ver)).toEqual(['v2.1.0']);
    expect(c.encadr.map((v) => v.ver)).toContain('v2.2.0');
    expect(c.cadres.map((v) => v.ver)).toContain('v2.0.0');
  });

  it('devColumns range par étape de dev', () => {
    const c = devColumns(makeProject());
    expect(c.avenir.map((v) => v.ver)).toEqual(['v2.0.0']);
    expect(c.encours.map((v) => v.ver)).toEqual(['v1.5.0']);
    expect(c.faits.map((v) => v.ver)).toEqual(['v1.0.0']);
  });

  it('isLaunchable : cadré, done 0, sans run', () => {
    const p = makeProject();
    expect(isLaunchable(p, p.versions.current as Version)).toBe(true);
  });

  it('isLaunchable : faux si un run est en cours sur la version', () => {
    const p = makeProject({
      runs: { r: { id: 'r', name: 'run', ver: 'v2.0.0', live: true } },
    });
    expect(isLaunchable(p, p.versions.current as Version)).toBe(false);
  });
});

describe('CadrageView', () => {
  it('affiche les trois colonnes de cadrage et la table d’activité', () => {
    render(<CadrageView project={makeProject()} onOpenRun={() => {}} />);
    expect(screen.getByText('À venir — à cadrer')).toBeTruthy();
    expect(screen.getByText('En cours')).toBeTruthy();
    expect(screen.getByText('Cadré')).toBeTruthy();
    expect(screen.getByText('Runs de cadrage récents')).toBeTruthy();
  });
});

describe('DevView', () => {
  it('affiche « Lancer » sur un lot lançable et ouvre le configurateur', async () => {
    render(<DevView project={makeProject()} onOpenRun={() => {}} />);
    const launch = screen.getByRole('button', { name: '▸ Lancer' });
    await userEvent.click(launch);
    expect(screen.getByText('Lancer la réalisation — v2.0.0')).toBeTruthy();
    // Le configurateur propose ses réglages.
    expect(screen.getByText('Taille de sprint')).toBeTruthy();
  });

  it('le lancement est simulé (pas de déclenchement réel)', async () => {
    render(<DevView project={makeProject()} onOpenRun={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: '▸ Lancer' }));
    // Le bouton du configurateur a un nom distinct de celui de la colonne.
    await userEvent.click(screen.getByRole('button', { name: '▸ Lancer le run' }));
    expect(screen.getByText(/Lancement simulé/)).toBeTruthy();
  });

  it('n’offre pas « Lancer » quand un run est en cours', () => {
    const p = makeProject({ runs: { r: { id: 'r', name: 'run', ver: 'v2.0.0', live: true } } });
    render(<DevView project={p} onOpenRun={() => {}} />);
    expect(screen.queryByRole('button', { name: '▸ Lancer' })).toBeNull();
  });
});
