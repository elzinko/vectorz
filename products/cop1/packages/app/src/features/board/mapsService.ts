/**
 * mapsService — les documents de la méthode pour la vue « Cartes » (fiche 20261102123552184, ADR-086).
 *
 * La liste vient de `ezk --root <projet> board maps --json` ; le contenu d'un document, de
 * `ezk … board maps --file <id> <nom>`. Mission control ne lit jamais ces fichiers lui-même, et ne sert
 * qu'un nom que la méthode a listé : le fichier principal d'un document, ou ses données. Le dossier du
 * projet vient du registre, par son nom.
 */
import type { BoardProjectInput } from './boardProvider.js';
import type { EzkExecRunner } from './ezkExec.js';

export interface MapDocument {
  id: string;
  titre: string;
  type: 'html' | 'svg';
  fichier: string;
  donnees: string | null;
}

export interface MapsServiceDeps {
  projects: () => BoardProjectInput[];
  run: EzkExecRunner;
  now?: () => number;
}

export type MapsListResponse = { status: 200 | 404 | 502; body: unknown };
export type MapsFileResponse = { status: 200 | 404 | 502; contentType: string; body: string };

/** La liste bouge rarement : relue au plus toutes les 30 s, pour ne pas lancer `ezk` à chaque fichier. */
const LIST_TTL_MS = 30_000;

const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  svg: 'image/svg+xml',
  js: 'text/javascript; charset=utf-8',
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Traduit `ezk board maps --json` ; `null` si la forme n'est pas celle du contrat v1. */
export function translateMaps(json: unknown): MapDocument[] | null {
  if (!isRecord(json) || json.schema_version !== 1 || !Array.isArray(json.documents)) return null;
  const docs: MapDocument[] = [];
  for (const d of json.documents) {
    if (!isRecord(d)) return null;
    const { id, titre, type, fichier, donnees } = d;
    if (typeof id !== 'string' || typeof titre !== 'string' || typeof fichier !== 'string')
      return null;
    if (type !== 'html' && type !== 'svg') return null;
    if (donnees !== null && typeof donnees !== 'string') return null;
    docs.push({ id, titre, type, fichier, donnees });
  }
  return docs;
}

const firstLine = (text: string): string =>
  text
    .split('\n')
    .find((l) => l.trim() !== '')
    ?.trim() ?? '';

export class MapsService {
  private readonly cache = new Map<string, { at: number; docs: MapDocument[] }>();
  private readonly now: () => number;

  constructor(private readonly deps: MapsServiceDeps) {
    this.now = deps.now ?? Date.now;
  }

  private root(projet: string): string | undefined {
    return this.deps.projects().find((p) => p.name === projet)?.root;
  }

  /** La liste des documents, ou la raison pour laquelle la méthode ne l'a pas donnée. */
  private async documents(root: string): Promise<MapDocument[] | string> {
    const hit = this.cache.get(root);
    if (hit && this.now() - hit.at < LIST_TTL_MS) return hit.docs;
    const r = await this.deps.run(['--root', root, 'board', 'maps', '--json']);
    if (r.code !== 0)
      return `ezk a échoué (code ${r.code})${firstLine(r.stderr) ? ` : ${firstLine(r.stderr)}` : ''}`;
    let docs: MapDocument[] | null;
    try {
      docs = translateMaps(JSON.parse(r.stdout));
    } catch {
      docs = null;
    }
    if (docs === null) return 'ezk board maps --json : format inconnu';
    this.cache.set(root, { at: this.now(), docs });
    return docs;
  }

  async list(projet: string): Promise<MapsListResponse> {
    const root = this.root(projet);
    if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
    const docs = await this.documents(root);
    if (typeof docs === 'string') return { status: 502, body: { error: docs } };
    return { status: 200, body: { documents: docs } };
  }

  async file(projet: string, id: string, nom: string): Promise<MapsFileResponse> {
    const notFound: MapsFileResponse = {
      status: 404,
      contentType: 'text/plain; charset=utf-8',
      body: 'introuvable',
    };
    const root = this.root(projet);
    if (!root) return notFound;
    const docs = await this.documents(root);
    if (typeof docs === 'string')
      return { status: 502, contentType: 'text/plain; charset=utf-8', body: docs };
    const doc = docs.find((d) => d.id === id);
    // Seuls deux noms par document : son fichier et ses données. Le reste n'est jamais demandé à ezk.
    if (!doc || (nom !== doc.fichier && nom !== doc.donnees)) return notFound;
    const r = await this.deps.run(['--root', root, 'board', 'maps', '--file', id, nom]);
    if (r.code !== 0) {
      return {
        status: 502,
        contentType: 'text/plain; charset=utf-8',
        body: `ezk a échoué (code ${r.code})`,
      };
    }
    const ext = nom.slice(nom.lastIndexOf('.') + 1);
    return {
      status: 200,
      contentType: CONTENT_TYPES[ext] ?? 'text/plain; charset=utf-8',
      body: r.stdout,
    };
  }
}
