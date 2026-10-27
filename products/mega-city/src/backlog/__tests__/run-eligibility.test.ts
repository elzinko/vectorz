import { describe, expect, it } from 'vitest';
import { BLOCKED_REASONS } from '../blocked-reasons.js';
import {
  ESCALATION_BY_REASON,
  type FicheEligibility,
  runDisposition,
} from '../run-eligibility.js';
import type { VersionScope } from '../version-scope.js';

/** Une fiche prête, dans la version en cours, non bloquée — le cas « à construire » par défaut. */
const f = (over: Partial<FicheEligibility> = {}): FicheEligibility => ({
  status: 'ready',
  type: 'feature',
  blocked: '',
  version: 'v0.15.0',
  ...over,
});

/** Un train de versions : v0.15.0 en cours, v0.16.0 écartée (borne), v0.14.0 livrée. */
const scopeV15: VersionScope = {
  current: 'v0.15.0',
  inScope: new Set(['v0.14.0', 'v0.15.0']),
  deferred: ['v0.16.0'],
  empty: false,
  allVersions: false,
};
/** La même, soupape `--all-versions` levée : plus de borne. */
const scopeAll: VersionScope = { ...scopeV15, deferred: [], allVersions: true };
/** Aucun train (tout étiqueté, ou pas de versions) : rien n'est hors borne. */
const scopeNoTrain: VersionScope = {
  current: undefined,
  inScope: new Set(),
  deferred: [],
  empty: false,
  allVersions: false,
};

describe('run-eligibility — filtre d\'éligibilité du run autonome (fiche 20261011091553794)', () => {
  it('fiche prête, dans la version, non bloquée → build', () => {
    const v = runDisposition(f(), scopeV15);
    expect(v.disposition).toBe('build');
    expect(v.reason).toBe('');
  });

  it('raison blocked: typée → escalade, message dérivé du type (sans délibérer)', () => {
    const v = runDisposition(f({ blocked: 'deferred — attend 3 décisions' }), scopeV15);
    expect(v.disposition).toBe('escalate');
    expect(v.reason).toBe('deferred');
    expect(v.message).toContain('différée par le PO');
  });

  it('chaque raison typée a son message d\'escalade (liste fermée couverte)', () => {
    for (const reason of BLOCKED_REASONS) {
      expect(ESCALATION_BY_REASON[reason]).toBeTruthy();
      const v = runDisposition(f({ blocked: reason }), scopeV15);
      expect(v.disposition).toBe('escalate');
      expect(v.reason).toBe(reason);
    }
  });

  it('blocked: hors liste fermée → escalade « non typé » (à requalifier, jamais construit en silence)', () => {
    const v = runDisposition(f({ blocked: 'attend la fiche 0009' }), scopeV15);
    expect(v.disposition).toBe('escalate');
    expect(v.reason).toBe('blocked-non-typé');
    expect(v.message).toContain('à requalifier');
  });

  it('le blocage prime tout : une fiche prête ET bloquée escalade quand même', () => {
    expect(runDisposition(f({ status: 'ready', blocked: 'review' }), scopeV15).disposition).toBe(
      'escalate',
    );
  });

  it('hors borne de version (version > en cours, sans --all-versions) → defer', () => {
    const v = runDisposition(f({ version: 'v0.16.0' }), scopeV15);
    expect(v.disposition).toBe('defer');
    expect(v.reason).toBe('hors-version');
    expect(v.message).toContain('v0.16.0');
    expect(v.message).toContain('v0.15.0');
  });

  it('--all-versions lève la borne : la fiche d\'une version supérieure redevient constructible', () => {
    expect(runDisposition(f({ version: 'v0.16.0' }), scopeAll).disposition).toBe('build');
  });

  it('sans train de versions, aucune fiche n\'est différée', () => {
    expect(runDisposition(f({ version: 'v0.16.0' }), scopeNoTrain).disposition).toBe('build');
  });

  it('fiche sans version (petit correctif hors train) n\'est jamais différée', () => {
    expect(runDisposition(f({ version: '' }), scopeV15).disposition).toBe('build');
  });

  it('version malformée n\'est pas différée en silence (signalée ailleurs)', () => {
    expect(runDisposition(f({ version: 'v0.16' }), scopeV15).disposition).toBe('build');
  });

  it('épic → escalade (jamais construit tel quel)', () => {
    const v = runDisposition(f({ type: 'epic' }), scopeV15);
    expect(v.disposition).toBe('escalate');
    expect(v.reason).toBe('epic');
  });

  it('idea → groom (auto-groom vers la DoR)', () => {
    const v = runDisposition(f({ status: 'idea' }), scopeV15);
    expect(v.disposition).toBe('groom');
    expect(v.reason).toBe('idea');
  });

  it('statut inattendu (in-progress) → escalade prudente', () => {
    const v = runDisposition(f({ status: 'in-progress' }), scopeV15);
    expect(v.disposition).toBe('escalate');
    expect(v.reason).toBe('statut-in-progress');
  });
});
