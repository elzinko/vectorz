/**
 * ezk-chef-suggest — cœur PUR de `ezk-chef suggest` (fiche 20260831075615809).
 *
 * Détecte les candidats-recette d'un sprint qui vient de finir : une fiche livrée qui
 * porte au moins une galère résolue+validée+utile, attribuée SANS AMBIGUÏTÉ (session
 * mono-feature). Zéro I/O ici — le bord (bin/ezk-chef-suggest.ts) lit les fichiers et
 * appelle ce module. `suggest` PROPOSE, ne crée aucune fiche, ne recopie aucun code
 * (ADR-0013) : un candidat n'est qu'un pointeur + un motif.
 */

export interface GalereEntry {
  /** Titre de la galère (texte en gras de la puce, ex. "Root Directory Vercel oublié"). */
  title: string;
}

export interface ParsedSession {
  path: string;
  /** Ids de fiche listés sur l'entête `fiches:` (vide si le récit n'en a pas). */
  ficheIds: string[];
  /** Galères de la section « Galères & gestes (labo) » — déjà « corrigé + validé » par convention. */
  galeres: GalereEntry[];
}

export interface Candidate {
  ficheId: string;
  motif: string;
  pointeurs: string[];
}

/** Isole le corps d'une section `## <nom>` jusqu'au prochain `## ` (ou fin de fichier). */
function extractSection(content: string, name: string): string | undefined {
  const lines = content.split('\n');
  const headingIndex = lines.findIndex((line) => line.trim() === `## ${name}`);
  if (headingIndex === -1) return undefined;
  const rest = lines.slice(headingIndex + 1);
  const nextHeadingOffset = rest.findIndex((line) => /^##\s/.test(line));
  const body = nextHeadingOffset === -1 ? rest : rest.slice(0, nextHeadingOffset);
  return body.join('\n').trim();
}

/**
 * Découpe la section labo en galères : chaque puce top-level (`-`, `*` ou `+`) qui COMMENCE par un
 * titre en gras `**titre**` est une entrée. Les détails (symptôme/geste/raison) peuvent suivre sur
 * la même ligne (`- **Titre** — Symptôme : …`) ou sur des lignes indentées juste en dessous.
 */
function parseGaleres(sectionBody: string | undefined): GalereEntry[] {
  if (!sectionBody) return [];
  const galeres: GalereEntry[] = [];
  const bulletRe = /^[-*+][ \t]+\*\*(.+?)\*\*/gm;
  let match: RegExpExecArray | null;
  while ((match = bulletRe.exec(sectionBody)) !== null) {
    galeres.push({ title: match[1].trim() });
  }
  return galeres;
}

/** Entête `fiches: <id>[,<id>]` — première ligne non vide du fichier, sinon absente. */
function parseFicheIds(content: string): string[] {
  const firstLine = content.split('\n').find((line) => line.trim().length > 0);
  if (!firstLine) return [];
  const match = /^fiches:\s*(.+)$/.exec(firstLine.trim());
  if (!match) return [];
  return match[1]
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/** Parse le texte brut d'un récit de session (docs/sessions/*.md) — pure, pas de disque. */
export function parseSessionMarkdown(content: string, path: string): ParsedSession {
  return {
    path,
    ficheIds: parseFicheIds(content),
    galeres: parseGaleres(extractSection(content, 'Galères & gestes (labo)')),
  };
}

/**
 * Détecte les candidats-recette depuis les récits déjà attachés au sprint. Règle
 * d'attribution (fiche §2) : une session mono-feature (1 seul id sur `fiches:`) verse ses
 * galères à cette fiche ; une session multi-feature sans attribution par entrée explicite
 * (option B, réservée) reste « ambiguë » et ne produit AUCUN candidat — jamais de faux
 * positif « les deux features ». Zéro galère exploitable → zéro candidat (pas de bruit).
 */
export function detectCandidates(sessions: ParsedSession[]): Candidate[] {
  const byFiche = new Map<string, { titles: string[]; pointeurs: string[] }>();

  for (const session of sessions) {
    if (session.ficheIds.length !== 1) continue; // 0 id (orpheline) ou multi (ambigu) : on ignore
    if (session.galeres.length === 0) continue;

    const ficheId = session.ficheIds[0];
    const entry = byFiche.get(ficheId) ?? { titles: [], pointeurs: [] };
    entry.titles.push(...session.galeres.map((g) => g.title));
    entry.pointeurs.push(session.path);
    byFiche.set(ficheId, entry);
  }

  return Array.from(byFiche.entries()).map(([ficheId, { titles, pointeurs }]) => ({
    ficheId,
    motif: titles.join(' ; '),
    pointeurs,
  }));
}
