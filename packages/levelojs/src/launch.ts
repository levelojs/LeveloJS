// packages/levelojs/src/launch.ts
import { render } from './runtime/web/dom.js';

export type Component = () => any;

/**
 * Universal application launcher for LeveloJS.
 * Automatically adapts between Web (Direct DOM) and Native.
 */
export function launch(rootComponent: Component): void {
  // Web environment (Browser DOM)
  if (typeof document !== 'undefined') {
    render(rootComponent);
    return;
  }

  // Native environment
  if (typeof rootComponent === 'function') {
    rootComponent();
  }
}
