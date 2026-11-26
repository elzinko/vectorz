import { describe, expect, it } from 'vitest';
import { blockedLibelle, ESCALATION_BY_REASON, UNKNOWN_REASON } from '../backlog/run-eligibility.js';
import { NOW_SCHEMA_VERSION, NowShowSchema, buildNowShow, type NowShowInput } from '../core/now-contract.js';
import type { RetroCapture } from '../core/retro-capture.js';

const active = (over: Partial<NowShowInput['actives'][number]> & { id: string }): NowShowInput['actives'][number] => ({
  title: `Fiche ${over.id}`,
  status: 'ready',
  blocked: '',
  enCours: false,
  file: `features/${over.id}_x.md`,
  ...over,
});

const capture = (over: Partial<RetroCapture> = {}): RetroCapture => ({
  file: 'docs/captures/2026-11-10-retro-a.md',
  date: '2026-11-10',
  theme: 't',
  scope: 's',
  participants: [],
  actions: [
    { proposition: 'Décidée', kind: 'regle', target: 'global', by: ['dev'], status: '✅', decision: 'oui', date: '2026-11-11' },
    { proposition: 'En attente', kind: 'action', by: ['qa'], status: '⏳', decision: '' },
  ],
  ...over,
});

const input = (over: Partial<NowShowInput> = {}): NowShowInput => ({
  actives: [],
  lots: [],
  dates: new Map(),
  retro: null,
  suites: [],
  ...over,
});

describe('blockedLibelle — la raison de blocage en français', () => {
  it('vaut la phrase de la table pour une raison connue, vide sans blocage', () => {
    expect(blockedLibelle('panel')).toBe(ESCALATION_BY_REASON.panel);
    expect(blockedLibelle('')).toBe('');
  });
  it('tolère le contexte hérité après « — »', () => {
    expect(blockedLibelle('deferred — réveil en décembre')).toBe(ESCALATION_BY_REASON.deferred);
  });
  it('une raison inconnue donne « raison non tracée, à requalifier »', () => {
    expect(blockedLibelle('mystere')).toBe(UNKNOWN_REASON);
    expect(UNKNOWN_REASON).toBe('raison non tracée, à requalifier');
  });
});

describe('buildNowShow — les alertes, une par élément', () => {
  it('porte la version du format', () => {
    expect(buildNowShow(input()).schema_version).toBe(NOW_SCHEMA_VERSION);
  });

  it('chaque fiche active bloquée donne une alerte fiche-bloquee avec la décision attendue', () => {
    const out = buildNowShow(
      input({
        actives: [active({ id: '1', blocked: 'panel' }), active({ id: '2', blocked: 'mystere' }), active({ id: '3' })],
        dates: new Map([['1', '2026-11-01']]),
      }),
    );
    const blocked = out.alertes.filter((a) => a.type === 'fiche-bloquee');
    expect(blocked).toHaveLength(2);
    expect(blocked[0]).toEqual({
      type: 'fiche-bloquee',
      id: '1',
      titre: 'Fiche 1',
      raison: 'panel',
      decision: ESCALATION_BY_REASON.panel,
      fichier: 'features/1_x.md',
      date: '2026-11-01',
    });
    expect(blocked[1].decision).toBe(UNKNOWN_REASON);
    expect(blocked[1].date).toBe('');
  });

  it('chaque idée non bloquée donne idee-a-groomer ; une idée bloquée ou en cours, non', () => {
    const out = buildNowShow(
      input({
        actives: [
          active({ id: '1', status: 'idea' }),
          active({ id: '2', status: 'idea', blocked: 'deferred' }),
          active({ id: '3', status: 'idea', enCours: true }),
          active({ id: '4', status: 'ready' }),
        ],
      }),
    );
    expect(out.alertes.filter((a) => a.type === 'idee-a-groomer').map((a) => a.id)).toEqual(['1']);
    expect(out.alertes.filter((a) => a.type === 'fiche-bloquee').map((a) => a.id)).toEqual(['2']);
  });

  it('chaque lot « à clore » sans étiquette donne version-a-poser', () => {
    const out = buildNowShow(
      input({
        lots: [
          { version: 'v0.23.0', nom: 'Le menu', etat: 'a-clore', etiquette: null },
          { version: 'v0.22.0', nom: '', etat: 'livree', etiquette: 'v0.22.0' },
          { version: 'v0.24.0', nom: '', etat: 'en-cours', etiquette: null },
        ],
      }),
    );
    const versions = out.alertes.filter((a) => a.type === 'version-a-poser');
    expect(versions.map((a) => a.id)).toEqual(['v0.23.0']);
    expect(versions[0].titre).toBe('Le menu');
  });

  it('seules les propositions en attente de la dernière rétro donnent proposition-retro', () => {
    const out = buildNowShow(input({ retro: capture() }));
    const retros = out.alertes.filter((a) => a.type === 'proposition-retro');
    expect(retros).toHaveLength(1);
    expect(retros[0]).toMatchObject({
      id: 'docs/captures/2026-11-10-retro-a.md#2',
      titre: 'En attente',
      fichier: 'docs/captures/2026-11-10-retro-a.md',
      date: '2026-11-10',
    });
  });

  it('question-session et sprint-sans-retro sont dits non mesurés, jamais comptés à zéro', () => {
    const out = buildNowShow(input());
    expect(out.alertes).toEqual([]);
    expect(out.non_mesure).toHaveLength(2);
    expect(out.non_mesure.join(' ')).toMatch(/question/);
    expect(out.non_mesure.join(' ')).toMatch(/sprint/);
  });

  it('une dernière rétro illisible est dite en mots, jamais comptée comme « aucune proposition »', () => {
    const out = buildNowShow(input({ retroIllisible: 'docs/captures/2026-11-10-retro-a.md' }));
    expect(out.alertes).toEqual([]);
    expect(out.non_mesure).toHaveLength(3);
    expect(out.non_mesure.join(' ')).toContain('docs/captures/2026-11-10-retro-a.md');
  });

  it('recopie les suites de la boussole', () => {
    const suites = [{ kind: 'suite' as const, command: '/x', reason: 'parce que' }];
    expect(buildNowShow(input({ suites })).suites).toEqual(suites);
  });

  it('respecte son schéma strict', () => {
    const out = buildNowShow(input({ actives: [active({ id: '1', blocked: 'panel' })], retro: capture() }));
    expect(NowShowSchema.safeParse(out).success).toBe(true);
    expect(NowShowSchema.safeParse({ ...out, inconnu: 1 }).success).toBe(false);
  });
});
