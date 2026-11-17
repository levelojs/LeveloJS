// packages/levelojs/src/exports.test.ts
import { describe, expect, it } from 'vitest';
import * as web from './index.js';
import * as native from './native.js';

describe('Platform export parity', () => {
  it('native exports every web export', () => {
    const missing = Object.keys(web).filter((k) => !(k in native));
    expect(missing).toEqual([]);
  });
});
