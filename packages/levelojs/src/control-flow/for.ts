import { cleanup, effect, state } from '../runtime/reactivity/index.js';
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
  const cache = new Map<T, Entry<T>>();

  effect(() => {
    const rawList =
      typeof props.each === 'function'
        ? (props.each as () => readonly T[] | null | undefined)()
        : props.each;

    const list = Array.isArray(rawList) ? rawList : [];

    if (list.length === 0) {
      cache.clear();
      setRendered(resolveFallback(props.fallback));
      return;
    }

    const activeItems = new Set<T>(list);
    for (const [cachedItem] of cache) {
      if (!activeItems.has(cachedItem)) {
        cache.delete(cachedItem);
      }
    }

    const nextNodes: JSX.Element[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      let entry = cache.get(item);

      if (!entry) {
        const [getIdx, setIdx] = state<number>(i);
        const element = props.children(item, getIdx);
        entry = {
          item,
          index: i,
          setIndex: setIdx,
          element,
        };
        cache.set(item, entry);
      } else if (entry.index !== i) {
        entry.index = i;
        entry.setIndex(i);
      }

      nextNodes.push(entry.element);
    }

    setRendered(nextNodes);
  });

  cleanup(() => {
    cache.clear();
    setRendered(null);
  });

  return rendered;
}
