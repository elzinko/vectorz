/**
 * jsdom ne mesure rien : React Flow veut `ResizeObserver` et `DOMMatrixReadOnly`. On les simule au
 * minimum, sans mocker la bibliothèque.
 */
import { vi } from 'vitest';

export function stubFlowBrowserApis(): void {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  class DOMMatrixReadOnlyStub {
    m22 = 1;
    constructor(public transform?: string) {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.stubGlobal('DOMMatrixReadOnly', DOMMatrixReadOnlyStub);
}
