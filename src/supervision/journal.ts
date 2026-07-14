/**
 * `journal.ts` — lib d'append du kit émetteur de supervisabilité v0.1 (fiche 0050,
 * cop1 docs/captures/2026-07-13-contrat-methode-et-versions.md §7).
 *
 * Un run = un dossier `.supervision/runs/<run_id>/`, un fichier `events.jsonl`
 * append-only : 1 événement = 1 ligne JSON = 1 écriture synchrone (jamais
 * d'entrelacement possible entre deux écritures consécutives). L'enveloppe
 * {event_id, run_id, seq, ts, contract, type, payload} est TOUJOURS calculée ici,
 * jamais fournie par l'appelant — le payload de l'appelant est nesté sous `payload`
 * et ne peut jamais écraser un champ d'enveloppe.
 *
 * `seq` est en base 1, strictement croissant, et RELU depuis le fichier à chaque
 * ouverture d'un `Journal` (jamais un compteur en mémoire qui repart de zéro) :
 * c'est ce qui garantit la continuité après redémarrage du serveur (rubrique G).
 */
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** URI de contrat versionnée, stable sur tout le run (squelette v0.1 du §7). */
export const CONTRACT_URI = 'cop1/supervisability@0.1';

export interface JournalEvent {
  event_id: string;
  run_id: string;
  seq: number;
  ts: string;
  contract: string;
  type: string;
  payload: Record<string, unknown>;
}

/** Nom du fichier journal dans le dossier d'un run. */
const EVENTS_FILE = 'events.jsonl';

/**
 * Lit les événements valides d'un journal. Tolérant à la corruption (M1, §7) : une
 * dernière ligne non terminée par `\n` (écriture interrompue en cours d'append) ou
 * non JSON-parsable est DROPPÉE, jamais fatale — le run reste utilisable et le
 * `seq` reprend sur la dernière ligne valide.
 */
export function readJournalEvents(filePath: string): JournalEvent[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const endsWithNewline = raw.endsWith('\n');
  const rawLines = raw.split('\n').filter((line) => line.length > 0);
  // Fichier ne finissant pas par \n ⇒ la dernière ligne est potentiellement tronquée
  // (crash mid-write) : on ne la considère même pas comme candidate.
  const candidateLines = endsWithNewline ? rawLines : rawLines.slice(0, -1);
  const events: JournalEvent[] = [];
  for (const line of candidateLines) {
    try {
      events.push(JSON.parse(line) as JournalEvent);
    } catch {
      // Ligne invalide ⇒ jamais fatale (spec §7) : ignorée.
    }
  }
  return events;
}

/** Lit la dernière ligne valide du journal existant pour en extraire le `seq`. */
function readLastSeq(filePath: string): number {
  const events = readJournalEvents(filePath);
  if (events.length === 0) return 0;
  return events[events.length - 1].seq;
}

/** Un writer append-only sur le journal d'UN run. Sans état partagé entre instances. */
export class Journal {
  private readonly filePath: string;
  private nextSeqValue: number;

  constructor(
    runDir: string,
    private readonly runId: string,
  ) {
    fs.mkdirSync(runDir, { recursive: true });
    this.filePath = path.join(runDir, EVENTS_FILE);
    this.nextSeqValue = readLastSeq(this.filePath) + 1;
  }

  /** Le `seq` que prendra le PROCHAIN événement écrit — utile pour nommer un artefact avant append. */
  peekNextSeq(): number {
    return this.nextSeqValue;
  }

  /**
   * Lecture littérale du §7 (« dernière ligne sans \n : ignorée ») : si le fichier
   * existe déjà et ne se termine PAS par `\n` (dernière écriture interrompue en
   * cours d'append — crash mid-write, QUE le JSON de la queue soit complet ou non),
   * cette queue incomplète est TRONQUÉE du fichier avant d'ajouter la nouvelle
   * ligne — jamais refermée. Refermer par un simple `\n` ressusciterait une ligne
   * qu'`readJournalEvents` avait pourtant ignorée (seq non compté), produisant un
   * `seq` dupliqué et, si c'était un `gate.reached`, un gate fantôme (M1-edge).
   */
  private truncateTrailingIncompleteLine(): void {
    if (!fs.existsSync(this.filePath)) return;
    const buf = fs.readFileSync(this.filePath);
    if (buf.length === 0) return;
    const lastNewlineIndex = buf.lastIndexOf(0x0a); // '\n'
    const truncateAt = lastNewlineIndex + 1; // 0 si aucun \n trouvé
    if (truncateAt !== buf.length) {
      fs.truncateSync(this.filePath, truncateAt);
    }
  }

  /**
   * Écrit une ligne. L'enveloppe est calculée ici ; `payload` est nesté tel quel
   * (l'appelant ne peut donc jamais écraser `seq`/`event_id`/`run_id`/`contract`,
   * même s'il glisse ces noms de clés dans son propre payload).
   */
  append(type: string, payload: Record<string, unknown>): JournalEvent {
    this.truncateTrailingIncompleteLine();
    const event: JournalEvent = {
      event_id: randomUUID(),
      run_id: this.runId,
      seq: this.nextSeqValue,
      ts: new Date().toISOString(),
      contract: CONTRACT_URI,
      type,
      payload,
    };
    fs.appendFileSync(this.filePath, `${JSON.stringify(event)}\n`, { encoding: 'utf8' });
    this.nextSeqValue += 1;
    return event;
  }
}
