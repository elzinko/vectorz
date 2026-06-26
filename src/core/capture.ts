/**
 * `capture` — cœur PUR + orchestrateur (ADR-0004, fiche 0002).
 *
 * RÈGLE D'OR (lifefindsaway) : le LLM ne RANGE jamais. Il rédige (`author`) et
 * juge (`judge`) AUX BORDS ; le rangement (artefact + journal + commit) est fait
 * par le CŒUR déterministe. Ici :
 *   - `planCapture` est PUR : calcule un `CapturePlan` (aucun disque, git, LLM, ni
 *     `Date.now()` — la date est un paramètre). 100 % testable, déterministe.
 *   - `capture` orchestre : author → judge (bords LLM) PUIS planCapture (pur) PUIS
 *     applyCapture (la seule frontière I/O). L'écriture vient toujours APRÈS l'avis.
 */
import matter from 'gray-matter';
import type { LearningEntry, Rule } from '../domain/model.js';
import type { FileWrite } from '../domain/plan.js';
import { assertSafeId } from '../loaders/catalog.js';
import { applyCapture } from '../io/capture.js';

/** Les bords LLM, injectés. Mockés en test : zéro appel réel dans la CI (ADR-0004 §2). */
export interface CapturePorts {
  /** Rédige le markdown de l'artefact. */
  author(brief: string): Promise<string>;
  /** Avis NON bloquant (cohérence/doublon) ; ses notes alimentent le résumé du journal. */
  judge(candidate: string, corpus: Rule[]): Promise<{ ok: boolean; notes: string }>;
}

/** Sortie pure de `planCapture` — ce que la coquille I/O doit matérialiser, rien de plus. */
export interface CapturePlan {
  artifact: FileWrite;
  journalLine: string;
  commitMessage: string;
}

type CaptureKind = LearningEntry['kind'];

/**
 * UN seul point de discrimination du `kind` (invariant ADR-0002) :
 *   - `dir`  : dossier du catalogue où atterrit l'artefact.
 *   - `ruleKind` : si défini, l'artefact est une Rule et porte ce `kind` en frontmatter.
 */
const DESTINATIONS: Record<CaptureKind, { dir: string; ruleKind?: Rule['kind'] }> = {
  rule: { dir: 'rules', ruleKind: 'disposition' },
  interaction: { dir: 'rules', ruleKind: 'interaction' },
  skill: { dir: 'skills' },
  agent: { dir: 'agents' },
};

/** Construit le markdown+frontmatter de l'artefact (id, kind éventuel, corps rédigé). */
function buildArtifactContent(id: string, ruleKind: Rule['kind'] | undefined, authored: string): string {
  const frontmatter: Record<string, string> = { id };
  if (ruleKind) frontmatter.kind = ruleKind;
  return matter.stringify(`\n${authored}\n`, frontmatter);
}

/** Une ligne du journal append-only : `| date | cible | type | résumé | commit |`. */
function buildJournalLine(date: string, target: string, kind: CaptureKind, summary: string): string {
  // colonne `commit` vide au POC : on ne peut inclure son propre sha (ADR-0004 §4).
  return `| ${date} | ${target} | ${kind} | ${summary} | |`;
}

/**
 * PUR — calcule le plan de capture. Déterministe : aucun `Date.now()`, aucun aléatoire ;
 * la `date` et le markdown `authored` sont des paramètres.
 */
export function planCapture(
  target: string,
  kind: CaptureKind,
  authored: string,
  date: string,
  summary = '',
): CapturePlan {
  const id = assertSafeId(target);
  const { dir, ruleKind } = DESTINATIONS[kind];
  return {
    artifact: {
      path: `${dir}/${id}.md`,
      content: buildArtifactContent(id, ruleKind, authored),
    },
    journalLine: buildJournalLine(date, id, kind, summary),
    commitMessage: `chore(capture): ${kind} ${id}`,
  };
}

/** Résumé de journal : trace l'avis du juge (un `ok:false` est consigné, jamais bloquant). */
function summarize(kind: CaptureKind, target: string, verdict: { ok: boolean; notes: string }): string {
  const prefix = `capture ${kind} ${target}`;
  return verdict.ok ? `${prefix} — ${verdict.notes}` : `${prefix} — avis: ${verdict.notes}`;
}

/**
 * Orchestrateur : author → judge (bords LLM) PUIS planCapture (pur) PUIS applyCapture (I/O).
 * Incarne « le LLM ne range jamais » : la seule écriture est dans `applyCapture`, en dernier.
 */
export async function capture(
  target: string,
  kind: CaptureKind,
  ports: CapturePorts,
  options: { rootDir: string; date: string },
): Promise<void> {
  const authored = await ports.author(`${kind}: ${target}`);
  // corpus vide au POC : le juge reste consultatif mais ne voit pas encore le
  // catalogue (pas de détection de doublon). Chargement d'un vrai corpus = fiche backlog.
  const verdict = await ports.judge(authored, []);
  const plan = planCapture(target, kind, authored, options.date, summarize(kind, target, verdict));
  applyCapture(plan, options.rootDir);
}
