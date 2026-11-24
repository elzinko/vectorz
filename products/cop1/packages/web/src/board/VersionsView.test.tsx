/**
 * Les pages Versions et Une version (fiche 20261124111115783) : à versionner, en construction,
 * étiquetées de la plus récente à la plus ancienne, la page d'une version et son fil d'Ariane. Une
 * donnée non publiée s'écrit « non publié », jamais « 0 ». La coupe reste une commande.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VersionsView } from './VersionsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, FicheDetail, VersionLot, VersionsPage } from './types.js';

afterEach(cleanup);

const fiche = (id: string, title: string): FicheDetail =>
  ({ id, title, prio: 'P1', status: 'done', ver: '', enclair: '', ctx: '', crit: [], verif: '', blocked: '' }) as FicheDetail;

const lot = (version: string, extra: Partial<VersionLot> = {}): VersionLot => ({
  version,
  nom: null,
  milestones: [],
  etat: 'livree',
  cycleDeVie: 'livree',
  etiquette: version,
  dateEtiquette: '2026-11-01T10:00:00+01:00',
  livrees: [],
  aFaire: [],
  pretes: [],
  bloquees: [],
  ...extra,
});

const page: VersionsPage = {
  lots: [
    lot('v0.1.0', { nom: 'Le socle dit vrai', livrees: ['f1'], dateEtiquette: '2026-08-01T10:00:00+02:00' }),
    lot('v0.2.0', { livrees: ['f2', 'f3'], milestones: ['board'] }),
    lot('v0.3.0', {
      nom: 'En cours',
      etat: 'en-cours',
      cycleDeVie: 'brouillon',
      etiquette: null,
      dateEtiquette: null,
      aFaire: ['f4'],
      pretes: ['f4'],
    }),
  ],
  prochaineCoupe: {
    derniereEtiquette: 'v0.2.0',
    livrees: [],
    nombre: 0,
    gate: {
      version: 'v0.2.0',
      verdict: 'GO',
      date: '2026-11-01T10:00:00Z',
      passes: [{ id: 'tests', title: 'Tests', go: true, sautee: false }],
    },
    numeroPropose: null,
  },
};

const project: BoardProject = {
  ...(BOARD_DATA.vectorz as BoardProject),
  plan: { state: 'ok' },
  versionsPage: page,
  objectifs: [
    {
      slug: 'board',
      nom: 'Mission control lisible',
      status: 'in-progress',
      total: 10,
      shipped: 7,
      counts: {},
      aFaire: [],
      livrees: ['f2'],
      versions: ['v0.2.0'],
    },
  ],
  fiches: { f1: fiche('f1', 'Première'), f2: fiche('f2', 'Deuxième'), f3: fiche('f3', 'Troisième'), f4: fiche('f4', 'Quatrième') },
};

const now = new Date('2026-11-24T12:00:00Z');

describe('VersionsView — la liste', () => {
  it('les versions étiquetées vont de la plus récente à la plus ancienne, avec nom ou « non publié »', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell')[0]?.textContent)).toEqual(['v0.2.0', 'v0.1.0']);
    expect(rows[0]?.textContent).toContain('non publié');
    expect(rows[0]?.textContent).toContain('board · 1');
    expect(rows[0]?.textContent).toContain('il y a 23 j');
    expect(rows[1]?.textContent).toContain('Le socle dit vrai');
  });

  it('« À versionner » dit l’étiquette, son âge, le nombre livré depuis, la gate et le numéro non publié', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} />);
    const block = screen.getByText('À versionner').closest('section') as HTMLElement;
    expect(block.textContent).toContain('v0.2.0 · il y a 23 j');
    expect(block.textContent).toContain('0 fiches livrées depuis');
    expect(block.textContent).toContain('GO');
    expect(block.textContent).toContain('Tests : GO');
    expect(block.textContent).toContain('numéro non publié');
  });

  it('un nombre non publié s’écrit « non publié », jamais 0', () => {
    const p = { ...project, versionsPage: { ...page, prochaineCoupe: { ...page.prochaineCoupe, nombre: null } } };
    render(<VersionsView project={p} onOpenFiche={() => {}} now={now} />);
    expect(screen.getByText('fiches livrées depuis : non publié')).toBeTruthy();
  });

  it('« En construction » liste les versions sans étiquette avec leur état en mots', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} />);
    const block = screen.getByText('En construction — 1').closest('section') as HTMLElement;
    expect(block.textContent).toContain('v0.3.0');
    expect(block.textContent).toContain('en construction');
    expect(block.textContent).toContain('1 à faire · 1 prêtes');
  });

  it('« Versionner » n’écrit rien : il montre la commande de coupe', async () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'Versionner' }));
    expect(screen.getByRole('status').textContent).toBe('à lancer : ezk backlog version tag <vX.Y.Z>');
  });
});

describe('VersionsView — la page d’une version', () => {
  it('s’ouvre au clic, montre objectifs et fiches cliquables, et le fil d’Ariane ramène à la liste', async () => {
    const onOpenFiche = vi.fn();
    render(<VersionsView project={project} onOpenFiche={onOpenFiche} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'v0.2.0' }));
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane des versions" }).textContent).toBe('Versions › v0.2.0');
    expect(screen.getByText('1 fiches ici · 7 / 10 livrées au total')).toBeTruthy();
    expect(screen.getByText(/la méthode ne publie pas les lancements par version/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Troisième' }));
    expect(onOpenFiche).toHaveBeenCalledWith('f3');
    await userEvent.click(screen.getByRole('button', { name: 'Versions' }));
    expect(screen.getByText('À versionner')).toBeTruthy();
  });
});

describe('VersionsView — jamais de faux chiffre', () => {
  it('sans versions publiées en entier, la page dit pourquoi', () => {
    const { versionsPage: _v, ...without } = project;
    render(<VersionsView project={without} onOpenFiche={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('versions indisponible');
  });
});
