import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderBoardOn } from './testing/renderBoard.js';
import { ConfigView } from './ConfigView.js';
import { ToolConfigView } from './ToolConfigView.js';
import {
  defaultToolConfig,
  resolveRole,
  resolveTier,
  type Role,
  type Tier,
  type ToolConfig,
} from './configModel.js';
import type { BoardProject } from './types.js';

afterEach(cleanup);

describe('configModel — résolveur pur (fiche 242)', () => {
  const tool = defaultToolConfig();

  it('résout tier → modèle + effort selon l’IDE actif', () => {
    expect(resolveTier(tool, 'high')).toEqual({ tier: 'high', model: 'Opus 4.8', effort: 'high' });
    expect(resolveTier({ ...tool, ide: 'Cursor' }, 'high').model).toBe('GPT-5');
  });

  it('refuse un tier inconnu en le nommant', () => {
    expect(() => resolveTier(tool, 'ultra')).toThrow(/ultra/);
  });

  it('refuse un IDE inconnu', () => {
    expect(() => resolveTier({ ...tool, ide: 'Zed' }, 'high')).toThrow(/Zed/);
  });

  it('résout un rôle : tier du projet, sinon défaut de l’outil', () => {
    expect(resolveRole({ 'ezk-architect': 'high' }, 'ezk-architect', tool).model).toBe('Opus 4.8');
    // ezk-dev absent → défaut de l'outil (middle) = Sonnet 5.5
    expect(resolveRole({}, 'ezk-dev', tool).model).toBe('Sonnet 5.5');
  });
});

const PROJECT: BoardProject = {
  name: 'demo',
  desc: '',
  live: false,
  funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
  metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
  versions: { current: null, upcoming: [], past: [] },
  runs: {},
  config: {
    groomPolicy: 'auto',
    sprintSize: 'auto',
    retro: 'à la fin',
    releaseGate: true,
    github: 'false',
    root: '~/demo',
    roles: { 'ezk-architect': 'high', 'ezk-qa': 'low' },
  },
};

function renderConfig(over?: { roles?: Partial<Record<Role, Tier>>; onSetRole?: (r: Role, t: Tier) => void; onGotoTool?: () => void }) {
  const roles = over?.roles ?? PROJECT.config!.roles ?? {};
  return render(
    <ConfigView
      project={PROJECT}
      tool={defaultToolConfig()}
      roles={roles}
      onSetRole={over?.onSetRole ?? (() => {})}
      onGotoTool={over?.onGotoTool ?? (() => {})}
    />,
  );
}

