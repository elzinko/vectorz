import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigView } from './ConfigView.js';
import { defaultToolConfig, effortLabel, projectFolder, tierLabel } from './configModel.js';
import type { BoardProject } from './types.js';

afterEach(cleanup);

type Config = NonNullable<BoardProject['config']>;

/** Un projet surveillé : sa config vient de la méthode (`ezk config show --json`, ADR-086). */
function liveProject(over: Partial<BoardProject> = {}): BoardProject {
  return {
    name: 'vectorz',
    desc: '',
    live: true,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
    versions: { current: null, upcoming: [], past: [] },
    runs: {},
    config: {
      releaseGate: true,
      github: 'coupé (100 % local)',
      integration: 'local-squash',
      root: '/Users/moi/vectorz',
      file: '.vectorz/config.yml',
      groomingTechniques: { mode: 'menu' },
      adverseReview: 'run',
      agents: [
        { agent: 'ezk-architect', tier: 'high', model: 'claude-opus-4-8', effort: 'high', source: 'defaut' },
        { agent: 'ezk-reviewer', tier: 'high', model: 'claude-opus-4-8', effort: 'high', source: 'defaut' },
        { agent: 'ezk-dev', tier: 'middle', model: 'sonnet', effort: 'medium', source: 'defaut' },
        { agent: 'ezk-steward', tier: 'low', model: 'haiku', effort: 'low', source: 'agent' },
      ],
    },
    configState: { state: 'ok' },
    ...over,
  };
}

function withConfig(patch: Partial<Config>): BoardProject {
  const base = liveProject();
  return { ...base, config: { ...base.config!, ...patch } };
}

function renderProject(project: BoardProject) {
  return render(
    <ConfigView project={project} tool={defaultToolConfig()} roles={{}} onSetRole={() => {}} onGotoTool={() => {}} />,
  );
}

function card(title: RegExp): HTMLElement {
  const h = screen.getAllByRole('heading', { level: 3 }).find((el) => title.test(el.textContent ?? ''));
  if (!h) throw new Error(`pas de bloc ${title}`);
  return h.closest('section') as HTMLElement;
}

/** Ce que dit la ligne de réglage `lab`. */
function val(lab: string): string {
  const row = screen.getByText(lab, { selector: '.lab' }).closest('.srow') as HTMLElement;
  return row.querySelector('.val')!.textContent ?? '';
}

function tableRows(block: HTMLElement): (string | null)[][] {
  return Array.from(block.querySelectorAll('tbody tr')).map((tr) =>
    Array.from(tr.querySelectorAll('th, td')).map((c) => c.textContent),
  );
}

describe('configModel — mots', () => {
  it('niveaux et efforts en français, une valeur inconnue telle quelle', () => {
    expect((['high', 'middle', 'low'] as const).map(tierLabel)).toEqual(['performant', 'standard', 'économe']);
    expect(['high', 'medium', 'low'].map(effortLabel)).toEqual(['élevé', 'moyen', 'faible']);
    expect(effortLabel('xhigh')).toBe('xhigh');
  });

  it('le dossier lu est celui du projet : un worktree est ramené à l’arbre principal', () => {
    expect(projectFolder('/Users/moi/vectorz')).toBe('/Users/moi/vectorz');
    expect(projectFolder('/Users/moi/vectorz/.claude/worktrees/agent-1')).toBe('/Users/moi/vectorz');
  });
});

