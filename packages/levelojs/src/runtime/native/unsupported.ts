// packages/levelojs/src/runtime/native/unsupported.ts

/**
 * Creates a safe no-op stub for web-only APIs on native platforms.
 * Logs a single warning in development mode and becomes completely silent in production.
 */
export function unsupported<T extends (...args: any[]) => any>(name: string): T {
  let warned = false;

  return ((..._args: any[]) => {
    const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
    if (!isProd && !warned) {
      warned = true;
      console.warn(`[Levelo] ${name} is not supported on native yet.`);
    }
  }) as T;
}
