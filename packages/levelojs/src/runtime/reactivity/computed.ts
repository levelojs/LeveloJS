// src/runtime/reactivity/computed.ts

import { cleanup } from './lifecycle.js';
import type { Getter } from './reactivity.js';
import { effect, state } from './reactivity.js';

/**
 * Creates a derived reactive state.
 *
 * The inner effect is registered with the active owner (if any) so it is
 * disposed automatically when the enclosing component unmounts. When no
 * owner is active, the effect lives for the process lifetime, matching the
 * behavior of a computed value created outside a component.
 */
export function computed<T>(computeFn: () => T): Getter<T> {
  const [getter, setter] = state<T>(computeFn());

  const dispose = effect(() => {
    setter(computeFn());
  });

  cleanup(dispose);

  return getter;
}
