/**
 * versions — le niveau « version » du backlog (fiche 20260824204751403) : cœur PUR (état du lot,
 * contrôle de cohérence, clôture) et son rendu texte. Aucun disque, aucune horloge, aucun git :
 * les fiches et les étiquettes sont injectées.
 */
import { describe, expect, it } from 'vitest';
import type { Fiche } from '../../loaders/fiches.js';
import {
  LOT_MAX,
  VERSION_FORMAT,
  buildVersions,
  checkVersions,
  closeVersion,
  compareVersions,
  hasErrors,
  tagOf,
} from '../versions.js';
import { renderFindings, renderProposal, renderVersionList } from '../versions-render.js';

/** Ids de 17 chiffres, comme les vraies fiches (c'est ce que lit `parsePlanSections`). */
const I = (n: number): string => `202601010000000${String(n).padStart(2, '0')}`;

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
    blocked: '',
    done: false,
    file: `features/${o.id}_x.md`,
    ...o,
  };
}
const shipped = (n: number, version: string): Fiche =>
  fiche({ id: I(n), status: 'shipped', done: true, version });
const todo = (n: number, version: string, extra: Partial<Fiche> = {}): Fiche =>
  fiche({ id: I(n), version, ...extra });
const parked = (n: number, version = ''): Fiche =>
  fiche({ id: I(n), milestone: 'parked', version });
const noTags: ReadonlySet<string> = new Set();

describe('compareVersions / tagOf / format', () => {
  it("trie dans l'ordre naturel : V0.2 avant V0.10, V0.10 avant V1.0, V0.3 avant V0.3.1", () => {
    const sorted = ['V1.0', 'V0.10', 'V0.3.1', 'V0.2', 'V0.3'].sort(compareVersions);
    expect(sorted).toEqual(['V0.2', 'V0.3', 'V0.3.1', 'V0.10', 'V1.0']);
    expect(compareVersions('V0.3', 'V0.3')).toBe(0);
  });

  it("l'étiquette git est la version en minuscule : V0.3 → v0.3", () => {
    expect(tagOf('V0.3')).toBe('v0.3');
    expect(tagOf('V0.3.1')).toBe('v0.3.1');
  });

  it('le format admet V<n>.<n> et V<n>.<n>.<n>, rien d’autre', () => {
    for (const ok of ['V0.1', 'V1.0', 'V0.10', 'V0.3.1']) expect(VERSION_FORMAT.test(ok)).toBe(true);
    for (const bad of ['v0.3', '0.3', 'V03', 'V0', 'V0.3-beta', ' V0.3']) {
      expect(VERSION_FORMAT.test(bad)).toBe(false);
    }
  });
});

describe('buildVersions — un lot par version, rien de perdu', () => {
  it('groupe par version dans l’ordre naturel et compte livrées / à faire / prêtes / bloquées', () => {
    const report = buildVersions(
      [
        shipped(1, 'V0.2'),
        todo(2, 'V0.10'),
        todo(3, 'V0.2', { status: 'ready' }),
        todo(4, 'V0.2', { blocked: 'attend la 3' }),
        todo(5, 'V0.2', { status: 'superseded', done: true }), // clos sans livraison : hors lot
      ],
      noTags,
    );
    expect(report.lots.map((l) => l.version)).toEqual(['V0.2', 'V0.10']);
    const v02 = report.lots[0];
    expect(v02.shipped.map((f) => f.id)).toEqual([I(1)]);
    expect(v02.todo.map((f) => f.id)).toEqual([I(3), I(4)]);
    expect(v02.ready.map((f) => f.id)).toEqual([I(3)]);
    expect(v02.blocked.map((f) => f.id)).toEqual([I(4)]);
    expect(report.terminal).toBe(1);
  });

  it('calcule l’état : en cours, à clore, livrée (étiquette), rouverte (étiquette + fiche à faire), vide', () => {
    const fiches = [
      todo(1, 'V0.3'), // en cours
      shipped(2, 'V0.2'), // à clore (pas d'étiquette v0.2)
      shipped(3, 'V0.1'), // livrée (étiquette v0.1)
      todo(4, 'V0.4'), // rouverte (étiquette v0.4 + fiche à faire)
      parked(5, 'V0.5'), // vide : seulement un intrus
    ];
    const report = buildVersions(fiches, new Set(['v0.1', 'v0.4']));
    const state = Object.fromEntries(report.lots.map((l) => [l.version, l.state]));
    expect(state).toEqual({
      'V0.1': 'livree',
      'V0.2': 'a-clore',
      'V0.3': 'en-cours',
      'V0.4': 'rouverte',
      'V0.5': 'vide',
    });
  });

  it('une fiche parkée qui porte une version est un intrus : hors lot, mais comptée à part', () => {
    const report = buildVersions([shipped(1, 'V0.1'), parked(2, 'V0.1')], noTags);
    const lot = report.lots[0];
    expect(lot.intruders.map((f) => f.id)).toEqual([I(2)]);
    expect(lot.todo).toEqual([]);
    expect(lot.state).toBe('a-clore');
  });

  it('une version illisible n’entre dans aucun lot mais n’est pas ignorée', () => {
    const report = buildVersions([todo(1, 'v0.3'), todo(2, 'V0.3')], noTags);
    expect(report.malformed.map((f) => f.id)).toEqual([I(1)]);
    expect(report.lots.map((l) => l.version)).toEqual(['V0.3']);
  });

  it('dit les fiches actives sans version (dont les parkées) ; les livrées sans version sont de l’historique', () => {
    const report = buildVersions(
      [todo(1, ''), todo(2, '', { status: 'ready' }), parked(3), fiche({ id: I(4), status: 'shipped', done: true })],
      noTags,
    );
    expect(report.unversioned).toEqual({ total: 3, parked: 1 });
    expect(report.history).toBe(1);
  });

  it('conserve toutes les fiches : chacune tombe dans une et une seule catégorie', () => {
    const fiches = [
      shipped(1, 'V0.1'),
      todo(2, 'V0.3'),
      parked(3, 'V0.3'),
      todo(4, 'v0.3'),
      todo(5, 'V0.3', { status: 'merged', done: true }),
      todo(6, ''),
      parked(7),
      fiche({ id: I(8), status: 'shipped', done: true }),
    ];
    const r = buildVersions(fiches, noTags);
    const inLots = r.lots.reduce((n, l) => n + l.shipped.length + l.todo.length + l.intruders.length, 0);
    expect(inLots + r.malformed.length + r.terminal + r.unversioned.total + r.history).toBe(fiches.length);
  });
});

