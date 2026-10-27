/**
 * Cœur pur — la DoR extensible par projet (fiche 20260815080414006, ADR-0016 amendé, ADR-0050).
 *
 * Le socle de la « prête » (problème / valeur / critères + dépendances externes si besoin) vit dans le
 * skill `ezk-backlog` et ne bouge pas. Un projet peut AJOUTER des slots dans `.vectorz/dor.yml`. Ce
 * module ne fait que le MÉCANIQUE (ADR-0001 : le script range, le LLM juge) :
 *   - `parseDorManifest` valide la forme du fichier (une clé inconnue est une erreur, jamais ignorée :
 *     une faute de frappe ne doit pas éteindre le gate en silence) ;
 *   - `checkFiche` dit, pour chaque slot déclaré, si la section existe, si elle a du contenu, si elle
 *     mentionne chaque item de la liste à balayer. Il ne juge JAMAIS la qualité de la réponse ;
 *   - `computeHealth` compte les fiches tirables, pour le seuil de lot (`health.min-ready`).
 *
 * AUCUNE I/O ici (ADR-0003) : la lecture du fichier vit dans `src/loaders/dor.ts`.
 */

export interface DorSlot {
  /** Identifiant stable, en kebab-case. */
  readonly id: string;
  /** Le titre de la section attendue dans la fiche (`## <heading>`), à la casse et aux accents près. */
  readonly heading: string;
  /** La question à trancher : ce que `groom` fait remplir et que le LLM juge. */
  readonly ask: string;
  /** La liste à balayer (ex. les surfaces du produit) : la section doit mentionner chacune. Peut être vide. */
  readonly items: readonly string[];
}

export interface DorManifest {
  readonly slots: readonly DorSlot[];
  /** Seuil de lot : en dessous, l'ouverture d'un sprint dit « groomez d'abord ». Absent = informatif. */
  readonly minReady?: number;
}

export type ParseResult =
  | { readonly ok: true; readonly manifest: DorManifest }
  | { readonly ok: false; readonly errors: readonly string[] };

