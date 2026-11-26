/**
 * La carte de projet partagée par « Projets » et « Vue d'ensemble » (fiche 20261126170000102) :
 * en-tête, compteurs « depuis le début », trois tuiles, trois vignettes. Une donnée que la méthode
 * ne publie pas se dit « non publié » ou « — », jamais « 0 ».
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectCard } from './ProjectCard.js';
import type { BoardProject, Objectif, SprintSummary, VersionsPage } from './types.js';

afterEach(cleanup);

const objectif = (slug: string, over: Partial<Objectif> = {}): Objectif => ({
  slug,
  nom: null,
  status: 'in-progress',
  total: 4,
  shipped: 2,
  counts: {},
  aFaire: [],
  livrees: [],
  versions: [],
  ...over,
});

const sprint = (over: Partial<SprintSummary> = {}): SprintSummary => ({
  slug: 'le-menu-suit-la-maquette',
  fichier: 'docs/sprints/x.md',
  jour: '2026-11-04',
  fin: null,
  dureeMs: 240_000,
  tokens: null,
  livrees: [{ id: '1', title: 'a' }],
  blocages: 0,
  ...over,
});

const versionsPage = (over: Partial<VersionsPage['prochaineCoupe']> = {}): VersionsPage => ({
  lots: [],
  prochaineCoupe: { derniereEtiquette: 'v0.22.0', livrees: [], nombre: 7, gate: null, numeroPropose: null, ...over },
});

const fiche = (id: string, blocked?: string) => ({
  id,
  title: id,
  prio: 'P1',
  status: 'ready' as const,
  ver: '',
  enclair: '',
  ctx: '',
  crit: [],
  verif: '',
  blocked,
});

const project = (over: Partial<BoardProject> = {}): BoardProject => ({
  name: 'vectorz',
  desc: '',
  live: false,
  funnel: { idea: 3, ready: 14, wip: 0, unversioned: 0, parked: 0 },
  metrics: { done: 379, tokens: '', temps: '', perFiche: '', sprints: 55, runs: 0, retros: 41 },
  versions: { current: null, upcoming: [], past: [] },
  runs: {},
  fiches: { a: fiche('a', 'panel'), b: fiche('b') },
  versionsPage: versionsPage(),
  objectifs: [objectif('recettes', { nom: 'Recettes & découvrabilité', status: 'shipped', total: 4, shipped: 4 })],
  lastSprints: [sprint({ numero: 32, but: 'Chaque projet montre ses recettes' })],
  ...over,
});

const tile = (label: RegExp | string) => screen.getByText(label).closest('.mcell') as HTMLElement;
const vignette = (name: string) => screen.getByRole('group', { name });

describe('ProjectCard — en-tête et compteurs', () => {
  it('montre le nom, un « i » et la pastille de la dernière version étiquetée', () => {
    render(<ProjectCard project={project()} />);
    const head = screen.getByRole('heading', { name: /vectorz/ });
    expect(within(head).getByText('v0.22.0')).toBeTruthy();
    expect(within(head).getByRole('button', { name: /Aide/ })).toBeTruthy();
  });

  it('les compteurs « depuis le début » sont livrées, sprints, rétros', () => {
    render(<ProjectCard project={project()} />);
    const since = screen.getByLabelText('Depuis le début');
    expect(since.textContent).toMatch(/379\s*livrées/);
    expect(since.textContent).toMatch(/55\s*sprints/);
    expect(since.textContent).toMatch(/41\s*rétros/);
  });

  it('un compteur que la méthode ne publie pas affiche « — », jamais « 0 »', () => {
    render(
      <ProjectCard
        project={project({ metrics: { done: 118, tokens: '', temps: '', perFiche: '', sprints: '—', runs: '—', retros: 5 } })}
      />,
    );
    const since = screen.getByLabelText('Depuis le début');
    expect(since.textContent).toMatch(/—\s*sprints/);
    expect(since.textContent).not.toMatch(/\b0\b/);
  });

  it('un projet sans compte rendu ni capture de rétro (0 publié) affiche « — », jamais « 0 sprints »', () => {
    render(
      <ProjectCard
        project={project({ metrics: { done: 132, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 } })}
      />,
    );
    const since = screen.getByLabelText('Depuis le début');
    expect(since.textContent).toMatch(/—\s*sprints/);
    expect(since.textContent).toMatch(/—\s*rétros/);
    expect(since.textContent).not.toMatch(/\b0\s*(sprints|rétros)/);
  });

  it('le nom ouvre le projet quand la page le demande', async () => {
    const onOpen = vi.fn();
    render(<ProjectCard project={project()} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'vectorz' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('sans demande d’ouverture, le nom n’est pas un bouton', () => {
    render(<ProjectCard project={project()} />);
    expect(screen.queryByRole('button', { name: 'vectorz' })).toBeNull();
  });
});

describe('ProjectCard — les trois tuiles', () => {
  it('compte les fiches prêtes, bloquées et livrées depuis la dernière version, et nomme celle-ci', () => {
    render(<ProjectCard project={project()} />);
    expect(tile('fiches prêtes').textContent).toContain('14');
    expect(tile('bloquées').textContent).toContain('1');
    expect(tile('livrées depuis v0.22.0').textContent).toContain('7');
  });

  it('un compte non publié affiche « — » : prochaine coupe sans nombre, fiches absentes', () => {
    render(<ProjectCard project={project({ versionsPage: versionsPage({ nombre: null }), fiches: undefined })} />);
    expect(tile('livrées depuis v0.22.0').textContent).toContain('—');
    expect(tile('bloquées').textContent).toContain('—');
  });

  it('sans version étiquetée, la tuile le dit', () => {
    render(<ProjectCard project={project({ versionsPage: undefined })} />);
    expect(tile('livrées depuis la dernière version').textContent).toContain('—');
  });

  it('plan pas reçu : aucun compte, jamais un faux 0', () => {
    render(<ProjectCard project={project({ plan: { state: 'loading' } })} />);
    expect(tile('fiches prêtes').textContent).toContain('—');
    expect(screen.getByLabelText('Depuis le début').textContent).toMatch(/—\s*livrées/);
  });
});

describe('ProjectCard — les trois vignettes', () => {
  it('Dernier objectif : nom, nombre de fiches, état « atteint »', () => {
    render(<ProjectCard project={project()} />);
    const v = within(vignette('Dernier objectif'));
    expect(v.getByText('recettes — Recettes & découvrabilité')).toBeTruthy();
    expect(v.getByText(/4 fiches/)).toBeTruthy();
    expect(v.getByText('atteint')).toBeTruthy();
  });

  it('Dernier objectif : objectifs non publiés → « non publié »', () => {
    render(<ProjectCard project={project({ objectifs: undefined })} />);
    expect(within(vignette('Dernier objectif')).getByText('non publié')).toBeTruthy();
  });

  it('Dernier sprint : « Sprint N — but », durée, fiches, badge « ok »', () => {
    render(<ProjectCard project={project()} />);
    const v = within(vignette('Dernier sprint'));
    expect(v.getByText('Sprint 32 — Chaque projet montre ses recettes')).toBeTruthy();
    expect(v.getByText(/4 min · 1 fiche/)).toBeTruthy();
    expect(v.getByText('ok')).toBeTruthy();
  });

  it('Dernier sprint : sans numéro ni but publié, le but vient du nom du compte rendu', () => {
    render(<ProjectCard project={project({ lastSprints: [sprint()] })} />);
    expect(within(vignette('Dernier sprint')).getByText('le menu suit la maquette')).toBeTruthy();
  });

  it('Dernier sprint : des blocages donnent un badge d’attention, des blocages non dits aucun badge', () => {
    render(<ProjectCard project={project({ lastSprints: [sprint({ blocages: 2 })] })} />);
    expect(within(vignette('Dernier sprint')).getByText('2 blocages')).toBeTruthy();
    cleanup();
    render(<ProjectCard project={project({ lastSprints: [sprint({ blocages: null })] })} />);
    expect(within(vignette('Dernier sprint')).queryByText('ok')).toBeNull();
  });

  it('Dernier sprint : aucun compte rendu → « non publié » et la raison, pas de zéro inventé', () => {
    render(<ProjectCard project={project({ lastSprints: undefined })} />);
    const v = within(vignette('Dernier sprint'));
    expect(v.getByText('Aucun compte rendu publié')).toBeTruthy();
    expect(v.getByText('non publié')).toBeTruthy();
    expect(vignette('Dernier sprint').textContent).not.toMatch(/\b0\b/);
  });

  it('Dernière rétro : le nombre de rétros, dates non publiées', () => {
    render(<ProjectCard project={project()} />);
    const v = within(vignette('Dernière rétro'));
    expect(v.getByText('41 rétros')).toBeTruthy();
    expect(v.getByText('non publié')).toBeTruthy();
  });

  it('Dernière rétro : compteur non publié → « non publié », pas de « 0 rétros »', () => {
    render(
      <ProjectCard
        project={project({ metrics: { done: 1, tokens: '', temps: '', perFiche: '', sprints: 1, runs: 1, retros: '—' } })}
      />,
    );
    const v = vignette('Dernière rétro');
    expect(v.textContent).toContain('non publié');
    expect(v.textContent).not.toMatch(/\b0\b/);
  });
});

describe('ProjectCard — pas de session, pas de commande', () => {
  it('ne montre aucune session ni commande ezk', () => {
    const { container } = render(<ProjectCard project={project()} />);
    expect(container.textContent).not.toMatch(/session/i);
    expect(container.textContent).not.toMatch(/ezk /);
  });
});
