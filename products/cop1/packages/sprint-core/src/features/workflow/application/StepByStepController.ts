import type { StepByStepMode, StepByStepPort } from '../domain/ports/StepByStepPort.js';

export type ApprovalResolver = (context: {
  phase: 'intra' | 'inter';
  label?: string;
}) => Promise<'continue' | 'skip' | 'abort'>;

/**
 * Controls step-by-step pauses across intra- and inter-command phases (epoch-1 pilot).
 * Kept for unit tests; dogfood method = mega-city + Moniteur.
 */
export class StepByStepController implements StepByStepPort {
  private mode: StepByStepMode = 'none';
  private paused = false;

  constructor(private readonly resolver: ApprovalResolver = async () => 'continue') {}

  setMode(mode: StepByStepMode): void {
    this.mode = mode;
  }

  getMode(): StepByStepMode {
    return this.mode;
  }

  isPaused(): boolean {
    return this.paused;
  }

  async awaitApproval(context: {
    phase: 'intra' | 'inter';
    label?: string;
  }): Promise<'continue' | 'skip' | 'abort'> {
    if (!this.isPhaseActive(context.phase)) {
      return 'continue';
    }
    this.paused = true;
    try {
      return await this.resolver(context);
    } finally {
      this.paused = false;
    }
  }

  private isPhaseActive(phase: 'intra' | 'inter'): boolean {
    if (this.mode === 'none') return false;
    if (this.mode === 'both') return true;
    return this.mode === phase;
  }
}