describe('ConfigView — quatre blocs (fiche 20261126170000110)', () => {
  it('Projet, Process, Niveaux, Plugins apparaissent dans cet ordre', () => {
    renderProject(liveProject());
    const first = screen.getAllByRole('heading', { level: 3 }).map((h) => (h.textContent ?? '').split(' ')[0]);
    expect(first.slice(0, 4)).toEqual(['Projet', 'Process', 'Niveaux', 'Plugins']);
  });

  it('Projet : le fichier de réglages et le dossier du projet', () => {
    renderProject(liveProject());
    const projet = card(/^Projet/);
    expect(within(projet).getByText('.vectorz/config.yml')).toBeTruthy();
    expect(within(projet).getByText('/Users/moi/vectorz')).toBeTruthy();
  });

  it('Projet : un worktree n’est jamais montré comme dossier lu', () => {
    renderProject(withConfig({ root: '/Users/moi/vectorz/.claude/worktrees/agent-9' }));
    expect(screen.queryByText(/worktrees/)).toBeNull();
    expect(within(card(/^Projet/)).getByText('/Users/moi/vectorz')).toBeTruthy();
  });

  it('Projet : sans config.yml, la page dit que les défauts de la méthode s’appliquent', () => {
    renderProject(withConfig({ file: null }));
    expect(within(card(/^Projet/)).getByText('aucun fichier · défauts de la méthode')).toBeTruthy();
  });

  it('Process : les trois étapes et leurs réglages, dans l’ordre', () => {
    renderProject(liveProject());
    const labels = Array.from(card(/^Process/).querySelectorAll('.psub, .lab')).map((e) => e.textContent);
    expect(labels).toEqual([
      'Préparer les fiches', 'Grooming', 'DoR',
      'Construire un sprint', 'DoD', 'Revue adverse',
      'Livrer une version', 'Gate de release', 'Cohérence du lot', 'Chasse aux bugs', 'Tests', 'Autres contrôles',
    ]);
  });

  it('Process : les valeurs publiées sont dites, les autres « non publié »', () => {
    renderProject(liveProject());
    expect(val('Grooming')).toBe('menu à chaque grooming');
    expect(val('Revue adverse')).toBe('oui');
    expect(val('Gate de release')).toBe('oui');
    expect(val('DoD')).toBe('oui · règles : non publié');
    for (const lab of ['Cohérence du lot', 'Chasse aux bugs', 'Tests', 'Autres contrôles']) {
      expect(val(lab)).toBe('non publié');
    }
  });

  it('Process : revue adverse coupée et gate coupée se lisent « non »', () => {
    renderProject(withConfig({ adverseReview: 'skip', releaseGate: false }));
    expect(val('Revue adverse')).toBe('non');
    expect(val('Gate de release')).toBe('non');
  });

  it('Process : une revue adverse non publiée ne devient pas « oui »', () => {
    renderProject(withConfig({ adverseReview: undefined }));
    expect(val('Revue adverse')).toBe('non publié');
  });

  it('Process : le grooming dit sa sélection, tout, rien ou l’erreur de la méthode', () => {
    const grooming = (g: Config['groomingTechniques']) => {
      cleanup();
      renderProject(withConfig({ groomingTechniques: g }));
      return val('Grooming');
    };
    expect(grooming({ mode: 'all', ids: [] })).toBe('toutes les techniques');
    expect(grooming({ mode: 'none', ids: [] })).toBe('aucune technique');
    expect(grooming({ mode: 'selection', ids: ['pre-mortem', 'inversion'] })).toBe('pre-mortem · inversion');
    expect(grooming({ mode: 'error', error: 'clé « grooming » illisible' })).toBe('config invalide : clé « grooming » illisible');
    expect(grooming(undefined)).toBe('non publié');
  });

  it('Niveaux : performant, standard, économe, avec le modèle et l’effort en français', () => {
    renderProject(liveProject());
    expect(tableRows(card(/^Niveaux/))).toEqual([
      ['performant', 'claude-opus-4-8', 'élevé', 'i'],
      ['standard', 'sonnet', 'moyen', 'i'],
      ['économe', 'haiku', 'faible', 'i'],
    ]);
  });

  it('Niveaux : un niveau sans agent se dit « non publié », jamais un modèle inventé', () => {
    renderProject(
      withConfig({ agents: [{ agent: 'ezk-dev', tier: 'middle', model: 'sonnet', effort: 'medium', source: 'defaut' }] }),
    );
    const rows = tableRows(card(/^Niveaux/));
    expect(rows[0]).toEqual(['performant', 'non publié', 'non publié', 'i']);
    expect(rows[2]).toEqual(['économe', 'non publié', 'non publié', 'i']);
  });

  it('Niveaux : les agents d’un niveau sont dans l’infobulle, un agent mal configuré donne sa raison', () => {
    renderProject(
      withConfig({
        agents: [
          { agent: 'ezk-dev', tier: 'middle', model: 'sonnet', effort: 'medium', source: 'defaut' },
          { agent: 'ezk-qa', error: 'Tier inconnu pour ezk-qa : « enorme »' },
        ],
      }),
    );
    const n = card(/^Niveaux/);
    expect(within(n).getByTitle(/ezk-dev/)).toBeTruthy();
    expect(within(n).getByText(/ezk-qa · config invalide : Tier inconnu pour ezk-qa/)).toBeTruthy();
  });

  it('Plugins : GitHub dit activé ou coupé', () => {
    renderProject(liveProject());
    expect(within(card(/^Plugins/)).getByText('coupé')).toBeTruthy();
    cleanup();
    renderProject(withConfig({ github: 'branché (PR, CI, revue Codex)' }));
    expect(within(card(/^Plugins/)).getByText('activé')).toBeTruthy();
  });

  it('Plugins : un état intermédiaire est dit en mots, pas réduit à « activé »', () => {
    renderProject(withConfig({ github: 'PR on · CI off · revue Codex off' }));
    const p = card(/^Plugins/);
    expect(within(p).getByText('partiel')).toBeTruthy();
    expect(within(p).getByText('PR on · CI off · revue Codex off')).toBeTruthy();
  });
});

