/**
 * ci-conso — le cœur d'agrégation de la conso Actions est PUR et déterministe
 * (fiche 20260828150801613 : réparer l'endpoint 410 → /usage + capitaliser en script,
 * ADR-0001 « le script compte, le LLM juge »). Le bord I/O (`bin/ci-conso.ts`, appels
 * `gh`) n'est pas testé ici ; l'agrégation, elle, l'est sur fixture.
 */
import { describe, expect, it } from 'vitest';
import {
  type UsageItem,
  aggregateActionsUsage,
  formatConsoReport,
  hideFreeForks,
  isActionsMinutes,
  parseConsoArgs,
} from '../core/ci-conso.js';

// Fixture inspirée d'une vraie réponse /settings/billing/usage : plusieurs SKU par repo,
// du storage (à ignorer) et du codespaces (à ignorer).
const FIXTURE: UsageItem[] = [
  { product: 'actions', sku: 'Actions Linux', quantity: 879, unitType: 'Minutes', netAmount: 0, repositoryName: 'vectorz' },
  { product: 'actions', sku: 'Actions macOS 3-core', quantity: 80, unitType: 'Minutes', netAmount: 4.96, repositoryName: 'muti' },
  { product: 'actions', sku: 'Actions Linux', quantity: 744, unitType: 'Minutes', netAmount: 0, repositoryName: 'muti' },
  { product: 'actions', sku: 'Actions storage', quantity: 100, unitType: 'GigabyteHours', netAmount: 2, repositoryName: 'vectorz' },
  { product: 'codespaces', sku: 'Codespaces compute', quantity: 5, unitType: 'Hours', netAmount: 1, repositoryName: 'muti' },
];

describe('ci-conso — agrégation déterministe (fiche 20260828150801613)', () => {
  it('somme les minutes Actions par repo, ignore storage/codespaces, trie minutes DESC', () => {
    const r = aggregateActionsUsage(FIXTURE, { vectorz: 'public', muti: 'private' });
    expect(r.rows).toEqual([
      { repo: 'vectorz', minutes: 879, netUsd: 0, visibility: 'public' },
      { repo: 'muti', minutes: 824, netUsd: 4.96, visibility: 'private' }, // 80 + 744
    ]);
    expect(r.totalMinutes).toBe(879 + 824);
    expect(r.totalNetUsd).toBeCloseTo(4.96);
  });

  it('isActionsMinutes ne retient que product=actions ET unitType=Minutes', () => {
    expect(isActionsMinutes(FIXTURE[0])).toBe(true); // Actions Linux Minutes
    expect(isActionsMinutes(FIXTURE[3])).toBe(false); // Actions storage (GigabyteHours)
    expect(isActionsMinutes(FIXTURE[4])).toBe(false); // codespaces
  });

  it('casse tolérante : la casse de la DOC GitHub ("Actions"/"minutes") est AUSSI comptée', () => {
    // Non-régression du P2 de revue : si le code n'acceptait que "actions"/"Minutes", un
    // changement de casse côté GitHub viderait le rapport en silence (« 0 min »).
    const r = aggregateActionsUsage(
      [{ product: 'Actions', sku: 'Actions Linux', quantity: 10, unitType: 'minutes', netAmount: 0, repositoryName: 'x' }],
      {},
    );
    expect(r.rows).toEqual([{ repo: 'x', minutes: 10, netUsd: 0, visibility: '?' }]);
  });

  it('visibilité inconnue → "?" (pas de crash, best-effort)', () => {
    const r = aggregateActionsUsage(FIXTURE, {}); // aucune visibilité fournie
    expect(r.rows.every((row) => row.visibility === '?')).toBe(true);
  });

  it('déterministe : même entrée → même sortie', () => {
    const vis = { vectorz: 'public', muti: 'private' };
    expect(aggregateActionsUsage(FIXTURE, vis)).toEqual(aggregateActionsUsage(FIXTURE, vis));
  });

  it('rendu texte : public = "gratuit", note sur les privés, total présent', () => {
    const out = formatConsoReport(aggregateActionsUsage(FIXTURE, { vectorz: 'public', muti: 'private' }), '2026-08');
    expect(out).toMatch(/public/);
    expect(out).toMatch(/private/);
    expect(out).toMatch(/gratuit/); // vectorz public
    expect(out).toMatch(/seuls les repos PRIVÉS comptent/);
    expect(out).toMatch(/total : 1703 min/);
  });

  it('coût suit netUsd : un repo public FACTURÉ (gros runners) montre le montant, pas "gratuit" (Codex #186)', () => {
    const items: UsageItem[] = [
      { product: 'actions', sku: 'Actions macOS 3-core', quantity: 100, unitType: 'Minutes', netAmount: 6.2, repositoryName: 'oss-heavy' },
    ];
    const out = formatConsoReport(aggregateActionsUsage(items, { 'oss-heavy': 'public' }), '2026-08');
    // Sur la LIGNE du repo (la note de bas contient « gratuit » à dessein) : le montant, pas « gratuit ».
    const row = out.split('\n').find((l) => l.includes('oss-heavy')) ?? '';
    expect(row).toMatch(/\$6\.20/);
    expect(row).not.toMatch(/gratuit/);
  });

  it('backlog vide → rapport vide, pas d’erreur', () => {
    const r = aggregateActionsUsage([], {});
    expect(r.rows).toEqual([]);
    expect(r.totalMinutes).toBe(0);
    expect(r.totalNetUsd).toBe(0);
  });
});

/**
 * `--no-forks` (fiche 20260829132313947) : ranger à part les forks qui ne pèsent PAS sur le quota
 * (publics, sans coût) sans jamais masquer ce qui consomme vraiment.
 */
