/**
 * Tests de `journal.ts` — lib d'append pure I/O du kit émetteur (fiche 0050).
 * Dérivés de la rubrique B du Gherkin (`kit-emetteur.feature`) : enveloppe imposée,
 * seq strictement croissant relu depuis le disque, écritures non entrelacées.
 */
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_URI, Journal, WRITE_LOCK_FILE, tryReclaimWriteLock } from '../journal.js';

describe('Journal — enveloppe et append (rubrique B)', () => {
  let tmpDir: string;
  let runDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-journal-'));
    runDir = path.join(tmpDir, '.supervision', 'runs', 'run-1');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('crée le dossier du run et le fichier events.jsonl', () => {
    const journal = new Journal(runDir, 'run-1');
    journal.append('run.started', { hello: 'world' });
    expect(fs.existsSync(path.join(runDir, 'events.jsonl'))).toBe(true);
  });

  it('chaque ligne contient exactement les champs imposés par l’enveloppe', () => {
    const journal = new Journal(runDir, 'run-1');
    journal.append('run.started', { foo: 'bar' });
    const lines = readLines(runDir);
    expect(lines).toHaveLength(1);
    const event = lines[0];
    expect(Object.keys(event).sort()).toEqual(
      ['contract', 'event_id', 'payload', 'run_id', 'seq', 'ts', 'type'].sort(),
    );
    expect(event.payload).toEqual({ foo: 'bar' });
  });

  it('seq démarre à 1 et croît strictement sans trou', () => {
    const journal = new Journal(runDir, 'run-1');
    journal.append('run.started', {});
    journal.append('gate.reached', {});
    journal.append('gate.resumed', {});
    const lines = readLines(runDir);
    expect(lines.map((l) => l.seq)).toEqual([1, 2, 3]);
  });

  it('le contract est une URI versionnée stable et identique sur toutes les lignes', () => {
    const journal = new Journal(runDir, 'run-1');
    journal.append('run.started', {});
    journal.append('run.finished', {});
    const lines = readLines(runDir);
    expect(lines[0].contract).toBe(CONTRACT_URI);
    expect(lines[1].contract).toBe(CONTRACT_URI);
  });

  it('tous les event_id sont uniques et tous les run_id identiques au run', () => {
    const journal = new Journal(runDir, 'run-1');
    journal.append('run.started', {});
    journal.append('gate.reached', {});
    const lines = readLines(runDir);
    expect(new Set(lines.map((l) => l.event_id)).size).toBe(2);
    expect(lines.every((l) => l.run_id === 'run-1')).toBe(true);
  });

  it('reprend le seq correct en relisant le fichier existant depuis un nouvel objet Journal', () => {
    const first = new Journal(runDir, 'run-1');
    first.append('run.started', {});
    first.append('gate.reached', {});

    // Nouvel objet, pas de compteur en mémoire partagé : preuve de relecture disque.
    const reopened = new Journal(runDir, 'run-1');
    const event = reopened.append('gate.resumed', {});
    expect(event.seq).toBe(3);

    const lines = readLines(runDir);
    expect(lines.map((l) => l.seq)).toEqual([1, 2, 3]);
  });

  it('le payload de l’appelant ne peut jamais écraser les champs d’enveloppe', () => {
    const journal = new Journal(runDir, 'run-1');
    const falsified = {
      seq: 9999,
      event_id: 'fake-event',
      run_id: 'autre-run',
      contract: 'contract://falsifie',
      gate_id: 'gate-1',
    };
    const event = journal.append('gate.reached', falsified);
    expect(event.seq).toBe(1);
    expect(event.event_id).not.toBe('fake-event');
    expect(event.run_id).toBe('run-1');
    expect(event.contract).toBe(CONTRACT_URI);
    // Les valeurs falsifiées, elles, restent dans le payload nesté tel quel (non
    // interprété comme enveloppe) — seule l'enveloppe est protégée.
    expect(event.payload.gate_id).toBe('gate-1');
  });

  it('deux écritures successives ne s’entrelacent jamais (append synchrone)', () => {
    const journal = new Journal(runDir, 'run-1');
    for (let i = 0; i < 20; i += 1) {
      journal.append('heartbeat', { i, uuid: randomUUID() });
    }
    const raw = fs.readFileSync(path.join(runDir, 'events.jsonl'), 'utf8');
    const rawLines = raw.split('\n').filter((l) => l.length > 0);
    expect(rawLines).toHaveLength(20);
    for (const line of rawLines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('deux Journal concurrents n’attribuent jamais le même seq (write lock)', () => {
    const a = new Journal(runDir, 'run-1');
    a.append('run.started', {});

    const left = new Journal(runDir, 'run-1');
    const right = new Journal(runDir, 'run-1');
    // Les deux croient nextSeq=2 avant append ; sous verrou chacun relit.
    const e1 = left.append('heartbeat', { who: 'left' });
    const e2 = right.append('heartbeat', { who: 'right' });
    expect(e1.seq).not.toBe(e2.seq);
    expect([e1.seq, e2.seq].sort((x, y) => x - y)).toEqual([2, 3]);
  });

  it('tryReclaimWriteLock récupère un verrou orphelin (PID mort / contenu vide)', () => {
    fs.mkdirSync(runDir, { recursive: true });
    const lockPath = path.join(runDir, WRITE_LOCK_FILE);
    fs.writeFileSync(lockPath, '999999999\n0\n'); // PID improbable + ts ancien
    expect(tryReclaimWriteLock(lockPath)).toBe(true);
    expect(fs.existsSync(lockPath)).toBe(false);

    // Contenu illisible mais frais → ne reclaim pas (fenêtre de publication)
    fs.writeFileSync(lockPath, '');
    expect(tryReclaimWriteLock(lockPath)).toBe(false);
    expect(fs.existsSync(lockPath)).toBe(true);

    // Contenu illisible et vieux → reclaim
    const old = Date.now() - 10_000;
    fs.utimesSync(lockPath, old / 1000, old / 1000);
    expect(tryReclaimWriteLock(lockPath, Date.now())).toBe(true);
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('tryReclaimWriteLock ne vole pas un verrou frais de ce process', () => {
    fs.mkdirSync(runDir, { recursive: true });
    const lockPath = path.join(runDir, WRITE_LOCK_FILE);
    fs.writeFileSync(lockPath, `${process.pid}\n${Date.now()}\n`);
    expect(tryReclaimWriteLock(lockPath)).toBe(false);
    expect(fs.existsSync(lockPath)).toBe(true);
    fs.unlinkSync(lockPath);
  });
});
function readLines(runDir: string): Array<{
  event_id: string;
  run_id: string;
  seq: number;
  ts: string;
  contract: string;
  type: string;
  payload: Record<string, unknown>;
}> {
  const raw = fs.readFileSync(path.join(runDir, 'events.jsonl'), 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l));
}
