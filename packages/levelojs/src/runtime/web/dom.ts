// packages/levelojs/src/runtime/web/dom.ts
import { setDefaultPageTitle } from '../head.js';

export type RenderInput = Element | (() => Element | null | undefined);

/**
 * Direct real-DOM mounting runtime for LeveloJS Web.
 * Zero-runtime overhead, no virtual DOM, no intermediate AST.
 */

export function render(rootComponent: RenderInput, container?: HTMLElement): void {
  const rootInstance = typeof rootComponent === 'function' ? rootComponent() : rootComponent;
  if (rootInstance instanceof Element && rootInstance.tagName.toUpperCase() === 'HTML') {
    // Preserve any CSS injected by bundler/plugins before document replacement
    const existingStyles = Array.from(
      document.head?.querySelectorAll('style, link[rel="stylesheet"]') || [],
    );
    document.documentElement.replaceWith(rootInstance);

    // Ensure <head> exists on the new <html> and re-attach preserved styles
    const head =
      document.head || document.documentElement.appendChild(document.createElement('head'));
    existingStyles.forEach((style) => head.appendChild(style));

    // Sync default page title from launch.tsx <title>
    if (document.title) {
      setDefaultPageTitle(document.title);
    }

    (window as any).__LEVELO_MOUNTED__ = true;
  } else if (container) {
    container.innerHTML = '';
    if (rootInstance instanceof Element) {
      container.appendChild(rootInstance);
    } else {
      console.log('[Levelo] App component must return an HTML Element');
    }
  } else {
    console.log('[Levelo] Root component must return an <html> element.');
  }
}

/**
 * Cleanly unmounts and wipes the target DOM container.
 */
export function unmount(container: HTMLElement | null): void {
  if (container) {
    container.innerHTML = '';
  }
}
