/**
 * RUN-REPORT (fiche 20260906122942607) : le bilan de fin de run, une ligne par fiche.
 *
 * En clair : le rapport ne se rédige pas au jugé. Chaque fiche porte six champs, le script refuse une
 * ligne incomplète, compare ce qui est déclaré à ce que dit GitHub, et ajoute HEAD contre origin/main
 * et les jetons contre le plafond.
 */
import { describe, expect, it } from 'vitest';
import {
  crossCheck,
  type FicheLine,
  type HeadFacts,
  parseFicheArg,
  parsePrFacts,
  type PrFacts,
  renderRunReport,
} from '../run-report.js';

const ok = (arg: string): FicheLine => {
  const parsed = parseFicheArg(arg);
  if (!parsed.line) throw new Error(parsed.error);
  return parsed.line;
};

const MERGED = '0080|mergée|#277|verte|GO|faite|-';
const OPEN = '0456|PR-ouverte|#278|verte|GO|à faire|attend la mise en main de #275';
const BLOCKED = '0500|bloquée|-|rouge|-|-|CI rouge, 2 correctifs tentés';

describe('parseFicheArg — une ligne, sept champs, aucun trou', () => {
  it('lit les six champs de la fiche et son id', () => {
    expect(ok(OPEN)).toEqual({
      id: '0456',
      state: 'PR-ouverte',
      pr: '#278',
      gate: 'verte',
      review: 'GO',
      validation: 'à faire',
      reason: 'attend la mise en main de #275',
    });
  });

  it('une fiche mergée n’a pas besoin de raison', () => {
    expect(ok(MERGED).reason).toBe('-');
  });

  it('refuse un nombre de champs inexact', () => {
    expect(parseFicheArg('0080|mergée|#277').error).toMatch(/7 champs/);
  });

  it('refuse un champ vide : « - » dit explicitement « sans objet »', () => {
    expect(parseFicheArg('0080|mergée|#277||GO|faite|-').error).toMatch(/gate/);
  });

  it('refuse un état inconnu et nomme les quatre permis', () => {
    const e = parseFicheArg('0080|finie|#277|verte|GO|faite|-').error ?? '';
    expect(e).toMatch(/mergée, PR-ouverte, bloquée ou sautée/);
  });

  it('une fiche mergée ou en PR ouverte porte son numéro de PR', () => {
    expect(parseFicheArg('0080|mergée|-|verte|GO|faite|-').error).toMatch(/PR/);
    expect(parseFicheArg('0080|PR-ouverte|abc|verte|GO|faite|raison').error).toMatch(/#<numéro>/);
  });

  it('hors mergée, la raison est obligatoire', () => {
    expect(parseFicheArg('0500|bloquée|-|rouge|-|-|-').error).toMatch(/raison/);
    expect(parseFicheArg('0500|sautée|-|-|-|-|-').error).toMatch(/raison/);
  });
});

describe('crossCheck — le déclaré contre ce que dit GitHub', () => {
  const pr = (over: Partial<PrFacts> = {}): PrFacts => ({ state: 'MERGED', checks: 'success', reviewTraces: 1, latestReview: 'positive', ...over });
  const prs = (entries: Array<[string, PrFacts | null]>): Map<string, PrFacts | null> => new Map(entries);

  it('ne dit rien quand tout concorde', () => {
    expect(crossCheck([ok(MERGED), ok(OPEN)], prs([['#277', pr()], ['#278', pr({ state: 'OPEN' })]]))).toEqual([]);
  });

  it('une PR déclarée mergée mais ouverte est un écart', () => {
    const out = crossCheck([ok(MERGED)], prs([['#277', pr({ state: 'OPEN' })]]));
    expect(out).toHaveLength(1);
    expect(out[0]?.message).toMatch(/déclarée mergée.*OPEN/);
  });

  it('une PR déclarée ouverte mais déjà mergée est un écart', () => {
    const out = crossCheck([ok(OPEN)], prs([['#278', pr({ state: 'MERGED' })]]));
    expect(out[0]?.message).toMatch(/déclarée ouverte.*MERGED/);
  });

  it('une gate déclarée verte contre une CI rouge est un écart', () => {
    const out = crossCheck([ok(MERGED)], prs([['#277', pr({ checks: 'failure' })]]));
    expect(out[0]?.message).toMatch(/gate verte.*CI/);
  });

  it('une revue GO sans aucune trace sur la PR est un écart (le garde-fou refuserait le merge)', () => {
    const out = crossCheck([ok(MERGED)], prs([['#277', pr({ reviewTraces: 0, latestReview: 'none' })]]));
    expect(out[0]?.message).toMatch(/revue GO.*aucune trace/);
  });

  it('une revue GO dont le dernier verdict est négatif est un écart', () => {
    const out = crossCheck([ok(MERGED)], prs([['#277', pr({ reviewTraces: 2, latestReview: 'negative' })]]));
    expect(out[0]?.message).toMatch(/revue GO.*dernier verdict.*négatif/);
  });

  it('une fiche bloquée ou sautée dont la PR est déjà mergée est un écart', () => {
    const blocked = crossCheck([ok('0500|bloquée|#123|rouge|-|-|CI rouge')], prs([['#123', pr({ state: 'MERGED' })]]));
    expect(blocked[0]?.message).toMatch(/déclarée bloquée, GitHub dit MERGED/);
    const skipped = crossCheck([ok('0501|sautée|#124|-|-|-|hors lot')], prs([['#124', pr({ state: 'MERGED' })]]));
    expect(skipped[0]?.message).toMatch(/déclarée sautée, GitHub dit MERGED/);
    // fermée sans merge : c'est cohérent avec « bloquée »
    expect(crossCheck([ok('0500|bloquée|#123|rouge|-|-|CI rouge')], prs([['#123', pr({ state: 'CLOSED' })]]))).toEqual([]);
  });

  it('une PR illisible n’est pas un écart : elle est dite « non vérifiée »', () => {
    const out = crossCheck([ok(MERGED)], prs([['#277', null]]));
    expect(out).toEqual([{ id: '0080', message: 'PR #277 illisible sur GitHub : non vérifiée' , severity: 'unverified' }]);
  });
});

describe('parsePrFacts — ce que dit gh pr view, réduit à ce que le bilan compare', () => {
  const view = (over: Record<string, unknown> = {}): unknown => ({
    state: 'MERGED',
    statusCheckRollup: [{ conclusion: 'SUCCESS', status: 'COMPLETED' }, { conclusion: 'SKIPPED', status: 'COMPLETED' }],
    reviews: [],
    comments: [],
    ...over,
  });

  it('lit l’état et une CI verte', () => {
    expect(parsePrFacts(view())).toEqual({ state: 'MERGED', checks: 'success', reviewTraces: 0, latestReview: 'none' });
  });

  it('une CI sans aucun check vaut « none », un check rouge vaut « failure », un check en cours « pending »', () => {
    expect(parsePrFacts(view({ statusCheckRollup: [] }))?.checks).toBe('none');
    expect(parsePrFacts(view({ statusCheckRollup: [{ conclusion: 'FAILURE', status: 'COMPLETED' }] }))?.checks).toBe('failure');
    expect(parsePrFacts(view({ statusCheckRollup: [{ conclusion: '', status: 'IN_PROGRESS' }] }))?.checks).toBe('pending');
  });

  it('compte les revues, et les commentaires qui portent un verdict ; pas les autres', () => {
    const out = parsePrFacts(
      view({
        reviews: [{ state: 'COMMENTED' }],
        comments: [{ body: 'Verdict de la revue adverse : GO' }, { body: 'deploy preview ready' }],
      }),
    );
    expect(out?.reviewTraces).toBe(2);
    expect(out?.latestReview).toBe('positive');
  });

  it('un verdict négatif n’est jamais une trace de GO : on garde le dernier, daté', () => {
    const changes = parsePrFacts(view({ reviews: [{ state: 'CHANGES_REQUESTED', submittedAt: '2026-10-01T10:00:00Z' }] }));
    expect(changes?.latestReview).toBe('negative');
    const nogo = parsePrFacts(view({ comments: [{ body: 'Verdict : NO-GO', createdAt: '2026-10-01T10:00:00Z' }] }));
    expect(nogo?.latestReview).toBe('negative');
    const fixed = parsePrFacts(
      view({
        comments: [
          { body: 'Verdict : NO-GO', createdAt: '2026-10-01T10:00:00Z' },
          { body: 'Verdict après correction : GO', createdAt: '2026-10-01T11:00:00Z' },
        ],
      }),
    );
    expect(fixed?.latestReview).toBe('positive');
    const regressed = parsePrFacts(
      view({
        reviews: [{ state: 'APPROVED', submittedAt: '2026-10-01T10:00:00Z' }],
        comments: [{ body: 'NO-GO : un bloquant est apparu', createdAt: '2026-10-01T12:00:00Z' }],
      }),
    );
    expect(regressed?.latestReview).toBe('negative');
  });

  it('une réponse illisible rend null (non vérifiée), jamais une exception', () => {
    expect(parsePrFacts(null)).toBeNull();
    expect(parsePrFacts('x')).toBeNull();
    expect(parsePrFacts({ state: 'DRAFT' })).toBeNull();
  });
});

describe('renderRunReport', () => {
  const head = (over: Partial<HeadFacts> = {}): HeadFacts => ({
    head: 'abc1234',
    branch: 'feat/x',
    originMain: 'def5678',
    behind: 0,
    ahead: 0,
    ...over,
  });
  const render = (lines: string[], extra: Partial<Parameters<typeof renderRunReport>[0]> = {}): string =>
    renderRunReport({
      lines: lines.map(ok),
      discrepancies: [],
      head: head(),
      tokens: {},
      github: 'checked',
      ...extra,
    });

  it('ouvre par « En clair » avec les comptes par état', () => {
    const out = render([MERGED, OPEN, BLOCKED]);
    expect(out.split('\n')[0]).toBe('RUN-REPORT');
    expect(out).toMatch(/En clair : 3 fiches traitées : 1 mergée, 1 PR ouverte, 1 bloquée, 0 sautée\./);
  });

  it('une ligne par fiche, avec les six champs', () => {
    const out = render([OPEN]);
    expect(out).toContain('0456');
    for (const part of ['PR-ouverte', '#278', 'verte', 'GO', 'à faire', 'attend la mise en main de #275']) {
      expect(out, part).toContain(part);
    }
  });

  it('dit la position de HEAD contre origin/main', () => {
    expect(render([MERGED])).toMatch(/HEAD abc1234 = origin\/main/);
    expect(render([MERGED], { head: head({ behind: 2 }) })).toMatch(/en retard de 2/);
    expect(render([MERGED], { head: head({ behind: 1, ahead: 3 }) })).toMatch(/divergé/);
    expect(render([MERGED], { head: head({ originMain: null }) })).toMatch(/origin\/main injoignable/);
    // --base release : la ligne dit la base réellement comparée, jamais « origin/main » en dur
    const release = render([MERGED], { head: head({ baseRef: 'origin/release', behind: 4 }) });
    expect(release).toMatch(/en retard de 4 sur origin\/release def5678/);
    expect(release).not.toMatch(/origin\/main/);
  });

  it('dit les jetons contre le plafond, ou qu’ils ne sont pas mesurés', () => {
    expect(render([MERGED], { tokens: { used: 420000, cap: 800000 } })).toMatch(/Jetons : 420 000 sur un plafond de 800 000 \(53 %\)/);
    expect(render([MERGED], { tokens: { used: 420000, setting: 'lean' } })).toMatch(/420 000 consommés/);
    expect(render([MERGED], { tokens: {} })).toMatch(/non mesurés/);
  });

  it('montre les écarts, et que la vérification GitHub a été sautée', () => {
    const out = render([MERGED], {
      discrepancies: [{ id: '0080', message: 'déclarée mergée, GitHub dit OPEN', severity: 'mismatch' }],
    });
    expect(out).toMatch(/Écarts avec GitHub/);
    expect(out).toContain('déclarée mergée, GitHub dit OPEN');
    expect(render([MERGED], { github: 'skipped' })).toMatch(/pris tel quel/);
  });

  it('finit par ce que cela veut dire pour le PO', () => {
    expect(render([MERGED])).toMatch(/Ce que ça veut dire pour toi : rien à faire/);
    const out = render([MERGED, OPEN, BLOCKED]);
    expect(out).toMatch(/Ce que ça veut dire pour toi : .*1 PR à merger.*#278/);
    expect(out).toMatch(/1 fiche bloquée à trancher/);
  });
});