describe('ConfigView (fiche 250)', () => {
  it('affiche les cartes et le modèle résolu par rôle', () => {
    renderConfig();
    expect(screen.getByText('Lancement par défaut')).toBeTruthy();
    expect(screen.getByText('Qualité')).toBeTruthy();
    expect(screen.getByText('Modules')).toBeTruthy();
    // ezk-architect = high → Opus 4.8 ; ezk-qa = low → Haiku 5.5
    expect(screen.getByText('Haiku 5.5')).toBeTruthy();
  });

  it('changer le tier d’un rôle remonte le choix (composant contrôlé)', async () => {
    const onSetRole = vi.fn();
    renderConfig({ onSetRole });
    const qaRow = screen.getByText('ezk-qa').closest('.cfgrow') as HTMLElement;
    const highBtn = Array.from(qaRow.querySelectorAll('button')).find((b) => b.textContent === 'high')!;
    await userEvent.click(highBtn);
    expect(onSetRole).toHaveBeenCalledWith('ezk-qa', 'high');
  });

  it('« régler l’outil » appelle le callback', async () => {
    const onGotoTool = vi.fn();
    renderConfig({ onGotoTool });
    await userEvent.click(screen.getAllByRole('button', { name: /régler l'outil/ })[0]);
    expect(onGotoTool).toHaveBeenCalled();
  });
});

/** Un projet surveillé : sa config vient de la méthode (`ezk config show --json`, ADR-086). */
function liveProject(over: Partial<BoardProject> = {}): BoardProject {
  return {
    ...PROJECT,
    config: {
      releaseGate: true,
      github: 'coupé (100 % local)',
      integration: 'local-squash',
      root: '/Users/moi/vectorz',
      file: '.vectorz/config.yml',
      agents: [
        { agent: 'ezk-architect', tier: 'high', model: 'claude-opus-4-8', effort: 'high', source: 'defaut' },
        { agent: 'ezk-dev', tier: 'high', model: 'claude-opus-4-8', effort: 'high', source: 'tier-projet' },
        { agent: 'ezk-qa', tier: 'middle', model: 'haiku', effort: 'medium', source: 'agent' },
        { agent: 'ezk-steward', tier: 'low', model: 'sonnet', effort: 'low', source: 'defaut' },
      ],
    },
    configState: { state: 'ok' },
    ...over,
  };
}

function renderProject(project: BoardProject) {
  return render(
    <ConfigView
      project={project}
      tool={defaultToolConfig()}
      roles={project.config?.roles ?? {}}
      onSetRole={() => {}}
      onGotoTool={() => {}}
    />,
  );
}

describe('ConfigView — la config lue par la méthode (ADR-086)', () => {
  it('un projet avec config.yml : le fichier est nommé, ses vrais réglages s’affichent', () => {
    renderProject(liveProject());
    expect(screen.getByText('.vectorz/config.yml · voyage avec le repo')).toBeTruthy();
    expect(screen.getByText('coupé (100 % local)')).toBeTruthy();
    expect(screen.getByText('local-squash')).toBeTruthy();
    expect(screen.getByText('/Users/moi/vectorz')).toBeTruthy();
    expect(screen.queryByText(/pas encore de/)).toBeNull();
  });

  it('les réglages de lancement, absents de la méthode, ne s’affichent pas inventés', () => {
    renderProject(liveProject());
    expect(screen.queryByText('Lancement par défaut')).toBeNull();
  });

  it('un projet sans config.yml : la page dit que les défauts de la méthode s’appliquent', () => {
    const base = liveProject();
    renderProject({ ...base, config: { ...base.config!, file: null } });
    expect(screen.getByText('pas de .vectorz/config.yml · réglages par défaut de la méthode')).toBeTruthy();
  });

  it('le modèle affiché est celui que la méthode lance, agent par agent, avec sa source', () => {
    renderProject(liveProject());
    const qaRow = screen.getByText('ezk-qa').closest('.cfgrow') as HTMLElement;
    expect(within(qaRow).getByText('haiku')).toBeTruthy();
    expect(within(qaRow).getByText('réglé pour cet agent')).toBeTruthy();
    const devRow = screen.getByText('ezk-dev').closest('.cfgrow') as HTMLElement;
    expect(within(devRow).getByText('claude-opus-4-8')).toBeTruthy();
    expect(within(devRow).getByText('tier du projet')).toBeTruthy();
    // Les agents hors des 4 rôles de la page sortent aussi : la méthode en lance 8.
    expect(screen.getByText('ezk-steward')).toBeTruthy();
  });

  it('rien à régler ici : pas de bouton de tier, la commande qui change un tier est donnée', () => {
    renderProject(liveProject());
    expect(screen.queryByRole('button', { name: 'high' })).toBeNull();
    expect(screen.queryByRole('button', { name: /régler l'outil/ })).toBeNull();
    expect(screen.getByText('ezk config roles set <agent> <tier>')).toBeTruthy();
  });

  it('un agent mal configuré montre la raison de la méthode, jamais un modèle inventé', () => {
    const base = liveProject();
    renderProject({
      ...base,
      config: {
        ...base.config!,
        agents: [{ agent: 'ezk-dev', error: 'Tier inconnu pour ezk-dev : « enorme »' }],
      },
    });
    const devRow = screen.getByText('ezk-dev').closest('.cfgrow') as HTMLElement;
    expect(within(devRow).getByText(/config invalide : Tier inconnu pour ezk-dev/)).toBeTruthy();
  });

  it('une source que la page ne connaît pas s’affiche telle quelle', () => {
    const base = liveProject();
    renderProject({
      ...base,
      config: {
        ...base.config!,
        agents: [{ agent: 'ezk-dev', tier: 'low', model: 'sonnet', effort: 'low', source: 'poste' }],
      },
    });
    expect(screen.getByText('poste')).toBeTruthy();
  });

  it('config en chargement : la page le dit, sans prétendre que le fichier manque', () => {
    renderProject(liveProject({ config: undefined, configState: { state: 'loading' } }));
    expect(screen.getByText('config en cours de chargement')).toBeTruthy();
    expect(screen.queryByText(/pas encore de/)).toBeNull();
  });

  it('config indisponible : la page donne la raison d’ezk', () => {
    renderProject(
      liveProject({ config: undefined, configState: { state: 'unavailable', reason: 'YAML malformé' } }),
    );
    expect(screen.getByText('config indisponible : YAML malformé')).toBeTruthy();
  });

  it('ni config ni état (serveur plus ancien que la page) : la page dit de le relancer', () => {
    renderProject(liveProject({ config: undefined, configState: undefined }));
    expect(screen.getByText(/il tourne sur un code plus ancien que la page\. Relance-le/)).toBeTruthy();
  });
});

describe('ToolConfigView (fiche 656)', () => {
  it('éditer le mapping émet une nouvelle config', async () => {
    let tool: ToolConfig = defaultToolConfig();
    const onChange = vi.fn((next: ToolConfig) => {
      tool = next;
    });
    render(<ToolConfigView tool={tool} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Modèle du tier high'), 'Sonnet 5.5');
    expect(onChange).toHaveBeenCalled();
    expect(tool.map['Claude Code'].models.high).toBe('Sonnet 5.5');
  });

  it('changer d’IDE actif émet la nouvelle config', async () => {
    const onChange = vi.fn();
    render(<ToolConfigView tool={defaultToolConfig()} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cursor' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ide: 'Cursor' }));
  });
});

describe('Board — le modèle résolu suit l’IDE actif (intégration 250 ↔ 656)', () => {
  it('changer l’IDE dans la config outil change le modèle résolu de la config projet', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Configuration' }));
    // vectorz : ezk-dev = middle → Claude Code = Sonnet 5.5
    expect(screen.getByText('Sonnet 5.5')).toBeTruthy();
    // Aller régler l'outil, passer en Cursor.
    await userEvent.click(screen.getByRole('button', { name: "Configuration de l'outil" }));
    await userEvent.click(screen.getByRole('button', { name: 'Cursor' }));
    // Revenir à la config projet : ezk-dev middle → Cursor = Grok 4.
    await userEvent.click(screen.getByRole('button', { name: 'Configuration' }));
    expect(screen.getByText('Grok 4')).toBeTruthy();
  });

  it('le tier édité dans la config projet survit au passage par la config outil', async () => {
    await renderBoardOn();
    await userEvent.click(screen.getByRole('button', { name: 'Configuration' }));
    // vectorz : ezk-qa = low. On le passe à high.
    const qaRow = screen.getByText('ezk-qa').closest('.cfgrow') as HTMLElement;
    const highBtn = Array.from(qaRow.querySelectorAll('button')).find((b) => b.textContent === 'high')!;
    await userEvent.click(highBtn);
    // Aller régler l'outil, puis revenir.
    await userEvent.click(screen.getByRole('button', { name: "Configuration de l'outil" }));
    await userEvent.click(screen.getByRole('button', { name: 'Configuration' }));
    // ezk-qa est resté à high (Opus 4.8), pas revenu à low.
    const qaRow2 = screen.getByText('ezk-qa').closest('.cfgrow') as HTMLElement;
    expect(within(qaRow2).getByText('Opus 4.8')).toBeTruthy();
  });
});
