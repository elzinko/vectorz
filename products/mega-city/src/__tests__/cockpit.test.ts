/**
 * Le cockpit (ADR-0062, fiche 20261004192802897) : l'état de chaque projet du registre, le choix
 * porté par le cookie, et la barre qui le montre. Le serveur lui-même est essayé de bout en bout
 * dans `project-root-bins.test.ts`.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type CockpitProject,
  PROJECT_COOKIE,
  dataTarget,
  layoutVersionOf,
  projectCookieHeader,
  projectCookieName,
  projectState,
  readCookie,
  renderProjectBar,
  resolveChoice,
  nameProjectInPage,
  safeReturnPath,
  shownProjectName,
  stateLabel,
} from '../core/cockpit.js';
import { cockpitRegistryDir, loadCockpitProjects } from '../io/cockpit.js';

const ok = (id: string, root = `/${id}`): CockpitProject => ({ id, root, method: 'mega-city', state: { kind: 'ok' } });

describe('projectState — ce que le cockpit sait lire, avant de lire', () => {
  const base = { exists: true, method: 'mega-city', layoutVersion: 5 };

  it('un projet au format courant est lisible', () => {
    expect(projectState(base, 5)).toEqual({ kind: 'ok' });
  });

  it('un dossier absent est « introuvable », avant tout autre jugement', () => {
    expect(projectState({ ...base, exists: false, method: 'bmad' }, 5)).toEqual({ kind: 'introuvable' });
  });

  it('une autre méthode n’est pas jugée sur son format', () => {
    expect(projectState({ ...base, method: 'bmad', layoutVersion: null }, 5)).toEqual({
      kind: 'methode-non-prise-en-charge',
      method: 'bmad',
    });
  });

  it('sans layout_version, le format n’est pas pris en charge', () => {
    expect(projectState({ ...base, layoutVersion: null }, 5)).toEqual({ kind: 'format-non-pris-en-charge' });
  });

  it('un format ancien est « en retard », avec sa version et celle attendue', () => {
    const state = projectState({ ...base, layoutVersion: 2 }, 5);
    expect(state).toEqual({ kind: 'format-en-retard', version: 2, current: 5 });
    expect(stateLabel(state)).toBe('format en retard (version 2, attendue 5)');
  });

  it('layoutVersionOf lit la clé du README, et rien d’autre', () => {
    expect(layoutVersionOf('---\nskill: ezk-backlog\nlayout_version: 5\n---\n')).toBe(5);
    expect(layoutVersionOf('# Backlog\nPas de version ici.\n')).toBeNull();
    expect(layoutVersionOf(null)).toBeNull();
  });
});

describe('le choix porté par la requête', () => {
  const projects = [ok('muti'), { ...ok('vieux'), state: { kind: 'format-en-retard', version: 2, current: 5 } as const }];

  it('lit le cookie du projet parmi les autres', () => {
    expect(readCookie(`theme=dark; ${PROJECT_COOKIE}=muti; x=1`, PROJECT_COOKIE)).toBe('muti');
    expect(readCookie('theme=dark', PROJECT_COOKIE)).toBeUndefined();
    expect(readCookie(undefined, PROJECT_COOKIE)).toBeUndefined();
  });

  it('sans choix : le projet du lancement, comme avant', () => {
    expect(dataTarget(resolveChoice(projects, undefined), '/lancement')).toEqual({ kind: 'lire', root: '/lancement' });
    expect(dataTarget(resolveChoice(projects, ''), '/lancement')).toEqual({ kind: 'lire', root: '/lancement' });
  });

  it('un projet du registre : ses données, par sa racine résolue', () => {
    expect(dataTarget(resolveChoice(projects, 'muti'), '/lancement')).toEqual({ kind: 'lire', root: '/muti' });
  });

  it('un identifiant inconnu est refusé, sans désigner aucune racine', () => {
    const target = dataTarget(resolveChoice(projects, '../../etc'), '/lancement');
    expect(target).toMatchObject({ kind: 'refus', status: 400 });
    expect(target).not.toHaveProperty('root');
  });

  it('un projet qu’on ne sait pas lire est refusé avec la raison, sans racine', () => {
    const target = dataTarget(resolveChoice(projects, 'vieux'), '/lancement');
    expect(target).toEqual({ kind: 'refus', status: 409, reason: 'vieux : format en retard (version 2, attendue 5)' });
  });

  it('après un choix, on revient à la page d’où il est fait, jamais ailleurs', () => {
    expect(safeReturnPath('/diagrams/avancement/board.html')).toBe('/diagrams/avancement/board.html');
    // « /\t/x » : le navigateur retire la tabulation et part sur « //x », une autre origine.
    for (const bad of [null, '', 'https://ailleurs.example', '//ailleurs.example/x', '/\\ailleurs', 'board.html', '/\t/ailleurs.example', '/\n/x']) {
      expect(safeReturnPath(bad)).toBe('/');
    }
  });

  it('le cookie se pose par identifiant et se retire', () => {
    const name = projectCookieName(4173);
    expect(name).toBe(`${PROJECT_COOKIE}-4173`);
    expect(projectCookieHeader(name, 'muti')).toBe(`${PROJECT_COOKIE}-4173=muti; Path=/; SameSite=Strict; HttpOnly`);
    expect(projectCookieHeader(name, null)).toContain('Max-Age=0');
  });
});

describe('renderProjectBar — la barre de choix', () => {
  const projects = [ok('muti'), { ...ok('samplerz'), state: { kind: 'format-non-pris-en-charge' } as const }];

  it('liste chaque projet du registre, l’état à côté de ceux qu’on ne sait pas lire', () => {
    const html = renderProjectBar(projects, { kind: 'defaut' }, 'projet de lancement (vectorz)');
    expect(html).toContain('<option value="" selected>projet de lancement (vectorz)</option>');
    expect(html).toContain('<option value="muti">muti</option>');
    expect(html).toContain('samplerz — format de fiches non pris en charge');
    expect(html).not.toContain('class="ezkprj-etat"');
  });

  it('le projet choisi est sélectionné ; s’il est illisible, un bandeau le dit', () => {
    const html = renderProjectBar(projects, resolveChoice(projects, 'samplerz'), 'défaut');
    expect(html).toContain('<option value="samplerz" selected>');
    expect(html).toContain('samplerz : format de fiches non pris en charge — aucune fiche affichée.');
  });

  it('un identifiant inconnu est dit tel quel, échappé', () => {
    const html = renderProjectBar(projects, resolveChoice(projects, '<script>'), 'défaut');
    expect(html).toContain('projet inconnu du registre : &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('un choix périmé reste sélectionné et offre le retour au projet du lancement', () => {
    const html = renderProjectBar(projects, resolveChoice(projects, 'retire'), 'défaut', null, '/diagrams/avancement/board.html');
    expect(html).toContain('<option value="retire" selected>(inconnu) retire</option>');
    expect(html).not.toContain('<option value="" selected>');
    expect(html).toContain('href="/projet?id=&amp;retour=%2Fdiagrams%2Favancement%2Fboard.html"');
  });
});

describe('le nom du projet affiché — les coques ne mentent pas', () => {
  const projects = [ok('vectorz', '/repo'), ok('muti')];

  it('le titre et l’en-tête portent le nom du projet montré', () => {
    const shell = '<title>Board d\'avancement — vectorz</title><h1>Avancement — vectorz</h1><p>vectorz reste ici</p>';
    expect(nameProjectInPage(shell, 'muti')).toBe(
      '<title>Board d\'avancement — muti</title><h1>Avancement — muti</h1><p>vectorz reste ici</p>',
    );
    expect(nameProjectInPage(shell, '<b>')).toContain('— &lt;b&gt;</h1>');
  });

  it('le projet choisi, sinon le nom du lancement dans le registre, sinon le dossier', () => {
    expect(shownProjectName(resolveChoice(projects, 'muti'), projects, '/repo', 'worktree-x')).toBe('muti');
    expect(shownProjectName({ kind: 'defaut' }, projects, '/repo', 'worktree-x')).toBe('vectorz');
    expect(shownProjectName({ kind: 'defaut' }, projects, '/ailleurs', 'ailleurs')).toBe('ailleurs');
  });
});

describe('loadCockpitProjects — le registre relu, chaque projet constaté', () => {
  let dir: string;

  beforeAll(() => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-cockpit-')));
    const project = (name: string, readme: string | null) => {
      mkdirSync(join(dir, name, 'features'), { recursive: true });
      if (readme !== null) writeFileSync(join(dir, name, 'features', 'README.md'), readme);
    };
    project('courant', '---\nlayout_version: 5\n---\n');
    project('ancien', '---\nlayout_version: 4\n---\n');
    project('sans-format', null);
    project('bmad', null);
    writeFileSync(
      join(dir, 'supervision.registry.yaml'),
      [
        'projects:',
        '  - { id: courant, path: courant, method: mega-city }',
        '  - { id: ancien, path: ancien, method: mega-city }',
        '  - { id: sans-format, path: sans-format, method: mega-city }',
        '  - { id: bmad, path: bmad, method: bmad }',
        '  - { id: parti, path: nulle-part, method: mega-city }',
        '',
      ].join('\n'),
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('donne à chaque projet son état, sans rien inventer', () => {
    const { projects, problem } = loadCockpitProjects(dir, 5);
    expect(problem).toBeNull();
    expect(Object.fromEntries(projects.map((p) => [p.id, p.state.kind]))).toEqual({
      courant: 'ok',
      ancien: 'format-en-retard',
      'sans-format': 'format-non-pris-en-charge',
      bmad: 'methode-non-prise-en-charge',
      parti: 'introuvable',
    });
    expect(projects.find((p) => p.id === 'courant')?.root).toBe(join(dir, 'courant'));
  });

  it('un registre cassé ne fait pas tomber la page : liste vide, et la raison', () => {
    const broken = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-cockpit-casse-')));
    writeFileSync(join(broken, 'supervision.registry.yaml'), 'projects: 12\n');
    const { projects, problem } = loadCockpitProjects(broken, 5);
    expect(projects).toEqual([]);
    expect(problem).toContain('supervision.registry.yaml');
    rmSync(broken, { recursive: true, force: true });
  });

  it('sans registre : aucun projet, aucune erreur', () => {
    expect(loadCockpitProjects(null, 5)).toEqual({ projects: [], problem: null });
  });

  it('EZK_COCKPIT_REGISTRY désigne le registre d’un essai ; sinon, celui trouvé', () => {
    expect(cockpitRegistryDir('/trouve', { EZK_COCKPIT_REGISTRY: dir })).toBe(dir);
    expect(cockpitRegistryDir('/trouve', {})).toBe('/trouve');
    expect(cockpitRegistryDir('/trouve', { EZK_COCKPIT_REGISTRY: join(dir, 'absent') })).toBeNull();
  });
});
