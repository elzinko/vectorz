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
  it('parke : version vidée, status idea, milestone parked, blocked typé', () => {
    const { text } = parkOutOfVersion(fiche(), { reason: 'à-découper', date: '2026-10-14' });
    const fm = frontMatter(text);
    expect(readField(fm, 'version')).toBe('');
    expect(readField(fm, 'status')).toBe('idea');
    expect(readField(fm, 'milestone')).toBe('parked');
    expect(blockedType(readField(fm, 'blocked'))).toBe('à-découper'); // reste une raison typée
    expect(readField(fm, 'blocked')).toContain('parké hors version');
    expect(readField(fm, 'blocked')).toContain('2026-10-14');
  });

  it('la version vidée est propre (`version:` sans espace en trop)', () => {
    const { text } = parkOutOfVersion(fiche(), { reason: 'attend-dépendance', date: '2026-10-14' });
    expect(text).toMatch(/^version:$/m);
    expect(text).not.toMatch(/^version: $/m);
  });

  it('rend la version quittée et une ligne de journal qui nomme la fiche, la raison, la réversibilité', () => {
    const { previousVersion, journal } = parkOutOfVersion(fiche(), { reason: 'à-découper', date: '2026-10-14' });
    expect(previousVersion).toBe('v0.16.0');
    expect(journal).toContain('20260101000000000');
    expect(journal).toContain('à-découper');
    expect(journal).toContain('v0.16.0');
    expect(journal).toContain('réversible');
  });

  it('une fiche sans version se parke aussi (journal « sans version »)', () => {
    const { previousVersion, journal } = parkOutOfVersion(fiche({ version: '' }), {
      reason: 'hérité',
      date: '2026-10-14',
    });
    expect(previousVersion).toBe('');
    expect(journal).toContain('sans version');
  });

  it('ne touche pas le corps de la fiche', () => {
    const { text } = parkOutOfVersion(fiche(), { reason: 'sous-revue', date: '2026-10-14' });
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
