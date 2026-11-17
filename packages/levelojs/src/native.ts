import { unsupported } from './runtime/native/unsupported.js';

//
// for only Native
//
export * from './runtime/native/index.js';
// common exports
export * from './shared.js';
export const head = unsupported<typeof import('./runtime/head.js').head>('head');
export const render = unsupported<typeof import('./runtime/web/dom.js').render>('render');
export const unmount = unsupported<typeof import('./runtime/web/dom.js').unmount>('unmount');