describe('checkVersions — la cohérence d’un lot', () => {
  const codes = (findings: ReturnType<typeof checkVersions>): string[] =>
    findings.map((f) => `${f.severity}:${f.code}`);

  it('signale une version illisible (erreur, jamais ignorée)', () => {
    const findings = checkVersions([todo(1, 'v0.3')], noTags);
    expect(codes(findings)).toEqual(['error:format']);
    expect(findings[0].ficheId).toBe(I(1));
    expect(findings[0].message).toContain('V0.3');
  });

  it('signale une fiche parkée rangée dans une version (erreur)', () => {
    const findings = checkVersions([shipped(1, 'V0.1'), parked(2, 'V0.1')], noTags);
    expect(codes(findings)).toEqual(['error:parkee']);
    expect(findings[0]).toMatchObject({ version: 'V0.1', ficheId: I(2) });
  });

  it('signale une version déjà livrée mais rouverte (erreur, une ligne par version)', () => {
    const findings = checkVersions([shipped(1, 'V0.2'), todo(2, 'V0.2'), todo(3, 'V0.2')], new Set(['v0.2']));
    expect(codes(findings)).toEqual(['error:rouverte']);
    expect(findings[0].message).toContain('v0.2');
    expect(findings[0].message).toContain('2 fiche');
  });

  it('signale une fiche bloquée (alerte) avec sa raison', () => {
    const findings = checkVersions([todo(1, 'V0.3', { blocked: 'attend la 2' })], noTags);
    expect(codes(findings)).toEqual(['warning:bloquee']);
    expect(findings[0].message).toContain('attend la 2');
  });

  it(`signale un lot trop gros au-delà de ${LOT_MAX} fiches à faire, réglable par max`, () => {
    const many = Array.from({ length: LOT_MAX + 1 }, (_, i) => todo(i + 1, 'V0.3'));
    expect(codes(checkVersions(many, noTags))).toEqual(['warning:taille']);
    expect(checkVersions(many.slice(0, LOT_MAX), noTags)).toEqual([]);
    expect(codes(checkVersions(many.slice(0, 3), noTags, { max: 2 }))).toEqual(['warning:taille']);
  });

  it('un lot sain ne produit rien ; hasErrors ne s’allume que sur une erreur', () => {
    expect(checkVersions([shipped(1, 'V0.2'), todo(2, 'V0.3')], noTags)).toEqual([]);
    expect(hasErrors(checkVersions([todo(1, 'V0.3', { blocked: 'x' })], noTags))).toBe(false);
    expect(hasErrors(checkVersions([parked(1, 'V0.3')], noTags))).toBe(true);
  });

  it('se limite à une version quand on la nomme', () => {
    const fiches = [parked(1, 'V0.1'), parked(2, 'V0.3')];
    const findings = checkVersions(fiches, noTags, { version: 'V0.3' });
    expect(findings.map((f) => f.ficheId)).toEqual([I(2)]);
  });

  it('trie : par version, erreurs avant alertes', () => {
    const findings = checkVersions(
      [todo(1, 'V0.4', { blocked: 'x' }), parked(2, 'V0.4'), parked(3, 'V0.3')],
      noTags,
    );
    expect(codes(findings)).toEqual(['error:parkee', 'error:parkee', 'warning:bloquee']);
    expect(findings.map((f) => f.version)).toEqual(['V0.3', 'V0.4', 'V0.4']);
  });
});

