/**
 * Le catalogue des moments respecte son contrat (ADR-0065, fiche 20261004101755756) :
 * noms uniques, sortes connues, et les moments attendus présents. Un nom en double ou
 * une sorte inconnue fait ÉCHOUER la validation (critère d'acceptation de la fiche).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateMomentsDoc } from '../core/moments.js';
import { loadMomentsDoc } from '../loaders/moments.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = loadMomentsDoc(megaCity);

describe('le catalogue des moments', () => {
  it('se charge et se valide depuis moments.yml', () => {
    expect(doc.moments.length).toBeGreaterThan(0);
  });

  it('rattache les six événements de la supervision', () => {
    const sup = [
      'run.started',
      'gate.reached',
      'gate.resumed',
      'escalation',
      'heartbeat',
      'run.finished',
    ];
    for (const nom of sup) {
      const m = doc.moments.find((x) => x.nom === nom);
      expect(m, `moment supervision manquant : ${nom}`).toBeDefined();
      expect(m?.sorte).toBe('evenement');
    }
  });

  it('porte les verbes changes et integrate comme commandes', () => {
    for (const nom of ['changes', 'integrate']) {
      const m = doc.moments.find((x) => x.nom === nom && x.sorte === 'commande');
      expect(m, `commande manquante : ${nom}`).toBeDefined();
    }
  });

  it('porte les moments 0171 (issue au ready, release en fin de version) comme événements', () => {
    for (const nom of ['story.readied', 'version.closed']) {
      const m = doc.moments.find((x) => x.nom === nom && x.sorte === 'evenement');
      expect(m, `événement 0171 manquant : ${nom}`).toBeDefined();
    }
  });

  it('porte la revue comme avis', () => {
    const m = doc.moments.find((x) => x.nom === 'review.verdict' && x.sorte === 'avis');
    expect(m).toBeDefined();
  });

  it('REFUSE un nom en double', () => {
    const dup = { moments: [doc.moments[0], doc.moments[0]] };
    expect(() => validateMomentsDoc(dup)).toThrow();
  });

  it('REFUSE une sorte inconnue', () => {
    const bad = { moments: [{ ...doc.moments[0], sorte: 'inconnue' }] };
    expect(() => validateMomentsDoc(bad)).toThrow();
  });
});
