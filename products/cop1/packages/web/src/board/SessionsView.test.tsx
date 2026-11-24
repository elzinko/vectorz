/**
 * Les pages Sessions et Une session (fiche 20261124111116042) : en cours depuis le journal, closes
 * depuis les récits, rangement par période dit à l'écran, fil en clair sans identifiant technique,
 * et le sprint qui s'ouvre sur sa page.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionsView, momentPhrase } from './SessionsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardChantier, BoardProject, SprintSummary } from './types.js';

afterEach(cleanup);

const chantiers: BoardChantier[] = [
  {
    key: 'board:v0.24.0',
    name: 'board:v0.24.0',
    state: 'live',
    age: 'il y a 2 min',
    merged: [],
    sessions: [
      {
        id: 's-live',
        label: 'claude/run-carte',
        state: 'live',
        startedAt: '2026-11-24T20:19:11Z',
        lastAt: '2026-11-24T21:00:00Z',
        events: [
          { when: 'il y a 2 min', kind: 'gate', title: 'Jalon sprint-pages-objectifs-checkpoint' },
          { when: 'il y a 1 h', kind: 'lancement', title: 'Run démarré' },
        ],
      },
    ],
  },
  {
    key: 'carte:v0.23.0',
    name: 'carte:v0.23.0',
    state: 'done',
    age: 'il y a 5 j',
    merged: [],
    sessions: [
      {
        id: 's-old',
        label: 'feat/carte',
        state: 'done',
        startedAt: '2026-11-17T09:00:00Z',
        lastAt: '2026-11-17T12:50:00Z',
        events: [{ when: 'il y a 7 j', kind: 'lancement', title: 'Run démarré' }],
      },
    ],
  },
];

const sprint = (slug: string, jour: string): SprintSummary => ({
  slug,
  fichier: `docs/sprints/${jour}-sprint-${slug}.md`,
  jour,
  fin: `${jour}T12:00:00Z`,
  dureeMs: null,
  tokens: null,
  livrees: [],
  blocages: null,
});

const project: BoardProject = {
  ...(BOARD_DATA.vectorz as BoardProject),
  plan: { state: 'ok' },
  chantiers,
  lastSprints: [sprint('carte-lisible', '2026-11-17')],
  pilotage: {
    milestones: [],
    sessions: [
      { date: '2026-11-19', title: 'Session du 17 au 19 novembre', file: 'docs/sessions/2026-11-19-run.md', fiches: [], prs: ['12'] },
      { date: '2026-11-04', title: 'Session du 4 novembre', file: 'docs/sessions/2026-11-04-run.md', fiches: [], prs: [] },
    ],
  },
};
const now = new Date('2026-11-24T21:00:00Z');
const handlers = { onOpenFiche: () => {}, onOpenSprint: () => {}, onViewRun: () => {} };

describe('SessionsView — la liste', () => {
  it('montre la session en cours, lue dans le journal, avec son dernier moment en clair', () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    const block = screen.getByText('En cours — 1').closest('section') as HTMLElement;
    expect(block.textContent).toContain('claude/run-carte');
    expect(block.textContent).toContain('dernier moment : Fin de sprint : pages objectifs');
    expect(block.textContent).not.toContain('checkpoint');
  });

  it('liste les sessions closes avec branche « non publié », lancements et sprints rangés par période, et le dit', () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]?.textContent).toBe('2026-11-19Session du 17 au 19 novembrenon publié11');
    expect(rows[1]?.textContent).toBe('2026-11-04Session du 4 novembrenon publié00');
    expect(screen.getByText(/Rangés par la période/)).toBeTruthy();
    expect(screen.getByText(/Seuls les 1 derniers sprints sont publiés/)).toBeTruthy();
  });

  it('le filtre par période réduit la liste', async () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: '7 derniers jours' }));
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 sessions');
  });
});

describe('SessionsView — la page d’une session', () => {
  it('montre en-tête, lancements, fil en clair, sprints et récit ; le sprint s’ouvre sur sa page', async () => {
    const onOpenSprint = vi.fn();
    const onViewRun = vi.fn();
    render(<SessionsView project={project} {...handlers} onOpenSprint={onOpenSprint} onViewRun={onViewRun} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Session du 17 au 19 novembre' }));
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane des sessions" }).textContent).toBe('Sessions › 2026-11-19');
    expect(screen.getByText('#12')).toBeTruthy();
    expect(screen.getByText(/feat\/carte · 2026-11-17 → 2026-11-17/)).toBeTruthy();
    expect(screen.getByText('Le fil — 1 moments')).toBeTruthy();
    expect(screen.getByText('docs/sessions/2026-11-19-run.md')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'carte-lisible' }));
    expect(onOpenSprint).toHaveBeenCalledWith('carte-lisible');
    await userEvent.click(screen.getByRole('button', { name: 'Voir le lancement' }));
    expect(onViewRun).toHaveBeenCalledWith('carte:v0.23.0');
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    expect(screen.getByText('Closes — 2')).toBeTruthy();
  });

  it('une session plus ancienne que les sprints publiés n’en montre aucun, et le dit', async () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Session du 4 novembre' }));
    expect(screen.getByText('aucun sprint publié dans sa période')).toBeTruthy();
  });
});

describe('SessionsView — retour du détail d’un lancement', () => {
  it('rouvre la session close d’où l’on venait, et dit laquelle est ouverte', async () => {
    const onOpenChange = vi.fn();
    render(<SessionsView project={project} {...handlers} now={now} initialOpen={0} onOpenChange={onOpenChange} />);
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane des sessions" }).textContent).toBe('Sessions › 2026-11-19');
    await userEvent.click(screen.getByRole('button', { name: 'Sessions' }));
    expect(onOpenChange).toHaveBeenCalledWith(null);
  });
});

describe('momentPhrase — le fil sans identifiant technique', () => {
  it('traduit les moments du journal en phrases', () => {
    expect(momentPhrase({ when: '', kind: 'lancement', title: 'Run démarré' })).toBe('Lancement');
    expect(momentPhrase({ when: '', kind: 'gate', title: 'Reprise après le jalon' })).toBe('Reprise');
    expect(momentPhrase({ when: '', kind: 'gate', title: 'Jalon inter-sprint' })).toBe('Point entre deux sprints');
    expect(momentPhrase({ when: '', kind: 'gate', title: 'Jalon 7f3a-uuid' })).toBe('Point d’arrêt de la méthode');
  });
});

describe('SessionsView — jamais de faux chiffre', () => {
  it('sans récits publiés, la page dit pourquoi', () => {
    const { pilotage: _p, ...without } = project;
    render(<SessionsView project={without} {...handlers} />);
    expect(screen.getByRole('status').textContent).toContain('sessions indisponible');
  });
});
