/**
 * groom-pass — la passe de grooming d'UNE milestone, en un geste (fiche 20261015122120198).
 *
 * En clair : quand on prépare une milestone, groomer ses fiches une par une est fastidieux. Ce module
 * donne les DEUX faits déterministes dont la passe a besoin — le LLM, lui, groome (il remplit les slots
 * manquants, ADR-0001 : le script range, le LLM juge) :
 *   1. la SÉLECTION : quelles fiches actives de la milestone sont à mûrir, et lesquelles demandent un
 *      arbitrage humain (elles restent idée, nommées) — via le filtre d'éligibilité partagé ;
 *   2. le DELTA : après la passe, ce qui a bougé — prêtes / toujours idée (+ raison) / découpées / exclues.
 *
 * PUR (ADR-0003) : aucune I/O. Le bord `bin/backlog-groom-milestone.ts` charge les fiches et imprime.
 * La passe NE FORCE JAMAIS `ready` (c'est le gate `ready` qui promeut) et ne touche qu'UNE milestone.
 */
import { TERMINAUX } from '../core/fiche-schema.js';
import type { Fiche } from '../loaders/fiches.js';
import { blockedType, isKnownBlockedReason } from './blocked-reasons.js';
import { type Disposition, runDisposition } from './run-eligibility.js';
import type { VersionScope } from './version-scope.js';

/**
 * Périmètre permissif : la passe de grooming ignore la borne de version (ADR-0070). Préparer une
 * milestone n'est pas tirer — on groome ses idées quelle que soit leur version cible.
 */
const GROOM_SCOPE: VersionScope = {
  current: undefined,
  inScope: new Set(),
  deferred: [],
  empty: false,
  allVersions: true,
};

/** Une fiche de la milestone, classée par le filtre d'éligibilité partagé (`run-eligibility`). */
export interface GroomCandidate {
  id: string;
  title: string;
  status: string;
  /** `groom` = à mûrir ; `escalate` = arbitrage humain (reste idée) ; `build` = déjà prête. */
  disposition: Disposition;
  reason: string;
  message: string;
}

/** État d'une fiche au DÉBUT de la passe (instantané que le bord capture pour calculer le delta). */
export interface FicheSnapshot {
  id: string;
  status: string;
}

/** Le bilan d'une passe de grooming — les FAITS, pas la prose (le LLM/rendu l'habille). */
export interface GroomDelta {
  /** Passées `idea` → `ready` : prêtes pour le gate. */
  pretes: string[];
  /** Restées `idea` : la raison (blocage typé, ou « reste à arbitrer »). */
  toujoursIdee: { id: string; reason: string }[];
  /** Nouvelles fiches de la milestone (filles ajoutées par un découpage). */
  decoupees: string[];
  /** Sorties par fermeture sans livraison (superseded / merged / split). */
  exclues: { id: string; status: string }[];
}

const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Les fiches ACTIVES d'une milestone (hors `done/`), classées. Pur, déterministe (tri par id). */
export function selectMilestone(fiches: readonly Fiche[], milestone: string): GroomCandidate[] {
  return fiches
    // Actives de CETTE milestone : hors done/, hors statuts terminaux (superseded/merged/split —
    // closes, ni à mûrir ni à arbitrer). Le delta, lui, les comptera en « exclues ».
    .filter((f) => f.milestone === milestone && !f.done && !TERMINAUX.includes(f.status))
    .map((f) => {
      const v = runDisposition(
        { status: f.status, type: f.type, blocked: f.blocked, version: f.version },
        GROOM_SCOPE,
      );
      return {
        id: f.id,
        title: f.title,
        status: f.status,
        disposition: v.disposition,
        reason: v.reason,
        message: v.message,
      };
    })
    .sort(byId);
}

/** La raison pour laquelle une fiche est RESTÉE idée : le blocage typé, sinon « reste à arbitrer ». */
function stillIdeaReason(f: Fiche): string {
  if (f.blocked.trim() === '') return 'reste à arbitrer';
  return isKnownBlockedReason(f.blocked) ? blockedType(f.blocked) : 'blocked non typé';
}

