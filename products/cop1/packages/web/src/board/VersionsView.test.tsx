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
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} onFocusChange={() => {}} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell')[0]?.textContent)).toEqual(['v0.2.0', 'v0.1.0']);
    expect(rows[0]?.textContent).toContain('non publié');
    const pastille = within(rows[0] as HTMLElement).getByText('board');
    expect(pastille.className).toContain('tag obj');
    expect(pastille.getAttribute('title')).toBe('Mission control lisible');
    expect(rows[0]?.textContent).toContain('il y a 23 j');
    expect(rows[1]?.textContent).toContain('Le socle dit vrai');
  });

  it('« À versionner » dit l’étiquette, son âge, le nombre livré depuis, la gate et le numéro non publié', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} onFocusChange={() => {}} />);
    const block = screen.getByText('À versionner').closest('section') as HTMLElement;
    expect(block.textContent).toContain('v0.2.0 · il y a 23 j');
    expect(block.textContent).toContain('0 fiches livrées depuis');
    expect(block.textContent).toContain('GO');
    expect(block.textContent).toContain('Tests : GO');
    expect(block.textContent).toContain('numéro non publié');
  });

  it('un nombre non publié s’écrit « non publié », jamais 0', () => {
    const p = { ...project, versionsPage: { ...page, prochaineCoupe: { ...page.prochaineCoupe, nombre: null } } };
    render(<VersionsView project={p} onOpenFiche={() => {}} now={now} onFocusChange={() => {}} />);
    expect(screen.getByText('fiches livrées depuis : non publié')).toBeTruthy();
  });

  it('« En construction » liste les versions sans étiquette avec leur état en mots', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} onFocusChange={() => {}} />);
    const block = screen.getByText('En construction — 1').closest('section') as HTMLElement;
    expect(block.textContent).toContain('v0.3.0');
    expect(block.textContent).toContain('en construction');
    expect(block.textContent).toContain('1 à faire · 1 prêtes');
  });

  it('sans version en construction, la carte « En construction » est absente, comme dans la maquette', () => {
    const allTagged = { ...project, versionsPage: { ...page, lots: page.lots.filter((l) => l.etiquette !== null) } };
    render(<VersionsView project={allTagged} onOpenFiche={() => {}} now={now} onFocusChange={() => {}} />);
    expect(screen.queryByText(/En construction/)).toBeNull();
  });

  it('« Versionner » n’écrit rien : il montre la commande de coupe', async () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} now={now} onFocusChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Versionner' }));
    expect(screen.getByRole('status').textContent).toBe('à lancer : ezk backlog version tag <vX.Y.Z>');
  });
});

describe('VersionsView — la page d’une version', () => {
  it('s’ouvre au clic, signale la version ouverte à Board et n’a pas de fil d’Ariane propre', async () => {
    const onFocusChange = vi.fn();
    render(<VersionsView project={project} onOpenFiche={() => {}} onFocusChange={onFocusChange} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'v0.2.0' }));
    expect(onFocusChange).toHaveBeenCalledWith('v0.2.0');
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('heading', { name: 'v0.2.0' })).toBeTruthy();
  });

  it('s’ouvre directement sur la version demandée par Board', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} initialOpen="v0.1.0" now={now} onFocusChange={() => {}} />);
    expect(screen.getByRole('heading', { name: 'v0.1.0' })).toBeTruthy();
  });

  it('montre en-tête, objectifs en cartes, qui l’a livrée puis fiches livrées, dans cet ordre', () => {
    render(<VersionsView project={project} onOpenFiche={() => {}} initialOpen="v0.2.0" now={now} onFocusChange={() => {}} />);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.replace(/\s*i$/, ''));
    expect(titles.slice(0, 4)).toEqual(['En-tête', 'Objectifs de cette version', "Qui l'a livrée", 'Fiches livrées']);
    const objectifs = screen.getByRole('heading', { name: /Objectifs de cette version/ }).closest('section') as HTMLElement;
    expect(within(objectifs).getByText('board').className).toContain('tag obj');
    expect(objectifs.textContent).toContain('Mission control lisible');
    expect(objectifs.textContent).toContain('1 fiches ici · 7 / 10 livrées au total');
    expect(screen.getByText(/la méthode ne publie pas les lancements par version/)).toBeTruthy();
  });

  it('un objectif non publié dit « non publié », jamais 0', () => {
    const p = { ...project, objectifs: [] };
    render(<VersionsView project={p} onOpenFiche={() => {}} initialOpen="v0.2.0" now={now} onFocusChange={() => {}} />);
    expect(screen.getByText('fiches ici : non publié')).toBeTruthy();
  });

  it('les fiches livrées s’affichent par pages courtes avec « Afficher plus » et un compteur de ce qui est affiché', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `g${i}`);
    const many = {
      ...project,
      fiches: { ...project.fiches, ...Object.fromEntries(ids.map((id) => [id, fiche(id, `Fiche ${id}`)])) },
      versionsPage: { ...page, lots: [lot('v0.9.0', { livrees: ids }), ...page.lots] },
    };
    const onOpenFiche = vi.fn();
    render(<VersionsView project={many} onOpenFiche={onOpenFiche} initialOpen="v0.9.0" now={now} onFocusChange={() => {}} />);
    expect(screen.getByText('8 sur 12 fiches')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Fiche g8' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(screen.getByText('12 sur 12 fiches')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Fiche g11' }));
    expect(onOpenFiche).toHaveBeenCalledWith('g11');
  });

  it('« Versionner » d’une version à clore ne pose rien : il montre la commande, aussi en infobulle', async () => {
    const closing = { ...page, lots: [...page.lots, lot('v0.4.0', { etat: 'a-clore', etiquette: null, dateEtiquette: null, livrees: ['f1'] })] };
    render(<VersionsView project={{ ...project, versionsPage: closing }} onOpenFiche={() => {}} initialOpen="v0.4.0" now={now} onFocusChange={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Versionner v0.4.0' });
    expect(btn.getAttribute('title')).toBe('ezk backlog version tag v0.4.0');
    await userEvent.click(btn);
    expect(screen.getByRole('status').textContent).toBe('à lancer : ezk backlog version tag v0.4.0');
  });
});

describe('VersionsView — jamais de faux chiffre', () => {
  it('sans versions publiées en entier, la page dit pourquoi', () => {
    const { versionsPage: _v, ...without } = project;
    render(<VersionsView project={without} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('versions indisponible');
  });
});
