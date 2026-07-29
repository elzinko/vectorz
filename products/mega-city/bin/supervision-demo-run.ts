#!/usr/bin/env node
/**
 * Déroulé AC1 (fiche 0050) : joue la méthode jouet supervision-demo (2 gates) en
 * pilotant DIRECTEMENT le runtime du kit émetteur — même moteur que le serveur MCP,
 * sans client LLM. Produit un journal réel sous <racine>/.supervision/runs/<run_id>/,
 * à faire vérifier par le validateur cop1 (voir src/supervision/README.md,
 * § « Conformité prouvée »). Banc d'essai jetable, pas une méthode de prod.
 *
 * usage : pnpm exec tsx bin/supervision-demo-run.ts <racine-projet-supervisé>
 */
import { SupervisionRuntime } from '../src/supervision/runtime.js';

const root = process.argv[2];
if (!root) {
  console.error('usage: supervision-demo-run.ts <racine-projet-supervisé>');
  process.exit(2);
}

const rt = new SupervisionRuntime(root);
const { run_id } = rt.runStart({
  method_name: 'supervision-demo',
  method_version: '0.1.0',
  seat: 'human',
});
rt.heartbeat({ note: 'étape 1 simulée' });
rt.escalate({ type: 'blocked', detail: 'escalade factice de démo (signal non-bloquant)' });
const g1 = rt.gateReached({
  gate_id: 'demo-gate-1',
  outcome: 'ok',
  report_markdown: 'Étape 1 simulée — résumé jouet.',
});
rt.gateResumed({ gate_event_id: g1.gate_event_id });
rt.heartbeat({ note: 'étape 2 simulée' });
const g2 = rt.gateReached({
  gate_id: 'demo-gate-2',
  outcome: 'ok',
  report_markdown: 'Étape 2 simulée — résumé jouet.',
});
rt.gateResumed({ gate_event_id: g2.gate_event_id });
rt.runFinished({ status: 'success' });
console.log(run_id);
