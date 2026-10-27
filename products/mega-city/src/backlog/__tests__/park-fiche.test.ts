import { describe, expect, it } from 'vitest';
import { frontMatter, readField } from '../../loaders/fiches.js';
import { blockedType } from '../blocked-reasons.js';
import { parkGuard, parkOutOfVersion } from '../park-fiche.js';
import type { Disposition, EligibilityVerdict } from '../run-eligibility.js';

const fiche = (over: { version?: string; status?: string; milestone?: string } = {}): string =>
  [
    '---',
    'id: "20260101000000000"',
    'title: Une fiche inconstruisable',
    'type: feature',
    'priority: P2',
    `status: ${over.status ?? 'ready'}`,
    `milestone: ${over.milestone ?? ''}`,
    `version: ${over.version ?? 'v0.16.0'}`,
    'product: mega-city',
    'blocked:',
    '---',
    '',
    '# corps',
    '',
  ].join('\n');

describe('park-fiche — sortir une fiche de sa version (fiche 20261013131852779)', () => {
  it('parke : version vidée, status idea, milestone parked, blocked typé (un seul mot)', () => {
    const { text } = parkOutOfVersion(fiche(), { reason: 'oversized', date: '2026-10-14' });
    const fm = frontMatter(text);
    expect(readField(fm, 'version')).toBe('');
    expect(readField(fm, 'status')).toBe('idea');
    expect(readField(fm, 'milestone')).toBe('parked');
    expect(readField(fm, 'blocked')).toBe('oversized'); // un seul mot, pas de contexte collé
    expect(blockedType(readField(fm, 'blocked'))).toBe('oversized');
  });

  it('la version vidée est propre (`version:` sans espace en trop)', () => {
    const { text } = parkOutOfVersion(fiche(), { reason: 'dependency', date: '2026-10-14' });
    expect(text).toMatch(/^version:$/m);
    expect(text).not.toMatch(/^version: $/m);
  });

  it('rend la version quittée et une ligne de journal qui nomme la fiche, la raison, la date, la réversibilité', () => {
    const { previousVersion, journal } = parkOutOfVersion(fiche(), { reason: 'oversized', date: '2026-10-14' });
    expect(previousVersion).toBe('v0.16.0');
    expect(journal).toContain('20260101000000000');
    expect(journal).toContain('oversized');
    expect(journal).toContain('v0.16.0');
    expect(journal).toContain('parké hors version'); // le contexte vit dans le journal, pas dans blocked:
    expect(journal).toContain('2026-10-14');
    expect(journal).toContain('réversible');
  });

  it('une fiche sans version se parke aussi (journal « sans version »)', () => {
    const { previousVersion, journal } = parkOutOfVersion(fiche({ version: '' }), {
      reason: 'legacy',
      date: '2026-10-14',
    });
    expect(previousVersion).toBe('');
    expect(journal).toContain('sans version');
  });

  it('ne touche pas le corps de la fiche', () => {
    const { text } = parkOutOfVersion(fiche(), { reason: 'review', date: '2026-10-14' });
    expect(text).toContain('# corps');
  });
});

describe('parkGuard — « tenter avant de parker » (fiche 20261018234206166)', () => {
  const verdict = (disposition: Disposition): EligibilityVerdict => ({ disposition, reason: '', message: '' });

  it('refuse une fiche à groomer (idée) sans --after-groom', () => {
    const refus = parkGuard(verdict('groom'), false);
    expect(refus).toBeDefined();
    expect(refus).toContain('tente-la');
  });

  it('refuse une fiche prête (build) sans --after-groom', () => {
    expect(parkGuard(verdict('build'), false)).toBeDefined();
  });

  it('autorise avec --after-groom (tentative attestée), même à groomer', () => {
    expect(parkGuard(verdict('groom'), true)).toBeUndefined();
  });

  it('autorise de plein droit une fiche bloquée (escalate) ou hors version (defer)', () => {
    expect(parkGuard(verdict('escalate'), false)).toBeUndefined();
    expect(parkGuard(verdict('defer'), false)).toBeUndefined();
  });
});