/**
 * Le delta d'une passe : compare l'instantané de DÉBUT (`before`, capturé par le bord) à l'état COURANT
 * (`after`). Ne regarde que les fiches de la milestone. Pur.
 */
export function groomPassDelta(
  before: readonly FicheSnapshot[],
  after: readonly Fiche[],
  milestone: string,
): GroomDelta {
  const beforeIds = new Set(before.map((b) => b.id));
  const afterById = new Map(after.map((f) => [f.id, f] as const));
  const pretes: string[] = [];
  const toujoursIdee: { id: string; reason: string }[] = [];
  const exclues: { id: string; status: string }[] = [];

  for (const b of before) {
    const f = afterById.get(b.id);
    if (f === undefined) continue; // disparue de l'arbre (rare) : rien à dire
    if (TERMINAUX.includes(f.status)) {
      exclues.push({ id: b.id, status: f.status });
    } else if (b.status === 'idea' && f.status === 'ready') {
      pretes.push(b.id);
    } else if (b.status === 'idea' && f.status === 'idea') {
      toujoursIdee.push({ id: b.id, reason: stillIdeaReason(f) });
    }
  }

  const decoupees = after
    .filter((f) => f.milestone === milestone && !f.done && !beforeIds.has(f.id))
    .map((f) => f.id)
    .sort();

  return { pretes: pretes.sort(), toujoursIdee: [...toujoursIdee].sort(byId), decoupees, exclues: [...exclues].sort(byId) };
}

/** La sélection, en clair : ce que la passe va groomer, et ce qui reste à l'humain. */
export function renderGroomSelection(milestone: string, candidates: readonly GroomCandidate[]): string[] {
  const aGroomer = candidates.filter((c) => c.disposition === 'groom');
  const escalade = candidates.filter((c) => c.disposition === 'escalate');
  const pretes = candidates.filter((c) => c.disposition === 'build');
  const intro =
    candidates.length === 0
      ? `En clair : aucune fiche active dans la milestone « ${milestone} ».`
      : `En clair : milestone « ${milestone} » — ${aGroomer.length} à groomer, ${pretes.length} déjà prête(s), ${escalade.length} à arbitrer (humain).`;
  const lines: string[] = [];
  if (aGroomer.length > 0) {
    lines.push('', 'À groomer (auto-groom, sans forcer ready) :');
    for (const c of aGroomer) lines.push(`  ~ ${c.id} — ${c.title}`);
  }
  if (escalade.length > 0) {
    lines.push('', 'Arbitrage humain (restent idée) :');
    for (const c of escalade) lines.push(`  ! ${c.id} (${c.reason}) — ${c.title}`);
  }
  return [intro, ...lines];
}

/** Le rapport de delta, en clair : ce que la passe a changé. */
export function renderGroomDelta(milestone: string, delta: GroomDelta): string[] {
  const total = delta.pretes.length + delta.toujoursIdee.length + delta.decoupees.length + delta.exclues.length;
  const intro =
    total === 0
      ? `En clair : la passe sur « ${milestone} » n'a rien changé.`
      : `En clair : passe sur « ${milestone} » — ${delta.pretes.length} prête(s), ${delta.toujoursIdee.length} toujours idée, ${delta.decoupees.length} découpée(s), ${delta.exclues.length} exclue(s).`;
  const lines: string[] = [];
  if (delta.pretes.length > 0) {
    lines.push('', 'Prêtes (pour le gate `ready`) :');
    for (const id of delta.pretes) lines.push(`  ✓ ${id}`);
  }
  if (delta.toujoursIdee.length > 0) {
    lines.push('', 'Toujours idée (raison) :');
    for (const t of delta.toujoursIdee) lines.push(`  · ${t.id} — ${t.reason}`);
  }
  if (delta.decoupees.length > 0) {
    lines.push('', 'Découpées (filles ajoutées) :');
    for (const id of delta.decoupees) lines.push(`  + ${id}`);
  }
  if (delta.exclues.length > 0) {
    lines.push('', 'Exclues (closes sans livraison) :');
    for (const e of delta.exclues) lines.push(`  − ${e.id} (${e.status})`);
  }
  return [intro, ...lines];
}