const ROOT_KEYS = ['slots', 'health'];
const SLOT_KEYS = ['id', 'heading', 'ask', 'items'];
const HEALTH_KEYS = ['min-ready'];
const KEBAB = /^[a-z0-9][a-z0-9-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Minuscules, sans accents, espaces fusionnés : la comparaison tolérante des titres et des items. */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Un titre comparé sans décor markdown (gras, code) ni deux-points final. */
function plainHeading(text: string): string {
  return plain(text.replace(/[*_`]/g, '')).replace(/\s*:$/, '');
}

function unknownKeys(record: Record<string, unknown>, allowed: string[], path: string, errors: string[]): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      errors.push(`${path ? `${path}.` : ''}${key} : clé inconnue (attendu : ${allowed.join(', ')})`);
    }
  }
}

function parseSlot(raw: unknown, index: number, errors: string[]): DorSlot | undefined {
  const path = `slots[${index}]`;
  if (!isRecord(raw)) {
    errors.push(`${path} : attendu un objet (id, heading, ask, items)`);
    return undefined;
  }
  const before = errors.length;
  unknownKeys(raw, SLOT_KEYS, path, errors);
  if (!isFilled(raw.id)) errors.push(`${path}.id : attendu une chaîne non vide`);
  else if (!KEBAB.test(raw.id)) errors.push(`${path}.id : « ${raw.id} » doit être en kebab-case (a-z, 0-9, tirets)`);
  if (!isFilled(raw.heading)) errors.push(`${path}.heading : attendu une chaîne non vide`);
  if (!isFilled(raw.ask)) errors.push(`${path}.ask : attendu une chaîne non vide`);

  let items: string[] = [];
  if (raw.items !== undefined) {
    if (!Array.isArray(raw.items)) {
      errors.push(`${path}.items : attendu une liste de chaînes`);
    } else {
      items = raw.items.filter(isFilled).map((s) => s.trim());
      raw.items.forEach((item, i) => {
        if (!isFilled(item)) errors.push(`${path}.items[${i}] : attendu une chaîne non vide`);
      });
    }
  }
  if (errors.length > before) return undefined;
  return {
    id: (raw.id as string).trim(),
    heading: (raw.heading as string).trim(),
    ask: (raw.ask as string).trim(),
    items,
  };
}

/**
 * Valide la valeur BRUTE du YAML (déjà parsée). `undefined` / `null` / `{}` = un projet sans slot : le
 * socle 3+1 seul, comportement actuel.
 */
export function parseDorManifest(raw: unknown): ParseResult {
  if (raw === undefined || raw === null) return { ok: true, manifest: { slots: [] } };
  if (!isRecord(raw)) {
    return { ok: false, errors: ['racine : attendu un objet YAML (clés « slots » et « health »)'] };
  }
  const errors: string[] = [];
  unknownKeys(raw, ROOT_KEYS, '', errors);

  const slots: DorSlot[] = [];
  if (raw.slots !== undefined) {
    if (!Array.isArray(raw.slots)) {
      errors.push('slots : attendu une liste');
    } else {
      const ids = new Set<string>();
      const headings = new Set<string>();
      raw.slots.forEach((entry, index) => {
        const slot = parseSlot(entry, index, errors);
        if (!slot) return;
        if (ids.has(slot.id)) errors.push(`slots[${index}].id : id « ${slot.id} » déjà déclaré`);
        if (headings.has(plainHeading(slot.heading))) {
          errors.push(`slots[${index}].heading : titre « ${slot.heading} » déjà pris par un autre slot`);
        }
        ids.add(slot.id);
        headings.add(plainHeading(slot.heading));
        slots.push(slot);
      });
    }
  }

  let minReady: number | undefined;
  if (raw.health !== undefined) {
    if (!isRecord(raw.health)) {
      errors.push('health : attendu un objet (clé « min-ready »)');
    } else {
      unknownKeys(raw.health, HEALTH_KEYS, 'health', errors);
      const value = raw.health['min-ready'];
      if (value !== undefined) {
        if (typeof value === 'number' && Number.isInteger(value) && value >= 1) minReady = value;
        else errors.push('health.min-ready : attendu un entier ≥ 1');
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: minReady === undefined ? { slots } : { slots, minReady } };
}

// --- le mécanique d'une fiche -------------------------------------------------------------------

export type SlotState = 'ok' | 'vide' | 'incomplet';

export interface SlotReport {
  readonly slot: DorSlot;
  readonly state: SlotState;
  /** Les items de la liste à balayer que la section ne mentionne pas (état `incomplet`). */
  readonly missing: readonly string[];
  /** Pourquoi `vide` : la section manque, ou elle ne contient qu'un marqueur. */
  readonly reason?: 'absente' | 'sans contenu';
}

const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const HEADING = /^(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const FENCE = /^\s{0,3}(?:```|~~~)/;
/** Un « marqueur » n'est pas une réponse : à définir, à groomer, TODO, TBD, N.A. seul, points de suspension. */
const PLACEHOLDER = /^(?:\(?\s*à\s+(?:définir|groomer|compléter|remplir)[^)]*\)?|<\s*à\s+[^>]*>|todo|tbd|n(?:\/a|\.a\.?)|…|\.{3}|\?)$/i;

/** Les lignes de la section de titre `heading` (jusqu'au titre suivant de même niveau ou plus haut). */
function sectionLines(body: string, heading: string): string[] | undefined {
  const target = plainHeading(heading);
  const out: string[] = [];
  let inFence = false;
  let found = false;
  let level = 0;
  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      if (found) out.push(line);
      continue;
    }
    const m = inFence ? null : HEADING.exec(line);
    if (m) {
      const depth = m[1].length;
      if (found && depth <= level) break;
      if (!found && plainHeading(m[2]) === target) {
        found = true;
        level = depth;
        continue;
      }
    }
    if (found) out.push(line);
  }
  return found ? out : undefined;
}

/**
 * L'item est-il mentionné ? Comme MOT entier (pluriel simple toléré), jamais comme morceau d'un autre
 * mot : « site » ne doit pas se lire dans « nécessite » (faux vert relevé en revue). Le texte est déjà
 * passé par `plain` ; les bornes sont des lettres, chiffres ou `_` (un identifiant `readme_old` n'est pas `readme`).
 */
function mentions(text: string, item: string): boolean {
  const escaped = plain(item).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?:s|x)?(?![\\p{L}\\p{N}_])`, 'u').test(text);
}

/** Les lignes qui portent une vraie réponse : ni vides, ni commentaires HTML, ni marqueurs. */
function answerLines(lines: readonly string[]): string[] {
  return lines
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map((line) => line.trim().replace(/^(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/, '').trim())
    .filter((line) => line !== '' && !PLACEHOLDER.test(line));
}

/**
 * Pour chaque slot déclaré, dans l'ordre du manifeste : la section existe-t-elle, a-t-elle du contenu,
 * mentionne-t-elle chaque item ? Le corps seul est lu (le front-matter est retiré d'abord).
 */
export function checkFiche(manifest: DorManifest, ficheText: string): SlotReport[] {
  const body = ficheText.replace(FRONT_MATTER, '');
  return manifest.slots.map((slot): SlotReport => {
    const lines = sectionLines(body, slot.heading);
    if (lines === undefined) return { slot, state: 'vide', missing: [], reason: 'absente' };
    const answers = answerLines(lines);
    if (answers.length === 0) return { slot, state: 'vide', missing: [], reason: 'sans contenu' };
    const text = plain(answers.join(' '));
    const missing = slot.items.filter((item) => !mentions(text, item));
    return { slot, state: missing.length > 0 ? 'incomplet' : 'ok', missing };
  });
}

// --- la santé du lot -----------------------------------------------------------------------------

export interface FicheStock {
  /** L'id de la fiche — sert à croiser le signal « en cours » déduit des branches (ADR-0077). Optionnel : les fixtures qui ne testent pas « en cours » peuvent l'omettre. */
  readonly id?: string;
  readonly status: string;
  readonly type: string;
  readonly done: boolean;
  readonly blocked: string;
}

export interface Health {
  /** Le stock actif : prêtes (tirables ou bloquées), pas prêtes, en cours. Hors épics, livrées, terminales. */
  readonly total: number;
  /** `status: ready`, non bloquées : ce que `next --ready-only` peut tirer. */
  readonly ready: number;
  /** `status: idea` : à groomer. */
  readonly notReady: number;
  readonly inProgress: number;
  /** `status: ready` mais portant un drapeau `blocked:` : non tirables, comptées à part. */
  readonly blockedReady: number;
  readonly minReady?: number;
  /** `ready >= minReady`. Indéfini quand le projet ne déclare pas de seuil. */
  readonly enough?: boolean;
}

/** Ensemble vide partagé : défaut de `computeHealth` quand aucun signal de branche n'est fourni (comportement d'avant). */
const EMPTY_IDS: ReadonlySet<string> = new Set();

export function computeHealth(
  fiches: readonly FicheStock[],
  minReady?: number,
  inProgressIds: ReadonlySet<string> = EMPTY_IDS,
): Health {
  let ready = 0;
  let notReady = 0;
  let inProgress = 0;
  let blockedReady = 0;
  for (const fiche of fiches) {
    if (fiche.done || fiche.type === 'epic') continue;
    // « En cours » est CALCULÉ des branches ouvertes (ADR-0077), jamais lu d'un `status` écrit (il ne
    // l'est plus) : une fiche dont une branche `feat/<id>-…` est ouverte compte « en cours », pas tirable.
    if (fiche.id && inProgressIds.has(fiche.id)) {
      inProgress += 1;
      continue;
    }
    if (fiche.status === 'ready') {
      if (fiche.blocked) blockedReady += 1;
      else ready += 1;
    } else if (fiche.status === 'idea') notReady += 1;
  }
  const health: Health = {
    total: ready + notReady + inProgress + blockedReady,
    ready,
    notReady,
    inProgress,
    blockedReady,
  };
  return minReady === undefined ? health : { ...health, minReady, enough: ready >= minReady };
}

// ─── La règle de taille au grooming (fiche 20261013013553179) ────────────────────────────────
// « Une fiche tient dans un sprint » (règle token-economy/fiche-tient-dans-un-sprint) : au `ready`,
// on COMPTE les critères d'acceptation. Au-delà du seuil, on avertit et on propose un découpage —
// jamais un blocage (soupape PO : le groomeur juge si ça tient). Le compte des SURFACES reste au
// jugement du groomeur (pas de signal mécanique fiable dans la fiche). PUR.

/** Au-delà de ce nombre de critères d'acceptation, la fiche est probablement trop grosse pour un sprint. */
export const MAX_ACCEPTANCE_CRITERIA = 6;

/**
 * Le nombre de critères d'acceptation d'une fiche : les cases à cocher sous « Critères d'acceptation ».
 * À défaut de section nommée, on compte toutes les cases du corps (meilleure estimation).
 */
export function acceptanceCriteriaCount(markdown: string): number {
  const section = /##\s*Crit[eè]res?\s+d['’]acceptation[^\n]*\n([\s\S]*?)(?:\n#{1,6}\s|$)/i.exec(markdown);
  const scope = section?.[1] ?? markdown;
  return (scope.match(/^[ \t]*[-*]\s*\[[ xX]\]/gm) ?? []).length;
}

// ─── Réservation laissée en prose (fiche 20261015213921103) ──────────────────────────────────
// Un caveat « réservé panel/maquette, pas d'autonomie hands-off » écrit en PROSE échappe à l'intake :
// il ne lit que le champ `blocked:`. Ce SIGNAL (jamais un blocage) le repère quand AUCUN `blocked:`
// typé ne le porte, pour que « prête » le dise au lieu de le laisser surgir en plein build. Jugement
// humain derrière (ADR-0001) : une fiche qui ne fait que PARLER de réservations peut déclencher à tort,
// d'où un simple signal. PUR.

/** Phrases de réservation (déjà normalisées par `plainLoose` : minuscules, sans accents, '/ - ' → espace). */
export const RESERVATION_MARKERS: readonly string[] = [
  'hands off',
  'pas d autonomie',
  'pas en autonomie',
  'reserve panel',
  'reserve maquette',
  'reserve au panel',
  'reserve a la maquette',
  'reserve a un panel',
];

export interface ReservationSignal {
  readonly reserved: boolean;
  /** La phrase repérée (normalisée), pour le message. */
  readonly marker?: string;
}

/** `plain` + apostrophes, tirets et slashs réduits à des espaces : la comparaison des phrases. */
function plainLoose(text: string): string {
  return plain(text)
    .replace(/['’/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Une réservation est-elle écrite en PROSE sans `blocked:` typé ? Si `blocked` est non vide, elle est
 * déjà déclarée — rien à signaler. Sinon on cherche une phrase de réservation dans le corps (hors
 * front-matter). SIGNAL seulement : le groomeur juge (ADR-0001), jamais un refus automatique.
 */
export function reservationInProse(ficheText: string, blocked: string): ReservationSignal {
  if (blocked.trim() !== '') return { reserved: false };
  const body = plainLoose(ficheText.replace(FRONT_MATTER, ''));
  for (const marker of RESERVATION_MARKERS) {
    if (body.includes(marker)) return { reserved: true, marker };
  }
  return { reserved: false };
}
