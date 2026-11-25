import { cleanup, effect, state, untrack } from '../runtime/reactivity/index.js';
import { type Owner, disposeOwner, runWithOwner } from '../runtime/reactivity/owner.js';
import type { JSX } from '../types/jsx.js';

export interface ForProps<T> {
  each: readonly T[] | (() => readonly T[]) | null | undefined;
  fallback?: JSX.Element | (() => JSX.Element);
  children: (item: T, index: () => number) => JSX.Element;
}

interface Entry<T> {
  item: T;
  index: number;
  setIndex: (next: number) => void;
  element: JSX.Element;
  /** Owns every effect and cleanup created while rendering this item. */
  owner: Owner;
}

function resolveFallback(fallback: JSX.Element | (() => JSX.Element) | undefined): JSX.Element {
  if (!fallback) return null;
  if (typeof fallback === 'function') {
    return (fallback as () => JSX.Element)();
  }
  return fallback;
}

export function For<T>(props: ForProps<T>): () => JSX.Element[] | JSX.Element {
  const [rendered, setRendered] = state<JSX.Element[] | JSX.Element>(null);

  // Each item maps to a pool of entries, so duplicate items get separate elements.
  const cache = new Map<T, Entry<T>[]>();

  function disposeAll(): void {
    for (const pool of cache.values()) {
      for (const entry of pool) disposeOwner(entry.owner);
    }
    cache.clear();
  }

  effect(() => {
    const rawList =
      typeof props.each === 'function'
        ? (props.each as () => readonly T[] | null | undefined)()
        : props.each;

    const list = Array.isArray(rawList) ? rawList : [];

    if (list.length === 0) {
      disposeAll();
      // Rendering the fallback must not subscribe this effect to signals it reads.
      setRendered(untrack(() => resolveFallback(props.fallback)));
      return;
    }

    const used = new Map<T, number>();
    const nextNodes: JSX.Element[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const position = used.get(item) ?? 0;
      used.set(item, position + 1);

      const pool = cache.get(item);
      let entry = pool?.[position];

      if (!entry) {
        const owner: Owner = { cleanups: [] };
        const [getIdx, setIdx] = state<number>(i);

        // Render inside the item's own owner so its effects survive list updates,
        // and untracked so reads inside the item do not re-run the whole list.
        const element = runWithOwner(owner, () => untrack(() => props.children(item, getIdx)));

        entry = { item, index: i, setIndex: setIdx, element, owner };

        if (pool) pool.push(entry);
        else cache.set(item, [entry]);
      } else if (entry.index !== i) {
        entry.index = i;
        entry.setIndex(i);
      }

      nextNodes.push(entry.element);
    }

    // Dispose entries whose items were removed from the list.
    for (const [item, pool] of cache) {
      const keep = used.get(item) ?? 0;

      for (let k = keep; k < pool.length; k++) {
        disposeOwner(pool[k].owner);
      }

      if (keep === 0) cache.delete(item);
      else pool.length = keep;
    }

    setRendered(nextNodes);
  });

  cleanup(() => {
    disposeAll();
    setRendered(null);
  });

  return rendered;
}