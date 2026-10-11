/**
 * version-scope — le garde-fou de séquence (fiche 20261010215345931, ADR-0070) : le tirage reste dans
 * la version en cours. Cœur PUR : les fiches et les étiquettes sont injectées, aucun disque, aucun git.
 */
import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import { applyVersionScope, formatVersionScope, versionScope } from '../version-scope.js';
import { buildVersions } from '../versions.js';

/** Ids de 17 chiffres, comme les vraies fiches. */
const I = (n: number): string => `202601010000000${String(n).padStart(2, '0')}`;

function fiche(o: Partial<Fiche> & { id: string }): Fiche {
  return {
    title: `Fiche ${o.id}`,
    type: 'feature',
    priority: 'P1',
    status: 'ready',
    milestone: '',
    version: '',
    product: 'mega-city',
    pr: '',
    labels: [],
    blocked: '',
    done: false,
    file: `features/${o.id}_x.md`,
    ...o,
  };
}
const ready = (n: number, version: string): Fiche => fiche({ id: I(n), status: 'ready', version });
const shipped = (n: number, version: string): Fiche => fiche({ id: I(n), status: 'shipped', done: true, version });
const parked = (n: number, version: string): Fiche => fiche({ id: I(n), status: 'idea', milestone: 'parked', version });
const scopeOf = (fiches: Fiche[], tags: Iterable<string>, allVersions = false) =>
  versionScope(buildVersions(fiches, new Set(tags)), { allVersions });

