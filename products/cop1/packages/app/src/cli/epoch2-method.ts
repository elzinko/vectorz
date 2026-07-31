/** Shared operator message when an époque-1 pilot CLI command was removed in E4. */
export const EPOCH2_METHOD_MESSAGE = `This cop1 pilot command was removed in epoch 2 (E4 / ADR-029).

Dogfood method: mega-city — ezk-backlog, ezk-sprint, ezk-archive.
Supervision: cop1 start + Moniteur (GET /api/supervision/runs, ADR-028).

BMAD as external emitter on another project: fiche 2058 + cop1 init-bmad-bridge.`;

export function exitWithEpoch2MethodHint(command: string): never {
  console.error(`cop1 ${command}: ${EPOCH2_METHOD_MESSAGE}`);
  process.exit(1);
}
