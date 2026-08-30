/**
 * Stubs en mémoire, ZÉRO I/O — ceux qu'utilisent les tests d'intégration du
 * domaine (même convention que `tools/outcomes/sources.ts#StubSource`).
 */
import type { BlockedEscalationEvent, JournalSource, SprintCheckpointEvent } from '../ports/JournalSource.js';
import type { MergedPrRecord, RepoSource, ShippedFicheRecord } from '../ports/RepoSource.js';
import type { TranscriptSource, UsageEvent } from '../ports/TranscriptSource.js';

export class StubJournalSource implements JournalSource {
  constructor(
    private readonly checkpoints: SprintCheckpointEvent[] = [],
    private readonly blockedEscalations: BlockedEscalationEvent[] = [],
    private readonly runStartedTs: string | undefined = undefined,
  ) {}

  listSprintCheckpoints(): SprintCheckpointEvent[] {
    return this.checkpoints;
  }

  listBlockedEscalations(): BlockedEscalationEvent[] {
    return this.blockedEscalations;
  }

  earliestRunStartedTs(): string | undefined {
    return this.runStartedTs;
  }
}

export class StubTranscriptSource implements TranscriptSource {
  constructor(private readonly events: UsageEvent[] = []) {}

  listUsageEvents(): UsageEvent[] {
    return this.events;
  }
}

export class StubRepoSource implements RepoSource {
  constructor(
    private readonly fiches: ShippedFicheRecord[] = [],
    private readonly prs: MergedPrRecord[] = [],
  ) {}

  listShippedFiches(): ShippedFicheRecord[] {
    return this.fiches;
  }

  listMergedPrs(): MergedPrRecord[] {
    return this.prs;
  }
}
