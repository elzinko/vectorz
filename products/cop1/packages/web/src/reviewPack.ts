/**
 * reviewPack.ts — parse un `REVIEW.md` (contrat `method-review@0.1`, fiche 0183 /
 * mega-city) en carte de reporting. Fonction PURE : zéro IO. La webapp de reporting
 * (fiche 0184, lot 1) est un LECTEUR — elle n'écrit jamais d'artefact ni n'invente
 * de collecte ; elle rend ce que le pack markdown-first (SoT) porte déjà.
 */

export interface ReviewCard {
  /** Chemin du `REVIEW.md` source (clé d'affichage). */
  path: string;
  fiche: string;
  branch: string;
  product: string;
  status: string;
  created: string;
  /** `name vX` reconstitué depuis le front-matter `method`. */
  method: string;
  /** Sections markdown du pack, indexées par titre (Résumé, Rendus, …). */
  sections: Record<string, string>;
}

/** Retire les guillemets YAML d'une valeur scalaire (render.ts en quote certaines). */
function stripQuotes(value: string): string {
  const t = value.trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return t;
}

/**
 * Parse un `REVIEW.md` rendu (front-matter YAML + sections `## `) en `ReviewCard`.
 * Tolérant : un champ absent devient une chaîne vide, jamais une valeur inventée.
 */
export function parseReviewPack(md: string, path = ''): ReviewCard {
  const fm: Record<string, string> = {};
  let methodName = '';
  let methodVersion = '';

  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (fmMatch) {
    let inMethod = false;
    for (const line of fmMatch[1].split('\n')) {
      const nested = line.match(/^\s{2}(name|version):\s*(.*)$/);
      if (inMethod && nested) {
        if (nested[1] === 'name') methodName = stripQuotes(nested[2]);
        else methodVersion = stripQuotes(nested[2]);
        continue;
      }
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv) continue;
      if (kv[1] === 'method') {
        inMethod = true;
        continue;
      }
      inMethod = false;
      fm[kv[1]] = stripQuotes(kv[2]);
    }
  }

  // Découpe en sections par titre `## ` — ligne à ligne, en respectant les blocs de
  // code clôturés (```), pour qu'un `## …` DANS une commande/un extrait ne soit pas
  // pris pour un titre (le contenu d'un pack contient du code, ex. section « À tester »).
  const sections: Record<string, string> = {};
  const body = fmMatch ? md.slice(fmMatch[0].length) : md;
  let currentHeading: string | null = null;
  let buffer: string[] = [];
  let inFence = false;
  const flush = () => {
    if (currentHeading !== null) sections[currentHeading] = buffer.join('\n').trim();
    buffer = [];
  };
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const heading = inFence ? null : line.match(/^## (.+)$/);
    if (heading) {
      flush();
      currentHeading = heading[1].trim();
    } else if (currentHeading !== null) {
      buffer.push(line);
    }
  }
  flush();

  const method = methodName
    ? methodVersion
      ? `${methodName} v${methodVersion}`
      : methodName
    : '';

  return {
    path,
    fiche: fm.fiche ?? '',
    branch: fm.branch ?? '',
    product: fm.product ?? '',
    status: fm.status ?? '',
    created: fm.created ?? '',
    method,
    sections,
  };
}