describe('ConfigView — ce qui ne doit plus apparaître', () => {
  it('ni « bundle », ni commande ezk en texte, ni geste sans cible', () => {
    const { container } = renderProject(liveProject());
    expect(container.textContent).not.toMatch(/bundle/i);
    expect(container.textContent).not.toMatch(/ezk config/);
    expect(screen.queryByRole('button', { name: /Ajouter|Installer|Enregistrer/ })).toBeNull();
  });

  it('un seul « i » par ligne de réglage, à droite', () => {
    renderProject(liveProject());
    const rows = Array.from(card(/^Process/).querySelectorAll('.srow'));
    expect(rows.length).toBe(9);
    for (const r of rows) {
      expect(r.querySelectorAll('.ibtn').length).toBe(1);
      expect(r.lastElementChild!.querySelector('.ibtn')).toBeTruthy();
    }
  });
});

describe('ConfigView — la config pas encore là', () => {
  it('config en chargement : la page le dit, sans prétendre que le fichier manque', () => {
    renderProject(liveProject({ config: undefined, configState: { state: 'loading' } }));
    expect(screen.getByText('config en cours de chargement')).toBeTruthy();
  });

  it('config indisponible : la page donne la raison d’ezk', () => {
    renderProject(liveProject({ config: undefined, configState: { state: 'unavailable', reason: 'YAML malformé' } }));
    expect(screen.getByText('config indisponible : YAML malformé')).toBeTruthy();
  });

  it('ni config ni état (serveur plus ancien que la page) : la page dit de le relancer', () => {
    renderProject(liveProject({ config: undefined, configState: undefined }));
    expect(screen.getByText(/il tourne sur un code plus ancien que la page\. Relance-le/)).toBeTruthy();
  });
});

describe('ConfigView — projet d’exemple (assistant d’ajout, sans méthode)', () => {
  const sample: BoardProject = {
    ...liveProject(),
    live: false,
    configState: undefined,
    config: { releaseGate: true, github: 'à définir', root: '~/demo', roles: { 'ezk-architect': 'high' } },
  };

  it('les niveaux viennent du mapping de l’outil, en français', () => {
    renderProject(sample);
    expect(tableRows(card(/^Niveaux/))[0]).toEqual(['performant', 'Opus 4.8', 'élevé', 'i']);
  });

  it('les réglages que la méthode ne publie pas sont « non publié »', () => {
    renderProject(sample);
    expect(val('Revue adverse')).toBe('non publié');
    expect(val('Grooming')).toBe('non publié');
  });
});
