/**
 * versions — le niveau « version » du backlog (fiche 20260824204751403) : cœur PUR (état du lot,
 * contrôle de cohérence, clôture) et son rendu texte. Aucun disque, aucune horloge, aucun git :
 * les fiches et les étiquettes sont injectées.
 *
 * Format : le champ `version:` est du semver strict `vX.Y.Z` (décision 2026-10-08). La version EST
 * son tag de release ; `releaseTagFor` fait une correspondance EXACTE (un patch voisin est une autre
 * version).
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
  proposedTagOf,
  releaseTagFor,
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
  it('trie dans l’ordre naturel : v0.2.0 avant v0.10.0, v0.10.0 avant v1.0.0, v0.3.0 avant v0.3.1', () => {
    const sorted = ['v1.0.0', 'v0.10.0', 'v0.3.1', 'v0.2.0', 'v0.3.0'].sort(compareVersions);
    expect(sorted).toEqual(['v0.2.0', 'v0.3.0', 'v0.3.1', 'v0.10.0', 'v1.0.0']);
    expect(compareVersions('v0.3.0', 'v0.3.0')).toBe(0);
  });

  it('la version EST déjà son tag semver : tagOf la rend telle quelle', () => {
    expect(tagOf('v0.3.0')).toBe('v0.3.0');
    expect(tagOf('v0.3.1')).toBe('v0.3.1');
  });

  it('le format admet le semver strict vX.Y.Z, rien d’autre', () => {
    for (const ok of ['v0.1.0', 'v1.0.0', 'v0.10.0', 'v0.3.1']) expect(VERSION_FORMAT.test(ok)).toBe(true);
    for (const bad of ['V0.1', 'v0.3', '0.3.0', 'v03', 'v0', 'v0.3.0-beta', ' v0.3.0', 'v1.2.3.4']) {
      expect(VERSION_FORMAT.test(bad)).toBe(false);
    }
  });
});

describe('étiquettes semver strict — la version est le tag vX.Y.Z (pas de tag nu vX.Y)', () => {
  it('proposedTagOf rend la version telle quelle (déjà 3 composantes)', () => {
    expect(proposedTagOf('v1.8.0')).toBe('v1.8.0');
    expect(proposedTagOf('v0.3.1')).toBe('v0.3.1');
  });

  it('releaseTagFor exige le tag exact de la version (3 composantes)', () => {
    expect(releaseTagFor('v1.7.0', new Set(['v1.7.0']))).toBe('v1.7.0');
    expect(releaseTagFor('v1.7.0', new Set(['v1.7']))).toBeUndefined(); // tag nu : refusé (semver strict)
    expect(releaseTagFor('v1.7.0', new Set(['v1.7.0-rc.6']))).toBeUndefined(); // pré-version : pas la sortie
    expect(releaseTagFor('v1.7.0', new Set(['v1.70.0']))).toBeUndefined(); // minor voisin, pas v1.7.0
    expect(releaseTagFor('v1.8.0', new Set(['v1.7.0']))).toBeUndefined(); // autre version
    expect(releaseTagFor('v0.3.1', new Set(['v0.3.1']))).toBe('v0.3.1'); // patch non nul : exact
    expect(releaseTagFor('v1.6.0', new Set(['v1.6.0', 'v1.6.9', 'v1.5.0']))).toBe('v1.6.0'); // exact : v1.6.9 est une AUTRE version
    expect(releaseTagFor('v1.*' as string, new Set(['v1.0.0']))).toBeUndefined(); // format non valide : pas d'injection
  });

  it('une version taguée en semver est « livrée » ; un tag nu vX.Y ne suffit pas', () => {
    const livree = buildVersions([shipped(1, 'v1.7.0')], new Set(['v1.7.0'])).lots[0];
    expect(livree.state).toBe('livree');
    expect(livree.releaseTag).toBe('v1.7.0');
    const bareTag = buildVersions([shipped(1, 'v1.7.0')], new Set(['v1.7'])).lots[0];
    expect(bareTag.state).toBe('a-clore'); // tag nu non reconnu : reste à clore
    expect(bareTag.releaseTag).toBeUndefined();
  });

  it('« rouverte » reconnaît le tag semver et nomme le tag réel', () => {
    const findings = checkVersions([shipped(1, 'v1.7.0'), todo(2, 'v1.7.0')], new Set(['v1.7.0']));
    expect(findings.map((f) => f.code)).toContain('rouverte');
    expect(findings.find((f) => f.code === 'rouverte')?.message).toContain('v1.7.0');
  });

  it('le rendu affiche le tag trouvé (v1.7.0)', () => {
    const text = renderVersionList(buildVersions([shipped(1, 'v1.7.0')], new Set(['v1.7.0']))).join('\n');
    expect(text).toContain('livrée (v1.7.0)');
  });

  it('closeVersion : refuse une version déjà sortie (tag réel), propose du semver sinon', () => {
    const r = closeVersion([shipped(1, 'v1.7.0')], new Set(['v1.7.0']), 'v1.7.0');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join('\n')).toContain("déjà livrée : l'étiquette v1.7.0 existe");
    const ok = closeVersion([shipped(1, 'v1.8.0')], noTags, 'v1.8.0'); // pas encore sortie
    expect(ok).toEqual({ ok: true, tag: 'v1.8.0', shipped: 1 });
  });
});

describe('buildVersions — un lot par version, rien de perdu', () => {
  it('groupe par version dans l’ordre naturel et compte livrées / à faire / prêtes / bloquées', () => {
    const report = buildVersions(
      [
        shipped(1, 'v0.2.0'),
        todo(2, 'v0.10.0'),
        todo(3, 'v0.2.0', { status: 'ready' }),
        todo(4, 'v0.2.0', { blocked: 'attend la 3' }),
        todo(5, 'v0.2.0', { status: 'superseded', done: true }), // clos sans livraison : hors lot
      ],
      noTags,
    );
    expect(report.lots.map((l) => l.version)).toEqual(['v0.2.0', 'v0.10.0']);
    const v02 = report.lots[0];
    expect(v02.shipped.map((f) => f.id)).toEqual([I(1)]);
    expect(v02.todo.map((f) => f.id)).toEqual([I(3), I(4)]);
    expect(v02.ready.map((f) => f.id)).toEqual([I(3)]);
    expect(v02.blocked.map((f) => f.id)).toEqual([I(4)]);
    expect(report.terminal).toBe(1);
  });

  it('calcule l’état : en cours, à clore, livrée (étiquette), rouverte (étiquette + fiche à faire), vide', () => {
    const fiches = [
      todo(1, 'v0.3.0'), // en cours
      shipped(2, 'v0.2.0'), // à clore (pas d'étiquette v0.2.0)
      shipped(3, 'v0.1.0'), // livrée (étiquette semver v0.1.0)
      todo(4, 'v0.4.0'), // rouverte (étiquette v0.4.0 + fiche à faire)
      parked(5, 'v0.5.0'), // vide : seulement un intrus
    ];
    const report = buildVersions(fiches, new Set(['v0.1.0', 'v0.4.0']));
    const state = Object.fromEntries(report.lots.map((l) => [l.version, l.state]));
    expect(state).toEqual({
      'v0.1.0': 'livree',
      'v0.2.0': 'a-clore',
      'v0.3.0': 'en-cours',
      'v0.4.0': 'rouverte',
      'v0.5.0': 'vide',
    });
  });

  it('une fiche parkée qui porte une version est un intrus : hors lot, mais comptée à part', () => {
    const report = buildVersions([shipped(1, 'v0.1.0'), parked(2, 'v0.1.0')], noTags);
    const lot = report.lots[0];
    expect(lot.intruders.map((f) => f.id)).toEqual([I(2)]);
    expect(lot.todo).toEqual([]);
    expect(lot.state).toBe('a-clore');
  });

  it('une version illisible n’entre dans aucun lot mais n’est pas ignorée', () => {
    const report = buildVersions([todo(1, 'v0.3'), todo(2, 'v0.3.0')], noTags);
    expect(report.malformed.map((f) => f.id)).toEqual([I(1)]);
    expect(report.lots.map((l) => l.version)).toEqual(['v0.3.0']);
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
      shipped(1, 'v0.1.0'),
      todo(2, 'v0.3.0'),
      parked(3, 'v0.3.0'),
      todo(4, 'v0.3'),
      todo(5, 'v0.3.0', { status: 'merged', done: true }),
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
    expect(findings[0].message).toContain('v0.3.0');
  });

  it('signale une fiche parkée rangée dans une version (erreur)', () => {
    const findings = checkVersions([shipped(1, 'v0.1.0'), parked(2, 'v0.1.0')], noTags);
    expect(codes(findings)).toEqual(['error:parkee']);
    expect(findings[0]).toMatchObject({ version: 'v0.1.0', ficheId: I(2) });
  });

  it('signale une version déjà livrée mais rouverte (erreur, une ligne par version)', () => {
    const findings = checkVersions([shipped(1, 'v0.2.0'), todo(2, 'v0.2.0'), todo(3, 'v0.2.0')], new Set(['v0.2.0']));
    expect(codes(findings)).toEqual(['error:rouverte']);
    expect(findings[0].message).toContain('v0.2.0');
    expect(findings[0].message).toContain('2 fiche');
  });

  it('signale une fiche bloquée (alerte) avec sa raison', () => {
    const findings = checkVersions([todo(1, 'v0.3.0', { blocked: 'attend la 2' })], noTags);
    expect(codes(findings)).toEqual(['warning:bloquee']);
    expect(findings[0].message).toContain('attend la 2');
  });

  it(`signale un lot trop gros au-delà de ${LOT_MAX} fiches à faire, réglable par max`, () => {
    const many = Array.from({ length: LOT_MAX + 1 }, (_, i) => todo(i + 1, 'v0.3.0'));
    expect(codes(checkVersions(many, noTags))).toEqual(['warning:taille']);
    expect(checkVersions(many.slice(0, LOT_MAX), noTags)).toEqual([]);
    expect(codes(checkVersions(many.slice(0, 3), noTags, { max: 2 }))).toEqual(['warning:taille']);
  });

  it('un lot sain ne produit rien ; hasErrors ne s’allume que sur une erreur', () => {
    expect(checkVersions([shipped(1, 'v0.2.0'), todo(2, 'v0.3.0')], noTags)).toEqual([]);
    expect(hasErrors(checkVersions([todo(1, 'v0.3.0', { blocked: 'x' })], noTags))).toBe(false);
    expect(hasErrors(checkVersions([parked(1, 'v0.3.0')], noTags))).toBe(true);
  });

  it('se limite à une version quand on la nomme', () => {
    const fiches = [parked(1, 'v0.1.0'), parked(2, 'v0.3.0')];
    const findings = checkVersions(fiches, noTags, { version: 'v0.3.0' });
    expect(findings.map((f) => f.ficheId)).toEqual([I(2)]);
  });

  it('trie : par version, erreurs avant alertes', () => {
    const findings = checkVersions(
      [todo(1, 'v0.4.0', { blocked: 'x' }), parked(2, 'v0.4.0'), parked(3, 'v0.3.0')],
      noTags,
    );
    expect(codes(findings)).toEqual(['error:parkee', 'error:parkee', 'warning:bloquee']);
    expect(findings.map((f) => f.version)).toEqual(['v0.3.0', 'v0.4.0', 'v0.4.0']);
  });
});

describe('checkVersions — l’accord avec PLAN.md (fail-loud sur la dérive)', () => {
  const PLAN = [
    '# PLAN',
    '',
    '## En clair',
    'Un paragraphe sans id.',
    '',
    '### ④ v0.3.0 — le backlog dit vrai',
    `- \`${I(1)}\` — dans le bon lot · \`build\``,
    `- \`${I(2)}\` — rangée là, mais la fiche dit v0.4.0 · \`build\``,
    `- \`${I(3)}\` — la fiche n'a pas de version · \`build\``,
    `- ~~\`${I(4)}\` — déjà livrée · \`build\`~~ — shipped #12`,
    '',
    '### ⑤ v0.4.0 — la méthode se tient',
    `- \`${I(5)}\` — bon · \`build\``,
    '',
    '### 🔀 v0.3.0 → v0.4.0 — transition',
    `- \`${I(6)}\` — section ambiguë · \`build\``,
    '',
    '### 🧹 En continu',
    `- \`${I(9)}\` — section sans version · \`build\``,
  ].join('\n');

  const fiches = [
    todo(1, 'v0.3.0'),
    todo(2, 'v0.4.0'),
    todo(3, ''),
    shipped(4, 'v0.1.0'),
    todo(5, 'v0.4.0'),
    todo(6, 'v0.4.0'),
    todo(7, 'v0.3.0'), // dans la version, absente du plan
    todo(8, 'v0.5.0'), // aucune section v0.5.0 : rien à comparer
    todo(9, ''), // dans une section sans version : hors sujet
  ];
  const planFindings = checkVersions(fiches, noTags, { planMd: PLAN });
  const by = (code: string): string[] =>
    planFindings
      .filter((f) => f.code === code)
      .map((f) => `${f.version}:${f.ficheId ?? ''}`)
      .sort();

  it('plan-ecart (erreur) : le plan range une fiche dans une autre version que la sienne, ou sans version', () => {
    expect(by('plan-ecart')).toEqual([`v0.3.0:${I(2)}`, `v0.3.0:${I(3)}`]);
    expect(planFindings.find((f) => f.code === 'plan-ecart' && f.ficheId === I(3))?.message).toContain('(vide)');
  });

  it('plan-ambigue (erreur) : une section qui cite deux versions n’est pas lue, elle est signalée', () => {
    const ambiguous = planFindings.filter((f) => f.code === 'plan-ambigue');
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0].severity).toBe('error');
    expect(ambiguous[0].message).toContain('v0.3.0');
    expect(ambiguous[0].message).toContain('v0.4.0');
  });

  it('plan-absente (alerte) : une fiche de la version manque dans la section du plan, si le plan en a une', () => {
    expect(by('plan-absente')).toEqual([`v0.3.0:${I(7)}`, `v0.4.0:${I(2)}`, `v0.4.0:${I(6)}`]);
    expect(planFindings.filter((f) => f.code === 'plan-absente').every((f) => f.severity === 'warning')).toBe(true);
  });

  it('un constat de plan concerne TOUTES les versions impliquées : check et close de chacune le voient', () => {
    // plan-ambigue : « v0.3.0 → v0.4.0 » concerne les deux versions
    for (const version of ['v0.3.0', 'v0.4.0']) {
      expect(checkVersions(fiches, noTags, { planMd: PLAN, version }).some((f) => f.code === 'plan-ambigue')).toBe(true);
    }
    // plan-ecart : une fiche v0.4.0 rangée dans la section v0.3.0 concerne v0.3.0 (la section) ET v0.4.0 (la fiche)
    const ecartV04 = checkVersions(fiches, noTags, { planMd: PLAN, version: 'v0.4.0' }).filter((f) => f.code === 'plan-ecart');
    expect(ecartV04.map((f) => f.ficheId)).toEqual([I(2)]);
    // close v0.4.0 (lot complet par ailleurs) refuse tant que le plan est ambigu ou contradictoire
    const complet = [shipped(10, 'v0.4.0'), shipped(11, 'v0.4.0')];
    const refus = closeVersion(complet, noTags, 'v0.4.0', { planMd: PLAN });
    expect(refus.ok).toBe(false);
    if (!refus.ok) expect(refus.reasons.join('\n')).toContain('plan-ambigue');
  });

  it('ignore les entrées barrées, les sections sans version et les versions sans section', () => {
    const ids = planFindings.map((f) => f.ficheId);
    expect(ids).not.toContain(I(4)); // barrée
    expect(ids).not.toContain(I(9)); // section « En continu »
    expect(ids).not.toContain(I(8)); // v0.5.0 n'a pas de section
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
    const r = closeVersion([shipped(1, 'v0.1.0')], noTags, 'v0.9.0');
    expect(r).toMatchObject({ ok: false });
  });

  it('refuse tant qu’il reste des fiches à faire, et les liste', () => {
    const r = closeVersion([shipped(1, 'v0.3.0'), todo(2, 'v0.3.0'), todo(3, 'v0.3.0', { status: 'ready' })], noTags, 'v0.3.0');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const text = r.reasons.join('\n');
      expect(text).toContain('2 fiche');
      expect(text).toContain(I(2));
      expect(text).toContain(I(3));
    }
  });

  it('refuse tant que le contrôle de lot est rouge (fiche parkée rangée dans la version)', () => {
    const r = closeVersion([shipped(1, 'v0.1.0'), parked(2, 'v0.1.0')], noTags, 'v0.1.0');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join('\n')).toContain(I(2));
  });

  it('refuse une version déjà livrée (l’étiquette semver existe)', () => {
    const r = closeVersion([shipped(1, 'v0.2.0')], new Set(['v0.2.0']), 'v0.2.0');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join('\n')).toContain('v0.2.0');
  });

  it('accepte une version complète et propose son étiquette semver (vX.Y.Z)', () => {
    const r = closeVersion([shipped(1, 'v0.2.0'), shipped(2, 'v0.2.0')], noTags, 'v0.2.0');
    expect(r).toEqual({ ok: true, tag: 'v0.2.0', shipped: 2 });
  });
});

describe('rendu texte — « En clair » d’abord', () => {
  const report = buildVersions(
    [shipped(1, 'v0.1.0'), parked(2, 'v0.1.0'), todo(3, 'v0.3.0', { status: 'ready' }), todo(4, ''), parked(5)],
    new Set(['v0.1.0']),
  );

  it('la liste ouvre par « En clair », donne un tableau et dit les fiches sans version', () => {
    const lines = renderVersionList(report);
    expect(lines[0].startsWith('En clair :')).toBe(true);
    const text = lines.join('\n');
    expect(text).toContain('Version');
    expect(text).toMatch(/v0\.1\.0\s+1\s+1\s+0\s+0\s+0\s+1\s+livrée/);
    expect(text).toMatch(/v0\.3\.0\s+1\s+0\s+1\s+1\s+0\s+0\s+en cours/);
    expect(text).toContain('2 fiche(s) active(s)');
    expect(text).toContain('dont 1 parkée(s)');
  });

  it('les constats ouvrent par « En clair » et disent ce qui n’est pas contrôlé', () => {
    const findings = checkVersions([parked(1, 'v0.1.0')], noTags);
    const text = renderFindings(findings, 'toutes les versions').join('\n');
    expect(text.startsWith('En clair :')).toBe(true);
    expect(text).toContain('parkee');
    expect(text).toContain('depends:');
  });

  it('un lot sain le dit', () => {
    const text = renderFindings([], 'v0.3.0').join('\n');
    expect(text).toContain('aucune erreur');
  });

  it('la proposition nomme les deux commandes git et affirme que rien n’est exécuté', () => {
    const text = renderProposal('v0.2.0', 'v0.2.0', 'abc1234', 'abc1234').join('\n');
    expect(text).toContain('git tag -a v0.2.0 -m "Version v0.2.0" abc1234');
    expect(text).toContain('git push origin v0.2.0');
    expect(text).toContain("rien n'est exécuté");
    expect(text).toContain('HEAD, qui est la pointe de origin/main');
  });

  it('la proposition avertit quand HEAD n’est pas la pointe de origin/main, ou quand elle est inconnue', () => {
    const apart = renderProposal('v0.2.0', 'v0.2.0', 'abc1234567890', 'def4567890123').join('\n');
    expect(apart).toContain("Attention : HEAD (abc123456) n'est pas la pointe de origin/main (def456789)");
    expect(apart).toContain('git tag -a v0.2.0 -m "Version v0.2.0" abc1234567890'); // toujours HEAD
    const unknown = renderProposal('v0.2.0', 'v0.2.0', 'abc1234').join('\n');
    expect(unknown).toContain('Pas de origin/main connu');
  });
});
