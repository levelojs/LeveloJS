export type RouteParams = Record<string, string>;

let currentParams: RouteParams = {};

export function setParams(newParams: RouteParams): void {
  currentParams = newParams;
}

export const params: RouteParams = new Proxy({} as RouteParams, {
  get(_, prop: string) {
    return currentParams[prop];
  },
});
