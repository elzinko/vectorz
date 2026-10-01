/**
 * La route d'écriture du tableau de bord — `POST /api/verdict` (fiche 20260826072532622, ADR-0057).
 *
 * C'est la SEULE écriture du tableau de bord. Le garde-fou (méthode, Host, Origin, type, taille,
 * id, verdict) est dans `core/verdicts.ts`, pur et testé cas par cas ; ici on lit le corps — en
 * s'arrêtant dès qu'il dépasse la limite —, on appelle le garde-fou, puis on écrit le fichier.
 * Un refus rend un code HTTP et n'écrit RIEN.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  MAX_BODY_BYTES,
  type RequestEnvelope,
  type VerdictRequest,
  checkVerdictRequest,
} from '../core/verdicts.js';
import { loadFiches } from '../loaders/fiches.js';
import { writeVerdict } from './verdicts.js';

export const VERDICT_ROUTE = '/api/verdict';

export interface EndpointContext {
  /** Racine du dépôt : le seul dossier écrit est `features/reviews/verdicts/` dessous. */
  repoRoot: string;
  /** Le jour du verdict, `AAAA-MM-JJ`. Injectable pour les tests ; défaut : le jour local. */
  today?: () => string;
}

export interface EndpointResult {
  status: number;
  body: Record<string, unknown>;
}

const localDay = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Garde-fou puis écriture, sur une requête déjà lue. Synchrone : tout le travail tient là. */
export function handleVerdictRequest(req: RequestEnvelope, ctx: EndpointContext): EndpointResult {
  const check = checkVerdictRequest(req, (id) => loadFiches(ctx.repoRoot).some((f) => f.id === id));
  if (!check.ok) return { status: check.status, body: { ok: false, error: check.error } };
  const { id, verdict }: VerdictRequest = check.request;
  const date = (ctx.today ?? localDay)();
  writeVerdict(ctx.repoRoot, id, verdict, date);
  return {
    status: 200,
    body: verdict === 'none' ? { ok: true, id, verdict } : { ok: true, id, verdict, date },
  };
}

/** Lit le corps de la requête, mais s'arrête dès que `max` octets sont dépassés (`null` = trop gros). */
function readCapped(req: IncomingMessage, max: number): Promise<string | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooBig = false;
    req.on('data', (chunk: Buffer) => {
      if (tooBig) return; // le reste du flux est lu pour être jeté, jamais gardé en mémoire
      size += chunk.length;
      if (size > max) {
        tooBig = true;
        chunks.length = 0;
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(null));
  });
}

/** Les en-têtes de Node, ramenés à du texte (un en-tête répété est joint). */
function plainHeaders(req: IncomingMessage): RequestEnvelope['headers'] {
  const out: RequestEnvelope['headers'] = {};
  for (const [name, value] of Object.entries(req.headers)) {
    out[name] = Array.isArray(value) ? value.join(', ') : value;
  }
  return out;
}

function reply(res: ServerResponse, { status, body }: EndpointResult): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    // Une requête refusée en cours de lecture ne doit pas garder la connexion ouverte.
    ...(status === 413 ? { Connection: 'close' } : {}),
  });
  res.end(JSON.stringify(body));
}

/** Sert la route : lit le corps (plafonné), passe par le garde-fou, répond en JSON. Ne jette jamais. */
export async function serveVerdict(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: EndpointContext,
): Promise<void> {
  try {
    const headers = plainHeaders(req);
    // Hors POST, ou corps annoncé trop gros : on répond sans lire le corps.
    const announced = Number(headers['content-length'] ?? 0);
    const body =
      req.method !== 'POST'
        ? ''
        : announced > MAX_BODY_BYTES
          ? null
          : await readCapped(req, MAX_BODY_BYTES);
    if (body === null) {
      reply(res, {
        status: 413,
        body: { ok: false, error: `corps trop gros : ${MAX_BODY_BYTES} octets au plus` },
      });
      return;
    }
    reply(res, handleVerdictRequest({ method: req.method ?? '', headers, body }, ctx));
  } catch (err) {
    reply(res, { status: 500, body: { ok: false, error: `écriture impossible : ${(err as Error).message}` } });
  }
}