describe('checkVersions — l’accord avec PLAN.md (fail-loud sur la dérive)', () => {
  const PLAN = [
    '# PLAN',
    '',
    '## En clair',
    'Un paragraphe sans id.',
    '',
    '### ④ V0.3 — le backlog dit vrai',
    `- \`${I(1)}\` — dans le bon lot · \`build\``,
    `- \`${I(2)}\` — rangée là, mais la fiche dit V0.4 · \`build\``,
    `- \`${I(3)}\` — la fiche n'a pas de version · \`build\``,
    `- ~~\`${I(4)}\` — déjà livrée · \`build\`~~ — shipped #12`,
    '',
    '### ⑤ V0.4 — la méthode se tient',
    `- \`${I(5)}\` — bon · \`build\``,
    '',
    '### 🔀 V0.3 → V0.4 — transition',
    `- \`${I(6)}\` — section ambiguë · \`build\``,
    '',
    '### 🧹 En continu',
    `- \`${I(9)}\` — section sans version · \`build\``,
  ].join('\n');

  const fiches = [
    todo(1, 'V0.3'),
    todo(2, 'V0.4'),
    todo(3, ''),
    shipped(4, 'V0.1'),
    todo(5, 'V0.4'),
    todo(6, 'V0.4'),
    todo(7, 'V0.3'), // dans la version, absente du plan
    todo(8, 'V0.5'), // aucune section V0.5 : rien à comparer
    todo(9, ''), // dans une section sans version : hors sujet
  ];
  const planFindings = checkVersions(fiches, noTags, { planMd: PLAN });
  const by = (code: string): string[] =>
    planFindings
      .filter((f) => f.code === code)
      .map((f) => `${f.version}:${f.ficheId ?? ''}`)
      .sort();

  it('plan-ecart (erreur) : le plan range une fiche dans une autre version que la sienne, ou sans version', () => {
    expect(by('plan-ecart')).toEqual([`V0.3:${I(2)}`, `V0.3:${I(3)}`]);
    expect(planFindings.find((f) => f.code === 'plan-ecart' && f.ficheId === I(3))?.message).toContain('(vide)');
  });

  it('plan-ambigue (erreur) : une section qui cite deux versions n’est pas lue, elle est signalée', () => {
    const ambiguous = planFindings.filter((f) => f.code === 'plan-ambigue');
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0].severity).toBe('error');
    expect(ambiguous[0].message).toContain('V0.3');
    expect(ambiguous[0].message).toContain('V0.4');
  });

  it('plan-absente (alerte) : une fiche de la version manque dans la section du plan, si le plan en a une', () => {
    expect(by('plan-absente')).toEqual([`V0.3:${I(7)}`, `V0.4:${I(2)}`, `V0.4:${I(6)}`]);
    expect(planFindings.filter((f) => f.code === 'plan-absente').every((f) => f.severity === 'warning')).toBe(true);
  });

  it('un constat de plan concerne TOUTES les versions impliquées : check et close de chacune le voient', () => {
    // plan-ambigue : « V0.3 → V0.4 » concerne les deux versions
    for (const version of ['V0.3', 'V0.4']) {
      expect(checkVersions(fiches, noTags, { planMd: PLAN, version }).some((f) => f.code === 'plan-ambigue')).toBe(true);
    }
    // plan-ecart : une fiche V0.4 rangée dans la section V0.3 concerne V0.3 (la section) ET V0.4 (la fiche)
    const ecartV04 = checkVersions(fiches, noTags, { planMd: PLAN, version: 'V0.4' }).filter((f) => f.code === 'plan-ecart');
    expect(ecartV04.map((f) => f.ficheId)).toEqual([I(2)]);
    // close V0.4 (lot complet par ailleurs) refuse tant que le plan est ambigu ou contradictoire
    const complet = [shipped(10, 'V0.4'), shipped(11, 'V0.4')];
    const refus = closeVersion(complet, noTags, 'V0.4', { planMd: PLAN });
    expect(refus.ok).toBe(false);
    if (!refus.ok) expect(refus.reasons.join('\n')).toContain('plan-ambigue');
  });

  it('ignore les entrées barrées, les sections sans version et les versions sans section', () => {
    const ids = planFindings.map((f) => f.ficheId);
    expect(ids).not.toContain(I(4)); // barrée
    expect(ids).not.toContain(I(9)); // section « En continu »
    expect(ids).not.toContain(I(8)); // V0.5 n'a pas de section
  });

  it('sans PLAN.md, aucune règle plan-*', () => {
    expect(checkVersions(fiches, noTags).filter((f) => f.code.startsWith('plan-'))).toEqual([]);
  });
});

