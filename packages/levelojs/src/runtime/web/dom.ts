// packages/levelojs/src/runtime/web/dom.ts

export type RenderInput = Element | (() => Element | null | undefined);

/**
 * Direct real-DOM mounting runtime for LeveloJS Web.
 * Zero-runtime overhead, no virtual DOM, no intermediate AST.
 */

export function render(rootComponent: RenderInput, container: HTMLElement | null): void {
    if (!container) {
        return console.error('[Levelo] DOM injection target container missing.');
    }

    container.innerHTML = '';

    const rootInstance = typeof rootComponent === 'function' ? rootComponent() : rootComponent;

    if (rootInstance instanceof Element) {
        container.appendChild(rootInstance);
    }
}

/**
 * Cleanly unmounts and wipes the target DOM container.
 */
export function unmount(container: HTMLElement | null): void {
    if (container) {
        container.innerHTML = ''
    }
}