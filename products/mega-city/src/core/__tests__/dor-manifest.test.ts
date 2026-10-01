import { describe, expect, it } from 'vitest';
import { type DorManifest, checkFiche, computeHealth, parseDorManifest } from '../dor-manifest.js';

const SURFACES = {
  id: 'surfaces',
  heading: 'Surfaces impactées',
  ask: 'Pour chaque surface : oui, non, ou comment ?',
  items: ['doc', 'site', 'README'],
};

function manifestOf(...slots: DorManifest['slots'][number][]): DorManifest {
  return { slots };
}

/** Une fiche minimale : front-matter + titre + les sections données. */
function fiche(sections: string): string {
  return `---\nid: "1"\ntitle: "t"\nstatus: idea\n---\n\n# Titre\n\n${sections}\n`;
}

describe('parseDorManifest — le contrat du fichier .vectorz/dor.yml', () => {
  it('absent ou vide : aucun slot, le socle 3+1 seul (non-régression)', () => {
    expect(parseDorManifest(undefined)).toEqual({ ok: true, manifest: { slots: [] } });
    expect(parseDorManifest(null)).toEqual({ ok: true, manifest: { slots: [] } });
    expect(parseDorManifest({})).toEqual({ ok: true, manifest: { slots: [] } });
  });

  it('lit un slot complet et le seuil de lot', () => {
    const parsed = parseDorManifest({
      slots: [SURFACES],
      health: { 'min-ready': 3 },
    });
    expect(parsed).toEqual({ ok: true, manifest: { slots: [SURFACES], minReady: 3 } });
  });

  it('un slot sans items est valide (la section doit alors seulement être non vide)', () => {
    const parsed = parseDorManifest({ slots: [{ id: 'contrat', heading: 'Contrat API', ask: 'Quoi ?' }] });
    expect(parsed).toEqual({
      ok: true,
      manifest: { slots: [{ id: 'contrat', heading: 'Contrat API', ask: 'Quoi ?', items: [] }] },
    });
  });

  it('nomme le champ fautif', () => {
    const parsed = parseDorManifest({ slots: [{ id: 'surfaces', ask: 'Quoi ?' }] });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join('\n')).toContain('slots[0].heading');
  });

  it('refuse une clé inconnue : une faute de frappe ne désactive pas le gate en silence', () => {
    const racine = parseDorManifest({ slot: [SURFACES] });
    expect(racine.ok).toBe(false);
    if (!racine.ok) expect(racine.errors.join('\n')).toContain('slot : clé inconnue');

    const dansUnSlot = parseDorManifest({ slots: [{ ...SURFACES, headings: 'x' }] });
    expect(dansUnSlot.ok).toBe(false);
    if (!dansUnSlot.ok) expect(dansUnSlot.errors.join('\n')).toContain('slots[0].headings : clé inconnue');
  });

  it('refuse deux slots de même id ou de même titre', () => {
    const memeId = parseDorManifest({ slots: [SURFACES, { ...SURFACES, heading: 'Autre' }] });
    expect(memeId.ok).toBe(false);
    if (!memeId.ok) expect(memeId.errors.join('\n')).toContain('id « surfaces » déjà déclaré');

    const memeTitre = parseDorManifest({ slots: [SURFACES, { ...SURFACES, id: 'autre', heading: 'surfaces IMPACTEES' }] });
    expect(memeTitre.ok).toBe(false);
    if (!memeTitre.ok) expect(memeTitre.errors.join('\n')).toContain('titre « surfaces IMPACTEES » déjà pris');
  });

  it('refuse un id qui n’est pas en kebab-case, une liste d’items mal formée, un seuil absurde', () => {
    const id = parseDorManifest({ slots: [{ ...SURFACES, id: 'Surfaces Impactées' }] });
    expect(id.ok).toBe(false);

    const items = parseDorManifest({ slots: [{ ...SURFACES, items: ['doc', ''] }] });
    expect(items.ok).toBe(false);
    if (!items.ok) expect(items.errors.join('\n')).toContain('slots[0].items[1]');

    for (const bad of [0, -1, 2.5, '3', true]) {
      const seuil = parseDorManifest({ health: { 'min-ready': bad } });
      expect(seuil.ok, String(bad)).toBe(false);
      if (!seuil.ok) expect(seuil.errors.join('\n')).toContain('health.min-ready');
    }
  });

  it('refuse une racine qui n’est pas un objet', () => {
    expect(parseDorManifest(['slots']).ok).toBe(false);
    expect(parseDorManifest('slots').ok).toBe(false);
  });
});

