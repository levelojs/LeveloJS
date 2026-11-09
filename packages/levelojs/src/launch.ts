// packages/levelojs/src/launch.ts
import { render } from "./runtime/web/dom.js";

export type Component = () => any;

/**
 * Universal application launcher for LeveloJS.
 * Automatically adapts between Web (Direct DOM) and Native
 */
export function launch(rootComponent: Component, target: string = "app"): void {
  // Web environment (Browser DOM)
  if (typeof document !== "undefined") {
    const container = document.getElementById(target) || document.body;
    render(rootComponent, container as HTMLElement);
    return;
  }

  // Native environment
  if (typeof rootComponent === "function") {
    rootComponent();
  }
}