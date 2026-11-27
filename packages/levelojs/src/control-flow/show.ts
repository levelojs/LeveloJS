import { cleanup, effect, state, untrack } from '../runtime/reactivity/index.js';
import type { JSX } from '../types/jsx.js';

export type ShowChild<T> = JSX.Element | ((value: () => T) => JSX.Element);

export interface ShowProps<T> {
  when: T | (() => T) | null | undefined | false;
  fallback?: JSX.Element | (() => JSX.Element);
  children: ShowChild<T>;
}

function resolveChild<T>(child: ShowChild<T> | undefined, accessor: () => T): JSX.Element {
  if (!child) return null;
  if (typeof child === 'function') {
    return (child as (value: () => T) => JSX.Element)(accessor);
  }
  return child;
}

function resolveFallback(fallback: JSX.Element | (() => JSX.Element) | undefined): JSX.Element {
  if (!fallback) return null;
  if (typeof fallback === 'function') {
    return (fallback as () => JSX.Element)();
  }
  return fallback;
}

export function Show<T>(props: ShowProps<T>): () => JSX.Element {
  const [current, setCurrent] = state<JSX.Element>(null);

  effect(() => {
    const rawWhen =
      typeof props.when === 'function'
        ? (props.when as () => T | null | undefined | false)()
        : props.when;

    // Only `when` should be tracked. Rendering the branch must not subscribe
    // this effect to signals read inside the children or the fallback.
    if (rawWhen) {
      const value = rawWhen as T;
      setCurrent(untrack(() => resolveChild(props.children, () => value)));
    } else {
      setCurrent(untrack(() => resolveFallback(props.fallback)));
    }
  });

  cleanup(() => {
    setCurrent(null);
  });

  return current;
}
