import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import { expectedDecision, launch, seal } from '../version-checkpoint.js';
import { versionScope } from '../version-scope.js';
import { buildVersions } from '../versions.js';

function fiche(o: Partial<Fiche> & { id: string }): Fiche {
  return {
    title: `Fiche ${o.id}`,
    type: 'feature',
    priority: 'P1',
    status: 'idea',
    milestone: '',
    version: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    depends: [],
    blocked: '',
    done: false,
    file: `features/${o.id}_x.md`,
    ...o,
  };
}
const noTags: ReadonlySet<string> = new Set();

/** Compose les vraies briques (buildVersions → lot, versionScope → périmètre), comme en production. */
function lotAndScope(fiches: Fiche[], version: string) {
  const report = buildVersions(fiches, noTags);
  const lot = report.lots.find((l) => l.version === version);
  if (!lot) throw new Error(`pas de lot pour ${version}`);
  return { lot, scope: versionScope(report, {}) };
}

describe('launch — « version lançable ? » (entrée)', () => {
  it('toutes les fiches prêtes → lançable, toutes dans le seau build', () => {
    const { lot, scope } = lotAndScope(
      [fiche({ id: '0001', status: 'ready', version: 'v0.17.0' }), fiche({ id: '0002', status: 'ready', version: 'v0.17.0' })],
      'v0.17.0',
    );
    const v = launch(lot, scope);
    expect(v.launchable).toBe(true);
    expect(v.build.map((f) => f.id)).toEqual(['0001', '0002']);
    expect(v.groom).toHaveLength(0);
    expect(v.escalate).toHaveLength(0);
  });

  it('une idée + une bloquée → PAS lançable, ventilées par disposition', () => {
    const { lot, scope } = lotAndScope(
      [
        fiche({ id: '0001', status: 'ready', version: 'v0.17.0' }),
        fiche({ id: '0002', status: 'idea', version: 'v0.17.0' }),
        fiche({ id: '0003', status: 'ready', version: 'v0.17.0', blocked: 'panel' }),
      ],
      'v0.17.0',
    );
    const v = launch(lot, scope);
    expect(v.launchable).toBe(false);
    expect(v.build.map((f) => f.id)).toEqual(['0001']);
    expect(v.groom.map((f) => f.id)).toEqual(['0002']);
    expect(v.escalate.map((f) => f.id)).toEqual(['0003']);
  });
});

describe('seal — « version scellable ? » (sortie)', () => {
  it('tout livré → scellable, rien en attente', () => {
    const { lot, scope } = lotAndScope([fiche({ id: '0001', status: 'shipped', done: true, version: 'v0.17.0' })], 'v0.17.0');
    const v = seal(lot, scope);
    expect(v.sealable).toBe(true);
    expect(v.pending).toHaveLength(0);
  });

  it('une bloquée non livrée → pas scellable, raison typée + décision attendue', () => {
    const { lot, scope } = lotAndScope(
      [
        fiche({ id: '0001', status: 'shipped', done: true, version: 'v0.17.0' }),
        fiche({ id: '0002', status: 'ready', version: 'v0.17.0', blocked: 'design' }),
      ],
      'v0.17.0',
    );
    const v = seal(lot, scope);
    expect(v.sealable).toBe(false);
    expect(v.pending).toHaveLength(1);
    expect(v.pending[0]).toMatchObject({ id: '0002', reason: 'design' });
    expect(v.pending[0].decision).toContain('PO');
  });

  it('une prête non construite → pas scellable, décision « construire ou sortir »', () => {
    const { lot, scope } = lotAndScope(
      [
        fiche({ id: '0001', status: 'shipped', done: true, version: 'v0.17.0' }),
        fiche({ id: '0002', status: 'ready', version: 'v0.17.0' }),
      ],
      'v0.17.0',
    );
    const v = seal(lot, scope);
    expect(v.sealable).toBe(false);
    expect(v.pending[0].decision).toContain('construire');
  });
});

describe('expectedDecision — la décision dépend de la raison typée', () => {
  it('dépendance externe → reporter à la version où elle arrive', () => {
    expect(expectedDecision({ disposition: 'escalate', reason: 'dependency', message: '' })).toContain('reporter');
  });
  it('geste PO (panel) → le PO fait le geste ou reporte', () => {
    expect(expectedDecision({ disposition: 'escalate', reason: 'panel', message: '' })).toContain('PO');
  });
  it('idée → groomer', () => {
    expect(expectedDecision({ disposition: 'groom', reason: '', message: '' })).toContain('groomer');
  });
  it('épic → découper', () => {
    expect(expectedDecision({ disposition: 'escalate', reason: 'epic', message: '' })).toContain('découper');
  });
});
