// packages/levelojs/src/styles/web.ts

import type { ClassMap, StyleRules } from './types.js';

export type { ClassMap, StyleRules };

/**
 * Dynamically injects JavaScript style objects as Scoped CSS and raw Global CSS rules simultaneously.
 * Guarantees that both dot-prefixed and raw plain keys resolve to both standard strings and scoped object mappings.
 */

export function style(rulesObj: StyleRules): ClassMap {
  if (typeof document === 'undefined') return {};

  let styleTag = document.getElementById('levelo-style-sheet') as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.setAttribute('id', 'levelo-style-sheet');
    document.head.appendChild(styleTag);
  }

  const uniqueHash = Math.random().toString(36).substring(2, 7);
  const classMap: ClassMap = {};
  let cssString = '';

  for (const [selector, properties] of Object.entries(rulesObj)) {
    const isDotPrefixed = selector.startsWith('.');
    const rawClassName = isDotPrefixed ? selector.slice(1) : selector;

    const isPureClass =
      !selector.startsWith('@') &&
      !selector.startsWith('#') &&
      !selector.includes(' ') &&
      selector !== 'button' &&
      selector !== 'div';

    if (isPureClass) {
      cssString += `.${rawClassName} {`;
      for (const [prop, val] of Object.entries(properties)) {
        const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssString += `${cssProperty}: ${val}; `;
      }
      cssString += '} \n';

      const scopedClassName = `${rawClassName}_${uniqueHash}`;
      classMap[rawClassName] = scopedClassName;

      cssString += `.${scopedClassName} { `;
      for (const [prop, val] of Object.entries(properties)) {
        const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssString += `${cssProperty}: ${val}; `;
      }
      cssString += '} \n';
    } else {
      cssString += `${selector} { `;
      for (const [prop, val] of Object.entries(properties)) {
        const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssString += `${cssProperty}: ${val}; `;
      }
      cssString += '} \n';
    }
  }

  styleTag.appendChild(document.createTextNode(cssString));
  return classMap;
}