describe('checkFiche — le mécanique du slot : présent, non vide, tous les items mentionnés', () => {
  const manifest = manifestOf(SURFACES);
  const etat = (text: string) => checkFiche(manifest, text)[0];

  it('section absente : vide', () => {
    const r = etat(fiche('## Contexte\n\nDu texte.'));
    expect(r.state).toBe('vide');
    expect(r.reason).toBe('absente');
  });

  it('section présente mais sans contenu ou avec un simple marqueur : vide', () => {
    for (const body of ['', '(à définir au grooming)', '<à groomer>', 'TODO', 'N.A.', '- …', '<!-- note -->']) {
      const r = etat(fiche(`## Surfaces impactées\n\n${body}\n\n## Suite\n\nx`));
      expect(r.state, body).toBe('vide');
      expect(r.reason, body).toBe('sans contenu');
    }
  });

  it('section présente mais un item n’est pas mentionné : incomplet, et nomme l’item', () => {
    const r = etat(fiche('## Surfaces impactées\n\n- doc : oui, la page d’accueil\n- site : non'));
    expect(r.state).toBe('incomplet');
    expect(r.missing).toEqual(['README']);
  });

  it('section complète : ok', () => {
    const r = etat(fiche('## Surfaces impactées\n\n- doc : oui\n- site : non, pas de page\n- README : N.A. — rien à dire'));
    expect(r.state).toBe('ok');
    expect(r.missing).toEqual([]);
  });

  it('« N.A. — raison » est une réponse, pas un marqueur', () => {
    const slot = { id: 'a', heading: 'Contrat', ask: 'q', items: [] };
    const r = checkFiche(manifestOf(slot), fiche('## Contrat\n\nN.A. — aucune API publique touchée')) [0];
    expect(r.state).toBe('ok');
  });

  it('la casse et les accents ne comptent pas (titre comme items)', () => {
    const r = etat(fiche('## SURFACES IMPACTEES\n\nDOC oui. Site non. readme non.'));
    expect(r.state).toBe('ok');
  });

  it('un titre décoré (gras, deux-points, niveau 3) est reconnu', () => {
    const r = etat(fiche('### **Surfaces impactées :**\n\ndoc, site, README : rien.'));
    expect(r.state).toBe('ok');
  });

  it('la section s’arrête au titre de même niveau ; les sous-titres en font partie', () => {
    const text = fiche('## Surfaces impactées\n\n### Détail\n\ndoc, site, README\n\n## Suite\n\nrien');
    expect(etat(text).state).toBe('ok');
    // Un item qui n’apparaît QU’APRÈS la section ne la remplit pas.
    const hors = fiche('## Surfaces impactées\n\ndoc, site\n\n## Suite\n\nREADME');
    expect(etat(hors).state).toBe('incomplet');
  });

  it('un titre dans un bloc de code ne compte pas', () => {
    const r = etat(fiche('```md\n## Surfaces impactées\n\ndoc site README\n```'));
    expect(r.state).toBe('vide');
    expect(r.reason).toBe('absente');
  });

  it('le front-matter n’est pas le corps : un commentaire YAML ne passe pas pour un titre', () => {
    const text = '---\nid: "1"\n# Surfaces impactées\nstatus: idea\n---\n\nCorps sans la section.\n';
    expect(checkFiche(manifest, text)[0].state).toBe('vide');
  });

  it('rend un rapport par slot déclaré, dans l’ordre du manifeste', () => {
    const deux = manifestOf(SURFACES, { id: 'contrat', heading: 'Contrat', ask: 'q', items: [] });
    const reports = checkFiche(deux, fiche('## Contrat\n\nOui.'));
    expect(reports.map((r) => [r.slot.id, r.state])).toEqual([
      ['surfaces', 'vide'],
      ['contrat', 'ok'],
    ]);
  });

  it('aucun slot déclaré : aucun rapport (le socle 3+1 seul)', () => {
    expect(checkFiche({ slots: [] }, fiche('rien'))).toEqual([]);
  });
});

describe('computeHealth — combien de fiches sont tirables (0100)', () => {
  const f = (status: string, extra: Partial<{ type: string; done: boolean; blocked: string }> = {}) => ({
    status,
    type: 'feature',
    done: false,
    blocked: '',
    ...extra,
  });

  it('compte prêtes, pas prêtes (idea), en cours ; ignore épics, livrées et terminales', () => {
    const health = computeHealth([
      f('ready'),
      f('ready'),
      f('idea'),
      f('idea'),
      f('idea'),
      f('in-progress'),
      f('ready', { type: 'epic' }),
      f('shipped'),
      f('superseded'),
      f('idea', { done: true }),
    ]);
    expect(health).toMatchObject({ total: 6, ready: 2, notReady: 3, inProgress: 1, blockedReady: 0 });
  });

  it('une fiche ready mais bloquée n’est pas tirable : comptée à part', () => {
    const health = computeHealth([f('ready'), f('ready', { blocked: 'attend le PO' })]);
    expect(health).toMatchObject({ total: 2, ready: 1, blockedReady: 1 });
  });

  it('sans seuil, enough reste indéfini (informatif)', () => {
    expect(computeHealth([f('idea')]).enough).toBeUndefined();
  });

  it('avec seuil : suffisant dès que prêtes ≥ seuil, insuffisant dessous', () => {
    expect(computeHealth([f('ready'), f('ready'), f('ready')], 3).enough).toBe(true);
    expect(computeHealth([f('ready'), f('ready')], 3).enough).toBe(false);
    expect(computeHealth([], 1).enough).toBe(false);
  });
});