describe('closeVersion — le geste qui clôt', () => {
  it('refuse un nom de version illisible', () => {
    expect(closeVersion([], noTags, 'v0.3')).toMatchObject({ ok: false });
  });

  it('refuse une version que personne ne porte', () => {
    const r = closeVersion([shipped(1, 'V0.1')], noTags, 'V0.9');
    expect(r).toMatchObject({ ok: false });
  });

  it('refuse tant qu’il reste des fiches à faire, et les liste', () => {
    const r = closeVersion([shipped(1, 'V0.3'), todo(2, 'V0.3'), todo(3, 'V0.3', { status: 'ready' })], noTags, 'V0.3');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const text = r.reasons.join('\n');
      expect(text).toContain('2 fiche');
      expect(text).toContain(I(2));
      expect(text).toContain(I(3));
    }
  });

  it('refuse tant que le contrôle de lot est rouge (fiche parkée rangée dans la version)', () => {
    const r = closeVersion([shipped(1, 'V0.1'), parked(2, 'V0.1')], noTags, 'V0.1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join('\n')).toContain(I(2));
  });

  it('refuse une version déjà livrée (l’étiquette existe)', () => {
    const r = closeVersion([shipped(1, 'V0.2')], new Set(['v0.2']), 'V0.2');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join('\n')).toContain('v0.2');
  });

  it('accepte une version complète et rend son étiquette', () => {
    const r = closeVersion([shipped(1, 'V0.2'), shipped(2, 'V0.2')], noTags, 'V0.2');
    expect(r).toEqual({ ok: true, tag: 'v0.2', shipped: 2 });
  });
});

describe('rendu texte — « En clair » d’abord', () => {
  const report = buildVersions(
    [shipped(1, 'V0.1'), parked(2, 'V0.1'), todo(3, 'V0.3', { status: 'ready' }), todo(4, ''), parked(5)],
    new Set(['v0.1']),
  );

  it('la liste ouvre par « En clair », donne un tableau et dit les fiches sans version', () => {
    const lines = renderVersionList(report);
    expect(lines[0].startsWith('En clair :')).toBe(true);
    const text = lines.join('\n');
    expect(text).toContain('Version');
    expect(text).toMatch(/V0\.1\s+1\s+1\s+0\s+0\s+0\s+1\s+livrée/);
    expect(text).toMatch(/V0\.3\s+1\s+0\s+1\s+1\s+0\s+0\s+en cours/);
    expect(text).toContain('2 fiche(s) active(s)');
    expect(text).toContain('dont 1 parkée(s)');
  });

  it('les constats ouvrent par « En clair » et disent ce qui n’est pas contrôlé', () => {
    const findings = checkVersions([parked(1, 'V0.1')], noTags);
    const text = renderFindings(findings, 'toutes les versions').join('\n');
    expect(text.startsWith('En clair :')).toBe(true);
    expect(text).toContain('parkee');
    expect(text).toContain('depends:');
  });

  it('un lot sain le dit', () => {
    const text = renderFindings([], 'V0.3').join('\n');
    expect(text).toContain('aucune erreur');
  });

  it('la proposition nomme les deux commandes git et affirme que rien n’est exécuté', () => {
    const text = renderProposal('V0.2', 'v0.2', 'abc1234', 'abc1234').join('\n');
    expect(text).toContain('git tag -a v0.2 -m "Version V0.2" abc1234');
    expect(text).toContain('git push origin v0.2');
    expect(text).toContain("rien n'est exécuté");
    expect(text).toContain('HEAD, qui est la pointe de origin/main');
  });

  it('la proposition avertit quand HEAD n’est pas la pointe de origin/main, ou quand elle est inconnue', () => {
    const apart = renderProposal('V0.2', 'v0.2', 'abc1234567890', 'def4567890123').join('\n');
    expect(apart).toContain("Attention : HEAD (abc123456) n'est pas la pointe de origin/main (def456789)");
    expect(apart).toContain('git tag -a v0.2 -m "Version V0.2" abc1234567890'); // toujours HEAD
    const unknown = renderProposal('V0.2', 'v0.2', 'abc1234').join('\n');
    expect(unknown).toContain('Pas de origin/main connu');
  });
});