describe('versionScope — la version en cours = plus bas lot non étiqueté', () => {
  it('v0.6 étiquetée, v0.7 et v0.8 non : la version en cours est v0.7, v0.8 est écartée', () => {
    const fiches = [shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.8.0')];
    const scope = scopeOf(fiches, ['v0.6.0']);
    expect(scope.current).toBe('v0.7.0');
    expect(scope.deferred).toEqual(['v0.8.0']);
    expect(scope.inScope.has('v0.7.0')).toBe(true);
    expect(scope.inScope.has('v0.8.0')).toBe(false);
    expect(scope.empty).toBe(false);
  });

  it('versions NON contiguës (v0.7 puis v0.9, pas de v0.8) : écarte bien v0.9', () => {
    const fiches = [shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.9.0')];
    const scope = scopeOf(fiches, ['v0.6.0']);
    expect(scope.current).toBe('v0.7.0');
    expect(scope.deferred).toEqual(['v0.9.0']);
  });

  it('sans aucune étiquette : la version la plus basse est en cours, les suivantes écartées', () => {
    const fiches = [ready(1, 'v0.1.0'), ready(2, 'v0.2.0')];
    const scope = scopeOf(fiches, []);
    expect(scope.current).toBe('v0.1.0');
    expect(scope.deferred).toEqual(['v0.2.0']);
  });

  it('train entièrement étiqueté : aucune version en cours, rien n’est écarté', () => {
    const fiches = [shipped(1, 'v0.1.0'), shipped(2, 'v0.2.0')];
    const scope = scopeOf(fiches, ['v0.1.0', 'v0.2.0']);
    expect(scope.current).toBeUndefined();
    expect(scope.deferred).toEqual([]);
  });

  it('version en cours tout livré mais pas étiquetée : marquée `empty` (« pousse l’étiquette »)', () => {
    const fiches = [shipped(1, 'v0.6.0'), shipped(2, 'v0.7.0'), ready(3, 'v0.8.0')];
    const scope = scopeOf(fiches, ['v0.6.0']); // v0.7 tout shipped mais pas taguée
    expect(scope.current).toBe('v0.7.0');
    expect(scope.empty).toBe(true);
    expect(scope.deferred).toEqual(['v0.8.0']);
  });

  it('version en cours avec UNE SEULE fiche parkée (rien livré) : PAS `empty` (ne pas dire « pousse le tag »)', () => {
    const fiches = [shipped(1, 'v0.6.0'), parked(2, 'v0.7.0')]; // v0.7 : todo=0 mais shipped=0
    const scope = scopeOf(fiches, ['v0.6.0']);
    expect(scope.current).toBe('v0.7.0');
    expect(scope.empty).toBe(false); // todo=0 ne suffit pas : il faut une livraison
  });
});

describe('applyVersionScope — garde la version en cours + sans version, écarte le supérieur', () => {
  it('écarte les fiches de version supérieure, garde la version en cours et les sans-version', () => {
    const fiches = [shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.8.0'), ready(4, '')];
    const scope = scopeOf(fiches, ['v0.6.0']);
    const { kept, deferred } = applyVersionScope(fiches, scope);
    expect(kept.map((f) => f.id)).toEqual([I(1), I(2), I(4)]); // v0.6 (livrée), v0.7 (en cours), sans version
    expect(deferred.map((f) => f.id)).toEqual([I(3)]); // v0.8 écartée
  });

  it('`--all-versions` lève le périmètre : tout est gardé, rien écarté', () => {
    const fiches = [shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.8.0')];
    const scope = scopeOf(fiches, ['v0.6.0'], true);
    const { kept, deferred } = applyVersionScope(fiches, scope);
    expect(kept).toHaveLength(3);
    expect(deferred).toEqual([]);
  });

  it('fiche à version MALFORMÉE : gardée, jamais écartée en silence (revue P1, LOI no-silent-mutation)', () => {
    // `v0.7` (deux composantes) est rejetée par VERSION_FORMAT → hors de tout lot (report.malformed).
    const fiches = [shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(9, 'v0.7'), ready(3, 'v0.8.0')];
    const scope = scopeOf(fiches, ['v0.6.0']);
    const { kept, deferred } = applyVersionScope(fiches, scope);
    expect(kept.map((f) => f.id)).toContain(I(9)); // la malformée reste tirable
    expect(deferred.map((f) => f.id)).toEqual([I(3)]); // seule v0.8 (bien formée, supérieure) est écartée
  });

  it('version inférieure ROUVERTE (taguée mais avec un todo) : gardée dans le périmètre', () => {
    // v0.6 taguée mais porte encore une fiche à faire (état « rouverte ») ; v0.7 est la version en cours.
    const fiches = [shipped(1, 'v0.6.0'), ready(4, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.8.0')];
    const scope = scopeOf(fiches, ['v0.6.0']);
    expect(scope.current).toBe('v0.7.0');
    const { kept } = applyVersionScope(fiches, scope);
    expect(kept.map((f) => f.id)).toContain(I(4)); // la fiche v0.6 rouverte reste tirable
    expect(kept.map((f) => f.id)).not.toContain(I(3)); // v0.8 écartée
  });
});

describe('formatVersionScope — aucun saut muet', () => {
  it('signale les versions écartées et renvoie vers --all-versions', () => {
    const scope = scopeOf([shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.8.0')], ['v0.6.0']);
    const lines = formatVersionScope(scope).join('\n');
    expect(lines).toContain('v0.8.0');
    expect(lines).toContain('--all-versions');
  });

  it('version complète non étiquetée : invite à pousser l’étiquette', () => {
    const scope = scopeOf([shipped(2, 'v0.7.0'), ready(3, 'v0.8.0')], []);
    // v0.1-less fixture : v0.7 shipped non taguée = en cours & empty
    const lines = formatVersionScope(scope).join('\n');
    expect(lines).toContain('complète');
    expect(lines).toContain('version close');
  });

  it('--all-versions : un seul avertissement bruyant, pas d’écart', () => {
    const scope = scopeOf([shipped(1, 'v0.6.0'), ready(2, 'v0.7.0'), ready(3, 'v0.8.0')], ['v0.6.0'], true);
    const lines = formatVersionScope(scope);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('--all-versions');
  });
});
