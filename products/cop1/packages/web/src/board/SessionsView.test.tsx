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

  it('une ligne par session : pastille, titre, puis date · branche · lancements · sprints ; ce qui n’est pas publié est omis, jamais 0', () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]?.textContent).toBe('closeSession du 17 au 19 novembre2026-11-19 · 1 lancement · 1 sprintclose');
    expect(rows[1]?.textContent).toBe('closeSession du 4 novembre2026-11-04close');
    expect(screen.queryByText('non publié')).toBeNull();
    expect(screen.queryByText(/Rangés par la période/)).toBeNull();
    expect(screen.getByLabelText(/Aide : Non publié par la méthode.*Rangés par la période/)).toBeTruthy();
  });

  it('aucune cellule ne dit « 0 » pour ce que la méthode ne publie pas', () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    const text = screen.getAllByRole('listitem').map((r) => r.textContent).join('|');
    expect(text).not.toMatch(/\b0 (lancement|sprint)/);
  });

  it('la recherche et le filtre de branche réduisent la liste', async () => {
    const withBranch: BoardProject = {
      ...project,
      pilotage: {
        milestones: [],
        sessions: [
          { date: '2026-11-19', title: 'Session carte', file: 'a.md', fiches: [], prs: [], branch: 'feat/carte' },
          { date: '2026-11-04', title: 'Session objectifs', file: 'b.md', fiches: [], prs: [], branch: 'main' },
        ],
      },
    };
    render(<SessionsView project={withBranch} {...handlers} now={now} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une session' }), 'objectifs');
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 sessions');
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Rechercher une session' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Branche' }), 'feat/carte');
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 sessions');
    expect(screen.getAllByRole('listitem')[0]?.textContent).toContain('feat/carte');
  });

  it('sans branche publiée, pas de filtre de branche sans objet', () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    expect(screen.queryByRole('combobox', { name: 'Branche' })).toBeNull();
  });

  it('« Afficher plus » ne paraît que s’il reste des sessions, avec le compteur à droite', async () => {
    const many: BoardProject = {
      ...project,
      pilotage: {
        milestones: [],
        sessions: Array.from({ length: 25 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          title: `Session ${i + 1}`,
          file: `s${i}.md`,
          fiches: [],
          prs: [],
        })),
      },
    };
    render(<SessionsView project={many} {...handlers} now={now} />);
    expect(screen.getAllByRole('listitem').length).toBe(20);
    expect(screen.getByText('1 en cours · 25 closes')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(screen.getAllByRole('listitem').length).toBe(25);
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
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
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByText(/PR : #12/)).toBeTruthy();
    expect(screen.getByText(/feat\/carte · 2026-11-17 → 2026-11-17/)).toBeTruthy();
    expect(screen.getByText('Le fil — 1 moment')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'carte-lisible' }));
    expect(onOpenSprint).toHaveBeenCalledWith('carte-lisible');
    await userEvent.click(screen.getByRole('button', { name: 'Voir le lancement' }));
    expect(onViewRun).toHaveBeenCalledWith('carte:v0.23.0');
  });

  it('une session plus ancienne que les sprints publiés n’en montre aucun, et le dit', async () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Session du 4 novembre' }));
    expect(screen.getAllByText('non publié pour cette période')).toHaveLength(3);
    expect(screen.getByText('Le fil — non publié')).toBeTruthy();
    expect(screen.queryByText(/Le fil — 0/)).toBeNull();
  });

  it('les cinq blocs paraissent dans l’ordre, les sprints du plus récent, le récit en sections sans Markdown brut', async () => {
    const withRecit: BoardProject = {
      ...project,
      lastSprints: [sprint('ancien', '2026-11-16'), sprint('carte-lisible', '2026-11-17')],
      pilotage: {
        milestones: [],
        sessions: [
          {
            date: '2026-11-19',
            title: 'Session du 17 au 19 novembre',
            file: 'r.md',
            fiches: ['f1'],
            prs: [],
            branch: 'feat/carte',
            openedAt: '2026-11-17',
            sections: [{ title: 'Ce qui est livré', text: 'La **carte** zoomable, voir `ezk`' }],
          },
        ],
      },
    };
    render(<SessionsView project={withRecit} {...handlers} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Session du 17 au 19 novembre' }));
    const heads = Array.from(document.querySelectorAll('.card > h3')).map((h) => h.textContent ?? '');
    const order = ['Lancements', 'Le fil', 'Sprints', 'Le récit', 'Les fiches citées'].map((k) => heads.findIndex((h) => h.startsWith(k)));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(screen.getByText('2 montrés')).toBeTruthy();
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons.indexOf('carte-lisible')).toBeLessThan(buttons.indexOf('ancien'));
    const summary = screen.getByTestId('session-summary').textContent ?? '';
    expect(summary).toContain('branche : feat/carte');
    expect(summary).toContain('durée : 2 jours');
    expect(summary).toContain('ouverte le 2026-11-17');
    expect(summary).toContain('1 fiche citée');
    const recit = screen.getByText('Ce qui est livré').closest('section') as HTMLElement;
    expect(recit.textContent).not.toMatch(/\*\*|`/);
    expect(recit.querySelector('b')?.textContent).toBe('carte');
  });

  it('sans récit publié, la page dit « non publié » au lieu d’un fichier brut', async () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Session du 17 au 19 novembre' }));
    const recit = screen.getByRole('heading', { name: 'Le récit' }).closest('section') as HTMLElement;
    expect(recit.textContent).toContain('non publié');
    expect(recit.textContent).not.toContain('.md');
  });
});

describe('SessionsView — l’en-tête d’une session', () => {
  it('une ligne de résumé qui omet ce qui n’est pas publié, et un « i » qui le dit', async () => {
    render(<SessionsView project={project} {...handlers} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Session du 17 au 19 novembre' }));
    const summary = screen.getByTestId('session-summary').textContent ?? '';
    expect(summary).toContain('closeclose le 2026-11-19 · 0 fiche citée · PR : #12');
    expect(summary).not.toContain('non publié');
    expect(screen.getByLabelText('Aide : Non publié par la méthode : ouverture, durée, branche')).toBeTruthy();
  });
});

describe('SessionsView — retour du détail d’un lancement', () => {
  it('rouvre la session close d’où l’on venait, et dit laquelle est ouverte', async () => {
    const onOpenChange = vi.fn();
    render(<SessionsView project={project} {...handlers} now={now} initialOpen={0} onOpenChange={onOpenChange} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Session du 17 au 19 novembre' })).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();
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
