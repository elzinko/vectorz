/**
 * Les pages Objectifs et Un objectif (fiches 20261124111115865 et 20261126170000107) : le tableau
 * dans l'ordre publié, la recherche et les filtres (« en cours » par défaut), la barre de
 * progression, le menu « ⋯ » et la page d'un objectif. Rien n'est recalculé, aucun geste n'écrit.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ObjectifsView, activesInWords } from './ObjectifsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, FicheDetail, Objectif } from './types.js';

afterEach(cleanup);

const fiche = (id: string, title: string, extra: Partial<FicheDetail> = {}): FicheDetail =>
  ({ id, title, prio: 'P1', status: 'idea', ver: '', enclair: '', ctx: '', crit: [], verif: '', blocked: '', ...extra }) as FicheDetail;

const objectifs: Objectif[] = [
  {
    slug: 'parked',
    nom: null,
    status: 'idea',
    total: 84,
    shipped: 0,
    counts: { idea: 84 },
    aFaire: ['p1'],
    livrees: [],
    versions: [],
  },
  {
    slug: 'board',
    nom: 'Mission control lisible',
    status: 'in-progress',
    total: 4,
    shipped: 2,
    counts: { idea: 1, ready: 1, shipped: 2 },
    aFaire: ['a1', 'a2'],
    livrees: ['l1', 'l2'],
    versions: ['v0.17.0', 'v0.23.0'],
  },
  {
    slug: 'qualite',
    nom: null,
    status: 'shipped',
    total: 1,
    shipped: 1,
    counts: { shipped: 1 },
    aFaire: [],
    livrees: ['l3'],
    versions: [],
  },
];

const project: BoardProject = {
  ...(BOARD_DATA.vectorz as BoardProject),
  plan: { state: 'ok' },
  objectifs,
  fiches: {
    a1: fiche('a1', 'Une idée bloquée', { blocked: 'panel' }),
    a2: fiche('a2', 'Une fiche prête', { status: 'ready' }),
    l1: fiche('l1', 'Une livrée étiquetée', { status: 'done', ver: 'v0.17.0' }),
    l2: fiche('l2', 'Une livrée sans version', { status: 'done' }),
    l3: fiche('l3', 'Une autre livrée', { status: 'done' }),
  },
};

const rowSlugs = (): string[] =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[1]?.querySelector('button')?.textContent ?? '');

const clearState = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Retirer le filtre État' }));
};

describe('ObjectifsView — le tableau', () => {
  it('ne garde par défaut que les objectifs « en cours », avec une puce qui se retire', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(rowSlugs()).toEqual(['board']);
    expect(screen.getByRole('button', { name: 'Retirer le filtre État' }).textContent).toContain('en cours');
    await clearState();
    expect(rowSlugs()).toEqual(['board', 'qualite']);
    expect(screen.queryByRole('button', { name: 'Retirer le filtre État' })).toBeNull();
  });

  it('« Tout effacer » retire toutes les puces', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    expect(rowSlugs()).toEqual(['board', 'qualite']);
    expect(screen.queryByRole('button', { name: 'Tout effacer' })).toBeNull();
  });

  it('liste les objectifs dans l’ordre publié, sans « parked », avec plan, nom, actives et versions', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    await clearState();
    expect(rowSlugs()).toEqual(['board', 'qualite']);
    const board = screen.getAllByRole('row')[1] as HTMLElement;
    expect(within(board).getAllByRole('cell')[0]?.textContent).toBe('1');
    expect(board.textContent).toContain('Mission control lisible');
    expect(board.textContent).toContain('2 / 4');
    expect(board.textContent).toContain('1 idée · 1 prête · 1 bloquée (1 panel)');
    expect(board.textContent).toContain('v0.17.0');
    const qualite = screen.getAllByRole('row')[2] as HTMLElement;
    expect(qualite.textContent).toContain('nom non publié');
    expect(qualite.textContent).toContain('aucune version posée');
  });

  it('montre le compteur de l’en-tête, le slug en pastille et le nom en infobulle', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(screen.getByText('2 · dans l’ordre du plan')).toBeTruthy();
    const slug = screen.getByRole('button', { name: 'board' });
    expect(slug.className).toContain('tag');
    expect(slug.className).toContain('obj');
    expect(slug.getAttribute('title')).toBe('Mission control lisible');
  });

  it('range « parked » à part, avec une phrase qui dit pourquoi', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(screen.getByText(/84 fiches mises de côté\. Ce n'est pas un objectif/)).toBeTruthy();
  });

  it('la recherche réduit la liste par le slug ou le nom', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    await clearState();
    const box = screen.getByRole('searchbox', { name: 'Rechercher un objectif' });
    await userEvent.type(box, 'lisible');
    expect(rowSlugs()).toEqual(['board']);
    await userEvent.clear(box);
    await userEvent.type(box, 'qual');
    expect(rowSlugs()).toEqual(['qualite']);
  });

  it('les filtres État, Version et Bloquées réduisent la liste, et le compteur compte ce qui est affiché', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 objectifs');
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par état'), '');
    expect(screen.getByRole('status').textContent).toBe('2 sur 2 objectifs');
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par version'), '-');
    expect(rowSlugs()).toEqual(['qualite']);
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par version'), '');
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par blocage'), 'avec');
    expect(rowSlugs()).toEqual(['board']);
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par blocage'), 'sans');
    expect(rowSlugs()).toEqual(['qualite']);
  });

  it('dit qu’aucun objectif ne correspond quand les filtres ne laissent rien', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par blocage'), 'sans');
    expect(screen.getByText('Aucun objectif ne correspond aux filtres.')).toBeTruthy();
  });
});

describe('ObjectifsView — la progression', () => {
  const gros: Objectif = {
    slug: 'gros',
    nom: null,
    status: 'in-progress',
    total: 49,
    shipped: 45,
    counts: { idea: 4, shipped: 45 },
    aFaire: [],
    livrees: [],
    versions: [],
  };

  it('dessine la proportion exacte livrées / total (45 / 49)', () => {
    render(<ObjectifsView project={{ ...project, objectifs: [gros] }} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    const bar = screen.getByRole('progressbar', { name: 'gros : 45 livrées sur 49' });
    expect(bar.getAttribute('aria-valuenow')).toBe('45');
    expect(bar.getAttribute('aria-valuemax')).toBe('49');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe(`${(45 / 49) * 100}%`);
  });

  it('n’invente pas de barre sans total : « — » à la place d’un faux zéro', () => {
    render(<ObjectifsView project={{ ...project, objectifs: [{ ...gros, total: 0, shipped: 0 }] }} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getAllByRole('row')[1]?.textContent).toContain('—');
    expect(screen.getAllByRole('row')[1]?.textContent).not.toContain('0 / 0');
  });
});

describe('ObjectifsView — le menu « ⋯ »', () => {
  it('n’offre que des gestes qui existent : la commande pour groomer, puis ouvrir', async () => {
    const onFocusChange = vi.fn();
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={onFocusChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions de l’objectif board' }));
    expect(screen.queryByRole('menuitem', { name: 'Voir ses fiches' })).toBeNull();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Groomer ses fiches' }));
    expect(screen.getByText('/ezk-backlog groom a1')).toBeTruthy();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ouvrir l’objectif' }));
    expect(onFocusChange).toHaveBeenCalledWith('board');
  });

  it('sans fiche à faire, « Groomer ses fiches » n’est pas proposé', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    await clearState();
    await userEvent.click(screen.getByRole('button', { name: 'Actions de l’objectif qualite' }));
    expect(screen.queryByRole('menuitem', { name: 'Groomer ses fiches' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Ouvrir l’objectif' })).toBeTruthy();
  });
});

describe('ObjectifsView — la page d’un objectif', () => {
  it('s’ouvre au clic et le dit à la page parente, qui porte le fil d’Ariane', async () => {
    const onFocusChange = vi.fn();
    render(<ObjectifsView project={project} onOpenFiche={() => {}} onFocusChange={onFocusChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'board' }));
    expect(onFocusChange).toHaveBeenCalledWith('board');
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('board');
  });

  it('s’ouvre d’entrée quand la page parente le demande', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} initialOpen="board" onFocusChange={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Mission control lisible');
  });

  it('range l’en-tête, les fiches à faire puis les fiches livrées, dans cet ordre', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} initialOpen="board" onFocusChange={() => {}} />);
    const heads = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent ?? '');
    expect(heads[0]).toContain('En-tête');
    expect(heads[1]).toContain('Fiches à faire');
    expect(heads[2]).toContain('Fiches livrées');
  });

  it('l’en-tête dit l’avancement, les versions avec leurs nombres, les livrées sans numéro et la place dans le plan', () => {
    const lots = [
      { version: 'v0.17.0', nom: null, milestones: [], etat: '', cycleDeVie: '', etiquette: null, dateEtiquette: null, livrees: ['l1'], aFaire: [], pretes: [], bloquees: [] },
    ] as unknown as NonNullable<BoardProject['versionsPage']>['lots'];
    const withLots = { ...project, versionsPage: { ...(project.versionsPage ?? {}), lots } } as BoardProject;
    render(<ObjectifsView project={withLots} onOpenFiche={() => {}} initialOpen="board" onFocusChange={() => {}} />);
    const card = screen.getByRole('heading', { name: /En-tête/ }).closest('section') as HTMLElement;
    expect(card.textContent).toContain('2 livrées / 4');
    expect(card.textContent).toContain('1 idée · 1 prête');
    expect(card.textContent).toContain('v0.17.0 · 1');
    expect(card.textContent).toContain('1 livrées sans numéro de version');
    expect(card.textContent).toContain('place 1 sur 2 dans l’ordre du plan');
    expect(within(card).getByRole('progressbar')).toBeTruthy();
  });

  it('montre les fiches à faire avec priorité, étape et motif de blocage, et ouvre une fiche au clic', async () => {
    const onOpenFiche = vi.fn();
    render(<ObjectifsView project={project} onOpenFiche={onOpenFiche} initialOpen="board" onFocusChange={() => {}} />);
    expect(screen.getByText('bloquée : panel')).toBeTruthy();
    expect(screen.getByText(/à étiqueter/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Une fiche prête' }));
    expect(onOpenFiche).toHaveBeenCalledWith('a2');
  });

  it('ne dessine pas de bouton « Groomer l’objectif » : la méthode n’a pas ce geste', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} initialOpen="board" onFocusChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /Groomer l.objectif/ })).toBeNull();
  });

  it('« Groomer ses fiches » n’écrit rien : il montre la commande de la première fiche à faire', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} initialOpen="board" onFocusChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Groomer ses fiches' }));
    expect(screen.getByRole('status').textContent).toBe('à lancer : /ezk-backlog groom a1');
  });

  it('dit « nom non publié » et l’annonce dans le « i » du résumé', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} initialOpen="qualite" onFocusChange={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('nom non publié');
    expect(screen.getByRole('button', { name: 'Aide : Non publié par la méthode : le nom de l’objectif.' })).toBeTruthy();
  });

  it('limite les fiches livrées à une page ; « Afficher plus » en montre davantage et le compteur compte l’affiché', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `x${i}`);
    const fiches = Object.fromEntries(ids.map((id) => [id, fiche(id, `Livrée ${id}`, { status: 'done' })]));
    const many: Objectif = { ...(objectifs[1] as Objectif), livrees: ids, shipped: 12, total: 12, aFaire: [] };
    render(<ObjectifsView project={{ ...project, objectifs: [many], fiches }} onOpenFiche={() => {}} initialOpen="board" onFocusChange={() => {}} />);
    expect(screen.getByText('10 sur 12')).toBeTruthy();
    expect(screen.queryByText('Livrée x11')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(screen.getByText('12 sur 12')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
  });
});

describe('ObjectifsView — les actives en mots', () => {
  it('compte les fiches en cours telles que la méthode les publie (`in-progress`)', () => {
    const o: Objectif = { ...(objectifs[1] as Objectif), counts: { 'in-progress': 2, shipped: 2 }, aFaire: [] };
    expect(activesInWords(o, project)).toBe('2 en cours');
  });
});

describe('ObjectifsView — jamais de faux chiffre', () => {
  it('sans objectifs publiés, la page dit pourquoi', () => {
    const { objectifs: _o, ...without } = project;
    render(<ObjectifsView project={without} onOpenFiche={() => {}} onFocusChange={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('objectifs indisponible');
  });
});
