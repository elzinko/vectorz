/**
 * Cas d'usage : abandon d'un run orphelin depuis le Moniteur.
 * ADR-035 D4 — la politique vit ici, pas dans l'adaptateur ni dans le front.
 *
 * Trois gardes (dans l'ordre) :
 *   1. runDir doit être une clé de la map de snapshots (404 sinon)
 *   2. snapshot state='running' ET liveness='presumed_dead' (409 sinon)
 *   3. abandon_command configurée (409 + marche à suivre sinon)
 *
 * Pas de mise à jour optimiste du snapshot (ADR-035 D6) : c'est le watcher
 * qui referme la boucle après écriture sur disque.
 */
import type { RunAbandonPort } from '../domain/RunAbandonPort.js';
import type { RunSnapshot } from '../domain/RunSnapshot.js';

export type AbandonRunResult =
  | { status: 200 | 202; runId: string }
  | { status: 404; error: string }
  | { status: 409; error: string };

export interface AbandonRunUseCaseOptions {
  /** Map live des snapshots (source de vérité serveur — D4 §1). */
  getSnapshot: (runDir: string) => RunSnapshot | undefined;
  /** Port injecté (EmitterCliAbandonAdapter en prod, stub en test). */
  abandonPort: RunAbandonPort;
  /** Commande CLI d'abandon depuis la config du siège (D3). Vide = dormante. */
  abandonCommand: string[];
}

export class AbandonRunUseCase {
  private readonly getSnapshot: (runDir: string) => RunSnapshot | undefined;
  private readonly abandonPort: RunAbandonPort;
  private readonly abandonCommand: string[];

  constructor(options: AbandonRunUseCaseOptions) {
    this.getSnapshot = options.getSnapshot;
    this.abandonPort = options.abandonPort;
    this.abandonCommand = options.abandonCommand;
  }

  async execute(runDir: string): Promise<AbandonRunResult> {
    // D4 §1 — runDir doit être une clé connue du serveur
    const snapshot = this.getSnapshot(runDir);
    if (!snapshot) {
      return { status: 404, error: `Run inconnu du serveur : ${runDir}` };
    }

    // D4 §2 — run running + presumed_dead uniquement
    if (snapshot.state !== 'running' || snapshot.liveness !== 'presumed_dead') {
      const reason =
        snapshot.state !== 'running'
          ? `le run est dans l'état "${snapshot.state}" (seul "running" est abandonneable)`
          : `le run est vivant (liveness="${snapshot.liveness}") — on n'abandonne pas un run qui répond`;
      return { status: 409, error: reason };
    }

    // D4 §3 — abandon_command configurée
    if (this.abandonCommand.length === 0) {
      return {
        status: 409,
        error:
          'La capacité d\'abandon est dormante (abandon_command non configurée). ' +
          'Configurez supervision.abandon_command dans cop1.config.yaml. ' +
          'Exemple : ["npx", "mega-city", "supervision:abandon"]',
      };
    }

    // Délègue au port (D2) — jamais d'écriture directe ici
    const outcome = await this.abandonPort.abandon({
      projectRoot: snapshot.projectRoot,
      expectedRunId: snapshot.runId,
    });

    if (!outcome.ok) {
      return { status: 409, error: outcome.reason };
    }

    // D6 : pas de mise à jour optimiste — le watcher referme la boucle
    return { status: 200, runId: outcome.runId };
  }
}
