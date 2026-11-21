import { isBatching, queue } from './batch.js';
import { disposeOwner, type Owner, setOwner } from './owner.js';

type Subscriber = () => void;
type Dependency = Set<Subscriber>;

export type Getter<T> = () => T;
export type Setter<T> = (newValue: T | ((prev: T) => T)) => void;
export type EffectDisposer = () => void;

/** The effect currently collecting signal dependencies. */
let activeEffect: Subscriber | null = null;

/** Dependencies collected by the currently running effect. */
let activeDeps: Set<Dependency> | null = null;

/**
 * Runs `fn` without subscribing the active effect to any signal read inside it.
 */
export function untrack<T>(fn: () => T): T {
  const prevEffect = activeEffect;
  const prevDeps = activeDeps;
  activeEffect = null;
  activeDeps = null;

  try {
    return fn();
  } finally {
    activeEffect = prevEffect;
    activeDeps = prevDeps;
  }
}

/**
 * Creates a reactive effect and returns a disposer for its subscriptions.
 * Effects created inside another effect are disposed automatically
 * when the parent effect re-runs or is disposed.
 */
export function effect(callback: () => void): EffectDisposer {
  const owner: Owner = { cleanups: [] };
  let deps = new Set<Dependency>();
  let disposed = false;
  let running = false;

  const runCleanups = (): void => {
    disposeOwner(owner);
  };

  const execute: Subscriber = () => {
    // Skip if disposed, and guard against an effect triggering itself.
    if (disposed || running) return;
    running = true;

    // Collect this run's dependencies separately instead of clearing everything first.
    const nextDeps = new Set<Dependency>();

    runCleanups();

    const prevOwner = setOwner(owner);
    const prevEffect = activeEffect;
    const prevDeps = activeDeps;
    activeEffect = execute;
    activeDeps = nextDeps;

    try {
      callback();
    } finally {
      // Restore the outer effect instead of resetting to null (keeps nesting correct).
      activeEffect = prevEffect;
      activeDeps = prevDeps;
      setOwner(prevOwner);

      // If disposed during this run, drop everything that was just collected.
      if (disposed) {
        nextDeps.forEach((dep) => dep.delete(execute));
      }

      // Only unsubscribe from signals that were not read in this run.
      deps.forEach((dep) => {
        if (!nextDeps.has(dep)) dep.delete(execute);
      });
      deps = nextDeps;
      running = false;
    }
  };

  const dispose: EffectDisposer = () => {
    if (disposed) return;
    disposed = true;
    deps.forEach((dep) => dep.delete(execute));
    deps.clear();
    runCleanups();
  };

  // Register with the parent owner so child effects are disposed with their parent.
  const parentOwner = setOwner(null);
  setOwner(parentOwner);
  parentOwner?.cleanups.push(dispose);

  execute();
  return dispose;
}

/** Creates a fine-grained reactive signal. */
export function state<T>(initialValue: T): [Getter<T>, Setter<T>] {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  const getter: Getter<T> = () => {
    if (activeEffect && activeDeps && !activeDeps.has(subscribers)) {
      activeDeps.add(subscribers);
      // No-op if the effect was already subscribed in a previous run.
      subscribers.add(activeEffect);
    }
    return value;
  };

  const setter: Setter<T> = (newValue) => {
    // Read signals inside an updater must not subscribe the active effect.
    const resolvedValue =
      typeof newValue === 'function'
        ? untrack(() => (newValue as (prev: T) => T)(value))
        : newValue;

    if (Object.is(value, resolvedValue)) return;

    value = resolvedValue;

    if (subscribers.size === 0) return;

    // Iterate over a copy because effects may change `subscribers` while running.
    for (const subscriber of [...subscribers]) {
      if (isBatching) {
        queue.add(subscriber);
      } else {
        subscriber();
      }
    }
  };

  return [getter, setter];
}
