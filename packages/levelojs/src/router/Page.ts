// src/router/page.ts
import type { RouteParams } from './params.js';

export type RouteComponent = (props: { params: RouteParams }) => Element | null | undefined;

export interface PageProps {
  path: string;
  component: (props: any) => Element;
}

/**
 * Configuration schema defining a standalone path pattern matching node.
 * Executed via Levelo's h() Factory.
 */
export function Page(props: PageProps): Record<string, any> {
  return {
    type: 'PAGE_CONFIG',
    path: props.path,
    component: props.component,
  };
}
