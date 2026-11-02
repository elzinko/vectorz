/**
 * requestGuard — la garde des requêtes du daemon (fiche 20261102165708468). PURE : elle lit trois
 * en-têtes et rend un verdict, sans I/O.
 *
 * Le daemon n'écoute que sur 127.0.0.1, mais le navigateur du poste est déjà « à l'intérieur ». Une
 * page d'un autre site peut lui envoyer une écriture « simple » (POST `text/plain`), que le navigateur
 * envoie sans demander la permission. Un nom de domaine qui pointe vers 127.0.0.1 l'atteint aussi, et
 * peut alors lire ses routes. D'où trois contrôles :
 *  - toutes les routes : le Host est `127.0.0.1`, `localhost` ou `[::1]`, sur le port du daemon ;
 *  - les écritures (POST, PUT, PATCH, DELETE) : l'Origin est absente (terminal, script) ou celle de la
 *    page de mission control, ou du daemon lui-même ;
 *  - les écritures : le corps est déclaré `application/json`.
 *
 * Modèle : la garde de la méthode (mega-city `src/core/verdicts.ts`, ADR-0057). Mission control ne
 * l'importe pas : l'ADR-021 lui interdit d'importer le code de mega-city.
 */

/** Les ports qui fixent ce qui est « local » : celui du daemon, et celui de sa page web. */
export interface GuardContext {
  daemonPort: number;
  webPort: number;
}

export interface RequestHeaders {
  method: string;
  host?: string;
  origin?: string;
  contentType?: string;
}

export type GuardVerdict = { ok: true } | { ok: false; status: 403 | 415; reason: string };

const LOCAL_HOSTNAMES = ['127.0.0.1', 'localhost', '[::1]'];
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function localAuthorities(port: number): string[] {
  return LOCAL_HOSTNAMES.map((hostname) => `${hostname}:${port}`);
}

/** Le verdict de la garde pour une requête : passer, ou refuser avec un code HTTP et une raison. */
export function guardRequest(headers: RequestHeaders, ctx: GuardContext): GuardVerdict {
  const host = headers.host?.toLowerCase();
  if (!host || !localAuthorities(ctx.daemonPort).includes(host)) {
    return { ok: false, status: 403, reason: 'host_refused' };
  }
  if (!WRITE_METHODS.has(headers.method.toUpperCase())) return { ok: true };

  if (headers.origin !== undefined) {
    const allowed = [...localAuthorities(ctx.webPort), ...localAuthorities(ctx.daemonPort)].map(
      (authority) => `http://${authority}`,
    );
    if (!allowed.includes(headers.origin.toLowerCase())) {
      return { ok: false, status: 403, reason: 'origin_refused' };
    }
  }

  const type = headers.contentType?.split(';')[0]?.trim().toLowerCase();
  if (type !== 'application/json')
    return { ok: false, status: 415, reason: 'content_type_refused' };
  return { ok: true };
}
