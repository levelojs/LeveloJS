// packages/levelojs/src/index.ts

//
// only for web
//
export { head } from './runtime/head.js';
export { render, unmount } from './runtime/web/dom.js';
export { Fragment, h, jsx, jsxs } from './runtime/web/jsx-runtime.js';
// commons exports
export * from './shared.js';
export { style } from './styles/web.js';