describe('ci-conso — masquer les forks gratuits (--no-forks)', () => {
  const run = (repositoryName: string, quantity: number, netAmount = 0): UsageItem => ({
    product: 'actions',
    sku: 'Actions Linux',
    quantity,
    unitType: 'Minutes',
    netAmount,
    repositoryName,
  });
  const ITEMS: UsageItem[] = [
    run('vectorz', 900),
    run('muti', 700, 4.96),
    run('p5.js', 300), // fork public gratuit
    run('BMAD-METHOD', 120), // fork public gratuit
    run('mon-fork-prive', 50), // fork PRIVÉ : pèse sur le quota
    run('fork-facture', 40, 1.5), // fork public mais FACTURÉ (gros runner)
    run('fork-inconnu', 30), // fork dont la visibilité n'a pas pu être lue
  ];
  const VIS = {
    vectorz: 'public',
    muti: 'private',
    'p5.js': 'public',
    'BMAD-METHOD': 'public',
    'mon-fork-prive': 'private',
    'fork-facture': 'public',
    // 'fork-inconnu' absent → '?'
  };
  const FORKS = new Set(['p5.js', 'BMAD-METHOD', 'mon-fork-prive', 'fork-facture', 'fork-inconnu']);

  it('masque les forks publics sans coût, recalcule les totaux, compte ce qui est masqué', () => {
    const r = hideFreeForks(aggregateActionsUsage(ITEMS, VIS), FORKS);
    expect(r.rows.map((row) => row.repo)).toEqual([
      'vectorz',
      'muti',
      'mon-fork-prive',
      'fork-facture',
      'fork-inconnu',
    ]);
    expect(r.hiddenForks).toEqual({ count: 2, minutes: 420 }); // p5.js 300 + BMAD-METHOD 120
    expect(r.totalMinutes).toBe(900 + 700 + 50 + 40 + 30); // somme des lignes GARDÉES
    expect(r.totalNetUsd).toBeCloseTo(4.96 + 1.5);
  });

  it('ne masque JAMAIS ce qui consomme : fork privé, fork facturé, fork à visibilité inconnue', () => {
    const r = hideFreeForks(aggregateActionsUsage(ITEMS, VIS), FORKS);
    const repos = r.rows.map((row) => row.repo);
    expect(repos).toContain('mon-fork-prive');
    expect(repos).toContain('fork-facture');
    expect(repos).toContain('fork-inconnu');
  });

  it('un repo public qui n’est PAS un fork reste affiché', () => {
    const r = hideFreeForks(aggregateActionsUsage(ITEMS, VIS), new Set(['p5.js']));
    expect(r.rows.map((row) => row.repo)).toContain('vectorz');
    expect(r.hiddenForks).toEqual({ count: 1, minutes: 300 });
  });

  it('option appliquée sans fork à masquer → lignes intactes, « 0 masqué » explicite', () => {
    const base = aggregateActionsUsage(ITEMS, VIS);
    const r = hideFreeForks(base, new Set());
    expect(r.rows).toEqual(base.rows);
    expect(r.totalMinutes).toBe(base.totalMinutes);
    expect(r.hiddenForks).toEqual({ count: 0, minutes: 0 });
  });

  it('pur : le rapport d’entrée n’est pas modifié', () => {
    const base = aggregateActionsUsage(ITEMS, VIS);
    const snapshot = JSON.parse(JSON.stringify(base));
    hideFreeForks(base, FORKS);
    expect(base).toEqual(snapshot);
  });

  it('rendu : les forks masqués disparaissent de la table, un pied dit combien', () => {
    const out = formatConsoReport(hideFreeForks(aggregateActionsUsage(ITEMS, VIS), FORKS), '2026-09');
    expect(out).not.toMatch(/p5\.js/);
    expect(out).not.toMatch(/BMAD-METHOD/);
    expect(out).toMatch(/mon-fork-prive/); // le fork privé reste lisible
    expect(out).toMatch(/forks masqués : 2 \(420 min/);
    expect(out).toMatch(/total : 1720 min/);
  });

  it('rendu sans l’option : aucune ligne « forks masqués », forks présents (comportement inchangé)', () => {
    const out = formatConsoReport(aggregateActionsUsage(ITEMS, VIS), '2026-09');
    expect(out).not.toMatch(/forks masqués/);
    expect(out).toMatch(/p5\.js/);
  });
});

describe('ci-conso — lecture des arguments de la CLI', () => {
  it('rien → mois courant, forks affichés', () => {
    expect(parseConsoArgs([])).toEqual({ noForks: false });
  });

  it('une période, avec ou sans --no-forks, dans les deux ordres', () => {
    expect(parseConsoArgs(['2026-08'])).toEqual({ period: '2026-08', noForks: false });
    expect(parseConsoArgs(['2026-08', '--no-forks'])).toEqual({ period: '2026-08', noForks: true });
    expect(parseConsoArgs(['--no-forks', '2026-08'])).toEqual({ period: '2026-08', noForks: true });
    expect(parseConsoArgs(['--no-forks'])).toEqual({ noForks: true });
  });

  it('ignore le séparateur « -- » laissé par un lanceur', () => {
    expect(parseConsoArgs(['--', '--no-forks'])).toEqual({ noForks: true });
  });

  it('jette sur une option inconnue (la faute de frappe ne passe pas en silence)', () => {
    expect(() => parseConsoArgs(['--no-fork'])).toThrow(/option inconnue « --no-fork »/);
    expect(() => parseConsoArgs(['-x'])).toThrow(/option inconnue/);
  });

  it('jette sur une deuxième période', () => {
    expect(() => parseConsoArgs(['2026-08', '2026-09'])).toThrow(/une seule période/);
  });
});
